.PHONY: dev start-ml start-backend start-frontend

start-ml:
	uvicorn clip_server:app --host 0.0.0.0 --port 8000

start-backend:
	cd backend && node server.js

start-frontend:
	cd my-app && npm start

dev:
	$(MAKE) -j3 start-ml start-backend start-frontend
