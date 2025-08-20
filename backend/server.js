const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3001;

app.use(cors());

// Opprett databaseforbindelse
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect(err => {
    if (err) {
        console.error('Feil ved tilkobling til databasen:', err);
        return;
    }
    console.log('Tilkoblet til databasen!');
});

// Mapping-funksjon for kategorier
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

    for (const mainCategory in categoryMapping) {
        if (mainCategory === category) {
            console.log(`Mapping funnet for kategori: ${mainCategory}`);
            return categoryMapping[mainCategory]; // Returner hele listen av kategorier
        }
    }

    console.log(`Ingen mapping funnet, returnerer original kategori: ${category}`);
    return [category]; // Returnerer originalkategori som en liste hvis ingen mapping finnes
}

// Endepunkt for å hente produkter
app.get('/products', (req, res) => {
    const { tables, category } = req.query;

    if (!tables || !category) {
        return res.status(400).send('Manglende tabeller eller kategori');
    }

    const tableList = tables.split(',');
    const mappedCategories = mapCategoryToMain(category); // Henter listen over mulige kategorier
    console.log(`Mapped kategorier: ${mappedCategories}`);

    const queries = tableList
        .map(table => {
            const conditions = mappedCategories.map(() => 'category LIKE ?').join(' OR ');
            return `SELECT * FROM ${table} WHERE ${conditions}`;
        })
        .join(' UNION ALL ');

    const parameters = mappedCategories.flatMap(cat => Array(tableList.length).fill(`%${cat}%`));

    console.log(`SQL-spørring: ${queries}`);
    console.log(`Parametere: ${parameters}`);

    db.query(queries, parameters, (err, results) => {
        if (err) {
            console.error('SQL-feil:', err.message);
            res.status(500).send('Feil ved henting av data');
            return;
        }
        console.log('SQL-resultater:', results);
        res.json(results);
    });
});

// Konfigurer multer for bildeopplastinger
const upload = multer({
    storage: multer.memoryStorage(),
});

// Funksjon for å beregne kosinuslikhet
function cosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, v, i) => sum + v * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, v) => sum + v * v, 0));
    return dotProduct / (magnitude1 * magnitude2);
}

const FormData = require('form-data');

// Endepunkt for bildeanalyse og matching
app.post('/analyze', upload.single('image'), async (req, res) => {
    console.log('Filen mottatt:', req.file);

    if (!req.file) {
        console.error('Ingen fil lastet opp i forespørselen.');
        return res.status(400).json({ error: 'Ingen fil lastet opp' });
    }

    try {
        console.log('Sender bildet til Python-server...');
        const formData = new FormData();
        formData.append('file', req.file.buffer, req.file.originalname); 
        
        const response = await axios.post('http://127.0.0.1:8000/analyze', formData, {
            headers: formData.getHeaders(), // Sett nødvendige headere for multipart/form-data
        });

        console.log('Mottatt svar fra Python-serveren:', response.data);

        const userVector = response.data.features;
        console.log('Funksjonsvektor mottatt:', userVector);

        // Hent data fra databasen
        const query = `SELECT id, name, price, image_url, feature_vector, product_link
                        FROM hm_products 
                        WHERE feature_vector IS NOT NULL
                        UNION ALL 
                        SELECT id, name, price, image_url, feature_vector, product_link
                        FROM weekday_products 
                        WHERE feature_vector IS NOT NULL
                        UNION ALL 
                        SELECT id, name, price, image_url, feature_vector, product_link
                        FROM zara_products 
                        WHERE feature_vector IS NOT NULL
                        UNION ALL 
                        SELECT id, name, price, image_url, feature_vector, product_link
                        FROM follestad_products 
                        WHERE feature_vector IS NOT NULL`;



        db.query(query, (err, results) => {
            if (err) {
                console.error('SQL-feil:', err);
                return res.status(500).json({ error: 'Feil ved henting av data' });
            }

            console.log('Resultater fra databasen:', results);

            try {
                const similarities = results.map(product => {
                    const productVector = JSON.parse(product.feature_vector);
                    if (productVector.length !== userVector.length) {
                        console.error('Dimensjonsfeil mellom vektorer:', productVector.length, userVector.length);
                        throw new Error('Dimensjonsfeil mellom bruker- og produktvektor');
                    }
                    const similarity = cosineSimilarity(userVector, productVector);
                    return { ...product, similarity };
                });

                const topMatches = similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 9);
                console.log('Topp-matching produkter:', topMatches);
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
