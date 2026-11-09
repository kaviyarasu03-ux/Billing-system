# Golden Cake Bakery Billing System

A bakery inventory and billing application with a React/Vite frontend, an
Express API, and MongoDB storage.

## Features

- View and manage the cake catalog, prices, and stock.
- Create customer bills with item quantities and discounts.
- Print bills and review billing history.
- View dashboard totals for cakes, orders, and revenue.

## Project layout

```text
backend/       Express API, MongoDB models, and tests
frontend/      React/Vite web application
Dockerfile     Docker image for the backend
render.yaml    Render Blueprint for a native Node backend service
```

## Important access warning

Login and authorization have been removed. Anyone who can reach the website or
API can view, add, edit, and delete cakes and bills. Do not expose this version
to the public internet with real customer or business data. Deploy it only in a
trusted environment, or add an access-control mechanism before public use.

## Requirements

- Node.js and npm.
- A MongoDB database reachable from the backend. Use MongoDB Atlas for a cloud
  deployment.

## Run locally

### 1. Configure MongoDB

Create `backend/.env` from the example:

```powershell
Copy-Item backend\.env.example backend\.env
```

Set `MONGO_URI` in `backend/.env` to your MongoDB connection string. Keep this
file private: it is ignored by Git and must not be committed or shared.

### 2. Start the backend

In a PowerShell terminal from the repository root:

```powershell
npm --prefix backend ci
npm --prefix backend start
```

The API listens on `http://localhost:5000`. Its root endpoint should display
`Bakery Cake Billing System API is Running!`.

### 3. Start the frontend

In a second terminal from the repository root:

```powershell
npm --prefix frontend ci
npm --prefix frontend run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. By default,
the frontend sends API requests to `http://localhost:5000`.

## Configuration

### Backend

| Variable | Required | Description |
|---|---:|---|
| `MONGO_URI` | Yes | MongoDB connection string. Keep it secret. |
| `PORT` | No | API port; defaults to `5000`. |

Use `backend/.env.example` as the local template. Production values belong in
the hosting provider's private environment settings, not in Git.

### Frontend

| Variable | Required | Description |
|---|---:|---|
| `VITE_API_URL` | For deployment | Backend base URL, e.g. `https://your-api.onrender.com`. Do not append `/api`. |

For local development, this defaults to `http://localhost:5000`. Vite embeds
`VITE_API_URL` into the frontend build, so rebuild and redeploy after changing
it. This URL is public configuration; never put database credentials or other
secrets in a `VITE_` variable.

## API endpoints

All data endpoints are currently unauthenticated.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | API health message |
| `GET` | `/api/cakes` | List cakes |
| `POST` | `/api/cakes` | Add a cake |
| `PUT` | `/api/cakes/:id` | Update a cake |
| `DELETE` | `/api/cakes/:id` | Delete a cake |
| `GET` | `/api/bills` | List bills, newest first |
| `POST` | `/api/bills` | Create a bill |
| `DELETE` | `/api/bills/:id` | Delete a bill |

## Test and build

Run backend tests:

```powershell
npm --prefix backend test
```

Lint and build the frontend:

```powershell
npm --prefix frontend run lint
npm --prefix frontend run build
```

The production frontend files are generated in `frontend/dist`.

## Deploy the backend to Render

The repository includes a Render Blueprint in `render.yaml` for a native Node
service:

1. Push the repository to GitHub.
2. In Render, choose **New → Blueprint** and select this repository.
3. Set the private `MONGO_URI` environment variable to a reachable MongoDB
   Atlas connection string. Do not paste it into source files, commits, chat,
   or logs.
4. Deploy and check the service logs. A successful startup reports that MongoDB
   connected and that the server is listening.
5. Open the Render service's public root URL and confirm it returns the API
   health message.

For an existing Docker-based Render service, use the repository root as its
Docker build context/root directory so Render can find the root `Dockerfile`
and the `backend/` files it copies. Configure `MONGO_URI` in Render's
Environment settings and redeploy.

The Blueprint uses Render's Free plan; free services may spin down while idle
and take longer to respond when they wake.

## Deploy the frontend to Cloudflare Pages

Configure the Pages project with:

- **Root directory:** `frontend`
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Environment variable:** `VITE_API_URL`, set to the Render service's public
  base URL, without a trailing slash or `/api`

Save the Pages environment variable and start a new build/deployment whenever
the API URL changes.

To deploy manually from PowerShell at the repository root:

```powershell
$env:VITE_API_URL = "https://your-api.onrender.com"
npm --prefix frontend ci
npm --prefix frontend run build
npx wrangler pages deploy frontend\dist --project-name=bakery-billing-system --branch=main
```

Replace the example URL with the actual public backend URL. The backend must
be deployed and connected to MongoDB for login-free data operations to work.
