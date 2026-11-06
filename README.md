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

Copy `backend/.env.example` to `backend/.env`, replace every placeholder, and set
`MONGO_URI` to a reachable MongoDB connection string. Use a new admin password
and a random `JWT_SECRET` of at least 32 characters. On first startup, the API
creates the admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD`; it does not
reset an existing admin password. Keep these values in deployment secrets in
production. Never commit `.env` or database credentials.

Generate a JWT secret locally with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Customers can create an account from the sign-in page. Customer accounts can
browse the cake catalog only. Admins can manage cakes, create bills, and view
billing history. The backend checks the account role on every protected API
request; hiding admin controls in the frontend is not the security boundary.
After signing in, admins can use **Security** in the sidebar to change the
password. The current password is verified, and changing the password expires
existing sessions so the admin must sign in again.

## Deploy the backend to Render

The root `render.yaml` is a Render Blueprint for the Express API. Push the
repository to GitHub, sign in to Render, choose **New → Blueprint**, and select
this repository. Render will create the web service using `backend` as its root.
The Blueprint uses the Free instance plan; free services may sleep when idle
and are best for testing, not production billing workloads.

When prompted, provide `MONGO_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` as
private environment values. Render generates `JWT_SECRET`. Never add these
values to the repository. Use a cloud MongoDB Atlas cluster for `MONGO_URI`.
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
