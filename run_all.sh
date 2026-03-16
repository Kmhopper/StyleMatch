#!/usr/bin/env bash
set -e

# GÃ¥ til prosjektroten (mappa der dette skriptet ligger)
cd "$(dirname "$0")"

# 1) Start ML-tjenesten
echo "[ML] starter uvicorn pÃ¥ :8000"
if [ -f backend/.venv/bin/activate ]; then
  ( cd backend && source .venv/bin/activate && uvicorn clip_server:app --host 0.0.0.0 --port 8000 ) &
else
  echo "[ADVARSEL] Ingen venv funnet i backend/. KjÃ¸rer med global Python."
  ( cd backend && uvicorn clip_server:app --host 0.0.0.0 --port 8000 ) &
fi

# 2) Start backend
echo "[Backend] starter Express pÃ¥ :3001"
( cd backend && node server.js ) &

# 3) Start frontend
echo "[Frontend] starter Next.js pÃ¥ :3000"
( cd my-app && npm run dev ) &

echo "Alt startet. Trykk Ctrl+C for Ã¥ stoppe."
wait

