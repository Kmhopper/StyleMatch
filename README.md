# Klesfinner – React + Express (+ Python ML)

En nettapp som samler produkter fra flere klesbutikker og lar brukeren
filtrere på kategorier og **finne lignende produkter** ved å laste opp et bilde.

## Demo
- Frontend (CRA): http://localhost:3000
- Backend API (Express): http://localhost:3001
- ML‑tjeneste (Python/Uvicorn): http://127.0.0.1:8000

## Nøkkelfunksjoner
- Kategoribasert utforsking (T‑skjorte, Genser, Hoodie, Skjorte, Bukse, Jeans, Shorts, Blazer, Jakke)
- Butikkfilter (H&M, Weekday, Zara, Follestad)
- Last opp bilde → backend → Python‑ML (CLIP) → cosine‑likhet mot lagrede feature‑vektorer i DB

## Teknologistack
- **Frontend:** React (CRA), react‑router, Bootstrap CSS  
- **Backend:** Node.js, Express, MySQL2, Multer (opplasting), Axios, Cheerio/Puppeteer (scraping), dotenv  
- **ML‑tjeneste:** Python (egen prosess) for feature‑ekstraksjon  
- **Database:** MySQL (tabeller: `hm_products`, `weekday_products`, `zara_products`, `follestad_products`)

## Arkitektur (kort)
```
[Browser]
   └── React (my-app)
         └── kall → Express API (backend:3001)
                   ├── /products?tables=...&category=...
                   │      └── MySQL-spørringer (samlet fra flere tabeller)
                   └── /analyze  (multipart image)
                          └── videresender til Python-ML (127.0.0.1:8000/analyze)
                                 └── matcher mot feature_vector i DB og returnerer topp-treff
```

--------------------------------------------------------------------------------

# Forutsetninger
- Node 18+
- Python 3.10–3.12 (for ML‑tjenesten)
- Én av disse for database:
  - Docker Desktop (anbefalt), **eller**
  - MySQL 8 lokalt + `mysql`‑klient på PATH

## Installer Node.js (anbefalt LTS 20)
**Windows (PowerShell)**
```powershell
winget install -e --id OpenJS.NodeJS.LTS
# start nytt PowerShell-vindu etter install
node -v
npm -v
```

**macOS (Homebrew)**
```bash
brew install node@20
brew link --overwrite --force node@20
node -v && npm -v
```

**Ubuntu/Debian**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

## Installer Python 3.10–3.12
**Windows**
1. Last ned fra https://www.python.org/downloads/windows/
2. Kryss av **“Add python.exe to PATH”**.
3. Sjekk:
```powershell
python --version
pip --version
```

**macOS (Homebrew)**
```bash
brew install python
python3 --version
pip3 --version
```

**Ubuntu/Debian**
```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv
python3 --version
pip3 --version
```

## Bootstrap (frontend)
```bash
cd my-app
npm install bootstrap@5
```

## Miljøvariabler (backend/.env – eksempel)
```ini
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=secret
DB_NAME=clothing_data
DB_PORT=3307
ML_URL=http://127.0.0.1:8000
```

--------------------------------------------------------------------------------

## Installer Python‑avhengigheter (ML‑tjenesten)
Kjør alt dette i `backend/`.

### 1) Opprett og aktiver virtuelt miljø
**Windows (PowerShell)**
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

