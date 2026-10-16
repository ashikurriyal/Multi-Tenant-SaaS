# LedgerFlow

**A multi-tenant subscription and usage-billing platform with exactly-once Stripe webhook processing, concurrency-safe usage limits, and SaaS revenue analytics.**

> 🚧 Work in progress. See [docs/LedgerFlow.md](docs/LedgerFlow.md) for the full blueprint and SRS.

## Tech stack

| Layer | Tools |
| --- | --- |
| Client | Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, Redux Toolkit + RTK Query |
| Server | Node.js, Express 5, TypeScript, Passport (local + JWT), Zod |
| Data | PostgreSQL, Prisma 7 |
| Payments | Stripe (test mode) |
| DevOps | GitHub Actions, Vercel, Render, Neon |

## Repository structure

```
.
├── client/   # Next.js app
├── server/   # Express REST API
└── docs/     # Blueprint/SRS, ERD, SQL schema, ADRs, Postman collection
```

## Getting started

Requirements: Node.js 22+ and a PostgreSQL database (we use [Prisma Postgres](https://www.prisma.io/postgres)).

```bash
# API → http://localhost:5050 (not 5000: macOS AirPlay Receiver uses that port)
cd server
cp .env.example .env      # set DATABASE_URL and SUPER_ADMIN_*
npm install               # also generates the Prisma client
npm run db:deploy         # apply migrations
npm run db:seed           # plans + super admin
npm run dev

# Client → http://localhost:3000
cd client
cp .env.example .env.local
npm install
npm run dev
```

The client proxies `/api/*` to the API through a Next.js rewrite, so the browser sees a single origin.

## Scripts

| Command | server | client |
| --- | --- | --- |
| `npm run dev` | Start API with hot reload | Start Next.js dev server |
| `npm run build` | Compile to `dist/` | Production build |
| `npm run lint` | ESLint | ESLint |
| `npm run typecheck` | `tsc --noEmit` | `tsc --noEmit` |
| `npm run db:migrate` | Create + apply a migration (dev) | |
| `npm run db:seed` | Seed plans + super admin | |
| `npm run stripe:setup` | Create Stripe products, prices and usage meter (test mode) and link them to the plans | |
| `npm run db:studio` | Open Prisma Studio | |
| `npm run verify:tenancy` | Check tenant isolation + RBAC against the database (creates and removes its own test data) | |

## Deployment

Website and API on Vercel, database on Prisma Postgres, all on free plans. Background jobs are secret-protected routes called by a GitHub Actions schedule. See [docs/deployment.md](docs/deployment.md).

## Git workflow

- `main`: deployable
- `development`: integration branch
- `feat/*`, `fix/*`, `chore/*`: one branch per feature, created from `development` and merged back into it
