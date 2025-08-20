# Klesfinner – React + Express (+ Python ML)

En nettapp som samler produkter fra flere klesbutikker og lar brukeren
filtrere på kategorier og **finne lignende produkter** ved å laste opp et bilde.

## Demo
- Frontend (CRA): http://localhost:3000
- Backend API (Express): http://localhost:3001
- ML-tjeneste (Python/Uvicorn): http://127.0.0.1:8000

## Nøkkelfunksjoner
- Kategoribasert utforsking (T-skjorte, Genser, Hoodie, Skjorte, Bukse, Jeans, Shorts, Blazer, Jakke)
- Butikkfilter (H&M, Weekday, Zara, Follestad)
- Last opp bilde → backend → Python-ML (CLIP) → cosine-likhet mot lagrede feature-vektorer i DB

## Teknologistack
- **Frontend:** React (CRA), react-router, Bootstrap CSS
- **Backend:** Node.js, Express, MySQL2, Multer (opplasting), Axios, Cheerio/Puppeteer (scraping), dotenv
- **ML-tjeneste:** Python (egen prosess) for feature-ekstraksjon
- **Database:** MySQL (tabeller: `hm_products`, `weekday_products`, `zara_products`, `follestad_products`)

## Arkitektur (kort)
[Browser]
   └── React (my-app)
         └── kall → Express API (backend:3001)
                   ├── /products?tables=...&category=...
                   │      └── MySQL-spørringer (samlet fra flere tabeller)
                   └── /analyze  (multipart image)
                          └── videresender til Python-ML (127.0.0.1:8000/analyze)
                                 └── matcher mot feature_vector i DB og returnerer topp-treff

--------------------------------------------------------------------------------

# Rask oppstart (3 deler)

> Kortversjon: kjør **én kommando**:
> - **Mac/Linux:** `./run_all.sh`  (første gang: `chmod +x run_all.sh`)
> - **Windows:** `run_all.bat` *eller* `.\run_all.ps1`

### 1) ML-tjeneste (Python)
Mac/Linux:
    uvicorn clip_server:app --host 0.0.0.0 --port 8000
Windows (PowerShell/CMD):
    python -m uvicorn clip_server:app --host 0.0.0.0 --port 8000

### 2) Backend (Express)
    cd backend
    node server.js

### 3) Frontend (React)
    cd my-app
    npm start

### Alternativer
- `./run_all.sh` (Mac/Linux) eller `run_all.bat` / `run_all.ps1` (Windows) starter alle tre.
- `make dev` gjør det samme via Makefile.
- Sett ML-URL i `backend/.env`:
    ML_URL=http://127.0.0.1:8000

--------------------------------------------------------------------------------

# Database: anbefalt oppsett via Docker Compose (ingen lokal MySQL nødvendig)

> Dette er den enkleste måten for testere. Compose starter MySQL 8 og importerer sample-data automatisk.

## 1) Opprett `docker-compose.yml` i prosjektroten med innholdet under
```yaml
version: "3.9"
services:
  db:
    image: mysql:8.0
    container_name: clothing_db
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: clothing_data
    ports:
      - "3306:3306"            # endre venstre side hvis 3306 er opptatt
    volumes:
      - db_data:/var/lib/mysql
      - ./my-app/database_sample:/docker-entrypoint-initdb.d:ro
    command: >
      --default-authentication-plugin=mysql_native_password
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_0900_ai_ci
volumes:
  db_data:
```

## 2) Start databasen
Mac/Linux/Windows (Docker Desktop):
    docker compose up -d

Se logger:
    docker compose logs -f db

Stopp og SLETT data (for å reimportere fra .sql neste gang):
    docker compose down -v

## 3) Backend `.env` når du bruker Compose
Opprett/oppdater `backend/.env` (ikke commit denne):
```ini
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=root
DB_NAME=clothing_data
ML_URL=http://127.0.0.1:8000
```

> Merk: Import fra `docker-entrypoint-initdb.d` skjer kun når volumet `db_data` er tomt. Bruk `docker compose down -v` for full reset.

--------------------------------------------------------------------------------

# Alternativ: Importer sample-data uten Docker (lokal MySQL kreves)

Legg disse filene i prosjektroten (inkludert i repoet):
- `import_db.ps1` (Windows/PowerShell)
- `import_db.sh` (macOS/Linux)

Begge skriptene:
- Leser DB-verdier fra `backend/.env` hvis den finnes
- Oppretter `clothing_data` hvis den ikke finnes
- Importerer alle `.sql` i `my-app/database_sample/`

**Windows:**
    .\import_db.ps1

**macOS/Linux:**
    chmod +x import_db.sh
    ./import_db.sh

--------------------------------------------------------------------------------

# Forutsetninger
- Node 18+
- Python 3.10+ (for ML-tjenesten)
- ETT av følgende for database:
  - Docker Desktop (anbefalt), eller
  - MySQL 8 lokalt + `mysql` klient på PATH

# Miljøvariabler (backend/.env – eksempel)
```ini
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=secret
DB_NAME=clothing_data
ML_URL=http://127.0.0.1:8000
```

--------------------------------------------------------------------------------

# Scripts & kvalitet
- CRA: `npm test`, `npm run build` i `my-app`
- Backend: `npm start`
- Valgfritt: legg til `npm run lint` og Prettier

# Sikkerhet / hemmeligheter
- Ikke commit `backend/.env`. Bruk `backend/.env.example` og `.gitignore`.
- Aktiver Secret Scanning + Push Protection i GitHub (Settings → Code security and analysis).

# Feilsøking (kjapt)
- **Port i bruk (3000/3001/8000/3306):** Windows: `npx kill-port 3000 3001 8000 3306`
- **Reimporter sample-data i Docker:** `docker compose down -v && docker compose up -d`
- **React på annen port:** PowerShell: `$env:PORT=3005; npm start`

# Lisens
MIT (forslag). Se `LICENSE`.
