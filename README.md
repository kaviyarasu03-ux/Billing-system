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

## Cloudflare frontend deployment

Build the Vite app from the `frontend` directory with `npm run build`, then
deploy it using `npx wrangler deploy`. Cloudflare Workers Builds should use
`frontend` as the root directory.
