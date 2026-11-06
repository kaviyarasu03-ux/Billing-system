# Bakery Billing System

This repository contains the Vite frontend and Express/MongoDB backend.

## Frontend

```powershell
cd frontend
npm ci
npm run dev
```

Set `VITE_API_URL` to the backend base URL when building the frontend. For local
development, the default is `http://localhost:5000`.

## Backend

```powershell
cd backend
npm ci
npm start
```

Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI` to a reachable
MongoDB connection string. Never commit `.env` or database credentials.

## Cloudflare frontend deployment

Build the Vite app from the `frontend` directory with `npm run build`, then
deploy it using `npx wrangler deploy`. Cloudflare Workers Builds should use
`frontend` as the root directory.
