require('dotenv').config();

const express = require('express');
const multer = require('multer');
const axios = require('axios');
const mysql = require('mysql2/promise');
const FormData = require('form-data');

const app = express();
const PORT = Number(process.env.PORT || 3001);

// For CORS (Cross-Origin Resource Sharing) – tillater at frontend er på en annen port
// (f.eks. React på localhost:3000) kan gjøre kall til API-et på port 3001. 
app.use(cors());


// -------------------- DB: pool --------------------
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'clothing_data',
  waitForConnections: true,
  connectionLimit: 10,
});

// Testkobling ved oppstart
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('[DB] Tilkoblet (pool ok)');
  } catch (e) {
    console.error('[DB] Kunne ikke koble til:', e.message);
  }
})();

// -------------------- Opplasting --------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// -------------------- Kategori-mapping --------------------
function mapCategoryToMain(category) {
  const categoryMapping = {
    'T-skjorte': ['Tshirt', 'Tshirtstanks', 'Tskjorte', 'Tee', 'Top'],
    'Bukse': ['Bukser', 'Bukse', 'Trousers', 'Trouser', 'Pants', 'Sweatpants'],
    'Jakke': ['Jacket', 'Jakker', 'Jakke', 'Jacketscoats', 'Coat', 'Jacker'],
    'Genser': ['Sweater', 'Genser', 'Gensere', 'Cardigan'],
    'Skjorte': ['Skjorte', 'Shirt', 'Shirts', 'Sleeve'],
    'Shorts': ['Shorts'],
    'Jeans': ['Jeans'],
    'Blazer': ['Blazer', 'Blazerssuits'],
    'Hoodie': ['Hoodie', 'Hoodiessweatshirts'],
  };

  if (Object.hasOwn(categoryMapping, category)) {
    return categoryMapping[category];
  }
  return [category];
}

// -------------------- Whitelist for tabeller --------------------
const ALLOWED_TABLES = new Set([
  'hm_products',
  'weekday_products',
  'zara_products',
  'follestad_products',
]);

// -------------------- /products --------------------
// Henter produkter fra whitelisted tabeller med enkel kategorifiltering (LIKE)
app.get('/products', async (req, res) => {
  try {
    const { tables, category } = req.query;
    if (!tables || !category) {
      return res.status(400).send('Manglende tabeller eller kategori');
    }

    const requested = String(tables)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const tableList = requested.filter(t => ALLOWED_TABLES.has(t));
    if (tableList.length === 0) {
      return res.status(400).send('Ingen gyldige tabeller valgt');
    }

    const mappedCategories = mapCategoryToMain(String(category));
    const conditions = mappedCategories.map(() => 'category LIKE ?').join(' OR ');
    const paramsPerTable = mappedCategories.map(c => `%${c}%`);

    // Bygg UNION ALL spørring
    const unionSql = tableList
      .map(t => `SELECT id, name, price, image_url, product_link, category FROM \`${t}\` WHERE ${conditions}`)
      .join(' UNION ALL ');

    const params = [];
    for (let i = 0; i < tableList.length; i++) {
      params.push(...paramsPerTable);
    }

    const [rows] = await pool.query(unionSql, params);
    res.json(rows);
  } catch (err) {
    console.error('/products feil:', err.message);
    res.status(500).send('Feil ved henting av data');
  }
});

// -------------------- Matching-hjelpere --------------------
function dot(u, v) {
  let s = 0;
  // forutsetter like lengder og L2-normaliserte vektorer
  for (let i = 0; i < u.length; i++) s += u[i] * v[i];
  return s; // == cosine hvis normalisert
}

// Holder topp K uten å sortere hele listen (bra nok for små K)
function topK(items, k, scoreFn) {
  const keep = []; // liten "min-heap" via sort; OK når k er lite
  for (const it of items) {
    const s = scoreFn(it);
    if (Number.isNaN(s)) continue;

    if (keep.length < k) {
      keep.push({ s, it });
      keep.sort((a, b) => a.s - b.s);
    } else if (s > keep[0].s) {
      keep[0] = { s, it };
      keep.sort((a, b) => a.s - b.s);
    }
  }
  return keep.sort((a, b) => b.s - a.s).map(x => x.it);
}

// -------------------- /analyze --------------------
// Tar imot bilde, kaller FastAPI for embedding, matcher mot DB, returnerer topp 9
app.post('/analyze', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Ingen fil lastet opp' });

  try {
    // 1) Send bilde til FastAPI (forutsetter at FastAPI kjører på denne adressen)
    const fastApiUrl = process.env.ML_ANALYZE_URL || 'http://127.0.0.1:8000/analyze';
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname || 'upload.jpg',
      contentType: req.file.mimetype || 'image/jpeg',
    });

    const mlResp = await axios.post(fastApiUrl, formData, {
      headers: formData.getHeaders(),
      timeout: Number(process.env.ML_TIMEOUT_MS || 120000),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const userVector = mlResp?.data?.features;
    if (!Array.isArray(userVector) || userVector.length === 0) {
      return res.status(502).json({ error: 'Ugyldig svar fra ML-tjenesten' });
    }

    // 2) Hent produkt-vektorer (kun nødvendige felt)
    const sql = `
      SELECT id, name, price, image_url, product_link, feature_vector
        FROM hm_products WHERE feature_vector IS NOT NULL
      UNION ALL
      SELECT id, name, price, image_url, product_link, feature_vector
        FROM weekday_products WHERE feature_vector IS NOT NULL
      UNION ALL
      SELECT id, name, price, image_url, product_link, feature_vector
        FROM zara_products WHERE feature_vector IS NOT NULL
      UNION ALL
      SELECT id, name, price, image_url, product_link, feature_vector
        FROM follestad_products WHERE feature_vector IS NOT NULL
    `;

    const [rows] = await pool.query(sql);

    // 3) Beregn score (dot) og plukk topp 9
    const candidates = [];
    for (const r of rows) {
      try {
        const vec = JSON.parse(r.feature_vector);
        if (!Array.isArray(vec) || vec.length !== userVector.length) continue; // dimensjonsmismatch
        // OBS: forutsetter L2-normaliserte vektorer ved lagring og i ML
        const score = dot(userVector, vec);
        candidates.push({ ...r, similarity: score });
      } catch (_) {
        // ignorer rader med korrupt JSON
      }
    }

    const top9 = topK(candidates, 9, (p) => p.similarity);

    return res.json(top9);
  } catch (err) {
    // FastAPI-feil eller DB-feil
    const detail =
      err.response?.data?.detail ||
      err.response?.data?.error ||
      err.message;
    console.error('/analyze feil:', detail);
    return res.status(500).json({ error: 'Noe gikk galt under bildeanalyse eller matching.' });
  }
});

// -------------------- Start --------------------
app.listen(PORT, () => {
  console.log(`API kjører på http://localhost:${PORT}`);
});
