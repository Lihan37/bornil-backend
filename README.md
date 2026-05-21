# Bornil Vibes Backend

Production-ready Express + TypeScript API for the Bornil Vibes jewelry shop.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and set all values.
3. Seed categories and sample products:
   ```bash
   npm run seed
   ```
4. Run in development:
   ```bash
   npm run dev
   ```

## Deployment

Build command:
```bash
npm run build
```

Start command:
```bash
npm start
```

Set `CLIENT_URL` to the deployed frontend URL and set `ADMIN_PHONES` as comma-separated phone numbers.
