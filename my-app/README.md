# Klesfinner – React + Express (+ Python ML)

En nettapp som samler produkter fra flere klesbutikker og lar brukeren
filtrere på kategorier og **finne lignende produkter** ved å laste opp et bilde.

## Demo
- Frontend: `my-app` (Create React App) på http://localhost:3000
- Backend API: `backend` (Express) på http://localhost:3001
- ML‑tjeneste (Python, uvicorn) på http://127.0.0.1:8000

## Nøkkelfunksjoner
- Kategoribasert utforsking (T‑skjorte, Genser, Hoodie, Skjorte, Bukse, Jeans, Shorts, Blazer, Jakke)
- Butikkfilter (H&M, Weekday, Zara, Follestad) med klikkbare produktkort
- Opplasting av bilde → backend → Python ML → cosine‑likhet mot lagrede feature‑vektorer i DB

## Teknologistack
- **Frontend:** React (CRA), react‑router, Bootstrap CSS
- **Backend:** Node.js, Express, MySQL2, Multer (opplasting), Axios, Cheerio/Puppeteer (scraping), dotenv
- **ML‑tjeneste:** Python (egen server, ikke i dette repoet) for feature‑ekstraksjon
- **Database:** MySQL (tabeller: `hm_products`, `weekday_products`, `zara_products`, `follestad_products`)

## Arkitektur (kort)
```
[Browser]
   └── React (my-app)
         └── kall → Express API (backend:3001)
                   ├── /products?tables=...&category=...
                   │      └── MySQL spørringer (samlet fra flere tabeller)
                   └── /analyze  (multipart image)
                          └── videresender til Python-ML (127.0.0.1:8000/analyze)
                                 └── matcher mot feature_vector i DB og returnerer topp treff
```

## Starte lokalt (3 deler)

> Kortversjon: kjør **én kommando**: `./run_all.sh` (Mac/Linux) eller `make dev` hvis du har Make.

### 1) ML‑tjeneste (Python)
```bash
uvicorn clip_server:app --host 0.0.0.0 --port 8000
```

### 2) Backend (Express)
```bash
cd backend
node server.js
```

### 3) Frontend (React)
```bash
cd my-app
npm start
```

### Alternativer
- `./run_all.sh` starter alle tre i bakgrunnen i samme terminal-vindu.
  - Første gang: `chmod +x run_all.sh`
- `make dev` gjør det samme via Makefile.
- Sett ML‑URL via miljøvariabel i `backend/.env`:
```ini
ML_URL=http://127.0.0.1:8000
```

## Komme i gang (detaljer)

### Forutsetninger
- Node 18+
- MySQL 8 (med tabeller nevnt over)
- Python‑ML‑tjeneste kjørende på `127.0.0.1:8000` (endres i `backend/server.js` eller `backend/.env`)

### Backend
```bash
cd backend
cp .env.example .env   # fyll inn DB‑verdier
npm ci || npm install
npm start              # starter på http://localhost:3001
```

**Miljøvariabler (.env):**
```ini
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=secret
DB_NAME=fashion
ML_URL=http://127.0.0.1:8000
```

### Frontend
```bash
cd my-app
npm ci || npm install
npm start              # kjører CRA dev server på http://localhost:3000
```

## Scripts & kvalitet
- CRA inkluderer `npm test`, `npm run build` i `my-app`.
- Backend har `npm start`. Legg gjerne til: `npm run lint` og Prettier.

## Sikkerhet / hemmeligheter
- Ikke commit `.env`. Bruk `.env.example` og `.gitignore` (lagt ved).

## Lisens
MIT (forslag). Se `LICENSE`.

## Roadmap
- CI (GitHub Actions) med build/lint/test for både frontend og backend
- Bytte hardkodet Python‑URL til miljøvariabel (nå lagt til som `ML_URL`)
- Docker Compose for lokal kjøring av DB + tjenester
