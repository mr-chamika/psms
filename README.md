# Photography Studio Management System (PSMS)

A full-stack Next.js app for managing a photography studio with role-based dashboards (admin, editor, photographer, receptionist), client and order workflows, sittings, billing, and reporting.

## Tech Stack

- Next.js App Router, React
- MongoDB + Mongoose
- JWT auth (cookies)
- Tailwind CSS + MUI + shadcn/ui
- Jest for tests

## Prerequisites

- Node.js 18+ (recommended)
- MongoDB instance (local or cloud)

## Quick Start

1) Install dependencies

```bash
npm install
```

2) Create your environment file

Create a `.env.local` file in the repo root:

```bash
MONGODB_URI=mongodb://localhost:27017/psms
JWT_SECRET=replace-with-strong-secret
JWT_EXPIRES_IN=3600
```

3) (Optional) Seed admin + baseline data

Update the defaults inside `scripts/seed.mjs` (admin, studio info, billing data), then run:

```bash
npm run create-admin
```

4) Run the dev server

```bash
npm run dev
```

Open http://localhost:3000

## Environment Variables

Required:

- `MONGODB_URI` - MongoDB connection string used by the app and seed script.
- `JWT_SECRET` - secret used to sign and verify auth tokens.

Optional:

- `JWT_EXPIRES_IN` - token expiry in seconds (default: 3600).

## Available Scripts

- `npm run dev` - start Next.js in development mode.
- `npm run build` - build for production.
- `npm run start` - run the production build.
- `npm run lint` - run ESLint.
- `npm run test` - run Jest tests.
- `npm run create-admin` - seed admin, studio info, and billing defaults.

## Project Structure

```
app/                Next.js App Router pages and API routes
	(auth)/           Auth pages (login, signup)
	(pages)/          Role-based dashboards and app pages
	api/              Route handlers (auth, users, clients, orders, reports, ...)
components/         UI + feature components
lib/                Auth helpers, DB connection, models, RBAC
__tests__/           Jest test suite
scripts/            Data seed scripts
public/             Static assets
```

Key areas:

- Auth + RBAC helpers live in `lib/auth.ts` and `lib/rbac`.
- Mongo connection + index sync in `lib/db.ts`.
- API endpoints are in `app/api/*/route.ts` (App Router style).

## Running Tests

```bash
npm test
```

Tests live in `__tests__/`. Jest is configured via `jest.config.js` and `jest.setup.js`.

## Data Fix Script (Optional)

If you need to clean invalid `photographer` or `editor` ids in `sittings`, run:

```bash
node fix-db.js
```

This script reads `MONGODB_URI` from `.env.local` or `.env`.

## Deployment

1) Build and start:

```bash
npm run build
npm run start
```

2) Ensure production env vars are set (`MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`).

## Notes

- Auth uses HTTP-only cookies; ensure `JWT_SECRET` is strong in production.
- Role redirects are defined in `lib/auth.ts` (`admin`, `editor`, `photographer`, `receptionist`).
