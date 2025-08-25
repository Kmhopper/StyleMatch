@echo off
setlocal enabledelayedexpansion

REM Gå til prosjektroten (mappa der denne .bat-fila ligger)
cd /d "%~dp0"

REM ---- 1) ML-tjenesten (Python + Uvicorn) ----
start "ML (uvicorn)" cmd /k "cd /d backend && python -m uvicorn clip_server:app --host 0.0.0.0 --port 8000"

REM ---- 2) Backend (Express) ----
start "Backend (Express)" cmd /k "cd /d backend && npm install && node server.js"

REM ---- 3) Frontend (React) ----
start "Frontend (React)" cmd /k "cd /d my-app && npm install && npm start"