**macOS/Linux**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
```

### 2) Installer pakkene fra requirements.txt
```bash
pip install -r requirements.txt
```

--------------------------------------------------------------------------------

# Rask oppstart (3 deler)

> Kortversjon: kjør **én kommando**:
> - **Mac/Linux:** `./run_all.sh`  (første gang: `chmod +x run_all.sh`)
> - **Windows:** `.\run_all.bat`

### 1) ML‑tjeneste (Python)
**macOS/Linux**
```bash
uvicorn clip_server:app --host 0.0.0.0 --port 8000
```
**Windows (PowerShell/CMD)**
```powershell
python -m uvicorn clip_server:app --host 0.0.0.0 --port 8000
```

### 2) Backend (Express)
```bash
cd backend
npm install
node server.js
```

### 3) Frontend (React)
```bash
cd my-app
npm install
npm start
```

### Alternativer
- `./run_all.sh` (Mac/Linux) / `.\run_all.bat` (Windows) starter alle tre.
- Sett ML‑URL i `backend/.env`:
```
ML_URL=http://127.0.0.1:8000
```

--------------------------------------------------------------------------------

## Database – komplett steg‑for‑steg

Du kan sette opp databasen på to måter:

- **A) Docker Compose (anbefalt)** – ingen MySQL‑installasjon trengs.
- **B) Lokal MySQL 8 + import‑skript** – bruk dette hvis du ikke kan installere Docker.

### A) Docker Compose (anbefalt)

1) **Installer Docker**
- **Windows 10/11**
  - Åpne PowerShell som administrator og kjør:
    ```powershell
    wsl --install
    ```
    Start PC‑en på nytt om du blir bedt.
  - Installer og start Docker Desktop for Windows (Kjør dette i vanlig PowerShell):
    ```powershell
    winget install -e --id Docker.DockerDesktop
    ```
  - Åpne docker desktop og skip inlogging (det er ikke nødvendig med bruker)
  
  - I Docker Desktop → Settings → General: huk av **Use WSL 2 based engine**.

- **macOS**
  ```bash
  brew install --cask docker
  open -a Docker
  ```

- **Ubuntu/Debian**
  ```bash
  sudo apt update
  sudo apt install -y docker.io docker-compose-plugin
  sudo usermod -aG docker $USER  # logg ut/inn etterpå
  ```

> **Tips:** På Windows – kjør Docker‑kommandoene i vanlig PowerShell (ikke inne i WSL‑Ubuntu).

2) **Verifiser at Docker fungerer**
```bash
docker --version
docker compose version
```

3) **Sjekk at compose‑filen finnes** (`docker-compose.yml` i prosjektroten)
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
      - "3307:3306"
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

4) **Lag backend‑miljøfil**
```powershell
# Windows
Copy-Item backend\env.example backend\.env
# hvis det feiler: opprett backend\.env og lim inn innholdet fra env.example
```
```bash
# macOS/Linux
cp backend/.env.example backend/.env
```
Sett verdiene slik når du bruker Docker:
```ini
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=root
DB_NAME=clothing_data
DB_PORT=3307
ML_URL=http://127.0.0.1:8000
```

5) **Start databasen**
```bash
docker compose up -d
```
Første gang importeres alle `.sql` fra `my-app/database_sample/` automatisk.

Nå er databasen oppe å kjører!

6) **Se logger/status (valgfritt)**
```bash
docker compose logs -f db
docker compose ps
```

7) **Re‑import (reset) av sample‑data senere**
```bash
docker compose down -v
docker compose up -d
```
(`-v` sletter datavolumet slik at init‑SQL kjøres på nytt.)

8) **Hvis port 3306 allerede er i bruk**
```yaml
ports:
  - "3307:3306"
```
La `backend/.env` stå med `DB_HOST=127.0.0.1` (kun port‑mapping endres).

---

### B) Uten Docker: lokal MySQL + import‑skript

1) **Installer MySQL 8 Community** (server + klient) og sørg for at `mysql` er på PATH. Notér ROOT‑passordet du velger under installasjonen.

2) **Lag backend‑miljøfil**
```powershell
# Windows
Copy-Item backend\env.example backend\.env

Dersom dette ikke funker, lag en .env fil i backend og kopier over det som er i env.example
```
```bash
# macOS/Linux
cp backend/.env.example backend/.env
```
Fyll inn:
```ini
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=<passordet-du-valgte>
DB_NAME=clothing_data
ML_URL=http://127.0.0.1:8000
```

3) **Importer sample‑data fra prosjektroten**
- **Windows**
  ```powershell
  .\import_db.ps1
  # hvis PowerShell blokkerer skript:
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  .\import_db.ps1
  ```
- **macOS/Linux**
  ```bash
  chmod +x import_db.sh
  ./import_db.sh
  ```

---

### Etter at databasen er oppe (gjelder begge måter)

Start tjenestene i tre terminaler/faner:

**ML‑tjeneste**
```bash
cd backend
python -m uvicorn clip_server:app --host 0.0.0.0 --port 8000
```

**Backend**
```bash
cd backend
npm install
node server.js
```

**Frontend**
```bash
cd my-app
npm install
npm start
```

Åpne: `http://localhost:3000`

Porter i bruk: 3000 (frontend), 3001 (backend), 8000 (ML), 3306 eller 3307 (DB).

---

### Feilsøking (kjapp)

- **`docker: not recognized`**
  - Installer Docker Desktop (og WSL 2 på Windows), åpne nytt terminalvindu, kjør `docker --version` og `docker compose version`.
- **Import i Docker skjedde ikke**
  ```bash
  docker compose down -v
  docker compose up -d
  ```
  (init‑SQL kjøres kun når volumet er tomt.)
- **Backend får ikke DB‑kontakt**
  - Sjekk `backend/.env` mot hvordan DB kjører (Docker: `root/root` og `127.0.0.1`), og se `docker compose logs -f db`.
- **Frigi porter på Windows**
  ```powershell
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

# Lisens
MIT. Se `LICENSE`.
