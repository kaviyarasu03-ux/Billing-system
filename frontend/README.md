# Golden Cake Bakery Billing System

React and Vite frontend for the bakery billing app. It connects to the Express
API to display cakes, manage inventory, create and print bills, and view sales
history.

## Run locally

Start the backend first. It must have a valid MongoDB connection configured as
`MONGO_URI` in `backend/.env` and run at `http://localhost:5000`.

Then, from this directory:

```powershell
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Configure the API URL

The frontend uses `VITE_API_URL` as the API base URL. For local development,
it defaults to `http://localhost:5000`. For a deployed site, set `VITE_API_URL`
to the public backend URL, for example `https://your-service.onrender.com`.
Do not add `/api` to the value.

Vite embeds this value into the built files, so rebuild and redeploy after
changing it.

## Build and lint

```powershell
npm run lint
npm run build
```

The production files are written to `dist`.

## Deploy to Cloudflare Pages

Configure the Pages project with:

- **Root directory:** `frontend`
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Environment variable:** `VITE_API_URL` set to the public backend URL

For a manual deployment, run these commands from this directory:

```powershell
npm ci
npm run build
npx wrangler pages deploy .\dist --project-name=bakery-billing-system --branch=main
```

## Access warning

This app currently has no login or authorization. Anyone who can reach the
frontend or API can manage cakes and billing data. Do not expose it publicly
with real business or customer data unless you add another access-control
mechanism.
