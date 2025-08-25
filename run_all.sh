#!/usr/bin/env bash
set -e

# 1) Start ML-tjenesten
echo "[ML] starter uvicorn på :8000"
( uvicorn clip_server:app --host 0.0.0.0 --port 8000 ) &

# 2) Start backend
echo "[Backend] starter Express på :3001"
( cd backend && node server.js ) &

# 3) Start frontend
echo "[Frontend] starter CRA på :3000"
( cd my-app && npm start ) &

echo "Alt startet. Trykk Ctrl+C for å stoppe."
wait
