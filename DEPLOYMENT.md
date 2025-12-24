# Deployment Guide

This guide covers recommended hosting options and a Docker-based setup for the Macronix Document Validation System (backend API, frontend web, and supporting services).

## Preferred Stack (Production)
- **Backend API**: Azure App Service (Linux) running Node.js
- **Database**: Azure Database for PostgreSQL (Flexible Server)
- **Frontend Web**: Azure Static Web Apps (for React build)
- **Storage/CDN**: ImageKit (already integrated) or Azure Blob Storage for assets
- **SMS**: Fast2SMS (DLT route). Ensure sender/template approvals align.
- **Domains/Short Links**: Your own domain; set `SHORT_URL_BASE` (e.g., https://mx.cx) and DNS accordingly

This provides reliability, observability, security (managed SSL), and easy scaling. If you prefer simpler one-click hosting, **Render** or **Railway** are strong alternatives for API + Postgres.

## Environment Variables (Backend)
Configure these in your hosting platform:
- `PORT=5000`
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_DIALECT=postgres`
- `FAST2SMS_API_KEY`, `FAST2SMS_SENDER_ID`, `FAST2SMS_DLT_TEMPLATE_ID`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- `SHORT_URL_BASE` (public base for short-links)
- `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`

## Docker (Local Prod-Like)
Use the provided Dockerfile and compose to run locally with Postgres:

```bash
docker compose up -d --build
docker compose logs -f api
```

API will be at `http://localhost:5000`. Postgres at `localhost:5432` (user `postgres`, password `postgres`).

Files:
- Backend Dockerfile: [backend/Dockerfile](backend/Dockerfile)
- Compose: [docker-compose.yml](docker-compose.yml)

## Azure Deployment (Backend)
1. Create Azure Database for PostgreSQL; note host, db, user, password, and firewall rules.
2. Create Azure App Service (Linux) → Runtime stack Node 18.
3. Configure App Settings with the environment variables listed above.
4. Deploy backend (GitHub Actions, Azure DevOps, or `az webapp up`).
5. Verify health endpoint (if present) and API routes.

## Frontend Web
Build the React app and deploy the `build` folder:

```bash
cd frontend
npm install
npm run build
```

Deploy the `frontend/build` directory to Azure Static Web Apps (or Netlify/Vercel). Configure the API base URL to the App Service domain.

## SMS DLT Alignment
- Ensure your Fast2SMS account has the same approved sender as your DLT template (e.g., `MACRONIX`).
- Set `FAST2SMS_SENDER_ID` and `FAST2SMS_DLT_TEMPLATE_ID` accordingly.
- Use the DLT route (`/dev/bulkV2`, `route=dlt`) with exact template text (already implemented in `notificationUtils`).

## Short Links & Domain
- Acquire a compact domain and set `SHORT_URL_BASE`.
- Point DNS to your frontend domain or a dedicated short-link redirector.

## Alternatives
- **Render**: One service for API (Node), one for Postgres. Set env vars in the dashboard. Auto-deploy from GitHub.
- **Railway**: Similar simplicity; good for rapid iteration.

## Troubleshooting
- If the backend exits on start, check DB connectivity and required env vars.
- Verify Postgres firewall/network from the App Service.
- Confirm Fast2SMS credentials and DLT sender/template approvals.
