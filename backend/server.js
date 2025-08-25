const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
require('dotenv').config();
const mysql = require('mysql2');

const app = express();
const PORT = 3001;

app.use(cors()); // tillat kall fra frontend

// Opprett databaseforbindelse
const db = mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'clothing_data',
});

db.connect(err => {
  if (err) {
    console.error('Feil ved tilkobling til databasen:', err);
    return;
  }
  console.log('Tilkoblet til databasen!');
});

// -------------------- Kategori-mapping --------------------
function mapCategoryToMain(category) {
  const categoryMapping = {
    'T-skjorte': ['Tshirt', 'Tshirtstanks', 'Tskjorte', 'Tee', 'Top'],
    'Bukse':     ['Bukser', 'Bukse', 'Trousers', 'Trouser', 'Pants', 'Sweatpants'],
    'Jakke':     ['Jacket', 'Jakker', 'Jakke', 'Jacketscoats', 'Coat', 'Jacker'],
    'Genser':    ['Sweater', 'Genser', 'Gensere', 'Cardigan'],
    'Skjorte':   ['Skjorte', 'Shirt', 'Shirts', 'Sleeve'],
    'Shorts':    ['Shorts'],
    'Jeans':     ['Jeans'],
    'Blazer':    ['Blazer', 'Blazerssuits'],
    'Hoodie':    ['Hoodie', 'Hoodiessweatshirts'],
  };

  for (const mainCategory in categoryMapping) {
    if (mainCategory === category) {
      console.log(`Mapping funnet for kategori: ${mainCategory}`);
      return categoryMapping[mainCategory];
    }
  }
  console.log(`Ingen mapping funnet, returnerer original kategori: ${category}`);
  return [category];
}

// -------------------- /products (med whitelist) --------------------
// Tillatte tabeller (whitelist). Viktig: tabellnavn kan ikke parameteriseres med '?'.
const ALLOWED_TABLES = new Set([
  'hm_products',
  'weekday_products',
  'zara_products',
  'follestad_products',
]);

app.get('/products', (req, res) => {
  const { tables, category } = req.query;
  if (!tables || !category) {
    return res.status(400).send('Manglende tabeller eller kategori');
  }

  // Rens input og filtrer mot whitelist
  const requested = String(tables)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const tableList = requested.filter(t => ALLOWED_TABLES.has(t));
  if (tableList.length === 0) {
    return res.status(400).send('Ingen gyldige tabeller valgt');
  }

  const mappedCategories = mapCategoryToMain(category); // f.eks. ['Hoodie','Hoodiessweatshirts']
  console.log(`Mapped kategorier: ${mappedCategories}`);

  // Bygg UNION ALL-spørring: én SELECT per tabell, med (category LIKE ? OR ...).
  // Bruk mysql.escapeId for å quote tabellnavn (belt & bukseseler — i tillegg til whitelist).
  const queries = tableList
    .map(table => {
      const safeTable = mysql.escapeId(table); // -> f.eks. `hm_products`
      const conditions = mappedCategories.map(() => 'category LIKE ?').join(' OR ');
      return `SELECT * FROM ${safeTable} WHERE ${conditions}`;
    })
    .join(' UNION ALL ');

  // PARAMETER-REKKEFØLGE: for hver TABELL → push ALLE kategoriene i samme rekkefølge
  const parameters = [];
  for (const _table of tableList) {
    for (const cat of mappedCategories) {
      parameters.push(`%${cat}%`);
    }
  }

  console.log(`SQL-spørring: ${queries}`);
  console.log(`Parametere: ${parameters}`);

  db.query(queries, parameters, (err, results) => {
    if (err) {
      console.error('SQL-feil:', err.message);
      return res.status(500).send('Feil ved henting av data');
    }
    res.json(results);
  });
});

// -------------------- /analyze --------------------
const upload = multer({ storage: multer.memoryStorage() });

// Kosinuslikhet (brukes etter at ML har levert feature-vektor)
function cosineSimilarity(vec1, vec2) {
  const dotProduct = vec1.reduce((sum, v, i) => sum + v * vec2[i], 0);
  const magnitude1 = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0));
  const magnitude2 = Math.sqrt(vec2.reduce((sum, v) => sum + v * v, 0));
  return dotProduct / (magnitude1 * magnitude2);
}

const FormData = require('form-data');

app.post('/analyze', upload.single('image'), async (req, res) => {
  console.log('Filen mottatt:', req.file);
  if (!req.file) {
    return res.status(400).json({ error: 'Ingen fil lastet opp' });
  }

  try {
    // 1) Send bilde til Python/FastAPI (clip_server.py) → få feature-vektor
    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname);

    const response = await axios.post('http://127.0.0.1:8000/analyze', formData, {
      headers: formData.getHeaders(),
    });

    const userVector = response.data.features;

    // 2) Hent alle produkter som har lagret vektor (fra alle tabeller)
    const query = `SELECT id, name, price, image_url, feature_vector, product_link
                     FROM hm_products WHERE feature_vector IS NOT NULL
                   UNION ALL
                   SELECT id, name, price, image_url, feature_vector, product_link
                     FROM weekday_products WHERE feature_vector IS NOT NULL
                   UNION ALL
                   SELECT id, name, price, image_url, feature_vector, product_link
                     FROM zara_products WHERE feature_vector IS NOT NULL
                   UNION ALL
                   SELECT id, name, price, image_url, feature_vector, product_link
                     FROM follestad_products WHERE feature_vector IS NOT NULL`;

    db.query(query, (err, results) => {
      if (err) {
        console.error('SQL-feil:', err);
        return res.status(500).json({ error: 'Feil ved henting av data' });
      }

      try {
        // 3) Beregn likhet per produkt
        const similarities = results.map(product => {
          const productVector = JSON.parse(product.feature_vector);
          if (productVector.length !== userVector.length) {
            throw new Error('Dimensjonsfeil mellom bruker- og produktvektor');
          }
          const similarity = cosineSimilarity(userVector, productVector);
          return { ...product, similarity };
        });

        // 4) Returner topp 9
        const topMatches = similarities
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 9);

        res.json(topMatches);
      } catch (vectorError) {
        console.error('Feil under matching av vektorer:', vectorError);
        res.status(500).json({ error: 'Feil under beregning av likheter.' });
      }
    });
  } catch (error) {
    console.error('Feil under bildeanalyse:', error.response?.data || error.message);
    res.status(500).json({ error: 'Noe gikk galt. Prøv igjen senere.' });
  }
});

// Start serveren
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
