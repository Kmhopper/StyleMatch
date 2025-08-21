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

## Database – komplett steg-for-steg

Du kan sette opp databasen på to måter:

- **A) Docker Compose (anbefalt)** – ingen MySQL-installasjon trengs.
- **B) Lokal MySQL 8 + import-skript** – bruk dette hvis du ikke kan installere Docker.

### A) Docker Compose (anbefalt)

1) Installer Docker
- Windows 10/11
  1. Åpne PowerShell som administrator og kjør:
     ```
     wsl --install
     ```
     Start PC-en på nytt om du blir bedt.
  2. Installer og start Docker Desktop for Windows.
  3. I Docker Desktop → Settings → General: huk av «Use WSL 2 based engine».
- macOS
  - Installer og start Docker Desktop for Mac.
- Linux (Ubuntu/Debian)
  ```
  sudo apt update
  sudo apt install -y docker.io docker-compose-plugin
  sudo usermod -aG docker $USER
  # logg ut/inn for at gruppen skal gjelde
  ```

2) Verifiser at Docker fungerer (åpne nytt terminalvindu etter install)
```
docker --version
docker compose version
```

3) Sjekk at compose-filen finnes
I prosjektroten skal filen `docker-compose.yml` ligge. (Hvis den mangler, opprett den med innholdet under.)
```
version: "3.9"
services:
  db:
    image: mysql:8.0
    container_name: clothing_db
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: clothing_data
    ports:
      - "3306:3306"
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

4) Lag backend-miljøfil
```
# Windows
Copy-Item backend\.env.example backend\.env
# macOS/Linux
cp backend/.env.example backend/.env
```
Åpne `backend/.env` og sett verdiene slik når du bruker Docker:
```
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=root
DB_NAME=clothing_data
ML_URL=http://127.0.0.1:8000
```

5) Start databasen
I prosjektroten:
```
docker compose up -d
```
Første gang importeres alle `.sql` fra `my-app/database_sample/` automatisk.

6) Se logger og status (valgfritt)
```
docker compose logs -f db
docker compose ps
```

7) Re-import (reset) av sample-data senere
```
docker compose down -v
docker compose up -d
```
(`-v` sletter datavolumet slik at init-SQL kjøres på nytt.)

8) Hvis port 3306 allerede er i bruk
Endre i `docker-compose.yml`:
```
ports:
  - "3307:3306"
```
La `backend/.env` stå med `DB_HOST=127.0.0.1`. (Kun port-mappingen endres.)

---

### B) Uten Docker: lokal MySQL + import-skript

1) Installer MySQL 8 Community (server + klient) og sørg for at `mysql` er på PATH. Notér ROOT-passordet du velger under installasjonen.

2) Lag backend-miljøfil
```
# Windows
Copy-Item backend\.env.example backend\.env
# macOS/Linux
cp backend/.env.example backend/.env
```
Fyll inn:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=<passordet-du-valgte>
DB_NAME=clothing_data
ML_URL=http://127.0.0.1:8000
```

3) Importer sample-data fra prosjektroten
- Windows
  ```
  .\import_db.ps1
  ```
  Hvis PowerShell blokkerer skript:
  ```
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  .\import_db.ps1
  ```
- macOS/Linux
  ```
  chmod +x import_db.sh
  ./import_db.sh
  ```

---

### Etter at databasen er oppe (gjelder begge måter)

Start tjenestene i tre terminaler/faner:

**ML-tjeneste**
```
python -m uvicorn clip_server:app --host 0.0.0.0 --port 8000
```

**Backend**
```
cd backend
npm install
node server.js
```

**Frontend**
```
cd my-app
npm install
npm start
```

Åpne: `http://localhost:3000`

Porter i bruk: 3000 (frontend), 3001 (backend), 8000 (ML), 3306 (DB).

---

### Feilsøking (kjapp)

- `docker: not recognized`
  - Installer Docker Desktop (og WSL 2 på Windows), åpne nytt terminalvindu, kjør `docker --version` og `docker compose version`.
- Importen i Docker skjedde ikke
  ```
  docker compose down -v
  docker compose up -d
  ```
  (init-SQL kjøres kun når volumet er tomt.)
- Backend får ikke DB-kontakt
  - Sjekk `backend/.env` mot hvordan DB kjører (Docker: `root/root` og `127.0.0.1`), og se `docker compose logs -f db`.
- Frigi porter på Windows
  ```
  npx kill-port 3000 3001 8000 3306
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
MIT. Se `LICENSE`.
