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

Copy `backend/.env.example` to `backend/.env`, replace the placeholder, and set
`MONGO_URI` to a reachable MongoDB connection string. Keep database credentials
private and never commit `.env`.

The app has no login or authorization. Anyone who can reach the website or API
can view and change cakes, create and delete bills, and view billing history.
Use it only in a trusted environment; do not expose it publicly with real
customer or business data.

## Deploy the backend to Render

The root `render.yaml` is a Render Blueprint for the Express API. To create a
native Node service, push the repository to GitHub, sign in to Render, choose
**New → Blueprint**, and select this repository. Render will create the web
service using `backend` as its root.

If you already created a Docker web service, keep its Docker runtime and use
the repository root as the service's root directory. The root `Dockerfile`
builds the API from `backend/`. Push any Dockerfile changes to GitHub, then
trigger a new deploy from Render.

The Blueprint uses the Free instance plan; free services may sleep when idle
and are best for testing, not production billing workloads.

When prompted, provide `MONGO_URI` as a private environment value. Never add
database credentials to the repository. Use a cloud MongoDB Atlas cluster for
`MONGO_URI`.
After deploying, test the service URL at `/` and confirm it returns the API
running message.

## Deploy the frontend to Cloudflare Pages

The Vite frontend is a static Pages site. In the Pages project, set the build
root to `frontend`, build command to `npm run build`, and output directory to
`dist`. Set `VITE_API_URL` to the Render service's base URL (without a trailing
slash or `/api`) in the Pages environment variables, then rebuild and deploy.
`VITE_API_URL` is embedded during the build, so changing it requires a new
frontend build.

For a manual Pages deployment, build and deploy from the `frontend` directory:

```powershell
npm ci
npm run build
npx wrangler pages deploy .\dist --project-name=bakery-billing-system --branch=main
```
