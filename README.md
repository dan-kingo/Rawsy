# Rawsy Monorepo

Rawsy is a multi-app platform consisting of:
- **Backend (Node + Express + TypeScript)** in `rawsy-backend`
- **Admin Web Portal (React + Vite)** in `rawsy-admin-portal`
- **Mobile App (Expo + React Native)** in `rawsy-frontend`

This README covers local setup, environment variables, scripts, and development workflow for all three apps.

---

## Prerequisites
- Node.js LTS and npm
- A MongoDB instance (Atlas or local)
- Cloudinary account (for media uploads)
- Firebase service account (for server-side notifications)
- Expo CLI (for running the mobile app): `npm i -g expo`

---

## Quick Start

### Backend (API)
1. Change directory:
   ```bash
   cd rawsy-backend
   ```
2. Install deps:
   ```bash
   npm install
   ```
3. Create `.env` and add required variables (see Environment):
4. Start in dev:
   ```bash
   npm run dev
   ```
   The API listens on port `4000`.

Common scripts:
- `npm run dev` — start with ts-node-dev
- `npm run build` — compile TypeScript to `dist`
- `npm start` — run compiled server from `dist`
- `npm run seed:admin` — seed an initial admin user

### Admin Web Portal
1. Change directory:
   ```bash
   cd rawsy-admin-portal
   ```
2. Install deps:
   ```bash
   npm install
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```
   Vite runs on port `3000`.

### Mobile App (Expo)
1. Change directory:
   ```bash
   cd rawsy-frontend
   ```
2. Install deps:
   ```bash
   npm install
   ```
3. Start Expo (choose platform):
   ```bash
   npm run start
   # or
   npm run android
   npm run ios
   npm run web
   ```

---

## Environment (Backend)
Create `rawsy-backend/.env` with the following keys:

```env
# MongoDB
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority

# JWT
JWT_SECRET=supersecret
JWT_EXPIRES=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Firebase Admin
# Paste the full JSON content as a single string
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

Notes:
- `MONGO_URI` is required for DB connectivity.
- Cloudinary and Firebase keys are required at runtime; the backend will throw if they are missing.
- The server listens on `4000` regardless of `PORT`.

---

## Admin Portal API Target
By default, the admin portal proxies `/api` to the hosted backend (`https://rawsy.onrender.com`). For local development, update the proxy target in `rawsy-admin-portal/vite.config.js`:

```js
proxy: {
  '/api': {
    target: 'http://localhost:4000',
    changeOrigin: true,
  },
}
```

Some components also reference the hosted URL directly; you can replace `https://rawsy.onrender.com` with your local API `http://localhost:4000` where needed.

---

## Mobile App API Base URL
The mobile app currently points to the hosted API in `rawsy-frontend/services/api.ts`:

```ts
const API_BASE_URL = 'https://rawsy.onrender.com/api';
```

For local development on a device/emulator, set `API_BASE_URL` to your machine's IP and backend port. Example:

```ts
const API_BASE_URL = 'http://192.168.1.10:4000/api';
```

Tip: Ensure your device can reach your machine's IP on the same network.

---

## Seeding an Admin User
Use the seed script to create an initial admin:

```bash
cd rawsy-backend
npm run seed:admin
```

Optional environment overrides:
- `ADMIN_EMAIL` (default: `admin@rawsy.com`)
- `ADMIN_PASSWORD` (default: `Admin@123`)
- `ADMIN_NAME` (default: `Admin User`)

See `rawsy-backend/SEED_ADMIN.md` for details.

---

## Directory Structure
```
rawsy-admin-portal/   # React + Vite admin web app
rawsy-backend/        # Node + Express + TS API server
rawsy-frontend/       # Expo + React Native mobile app
```

---

## API Overview (Backend)
The server mounts endpoints under `/api/*`:
- `/api/auth` — authentication, device tokens
- `/api/products` — product catalog
- `/api/admin` — admin actions & metrics
- `/api/orders` — order management
- `/api/notifications` — push notifications
- `/api/wishlist`, `/api/cart` — user lists and carts
- `/api/reviews`, `/api/quotes`, `/api/support`, `/api/home`
- Static invoices served at `/invoices/files`

---

## Build & Deploy
- Backend: `npm run build` then `npm start`
- Admin Portal: `npm run build` produces static assets in `dist/`
- Mobile: Use EAS for builds; see `rawsy-frontend/eas.json`

---

## Troubleshooting
- Cannot connect to MongoDB: verify `MONGO_URI` and network/firewall.
- 401 responses: check token handling in clients; tokens are attached automatically via interceptors.
- Mobile cannot hit local API: use your machine's LAN IP, not `localhost`.

---

## Contributing
- Keep changes minimal and focused.
- Follow TypeScript and linting configs in each app.
- Prefer small PRs with clear descriptions.
