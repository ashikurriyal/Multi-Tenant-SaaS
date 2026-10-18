# LedgerFlow — Project Blueprint & Software Requirements Specification (SRS)

**Multi-Tenant SaaS Billing & Usage Analytics Platform**

| | |
| --- | --- |
| Document version | 1.0 |
| Date | 8 October 2026 |
| Status | Approved for build |
| Stack | Next.js · Redux Toolkit + RTK Query · Express 5 · TypeScript · Prisma 7 · PostgreSQL · Stripe (test mode) |

---

## Table of contents

**Part A — Project blueprint**

1. [Overview](#1-overview)
2. [Key concepts in plain English](#2-key-concepts-in-plain-english)
3. [Scope](#3-scope)
4. [Technology stack](#4-technology-stack)
5. [System architecture](#5-system-architecture)
6. [Repository structure](#6-repository-structure)

**Part B — Software Requirements Specification**

7. [Introduction](#7-introduction)
8. [Overall description](#8-overall-description)
9. [Functional requirements](#9-functional-requirements)
10. [API specification](#10-api-specification)
11. [Data requirements and ERD](#11-data-requirements-and-erd)
12. [Business rules and state machines](#12-business-rules-and-state-machines)
13. [Background jobs](#13-background-jobs)
14. [Non-functional requirements](#14-non-functional-requirements)
15. [Environment variables](#15-environment-variables)

**Part C — Build guide**

16. [Implementation guide (key code patterns)](#16-implementation-guide-key-code-patterns)
17. [Frontend specification](#17-frontend-specification)
18. [Build plan: 4 phases](#18-build-plan-4-phases)
19. [Manual verification checklist](#19-manual-verification-checklist)
20. [Deployment and security](#20-deployment-and-security)
21. [Portfolio presentation](#21-portfolio-presentation)
22. [Resume bullets and interview preparation](#22-resume-bullets-and-interview-preparation)

---

# Part A — Project blueprint

## 1. Overview

LedgerFlow is a multi-tenant B2B SaaS where companies sign up, invite their team, subscribe to a pricing plan through Stripe (test mode), send metered usage through an API, and see usage and billing dashboards. A platform admin view shows revenue health across all customers: MRR, churn and expansion.

### 1.1 The product being sold

LedgerFlow sells a metered **"API credits"** service. Each customer company (a *tenant*) gets API keys. Its apps report usage events (for example `documents_processed`). LedgerFlow counts that usage, enforces plan limits, bills overage through Stripe, and charts it.

The usage source is deliberately simple, so the engineering effort goes into billing, data isolation and correctness, not into a fake product.

### 1.2 Plans (example values, change freely)

| Plan | Price | Seats | Included units / month | Overage |
| --- | --- | --- | --- | --- |
| Free | $0 | 3 | 1,000 | Blocked (hard limit) |
| Pro | $49 / month | 10 | 50,000 | $0.002 per unit |
| Business | $199 / month | 50 | 500,000 | $0.001 per unit |

### 1.3 The business problem

Billing is where SaaS companies lose money silently:

- A webhook processed twice provisions a customer twice.
- A missed `invoice.payment_failed` event gives months of free service.
- A wrong MRR formula misleads the founders and investors.

Every funded startup has an engineer who owns this code, and it is notoriously easy to get wrong.

### 1.4 What this project proves to a hiring manager

| Skill | Where it shows up |
| --- | --- |
| Data isolation in a multi-tenant system | Every query is scoped by `organizationId`; one company can never read another's data |
| Reliable third-party integration | Stripe webhooks can arrive late, twice, or out of order, and the system stays correct |
| State machines driven by an external system | Subscription status changes only when Stripe says so |
| Money correctness | Integer cents, idempotent writes, nightly reconciliation against Stripe |
| Concurrency correctness | Usage limits enforced with an atomic database update that cannot be overrun |
| Analytics on transactional data | MRR movements, churn and NRR computed from daily snapshots |

**One-line pitch for the README:**
*A multi-tenant subscription and usage-billing platform with exactly-once Stripe webhook processing, concurrency-safe usage limits, and SaaS revenue analytics.*

---

## 2. Key concepts in plain English

Learn these terms before writing code; every later section uses them.

| Term | Plain meaning | Where it appears in LedgerFlow |
| --- | --- | --- |
| Tenant | One customer company using the app. Many tenants share one database. | `organizations` table; every business row has an `organizationId`. |
| RBAC | Role-based access control: what each person may do inside their company. | Owner, Admin, Billing and Member roles mapped to permissions. |
| Subscription | An ongoing agreement to pay for a plan every period. | One `subscriptions` row per organization, mirrored from Stripe. |
| Webhook | Stripe calling *your* server to say "something happened" (payment succeeded, card failed). | `POST /api/v1/webhooks/stripe`, the most important endpoint in the project. |
| Idempotency | Doing the same operation twice has the same effect as doing it once. | Duplicate webhooks and retried usage reports are ignored safely. |
| Source of truth | The system whose data wins in a disagreement. | Stripe owns payment state; your database is a fast local copy that is reconciled against Stripe. |
| Metered usage | Billing for how much a customer used, not a flat fee. | Usage events are counted and reported to Stripe for overage charges. |
| Proration | Charging a fair partial amount when a plan changes mid-month. | Upgrading Pro → Business on day 15 charges roughly half the difference now. |
| Dunning | Chasing failed payments: retries, emails, then downgrade. | `PAST_DUE` banner, reminder emails, downgrade to Free after the grace period. |
| MRR / churn | Monthly recurring revenue, and the share of customers or revenue lost per month. | Platform admin dashboard. |
| Atomic update | A database write that checks a condition and changes data in one step, so two requests can't both pass the check. | Usage-limit enforcement (`usage_counters`). |

> **The golden rule of this project:** the user's browser never decides whether someone has paid. Only a verified Stripe webhook (or a direct read from the Stripe API) can change subscription state.

---

## 3. Scope

Ship the MVP column completely before touching stretch goals. A finished, correct MVP beats a half-built feature list.

| Area | MVP (must ship) | Stretch (after MVP is deployed) |
| --- | --- | --- |
| Accounts | Register, login, refresh-token rotation, logout, profile | Google login (passport-google-oauth20), email verification |
| Tenancy and roles | Org-scoped data, 4 org roles, permission checks on every endpoint | Transfer ownership |
| Billing | Stripe Checkout, Customer Portal, plan change with proration preview, invoice list | Annual plans, coupons |
| Webhooks | Signature check, dedupe, retries with backoff, nightly reconciliation | Admin button to replay a failed event |
| Usage | API keys, usage ingestion, concurrency-safe plan limits, overage reporting to Stripe | Per-plan API rate limits |
| Analytics | Tenant usage chart; admin MRR, MRR movements, churn, ARPA | Cohort retention table, CSV export |
| Operations | GitHub Actions (lint, type-check, build), auto-deploy, health endpoint | Docker, error tracking (Sentry) |
| Quality | Manual verification checklist (section 19) | Automated tests (Jest + Supertest) |

### 3.1 Non-goals (state these in your README — it shows judgement)

- No card data ever touches LedgerFlow servers. Stripe Checkout and the Customer Portal handle it, which keeps the project out of PCI scope.
- No custom payment processing, tax calculation or multi-currency in the MVP.
- No invoice generation of our own; Stripe issues invoices and LedgerFlow displays them.

---

## 4. Technology stack

Every tool below is either already in your stack or is small enough to learn in a day. Tools you don't know yet (Redis, BullMQ, argon2, Zustand, testing frameworks) are intentionally **not** used.

### 4.1 Stack

| Layer | Choice | Purpose |
| --- | --- | --- |
| Frontend framework | Next.js (App Router), React, TypeScript | Pages, routing, server rendering of public pages |
| Styling and UI | Tailwind CSS, shadcn/ui, Magic UI (landing page only) | Consistent, accessible components |
| Client state | **Redux Toolkit** (slices for auth and UI state) | Access token in memory, active organization, UI flags |
| Server data | **RTK Query** | API calls, caching, tag-based invalidation, polling, automatic token refresh |
| Forms | React Hook Form + Zod | Form state and validation |
| Charts | Recharts | Usage and MRR charts |
| Backend | Node.js, Express 5, TypeScript (strict) | REST API |
| Auth | **passport**, **passport-local**, **passport-jwt**, **jsonwebtoken**, **bcrypt**, **cookie-parser** | Login, token issue/verify, password hashing, cookies |
| HTTP middleware | **cors**, helmet, express-rate-limit, morgan | CORS, security headers, brute-force protection, request logs |
| Validation | Zod | Request body/query validation (server) and forms (client) |
| ORM and database | Prisma 7 (`@prisma/adapter-pg`), PostgreSQL | Data access, migrations |
| Payments | Stripe (test mode): Checkout, Customer Portal, Billing, Billing Meters | Subscriptions, invoices, usage-based overage |
| Scheduled jobs | node-cron | Retries, usage reporting, rollups, reconciliation |
| Email | Nodemailer (Mailtrap in development, any SMTP in production) | Invitations and payment emails |
| DevOps | Git, GitHub Actions, Vercel (client and API), Prisma Postgres | CI and free deployment (see `docs/deployment.md`) |
| API tools | Postman, Stripe CLI | Manual testing of endpoints and webhooks |

### 4.2 New things you will learn in this project

Be honest in interviews: say these were new to you and explain how you used them. That is a strength, not a weakness.

| Tool | Size of learning | What you need from it |
| --- | --- | --- |
| Stripe | Large (core of the project) | Checkout Sessions, Customer Portal, webhooks, Subscriptions, Billing Meters, Stripe CLI |
| Redux Toolkit + RTK Query | Medium (you chose it) | `createSlice`, `createApi`, tags, `pollingInterval`, a re-auth base query |
| Zod | Small (1 day) | Schemas, `safeParse`, `z.infer` |
| node-cron | Small (1 hour) | `cron.schedule('*/5 * * * *', fn)` |
| Nodemailer | Small (1 hour) | `transporter.sendMail()` |
| helmet, express-rate-limit, morgan | Tiny (minutes) | One line of middleware each |

### 4.3 Why there is no Redis or job queue

PostgreSQL alone handles everything at portfolio scale:

- **Webhook processing** uses a database "inbox" table with a retry schedule instead of a queue.
- **Usage limits** use an atomic conditional `UPDATE`, which cannot be overrun (proven in section 16.4).
- **Scheduled work** uses node-cron inside the API process.

Interview answer: *"PostgreSQL gave me the correctness guarantees I needed. If throughput grew, I'd move webhook processing to a queue like BullMQ and limit counters to Redis — the inbox and idempotency design stays the same."*

---

## 5. System architecture

The API answers users and Stripe quickly. Webhook work is recorded in an inbox table, so nothing is lost if processing fails, and scheduled jobs retry it and keep PostgreSQL in line with Stripe.

```
                 ┌─────────────────────┐        Checkout / Portal redirect      ┌──────────────────────┐
                 │  Next.js client     │ ─────────────────────────────────────► │  Stripe              │
                 │  (Vercel)           │                                        │  (source of truth    │
                 │  Redux + RTK Query  │                                        │   for payments)      │
                 └─────────┬───────────┘                                        └───┬──────────────▲───┘
                           │ REST + Bearer JWT                                       │ webhooks     │ API calls
                           │ (via Next.js /api rewrite)                              │ (signed)     │ (re-fetch,
┌─────────────────────┐    │                                                         │              │  meter events)
│  Customer apps      │    ▼                                                         ▼              │
│  (x-api-key)        ├──► ┌──────────────────────────────────────────────────────────────────────┴──┐
└─────────────────────┘    │  Express 5 API (Vercel)                                                   │
                           │  passport (local + jwt) · cors · cookie-parser · helmet · rate limit     │
                           │  modules: auth, users, orgs, billing, webhooks, usage, analytics, admin  │
                           │  node-cron jobs: webhook retry, meter report, rollups, MRR, reconcile    │
                           └──────────────────────────────────┬───────────────────────────────────────┘
                                                              │ Prisma 7 (tenant-scoped client)
                                                              ▼
                                               ┌───────────────────────────────┐
                                               │  PostgreSQL (Prisma Postgres)│
                                               │  16 tables — see section 11   │
                                               └───────────────────────────────┘
```

### 5.1 Request flows at a glance

| Flow | Path |
| --- | --- |
| User action | Browser → Next.js rewrite `/api/*` → Express → middleware chain → service → Prisma → PostgreSQL |
| Payment | Browser → Stripe Checkout → Stripe sends webhook → Express inbox → processor → PostgreSQL → browser polling sees `ACTIVE` |
| Usage | Customer app → `POST /api/v1/usage` (API key) → atomic counter check → `usage_events` → cron reports overage to Stripe |
| Analytics | Nightly cron → `mrr_snapshots`, `usage_daily_rollups` → dashboards read only these tables |

### 5.2 Why the client calls the API through a Next.js rewrite

If the client (`ledgerflow.vercel.app`) and API (`ledgerflow-api.onrender.com`) are on different sites, browsers treat the refresh-token cookie as a third-party cookie, and Safari blocks it.

A rewrite in `next.config.ts` makes the browser see one origin:

```ts
// client/next.config.ts
const nextConfig = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${process.env.API_URL}/api/:path*` }];
  },
};
export default nextConfig;
```

Now cookies are first-party, `SameSite=Lax` works, and CORS problems disappear in production. Stripe webhooks still go straight to the API URL.

---

## 6. Repository structure

One Git repository with two folders. The server follows the same modular pattern as your Prisma Press project.

```
ledgerflow/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts                      # plans, demo tenants, 12 months of history
│   ├── prisma.config.ts
│   ├── src/
│   │   ├── server.ts                    # connect Prisma, start app, start cron jobs
│   │   ├── app.ts                       # express app, middleware order, routes
│   │   ├── config/index.ts              # typed env variables
│   │   ├── lib/
│   │   │   ├── prisma.ts                # base Prisma client
│   │   │   ├── tenantPrisma.ts          # tenant-scoped client (section 16.3)
│   │   │   ├── stripe.ts                # Stripe SDK instance
│   │   │   ├── passport.ts              # local + jwt strategies
│   │   │   └── mailer.ts                # nodemailer transporter
│   │   ├── middlewares/
│   │   │   ├── auth.ts                  # passport-jwt guard
│   │   │   ├── requireOrgMember.ts      # loads membership, 404 if none
│   │   │   ├── requirePermission.ts     # RBAC check
│   │   │   ├── requireSuperAdmin.ts
│   │   │   ├── apiKeyAuth.ts            # x-api-key for usage ingestion
│   │   │   ├── validateRequest.ts       # Zod
│   │   │   ├── globalErrorHandler.ts
│   │   │   └── notFound.ts
│   │   ├── modules/
│   │   │   ├── auth/         auth.route.ts · auth.controller.ts · auth.service.ts · auth.validation.ts
│   │   │   ├── user/
│   │   │   ├── organization/
│   │   │   ├── member/
│   │   │   ├── invitation/
│   │   │   ├── plan/
│   │   │   ├── billing/
│   │   │   ├── webhook/      webhook.route.ts · webhook.processor.ts · stripe.handlers.ts
│   │   │   ├── apiKey/
│   │   │   ├── usage/
│   │   │   ├── analytics/
│   │   │   ├── admin/
│   │   │   └── audit/
│   │   ├── jobs/             index.ts (registers all cron jobs) + one file per job
│   │   ├── shared/
│   │   │   ├── permissions.ts           # role → permission map
│   │   │   ├── subscriptionState.ts     # status mapping + access level
│   │   │   ├── entitlements.ts
│   │   │   └── metrics.ts               # MRR / churn math
│   │   ├── errors/           AppError.ts · handlePrismaError.ts · handleZodError.ts
│   │   ├── utils/            catchAsync.ts · sendResponse.ts · hash.ts · tokens.ts
│   │   └── routes/index.ts              # mounts every module router under /api/v1
│   └── package.json
├── client/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (public)/     page.tsx (landing) · pricing/ · login/ · register/ · invite/[token]/
│   │   │   ├── [orgSlug]/    dashboard/ · usage/ · billing/ · settings/{members,api-keys,audit,profile}/
│   │   │   └── admin/        page.tsx · tenants/ · webhooks/
│   │   ├── redux/
│   │   │   ├── store.ts
│   │   │   ├── hooks.ts                 # typed useAppDispatch / useAppSelector
│   │   │   ├── StoreProvider.tsx
│   │   │   ├── features/     authSlice.ts · orgSlice.ts · uiSlice.ts
│   │   │   └── api/          baseApi.ts (re-auth) · authApi.ts · orgApi.ts · billingApi.ts
│   │   │                     usageApi.ts · apiKeyApi.ts · adminApi.ts
│   │   ├── components/       ui/ (shadcn) · billing/ · usage/ · members/ · charts/
│   │   ├── schemas/          Zod schemas for forms
│   │   └── lib/              permissions.ts (same map as server) · format.ts (money, dates)
│   └── package.json
├── docs/
│   ├── LedgerFlow.md                    # this document
│   ├── ledgerflow-erd.png · ledgerflow-erd.svg · ledgerflow-schema.sql
│   ├── postman/                         # Postman collection
│   └── adr/                             # architecture decision records
├── .github/workflows/ci.yml
└── README.md
```

**Layer rules (say these in interviews):**

- **Route** maps a URL to middleware and a controller.
- **Controller** handles HTTP only: reads `req`, calls a service, calls `sendResponse`.
- **Service** holds the business rules. It never touches `req` or `res`.
- **Prisma** is called only from services, through the tenant-scoped client for tenant data.

---

# Part B — Software Requirements Specification

## 7. Introduction

### 7.1 Purpose

This SRS is the source of truth for LedgerFlow. It defines what the system must do, how the API behaves, what data is stored, and the quality targets the system must meet. If code and this document disagree, update one of them on purpose — never leave them out of sync.

### 7.2 Product scope

LedgerFlow lets organizations subscribe to a plan, manage members and API keys, send metered usage, and view usage and billing. Platform administrators see revenue analytics across all organizations. Stripe (test mode) processes all payments.

### 7.3 Definitions and abbreviations

| Term | Meaning |
| --- | --- |
| Organization / tenant | A customer company. All business data belongs to exactly one organization. |
| Member | A user who belongs to an organization through a `memberships` row with a role. |
| Super admin | A LedgerFlow staff user (`platformRole = SUPER_ADMIN`). Not an organization role. |
| Access token | Short-lived JWT (15 minutes) sent in `Authorization: Bearer <token>`. |
| Refresh token | Longer-lived JWT (7 days) kept in an `httpOnly` cookie; used only to get new access tokens. |
| API key | Secret string (`lf_live_…`) used by a customer's software to send usage. |
| Billing period | The time range a subscription charges for, normally one month. |
| Unit | One counted item of usage (for example one processed document). |
| MRR | Monthly recurring revenue. |
| NRR | Net revenue retention. |
| ARPA | Average revenue per account. |
| Inbox | The `stripe_events` table, where every received webhook is stored before processing. |

### 7.4 Requirement conventions

- **Must** = required for the MVP. **Should** = strongly recommended. **May** = optional.
- Functional requirements use IDs such as `FR-AUTH-03`. Non-functional requirements use `NFR-SEC-02`.
- All money is stored and calculated as **integer cents**. Overage prices use **micros** (millionths of a dollar).
- All timestamps are stored in UTC.

### 7.5 References

- Stripe documentation: Billing, Checkout, Customer Portal, Webhooks, Billing Meters, Test clocks (use the version pinned in code).
- Prisma 7 documentation (client extensions, transactions, raw queries).
- Redux Toolkit / RTK Query documentation.
- Passport.js documentation (`passport-local`, `passport-jwt`).

---

## 8. Overall description

### 8.1 Product perspective

LedgerFlow is a standalone web application made of a Next.js client, an Express API and a PostgreSQL database. It depends on two external systems:

- **Stripe** for payments, invoices and usage-based overage.
- **An SMTP server** for email.

### 8.2 User classes and roles

| Actor | How they authenticate | What they do |
| --- | --- | --- |
| Visitor | None | Views landing and pricing pages, registers |
| Member | JWT | Views dashboards and usage for their organization |
| Billing | JWT | Member rights + manages plan, payment method and invoices |
| Admin | JWT | Member rights + manages members, invitations, API keys, org settings, audit log |
| Owner | JWT | All organization rights (one organization has at least one owner) |
| Super admin | JWT + `platformRole` | Platform analytics, tenant list, failed webhook events |
| Customer software | API key | Sends usage events |
| Stripe | Webhook signature | Notifies LedgerFlow of payment and subscription events |

A user may belong to many organizations, with a different role in each.

### 8.3 Permission matrix

The same map lives in `server/src/shared/permissions.ts` and `client/src/lib/permissions.ts`.

| Permission | Owner | Admin | Billing | Member |
| --- | :---: | :---: | :---: | :---: |
| `usage:read` — dashboards, usage | ✓ | ✓ | ✓ | ✓ |
| `members:read` — member list | ✓ | ✓ | ✓ | ✓ |
| `members:manage` — invite, change role, remove | ✓ | ✓ | | |
| `apikeys:manage` — create, revoke API keys | ✓ | ✓ | | |
| `org:update` — rename organization | ✓ | ✓ | | |
| `audit:read` — audit log | ✓ | ✓ | | |
| `billing:read` — plan, invoices | ✓ | ✓ | ✓ | |
| `billing:manage` — checkout, change plan, portal | ✓ | | ✓ | |

Only an Owner may grant or remove the Owner role.

### 8.4 Operating environment

| Component | Environment |
| --- | --- |
| Client | Latest Chrome, Firefox, Safari, Edge; works from 360 px wide screens |
| Server | Node.js 22 LTS, Express 5 |
| Database | PostgreSQL 16 (Prisma Postgres: `ledgerflow-dev` for development, `ledgerflow-prod` for production) |
| Payments | Stripe test mode only |

### 8.5 Design constraints

- Prisma is the only way the application reads and writes data; raw SQL is allowed only through `prisma.$executeRaw` / `$queryRaw` with tagged templates (never string concatenation).
- Passwords are hashed with bcrypt. Tokens are issued with jsonwebtoken and verified through passport-jwt.
- The API contract in section 10 changes only through a new version prefix (`/api/v2`).
- No card data is stored, logged or transmitted by LedgerFlow.

### 8.6 Assumptions and dependencies

- Stripe test mode is available, and the Stripe CLI is installed for local webhook forwarding.
- The server host keeps the process running continuously (no sleeping), because scheduled jobs run inside it.
- One API instance runs at a time in the MVP (in-memory rate limiting relies on this).

---

## 9. Functional requirements

### 9.1 Authentication (FR-AUTH)

| ID | Requirement |
| --- | --- |
| FR-AUTH-01 | The system must let a visitor register with `name`, `email`, `password` and `organizationName`. In **one database transaction** it must create the user, the organization (with a unique `slug`), an `OWNER` membership and a `FREE` subscription with status `ACTIVE`. |
| FR-AUTH-02 | Email addresses must be unique (case-insensitive; store them lower-cased). A duplicate returns `409 EMAIL_TAKEN`. |
| FR-AUTH-03 | Passwords must be at least 8 characters and must be hashed with bcrypt using `BCRYPT_SALT_ROUNDS` (default 12). |
| FR-AUTH-04 | Login must use the passport-local strategy with `email` and `password`. Wrong credentials return `401 INVALID_CREDENTIALS` with the same message for unknown email and wrong password. A `BLOCKED` user returns `403 USER_BLOCKED`. A correct password for an account whose email is not verified returns `403 EMAIL_NOT_VERIFIED` (checked after the password, so the answer never reveals that an account exists). |
| FR-AUTH-05 | On login the system must issue an access token (JWT, `JWT_ACCESS_EXPIRES_IN`, default `15m`) containing `sub` (user id), `email` and `platformRole`, and return it in the response body. |
| FR-AUTH-06 | On login the system must issue a refresh token (JWT, `JWT_REFRESH_EXPIRES_IN`, default `7d`) with a unique `jti` and a `familyId`, store a `refresh_tokens` row whose `id` is the `jti`, and set it as cookie `refreshToken` (`httpOnly`, `secure` in production, `sameSite: 'lax'`, `path: '/api/v1/auth'`). |
| FR-AUTH-07 | `POST /auth/refresh-token` must verify the cookie's JWT, find its row, and if valid and not revoked: revoke it, issue a new refresh token in the same family, set the new cookie, and return a new access token (rotation). |
| FR-AUTH-08 | If a refresh token that is already revoked is presented, the system must revoke **every** token in its family and return `401 TOKEN_REUSED` (stolen-token detection). |
| FR-AUTH-09 | Logout must revoke the current token family and clear the cookie. |
| FR-AUTH-10 | Protected routes must read the token from `Authorization: Bearer <token>` using passport-jwt (`ExtractJwt.fromAuthHeaderAsBearerToken()`). |
| FR-AUTH-11 | Login, register, verify-email and reset-password must be rate-limited to 5 requests per minute per IP. Resend-verification and forgot-password: 3 per 15 minutes per IP. Counters are stored in PostgreSQL (`rate_limits`) so the limit holds across server instances. |
| FR-AUTH-12 | **Email verification (hard gate).** Registration does **not** start a session. In the same transaction it creates a `VERIFY_EMAIL` token (random 32 bytes, stored only as SHA-256 in `email_tokens`, valid 24 hours) and queues a `verify_email` outbox email with the link `/verify-email?token=…` (plus `&next=` when given). Until `users.emailVerifiedAt` is set, login, the access-token guard and refresh all refuse the account. |
| FR-AUTH-13 | `POST /auth/verify-email` must consume the token atomically (one use only), set `emailVerifiedAt`, and start a session (access token in the body, refresh cookie) — the link proves the person owns the address. Unknown, expired and used tokens all return `410 TOKEN_EXPIRED`. |
| FR-AUTH-14 | `POST /auth/resend-verification` must always answer with the same message, whether or not the address has an account. For an unverified account it issues a new link (older links stop working), at most once per 60 seconds per account. |
| FR-AUTH-15 | Registering with an `inviteToken` whose invitation is pending, unexpired and addressed to the same email marks the account verified immediately and starts a session: the invitation link already proves the address. Registering an address held by an **unverified** account replaces that account (and the organization only it belongs to), so nobody can block an address by signing up with it first. |
| FR-AUTH-16 | `POST /auth/forgot-password` must always answer with the same message. A verified account receives a `RESET_PASSWORD` link (valid 1 hour, `/reset-password?token=…`); an unverified account receives a new verification link instead. At most once per 60 seconds per account. |
| FR-AUTH-17 | `POST /auth/reset-password` must consume the token atomically, set the new password (same rules as FR-AUTH-03) and revoke **all** of the user's refresh tokens. It does not start a session; the user logs in with the new password. |
| FR-AUTH-18 | Accounts still unverified 7 days after registration are deleted by the daily `cleanup` job, together with organizations they are the only member of. |

### 9.2 Users and profile (FR-USER)

| ID | Requirement |
| --- | --- |
| FR-USER-01 | `GET /users/me` must return the user (without `password`) and their memberships with organization `id`, `name`, `slug` and `role`. |
| FR-USER-02 | A user must be able to update their `name`. |
| FR-USER-03 | A user must be able to change their password by providing the current one. On success all of their refresh tokens are revoked. |

### 9.3 Organizations and members (FR-ORG)

| ID | Requirement |
| --- | --- |
| FR-ORG-01 | A logged-in user may create another organization; they become its `OWNER` and it starts on the Free plan. |
| FR-ORG-02 | Every `/orgs/:orgId/*` route must check that the user has a membership in that organization. If not, it must return **`404 ORG_NOT_FOUND`** (not 403, so the existence of other organizations is not revealed). |
| FR-ORG-03 | `GET /orgs/:orgId` must return the organization, the caller's role, and its current entitlements (section 12.3). |
| FR-ORG-04 | Users with `org:update` may rename the organization. The slug does not change after creation. |
| FR-ORG-05 | Users with `members:manage` may change a member's role and remove a member. Only an Owner may assign or remove the `OWNER` role. |
| FR-ORG-06 | The system must prevent removing or demoting the **last** Owner (`409 LAST_OWNER`). |
| FR-ORG-07 | Any member may leave an organization, except the last Owner. |
| FR-ORG-08 | Every role change and removal must write an audit log entry. |

### 9.4 Invitations (FR-INV)

| ID | Requirement |
| --- | --- |
| FR-INV-01 | Users with `members:manage` may invite an email address with a role (`ADMIN`, `BILLING` or `MEMBER`). |
| FR-INV-02 | An invitation must be refused with `402 PLAN_LIMIT_SEATS` if `members + pending invitations` would exceed the plan's seat limit. |
| FR-INV-03 | The invitation token must be a random 32-byte value, stored only as a SHA-256 hash, valid for 7 days, and emailed as a link `/invite/<token>` through the email outbox. |
| FR-INV-04 | Accepting requires a logged-in user whose email equals the invited email (`403 INVITE_EMAIL_MISMATCH` otherwise). A visitor without an account registers first, then accepts. |
| FR-INV-05 | Accepting creates the membership, sets `acceptedAt`, and is refused if the seat limit is now full. |
| FR-INV-06 | Admins may list pending invitations and revoke them (delete). |

### 9.5 Plans (FR-PLAN)

| ID | Requirement |
| --- | --- |
| FR-PLAN-01 | `GET /plans` must return active plans for the public pricing page. |
| FR-PLAN-02 | Plans are created by the seed script. `npm run stripe:setup` (`server/scripts/stripe-setup.ts`) creates their Stripe Products and Prices and a Billing Meter, then writes `stripePriceId` (flat monthly) and `stripeMeteredPriceId` (overage) into the `plans` table. It is idempotent: everything is found by lookup key (`ledgerflow_<plan>_monthly`, `ledgerflow_<plan>_overage`); when a plan's amounts change, a new Price takes over the lookup key and the old one is archived. Prices are never edited through the API, and price ids are never put in environment variables. It refuses live-mode keys. |
| FR-PLAN-03 | The overage Price is **metered and graduated**: the first `includedUnits` of a period cost 0, every further unit costs `overageUnitMicros`. Every accepted usage event can therefore be reported to the Meter, and Stripe bills only the excess. |

### 9.6 Billing (FR-BILL)

| ID | Requirement |
| --- | --- |
| FR-BILL-01 | `GET /orgs/:orgId/billing/subscription` must return plan, status, period dates, `cancelAtPeriodEnd`, `graceEndsAt` and access level. |
| FR-BILL-02 | `POST /billing/checkout-session` with `planCode` (`PRO` or `BUSINESS`) must: create the Stripe Customer if the organization has none and save `stripeCustomerId` **immediately** (so abandoned checkouts never create duplicate customers; the create call uses the idempotency key `ledgerflow-customer-<orgId>` and only organization data, so simultaneous clicks get the same customer); create a Checkout Session in `subscription` mode with the plan's flat price (quantity 1) and metered overage price; put `organizationId` and `planCode` in session and subscription `metadata` and `client_reference_id`; return the Checkout URL. It is only allowed when the organization holds no paid subscription (`INCOMPLETE`, `TRIALING`, `ACTIVE`, `PAST_DUE` or `UNPAID` with a `stripeSubscriptionId` → `409 ALREADY_SUBSCRIBED`). A plan without Stripe prices → `503 BILLING_NOT_CONFIGURED`. |
| FR-BILL-03 | The success page must **not** activate anything. The client polls `GET /billing/subscription` until status becomes `ACTIVE` or `TRIALING` (stop after 30 seconds). |
| FR-BILL-04 | `POST /billing/change-plan/preview` must return the prorated amount due now (`amountDueNowCents`, negative = credit), the new monthly price, and a `prorationDate`, using Stripe's invoice preview with `proration_behavior: always_invoice`. Only for an `ACTIVE` or `TRIALING` paid subscription (`409 NOT_SUBSCRIBED` otherwise, `409 PAYMENT_FAILED` while past due); the same plan → `409 CONFLICT`; moving to Free is done by cancelling in the Customer Portal. |
| FR-BILL-05 | `POST /billing/change-plan` must update the Stripe subscription's flat and metered prices with proration charged immediately (`always_invoice`, `payment_behavior: error_if_incomplete`, so a declined card changes nothing → `402 PAYMENT_FAILED`). It must require an `Idempotency-Key` header (8–100 characters) and pass it to Stripe: a repeated request returns the first one's result (a request still in progress is waited for), the same key with a different plan → `409 IDEMPOTENCY_KEY_REUSED`. A `prorationDate` from a preview less than an hour old is used, so the charge equals the preview. The local database changes only when the resulting webhook arrives (`202`). |
| FR-BILL-06 | Downgrading (preview and apply) must be refused with `409 SEATS_EXCEED_TARGET_PLAN` if members plus pending invitations exceed the target plan's seat limit. |
| FR-BILL-07 | `POST /billing/portal-session` must return a Stripe Customer Portal URL (update card, update billing email and address, download invoices, cancel at period end). The portal configuration is created by `npm run stripe:setup`; plan changes are **not** offered there, because they go through FR-BILL-04…06 (preview and seat checks). Without a Stripe customer → `409 NO_BILLING_ACCOUNT`. |
| FR-BILL-08 | `GET /billing/invoices` must list invoices newest first (paginated) with amount due and paid, status, period, paid date and Stripe-hosted invoice URL, from the local `invoices` table kept current by invoice webhooks. |
| FR-BILL-09 | Every billing change must write an audit log entry (actor = user for requests, `null` for Stripe-driven changes). |

### 9.7 Stripe webhooks (FR-WH)

| ID | Requirement |
| --- | --- |
| FR-WH-01 | `POST /api/v1/webhooks/stripe` must read the **raw** request body (mounted with `express.raw({ type: 'application/json' })` before `express.json()`). |
| FR-WH-02 | It must verify the `Stripe-Signature` header with `STRIPE_WEBHOOK_SECRET`. Invalid → `400`, nothing stored. |
| FR-WH-03 | It must insert the event into `stripe_events` using Stripe's event id as primary key. If the id already exists, it must return `200` without processing again (deduplication). |
| FR-WH-04 | Once the event is stored, the receiver must **answer `200` immediately** (`{ received: true, duplicate }`) and process the event **after** the response (Vercel `waitUntil`), so Stripe never waits on our database work. Processing claims the event atomically (`RECEIVED`/`FAILED` → `PROCESSING`), so the request, the retry job and other instances can never process one event twice. Failures are recorded on the row and retried by the `retry-webhooks` job. Without a configured `STRIPE_WEBHOOK_SECRET` the receiver answers `503` so Stripe retries later. |
| FR-WH-05 | For subscription and invoice events the processor must **re-fetch the current object from the Stripe API** rather than trusting the event payload, so events arriving out of order still produce the correct final state (observed in testing: `invoice.paid` regularly arrives before `customer.subscription.created`). |
| FR-WH-06 | All database changes for one event must happen in one Prisma transaction. |
| FR-WH-07 | A failed event must be retried with exponential backoff (`nextAttemptAt = now + 2^attempts minutes`: 2, 4, 8, 16) up to 5 attempts, then stay `FAILED` with no next attempt and appear in the super-admin dashboard. A `PROCESSING` row untouched for 10 minutes (crashed or timed-out worker) is reset to `FAILED` and retried. |
| FR-WH-08 | Events to handle in the MVP: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.trial_will_end`. Other events are stored and marked `PROCESSED` with no action. |
| FR-WH-09 | A nightly reconciliation job must compare every organization that has a `stripeSubscriptionId` against Stripe and correct differences, writing audit action `reconciliation.corrected`. |

### 9.8 API keys (FR-KEY)

| ID | Requirement |
| --- | --- |
| FR-KEY-01 | Users with `apikeys:manage` may create a named API key (name 2–60 characters). The full key (`lf_live_` + 32 random bytes in base64url; `lf_test_` outside production, so keys from the wrong environment are recognizable) is returned **once**, with `Cache-Control: no-store`, and never again. |
| FR-KEY-02 | Only the SHA-256 hash and the first 12 characters (`prefix`) are stored. |
| FR-KEY-03 | An organization may have at most 10 active (non-revoked) keys; the 11th → `409 CONFLICT`. The organization row is locked while counting, so simultaneous requests can't exceed the limit. |
| FR-KEY-04 | Revoking sets `revokedAt` (the row is kept for usage history); revoked keys are rejected on the very next request with `401 INVALID_API_KEY` — keys are checked against the database on every request. Missing, malformed, unknown and revoked keys all get the same `401`. Revoking twice → `409`. |
| FR-KEY-05 | The list endpoint shows name, prefix, creator, `lastUsedAt`, `createdAt` and `revokedAt` (active keys first); never the key or its hash. `lastUsedAt` is updated at most once a minute per key, after the response, so high-volume ingestion doesn't write on every request. Creating and revoking are audited (`apikey.created`, `apikey.revoked`). |

### 9.9 Usage metering (FR-USE)

| ID | Requirement |
| --- | --- |
| FR-USE-01 | `POST /api/v1/usage` must authenticate with header `x-api-key` and resolve the organization from the key. |
| FR-USE-02 | The body must contain `metric` (lowercase letters, digits, underscore; 1–50 chars), `quantity` (integer 1–10,000), `idempotencyKey` (1–100 chars) and optional `occurredAt` (ISO date, not more than 24 hours old or 5 minutes in the future; defaults to now). |
| FR-USE-03 | A repeated `idempotencyKey` for the same organization must return `202` with the **original** event id and `duplicate: true`, and must not count usage again. |
| FR-USE-04 | For plans without overage (Free, or any organization whose access level is `FREE`), the system must reject usage that would exceed `includedUnits` for the current period with `429 PLAN_LIMIT_USAGE`. This check must be **atomic**: concurrent requests can never push usage over the limit (section 16.4). |
| FR-USE-05 | For paid plans, usage beyond `includedUnits` is accepted and billed as overage. |
| FR-USE-06 | For a paid plan with full access, the usage period is the subscription's `currentPeriodStart` → `currentPeriodEnd`. For Free (and any organization whose access level is `FREE`), it is the current calendar month in UTC, computed at request time so the limit resets on the 1st even before `roll-free-periods` runs. |
| FR-USE-07 | `GET /orgs/:orgId/usage/summary` must return units used this period, included units, percentage used, projected end-of-period units (current daily average × days in period; at least one day counts as elapsed, so an early burst doesn't project absurd numbers), and projected overage cost. |
| FR-USE-08 | `GET /orgs/:orgId/usage/daily?from&to&metric` must return a zero-filled daily series from `usage_daily_rollups` (maximum 90 days per request; default the last 30 days). Rollups are refreshed by `usage-rollup`, so today's value can lag by one run. |
| FR-USE-09 | The usage endpoint must be rate-limited to 100 requests per second per API key (`429 RATE_LIMITED`). The count is kept in memory per server instance, not in PostgreSQL, so the busiest endpoint doesn't pay an extra database write per request; with several instances the ceiling is a multiple of 100/s. The plan limit itself is enforced exactly by the atomic counter. |
| FR-USE-10 | `lastUsedAt` on the API key should be updated at most once per minute per key. |

### 9.10 Analytics (FR-AN)

| ID | Requirement |
| --- | --- |
| FR-AN-01 | The tenant dashboard must show usage vs quota, a 30-day daily usage chart, plan, renewal date and projected overage. |
| FR-AN-02 | The system must store one `mrr_snapshots` row per organization per day (job, section 13). |
| FR-AN-03 | Super admins must be able to view, for the last N months (default 12): MRR, MRR movements (new, expansion, contraction, churned, reactivation), customer churn rate, NRR and ARPA, calculated exactly as in section 12.4. |
| FR-AN-04 | Super admins must be able to list all organizations with plan, status, member count and current MRR, with search by name and filter by plan/status. |
| FR-AN-05 | Super admins must be able to list `FAILED` webhook events with type, attempts and last error. |

### 9.11 Audit log (FR-AUD)

| ID | Requirement |
| --- | --- |
| FR-AUD-01 | The system must write an `audit_logs` row for: member invited/joined/removed/role changed, API key created/revoked, checkout started, plan changed, subscription status changed, reconciliation corrections. |
| FR-AUD-02 | Rows store `before` and `after` JSON for changes. Audit rows are never updated or deleted by the application. |
| FR-AUD-03 | Users with `audit:read` may list their organization's audit log, newest first, with pagination. |

### 9.12 Email (FR-MAIL)

| ID | Requirement |
| --- | --- |
| FR-MAIL-01 | Emails are written to `email_outbox` **inside the same transaction** as the change that causes them, then sent by a job. A crash can therefore never lose an email. |
| FR-MAIL-02 | Templates: `invitation`, `verify_email`, `reset_password`, `payment_failed`, `payment_recovered`, `trial_will_end`, `subscription_canceled`. Links inside a payload are replaced by `[redacted after send]` once delivered. |
| FR-MAIL-03 | Sending failures are retried up to 5 times, then marked `FAILED`. Each row is claimed atomically before sending, so concurrent senders (scheduled job, after-request send, several instances) deliver it exactly once. Emails caused by a request are also sent right after the response. |

---

## 10. API specification

### 10.1 Conventions

- Base path: `/api/v1`. Request and response bodies are JSON.
- Authenticated requests send `Authorization: Bearer <accessToken>`. Cookies are sent with `credentials: 'include'`.
- Pagination uses `?page=1&limit=10` (maximum `limit` 100).

**Success response** (same helper as Prisma Press, used by **every** controller):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Members retrieved successfully",
  "meta": { "page": 1, "limit": 10, "total": 23, "totalPages": 3 },
  "data": []
}
```

`meta` appears only on paginated responses.

**Error response:**

```json
{
  "success": false,
  "statusCode": 402,
  "message": "Your plan allows 3 seats. Upgrade to invite more members.",
  "errorCode": "PLAN_LIMIT_SEATS",
  "errorDetails": []
}
```

`errorDetails` lists field errors for validation failures: `[{ "path": "email", "message": "Invalid email" }]`.

### 10.2 Error codes

| HTTP | `errorCode` | When |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Zod validation failed |
| 400 | `INVALID_SIGNATURE` | Stripe webhook signature invalid |
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password |
| 401 | `TOKEN_REUSED` | Revoked refresh token presented; family revoked |
| 401 | `INVALID_API_KEY` | Unknown or revoked API key |
| 402 | `PLAN_LIMIT_SEATS` | Seat limit reached |
| 402 | `PAYMENT_FAILED` | Card declined during a plan change (nothing changed), or plan change attempted while past due (409) |
| 403 | `FORBIDDEN` | Member lacks the permission |
| 403 | `USER_BLOCKED` | Account blocked |
| 403 | `EMAIL_NOT_VERIFIED` | Correct password, but the email address is not verified yet |
| 403 | `INVITE_EMAIL_MISMATCH` | Logged-in email differs from the invited email |
| 404 | `NOT_FOUND` / `ORG_NOT_FOUND` | Resource missing, or not in the caller's organization |
| 409 | `EMAIL_TAKEN` | Email already registered |
| 409 | `LAST_OWNER` | Would remove or demote the last Owner |
| 409 | `ALREADY_SUBSCRIBED` | Checkout requested while a paid subscription is active |
| 409 | `SEATS_EXCEED_TARGET_PLAN` | Downgrade target has fewer seats than current members |
| 409 | `NO_BILLING_ACCOUNT` | Customer Portal requested before the organization's first checkout |
| 409 | `NOT_SUBSCRIBED` | Plan change requested without an active paid subscription |
| 409 | `IDEMPOTENCY_KEY_REUSED` | The same `Idempotency-Key` was sent for a different request |
| 410 | `INVITE_EXPIRED` | Invitation expired or already used |
| 410 | `TOKEN_EXPIRED` | Verification or password-reset link unknown, expired or already used |
| 429 | `PLAN_LIMIT_USAGE` | Free-plan usage limit reached |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected error (details logged, not returned) |
| 502 | `PAYMENT_PROVIDER_ERROR` | A Stripe API call failed (Stripe's message is logged with its request id, not returned) |
| 503 | `BILLING_NOT_CONFIGURED` | The plan has no Stripe prices yet (`npm run stripe:setup` not run) |

Prisma errors are translated: `P2002` (unique) → 409, `P2025` (not found) → 404, `P2003` (foreign key) → 400.

### 10.3 Endpoint summary

| # | Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- | --- |
| 1 | POST | `/auth/register` | Public | Create user, organization, owner membership, Free subscription; send verification email (no session) |
| 2 | POST | `/auth/login` | Public | Issue access token + refresh cookie |
| 3 | POST | `/auth/refresh-token` | Refresh cookie | Rotate refresh token, return new access token |
| 4 | POST | `/auth/logout` | Refresh cookie | Revoke token family, clear cookie |
| 5 | GET | `/users/me` | Logged in | Current user + memberships |
| 6 | PATCH | `/users/me` | Logged in | Update name |
| 7 | PATCH | `/users/me/password` | Logged in | Change password |
| 8 | POST | `/orgs` | Logged in | Create another organization |
| 9 | GET | `/orgs/:orgId` | Member | Organization, my role, entitlements |
| 10 | PATCH | `/orgs/:orgId` | `org:update` | Rename organization |
| 11 | GET | `/orgs/:orgId/members` | `members:read` | List members (paginated) |
| 12 | PATCH | `/orgs/:orgId/members/:membershipId` | `members:manage` | Change role |
| 13 | DELETE | `/orgs/:orgId/members/:membershipId` | `members:manage` (or self) | Remove member / leave |
| 14 | GET | `/orgs/:orgId/invitations` | `members:manage` | Pending invitations |
| 15 | POST | `/orgs/:orgId/invitations` | `members:manage` | Invite by email |
| 16 | DELETE | `/orgs/:orgId/invitations/:invitationId` | `members:manage` | Revoke invitation |
| 17 | GET | `/invitations/:token` | Public | Invitation details (org name, role, email) |
| 18 | POST | `/invitations/:token/accept` | Logged in | Join the organization |
| 19 | GET | `/plans` | Public | Active plans |
| 20 | GET | `/orgs/:orgId/billing/subscription` | `billing:read` | Current subscription and access level |
| 21 | POST | `/orgs/:orgId/billing/checkout-session` | `billing:manage` | Start Stripe Checkout |
| 22 | POST | `/orgs/:orgId/billing/change-plan/preview` | `billing:manage` | Prorated amount for a plan change |
| 23 | POST | `/orgs/:orgId/billing/change-plan` | `billing:manage` | Apply upgrade or downgrade |
| 24 | POST | `/orgs/:orgId/billing/portal-session` | `billing:manage` | Stripe Customer Portal URL |
| 25 | GET | `/orgs/:orgId/billing/invoices` | `billing:read` | Invoice history (paginated) |
| 26 | GET | `/orgs/:orgId/api-keys` | `apikeys:manage` | List keys |
| 27 | POST | `/orgs/:orgId/api-keys` | `apikeys:manage` | Create key (full key returned once) |
| 28 | DELETE | `/orgs/:orgId/api-keys/:keyId` | `apikeys:manage` | Revoke key |
| 29 | POST | `/usage` | API key | Ingest a usage event |
| 30 | GET | `/orgs/:orgId/usage/summary` | `usage:read` | Current period summary |
| 31 | GET | `/orgs/:orgId/usage/daily` | `usage:read` | Daily usage series |
| 32 | GET | `/orgs/:orgId/audit-logs` | `audit:read` | Audit log (paginated) |
| 33 | POST | `/webhooks/stripe` | Stripe signature | Webhook receiver |
| 34 | GET | `/admin/metrics/mrr?months=12` | Super admin | MRR series + movements |
| 35 | GET | `/admin/metrics/churn?months=12` | Super admin | Churn, NRR, ARPA |
| 36 | GET | `/admin/tenants` | Super admin | All organizations (search, filter, paginated) |
| 37 | GET | `/admin/webhook-events?status=FAILED` | Super admin | Webhook inbox |
| 38 | GET | `/health` | Public | `{ status: "ok", db: "ok" }` |
| 39 | POST | `/auth/verify-email` | Public (token) | Verify the address and start a session |
| 40 | POST | `/auth/resend-verification` | Public | Send a new verification link (same answer for every email) |
| 41 | POST | `/auth/forgot-password` | Public | Send a password-reset link (same answer for every email) |
| 42 | POST | `/auth/reset-password` | Public (token) | Set a new password; revoke all sessions |
| 43 | GET, POST | `/internal/jobs/:name` | `Bearer CRON_SECRET` | Run a scheduled job (any name in section 13); 404 when no secret is configured |

### 10.4 Endpoint details (main flows)

#### 1. Register — `POST /api/v1/auth/register`

```json
// Request
{
  "name": "Sarah Khan",
  "email": "sarah@acme.com",
  "password": "password123",
  "organizationName": "Acme Inc"
}
```

```json
// Response 201 — no session yet; a verification email is on its way
{
  "success": true,
  "statusCode": 201,
  "message": "Account created. Check your inbox to verify your email.",
  "data": {
    "user": { "id": "6f1c…", "name": "Sarah Khan", "email": "sarah@acme.com", "platformRole": "USER" },
    "organization": { "id": "9a2e…", "name": "Acme Inc", "slug": "acme-inc", "role": "OWNER" },
    "verificationRequired": true
  }
}
```

Validation: `name` 2–60 chars, valid `email`, `password` 8–72 chars, `organizationName` 2–80 chars. Optional: `inviteToken` (FR-AUTH-15) and `next`, a same-site path such as `/invite/abc` carried into the verification link. The slug is generated from the name; if taken (or equal to a top-level route such as `login`), a short random suffix is added (`acme-inc-x7k2`).

When `inviteToken` matches a pending invitation for the same email, the response has `"verificationRequired": false`, an `accessToken`, and sets the refresh cookie, exactly like login.

#### 1b. Verify email — `POST /api/v1/auth/verify-email`

```json
// Request (token from the emailed link)
{ "token": "Qm9…" }
```

```json
// Response 200 (sets the refresh cookie)
{ "success": true, "statusCode": 200, "message": "Email verified",
  "data": { "accessToken": "eyJhbGciOi…", "user": { "id": "6f1c…", "name": "Sarah Khan", "email": "sarah@acme.com", "platformRole": "USER" } } }
```

Resend, forgot-password and reset-password follow the same pattern; resend and forgot-password always return `"If an account exists for this email, we have sent a link to it. Check your inbox."`

#### 2. Login — `POST /api/v1/auth/login`

```json
// Request
{ "email": "sarah@acme.com", "password": "password123" }
```

```json
// Response 200  (also sets cookie: refreshToken=…; HttpOnly; Path=/api/v1/auth; SameSite=Lax)
{
  "success": true,
  "statusCode": 200,
  "message": "Logged in successfully",
  "data": {
    "accessToken": "eyJhbGciOi…",
    "user": { "id": "6f1c…", "name": "Sarah Khan", "email": "sarah@acme.com", "platformRole": "USER" }
  }
}
```

The refresh token is **only** in the cookie, never in the body. An unverified account gets `403 EMAIL_NOT_VERIFIED` instead (FR-AUTH-04).

#### 3. Refresh — `POST /api/v1/auth/refresh-token`

No body. The browser sends the cookie automatically.

```json
// Response 200 (sets a new refreshToken cookie)
{ "success": true, "statusCode": 200, "message": "Token refreshed", "data": { "accessToken": "eyJhbGciOi…" } }
```

#### 9. Organization details — `GET /api/v1/orgs/:orgId`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Organization retrieved successfully",
  "data": {
    "id": "9a2e…",
    "name": "Acme Inc",
    "slug": "acme-inc",
    "myRole": "OWNER",
    "entitlements": {
      "planCode": "PRO",
      "accessLevel": "FULL",
      "seatLimit": 10,
      "seatsUsed": 4,
      "includedUnits": 50000,
      "overageAllowed": true
    }
  }
}
```

#### 15. Invite — `POST /api/v1/orgs/:orgId/invitations`

```json
// Request
{ "email": "omar@acme.com", "role": "BILLING" }
```

```json
// Response 201
{
  "success": true,
  "statusCode": 201,
  "message": "Invitation sent",
  "data": { "id": "c41d…", "email": "omar@acme.com", "role": "BILLING", "expiresAt": "2026-10-15T09:00:00.000Z" }
}
```

#### 20. Subscription — `GET /api/v1/orgs/:orgId/billing/subscription`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscription retrieved successfully",
  "data": {
    "plan": { "code": "PRO", "name": "Pro", "monthlyPriceCents": 4900, "seatLimit": 10,
              "includedUnits": 50000, "overageUnitMicros": 2000 },
    "status": "PAST_DUE",
    "accessLevel": "FULL",
    "currentPeriodStart": "2026-10-01T00:00:00.000Z",
    "currentPeriodEnd": "2026-11-01T00:00:00.000Z",
    "cancelAtPeriodEnd": false,
    "trialEndsAt": null,
    "graceEndsAt": "2026-10-12T00:00:00.000Z",
    "isPaidPlan": true,
    "hasBillingAccount": true
  }
}
```

#### 21. Checkout — `POST /api/v1/orgs/:orgId/billing/checkout-session`

```json
// Request
{ "planCode": "PRO" }
// Response 201
{ "success": true, "statusCode": 201, "message": "Checkout session created",
  "data": { "url": "https://checkout.stripe.com/c/pay/cs_test_…" } }
```

The client does `window.location.href = data.url`. Stripe sends the user back to `/<orgSlug>/billing?checkout=success` (or `?checkout=canceled`); the subscription changes only when the webhook arrives (FR-BILL-03).

`POST /api/v1/orgs/:orgId/billing/portal-session` answers the same way with a `https://billing.stripe.com/…` URL, or `409 NO_BILLING_ACCOUNT` before the first checkout.

#### 22. Change-plan preview — `POST /api/v1/orgs/:orgId/billing/change-plan/preview`

```json
// Request
{ "planCode": "BUSINESS" }
// Response 200 (half-way through a Pro month)
{ "success": true, "statusCode": 200, "message": "Plan change preview",
  "data": { "currentPlan": { "code": "PRO", "name": "Pro" },
            "targetPlan": { "code": "BUSINESS", "name": "Business", "monthlyPriceCents": 19900 },
            "isUpgrade": true, "amountDueNowCents": 7500, "currency": "usd",
            "nextMonthlyCents": 19900, "prorationDate": 1792178391 } }
```

Apply with the same `planCode`, the `prorationDate` from the preview (so the charge equals the preview) and a client-generated `Idempotency-Key` header:

```http
POST /api/v1/orgs/:orgId/billing/change-plan
Idempotency-Key: 3f2b9c4e-…
{ "planCode": "BUSINESS", "prorationDate": 1792178391 }
→ 202 { "data": { "planCode": "BUSINESS", "status": "pending" } }
```

`202` means Stripe accepted the change; the plan switches when `customer.subscription.updated` arrives. A negative `amountDueNowCents` (downgrade) is a credit Stripe applies to the next invoices.

#### 27. Create API key — `POST /api/v1/orgs/:orgId/api-keys`

```json
// Request
{ "name": "Production server" }
// Response 201
{ "success": true, "statusCode": 201, "message": "API key created. Copy it now — it won't be shown again.",
  "data": { "id": "k91f…", "name": "Production server", "prefix": "lf_live_3Hq9", "key": "lf_live_3Hq9…full-secret…" } }
```

#### 29. Ingest usage — `POST /api/v1/usage`

```
x-api-key: lf_live_3Hq9…
Content-Type: application/json
```

```json
// Request
{ "metric": "documents_processed", "quantity": 25, "idempotencyKey": "job-8831-batch-2" }
```

```json
// Response 202
{ "success": true, "statusCode": 202, "message": "Usage recorded",
  "data": { "eventId": "184467", "duplicate": false, "periodUnits": 742, "includedUnits": 1000 } }
```

```json
// Response 429 (Free plan, limit reached)
{ "success": false, "statusCode": 429, "message": "Monthly usage limit of 1,000 units reached. Upgrade to continue.",
  "errorCode": "PLAN_LIMIT_USAGE", "errorDetails": [] }
```

| Case | Response |
| --- | --- |
| Same `idempotencyKey` again (from any of the organization's keys, even at the limit) | `202`, message `Already recorded`, the original `eventId`, `duplicate: true`; nothing counted |
| Missing, malformed, unknown or revoked key | `401 INVALID_API_KEY` |
| Invalid body (metric format, quantity outside 1–10,000, `occurredAt` older than 24 h or more than 5 min ahead) | `400 VALIDATION_ERROR` |
| More than 100 requests in one second with the same key | `429 RATE_LIMITED` (`RateLimit` headers show what is left) |

`202` means "accepted for billing": overage is reported to Stripe's meter later by the `report-usage` job.

#### 30. Usage summary — `GET /api/v1/orgs/:orgId/usage/summary`

```json
{
  "success": true, "statusCode": 200, "message": "Usage summary retrieved",
  "data": {
    "planCode": "PRO",
    "periodStart": "2026-10-01T00:00:00.000Z",
    "periodEnd": "2026-11-01T00:00:00.000Z",
    "unitsUsed": 41250,
    "includedUnits": 50000,
    "percentUsed": 82.5,
    "overageAllowed": true,
    "limitReached": false,
    "overageCents": 0,
    "projectedUnits": 61500,
    "projectedOverageCents": 2300
  }
}
```

The period and limits come from the same rules as ingestion (FR-USE-06): the Stripe period on a paid plan with full access, otherwise the calendar month with the Free limit. `limitReached` is only ever `true` when overage isn't allowed (new usage gets `429`). Overage costs `overageUnitMicros` per unit (10,000 micros = 1 cent).

#### 31. Daily usage — `GET /api/v1/orgs/:orgId/usage/daily?from=2026-10-01&to=2026-10-03&metric=docs`

```json
{
  "success": true, "statusCode": 200, "message": "Daily usage retrieved",
  "data": {
    "from": "2026-10-01", "to": "2026-10-03", "metric": "docs",
    "metrics": ["docs", "pages"],
    "totalUnits": 30,
    "days": [
      { "day": "2026-10-01", "units": 10 },
      { "day": "2026-10-02", "units": 0 },
      { "day": "2026-10-03", "units": 20 }
    ]
  }
}
```

Days are UTC; both ends are included. All parameters are optional: `to` defaults to today, `from` to 29 days before `to`, and without `metric` every metric is summed. `metrics` lists every metric seen in the range, for a filter. More than 90 days, or `from` after `to` → `400 VALIDATION_ERROR`.

#### 34. Admin MRR — `GET /api/v1/admin/metrics/mrr?months=12`

```json
{
  "success": true, "statusCode": 200, "message": "MRR metrics retrieved",
  "data": [
    { "month": "2026-09", "asOf": "2026-09-30", "mrrCents": 1245000, "payingCustomers": 61,
      "newCents": 98000, "expansionCents": 45000, "contractionCents": 12000, "churnedCents": 39000,
      "reactivationCents": 0, "netNewCents": 92000 }
  ]
}
```

`months` is 1–36 (default 12), oldest first, ending with the current month. Each month compares the last snapshot day of the previous month with the last snapshot day of this one (`asOf`; for the current month, the latest snapshot). A month without snapshots carries the previous state forward, so a missed job never looks like mass churn; months before the first snapshot are zero with `asOf: null`.

#### 35. Admin churn — `GET /api/v1/admin/metrics/churn?months=12`

```json
{ "month": "2026-09", "asOf": "2026-09-30", "startCustomers": 100, "endCustomers": 102,
  "churnedCustomers": 4, "customerChurnPercent": 4, "startMrrCents": 1000000, "mrrCents": 1070000,
  "nrrPercent": 103, "arpaCents": 10490 }
```

Percentages have two decimals. `customerChurnPercent` and `nrrPercent` are `null` without paying customers at the start; `arpaCents` is `null` without paying customers at the end.

#### 36. Admin tenants — `GET /api/v1/admin/tenants?search=acme&plan=PRO&status=ACTIVE&page=1&limit=10`

Each row: `id`, `name`, `slug`, `createdAt`, `planCode`, `planName`, `status`, `accessLevel`, `cancelAtPeriodEnd`, `currentPeriodEnd`, `memberCount`, `mrrCents` (current, same rule as the snapshots). `search` matches the name (case-insensitive) or slug. Newest first, paginated (`meta`).

#### 37. Admin webhook events — `GET /api/v1/admin/webhook-events?status=FAILED&page=1&limit=10`

Each row: `id`, `type`, `status`, `attempts`, `lastError`, `nextAttemptAt`, `receivedAt`, `processedAt`. `status` defaults to `FAILED`. Payloads are never returned (NFR-SEC-08). Newest first, paginated.

---

## 11. Data requirements and ERD

### 11.1 Entity relationship diagram

![LedgerFlow ERD](./ledgerflow-erd.png)

*Keep `ledgerflow-erd.png` in the same folder as this file. The SVG version (`ledgerflow-erd.svg`) zooms without blurring.*

**Reading the diagram:** each box is a table; `PK` primary key, `FK` foreign key, `UQ` unique, `?` nullable. Crow's-foot ends: two bars = exactly one, bar + circle = zero or one, circle + crow's foot = zero or many. Colours group tables by domain.

**Import into DrawSQL:** create a new diagram → *Import* → *PostgreSQL* → paste `ledgerflow-schema.sql`. Tables and relationships appear automatically; arrange them like the PNG.

The same ERD as Mermaid (GitHub renders this automatically):

```mermaid
erDiagram
  users {
    string id PK
    string name
    string email UK
    string password
    UserStatus status
    PlatformRole platformRole
    datetime emailVerifiedAt "nullable"
    datetime createdAt
    datetime updatedAt
  }
  email_tokens {
    string id PK
    string userId FK
    EmailTokenPurpose purpose
    string tokenHash UK
    datetime expiresAt
    datetime usedAt "nullable"
    datetime createdAt
  }
  rate_limits {
    string key PK
    int hits
    datetime resetAt
  }
  organizations {
    string id PK
    string name
    string slug UK
    string stripeCustomerId UK "nullable"
    datetime createdAt
    datetime updatedAt
  }
  memberships {
    string id PK
    string userId FK
    string organizationId FK
    OrgRole role
    datetime createdAt
  }
  invitations {
    string id PK
    string organizationId FK
    string invitedById FK
    string email
    OrgRole role
    string tokenHash UK
    datetime expiresAt
    datetime acceptedAt "nullable"
    datetime createdAt
  }
  refresh_tokens {
    string id PK
    string userId FK
    string familyId
    datetime expiresAt
    datetime revokedAt "nullable"
    datetime createdAt
  }
  plans {
    string id PK
    string code UK
    string name
    string stripePriceId UK "nullable"
    string stripeMeteredPriceId UK "nullable"
    int monthlyPriceCents
    int seatLimit
    int includedUnits
    int overageUnitMicros
    boolean isActive
    datetime createdAt
  }
  subscriptions {
    string id PK
    string organizationId FK, UK
    string planId FK
    string stripeSubscriptionId UK "nullable"
    SubscriptionStatus status
    datetime currentPeriodStart
    datetime currentPeriodEnd
    boolean cancelAtPeriodEnd
    datetime trialEndsAt "nullable"
    datetime graceEndsAt "nullable"
    datetime createdAt
    datetime updatedAt
  }
  invoices {
    string id PK
    string organizationId FK
    string subscriptionId FK "nullable"
    string stripeInvoiceId UK
    InvoiceStatus status
    int amountDueCents
    int amountPaidCents
    string currency
    datetime periodStart
    datetime periodEnd
    string hostedInvoiceUrl "nullable"
    datetime paidAt "nullable"
    datetime createdAt
  }
  stripe_events {
    string id PK
    string type
    json payload
    WebhookEventStatus status
    int attempts
    datetime nextAttemptAt "nullable"
    string lastError "nullable"
    datetime receivedAt
    datetime processedAt "nullable"
    datetime updatedAt
  }
  api_keys {
    string id PK
    string organizationId FK
    string createdById FK
    string name
    string prefix
    string keyHash UK
    datetime lastUsedAt "nullable"
    datetime revokedAt "nullable"
    datetime createdAt
  }
  usage_events {
    bigint id PK
    string organizationId FK
    string apiKeyId FK
    string metric
    int quantity
    string idempotencyKey
    datetime occurredAt
    datetime periodStart
    boolean billable
    datetime reportedToStripeAt "nullable"
    datetime createdAt
  }
  usage_counters {
    string organizationId PK, FK
    datetime periodStart PK
    int units
    datetime updatedAt
  }
  usage_daily_rollups {
    string organizationId PK, FK
    string metric PK
    date day PK
    int quantity
  }
  mrr_snapshots {
    date day PK
    string organizationId PK, FK
    string planId FK
    int mrrCents
  }
  audit_logs {
    bigint id PK
    string organizationId FK "nullable"
    string actorId FK "nullable"
    string action
    string entityType
    string entityId
    json before "nullable"
    json after "nullable"
    datetime createdAt
  }
  email_outbox {
    string id PK
    string organizationId FK "nullable"
    string toEmail
    string template
    json data
    EmailStatus status
    int attempts
    string lastError "nullable"
    datetime sentAt "nullable"
    datetime createdAt
  }
  users ||--o{ memberships : "userId"
  organizations ||--o{ memberships : "organizationId"
  organizations ||--o{ invitations : "organizationId"
  users ||--o{ invitations : "invitedById"
  users ||--o{ refresh_tokens : "userId"
  organizations ||--o| subscriptions : "organizationId"
  plans ||--o{ subscriptions : "planId"
  organizations ||--o{ invoices : "organizationId"
  subscriptions |o--o{ invoices : "subscriptionId"
  organizations ||--o{ api_keys : "organizationId"
  users ||--o{ api_keys : "createdById"
  organizations ||--o{ usage_events : "organizationId"
  api_keys ||--o{ usage_events : "apiKeyId"
  organizations ||--o{ usage_counters : "organizationId"
  organizations ||--o{ usage_daily_rollups : "organizationId"
  organizations ||--o{ mrr_snapshots : "organizationId"
  plans ||--o{ mrr_snapshots : "planId"
  organizations |o--o{ audit_logs : "organizationId"
  users |o--o{ audit_logs : "actorId"
  organizations |o--o{ email_outbox : "organizationId"
  users ||--o{ email_tokens : "userId"
```

### 11.2 Relationships

| Parent | Child | Type | Meaning |
| --- | --- | --- | --- |
| users | memberships | 1 → many | A user can belong to many organizations |
| organizations | memberships | 1 → many | An organization has many members |
| organizations | invitations | 1 → many | Pending and accepted invitations |
| users | invitations | 1 → many | Who sent the invitation (`invitedById`) |
| users | refresh_tokens | 1 → many | One row per issued refresh token |
| users | email_tokens | 1 → many | Verification and password-reset links sent to the user |
| organizations | subscriptions | 1 → 0..1 | One subscription per organization (`organizationId` is unique) |
| plans | subscriptions | 1 → many | Which plan the subscription is on |
| organizations | invoices | 1 → many | Billing history |
| subscriptions | invoices | 0..1 → many | Invoice belongs to a subscription (nullable for one-off invoices) |
| organizations | api_keys | 1 → many | Keys for usage ingestion |
| users | api_keys | 1 → many | Who created the key |
| organizations | usage_events | 1 → many | Raw usage records |
| api_keys | usage_events | 1 → many | Which key sent the event |
| organizations | usage_counters | 1 → many | One counter per billing period |
| organizations | usage_daily_rollups | 1 → many | Daily totals per metric |
| organizations | mrr_snapshots | 1 → many | One row per day |
| plans | mrr_snapshots | 1 → many | Plan on that day |
| organizations | audit_logs | 0..1 → many | Null for platform-level events |
| users | audit_logs | 0..1 → many | Null when the actor is Stripe or a job |
| organizations | email_outbox | 0..1 → many | Null for emails not tied to an organization |

`stripe_events` has no foreign keys on purpose: it is written **before** LedgerFlow knows which organization an event belongs to. `rate_limits` has none either: its keys are request attributes (e.g. the client IP), not database rows.

### 11.3 Data dictionary

| Table | Purpose | Important rules |
| --- | --- | --- |
| `users` | People who log in | `email` unique, stored lower-case; `password` is a bcrypt hash; `emailVerifiedAt` null until the address is verified (no login before that); `platformRole` `SUPER_ADMIN` only for LedgerFlow staff |
| `organizations` | Tenants | `slug` unique and permanent; `stripeCustomerId` set at first checkout |
| `memberships` | User ↔ organization with a role | Unique `(userId, organizationId)`; at least one `OWNER` per organization |
| `invitations` | Invitations by email | Token stored as SHA-256 `tokenHash`; expires after 7 days; `acceptedAt` set once |
| `refresh_tokens` | Issued refresh tokens | `id` = JWT `jti`; `familyId` groups one login's rotations; `revokedAt` marks used/revoked |
| `email_tokens` | One-time links sent by email | `purpose` `VERIFY_EMAIL` (24 h) or `RESET_PASSWORD` (1 h); only the SHA-256 `tokenHash` is stored; `usedAt` set once; a new link deletes older unused ones; removed by `cleanup` a day after use or expiry |
| `plans` | Free, Pro, Business | Mirrors Stripe Prices; money in cents; overage in micros |
| `subscriptions` | Each organization's current subscription | One per organization; changed only by webhooks, reconciliation and the Free-period job |
| `invoices` | Stripe invoices | Upserted by `stripeInvoiceId`; never edited by users |
| `stripe_events` | Webhook inbox | `id` = Stripe event id (dedupe); `status`, `attempts`, `nextAttemptAt` drive retries |
| `api_keys` | Machine credentials | Only `keyHash` + `prefix` stored; max 10 active per organization |
| `usage_events` | Every accepted usage report | Unique `(organizationId, idempotencyKey)`; `periodStart` = the `usage_counters` period it was added to; `billable` = recorded on a paid plan with full access, so reported to Stripe's meter; `reportedToStripeAt` set by `report-usage` |
| `usage_counters` | Running total per billing period | Primary key `(organizationId, periodStart)`; incremented only by the atomic update in section 16.4 |
| `usage_daily_rollups` | Daily totals for charts | Rebuilt by job; dashboards read this, not raw events |
| `mrr_snapshots` | Daily MRR per organization | Written by job; source for all revenue analytics |
| `audit_logs` | Who changed what | Insert-only |
| `email_outbox` | Emails waiting to be sent | Written in the same transaction as the change; sent right after the request and by the `send-emails` job; each row claimed atomically before sending |
| `rate_limits` | Fixed-window request counters | `key` = limiter prefix + client key (e.g. `auth:203.0.113.7`); one atomic upsert per counted request; expired windows removed by `cleanup` |

### 11.4 Enumerations

| Enum | Values |
| --- | --- |
| `UserStatus` | `ACTIVE`, `BLOCKED` |
| `PlatformRole` | `USER`, `SUPER_ADMIN` |
| `OrgRole` | `OWNER`, `ADMIN`, `BILLING`, `MEMBER` |
| `SubscriptionStatus` | `INCOMPLETE`, `TRIALING`, `ACTIVE`, `PAST_DUE`, `UNPAID`, `CANCELED` |
| `InvoiceStatus` | `DRAFT`, `OPEN`, `PAID`, `UNCOLLECTIBLE`, `VOID` |
| `WebhookEventStatus` | `RECEIVED`, `PROCESSING`, `PROCESSED`, `FAILED` |
| `EmailStatus` | `PENDING`, `SENT`, `FAILED` |
| `EmailTokenPurpose` | `VERIFY_EMAIL`, `RESET_PASSWORD` |

### 11.5 Prisma schema

This schema is validated with Prisma 7.10 and applied to PostgreSQL 16 by four migrations (`init`, `rate_limits`, `email_verification`, `usage_jobs`): **18 tables, 21 foreign keys**. The app keeps it as one file per model in `server/prisma/schema/` (`prisma.config.ts` points at that folder); below is the same schema in one file, also saved as `docs/schema.prisma`. The `prisma-client` generator writes to `generated/prisma`, and the database URL lives in `prisma.config.ts`.

The `email_verification` migration marks every account that existed before it as verified, so no existing user is locked out. The `usage_jobs` migration fills `periodStart` for existing usage events (the paid period they fall in, otherwise their calendar month) and leaves them `billable = false`, so nothing recorded before it is sent to Stripe.

```prisma
// LedgerFlow — complete Prisma schema in one file, for reading.
// The app keeps the same schema split into one file per model: server/prisma/schema/

generator client {
  provider     = "prisma-client"
  output       = "../generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
}

// ================ ENUMS =================

enum UserStatus {
  ACTIVE
  BLOCKED
}

enum PlatformRole {
  USER
  SUPER_ADMIN
}

enum OrgRole {
  OWNER
  ADMIN
  BILLING
  MEMBER
}

enum SubscriptionStatus {
  INCOMPLETE
  TRIALING
  ACTIVE
  PAST_DUE
  UNPAID
  CANCELED
}

enum InvoiceStatus {
  DRAFT
  OPEN
  PAID
  UNCOLLECTIBLE
  VOID
}

enum WebhookEventStatus {
  RECEIVED
  PROCESSING
  PROCESSED
  FAILED
}

enum EmailStatus {
  PENDING
  SENT
  FAILED
}

enum EmailTokenPurpose {
  VERIFY_EMAIL
  RESET_PASSWORD
}

// ========== IDENTITY & TENANCY ==========

model User {
  id              String       @id @default(uuid())
  name            String
  email           String       @unique
  password        String // bcrypt hash
  status          UserStatus   @default(ACTIVE)
  platformRole    PlatformRole @default(USER)
  // null until the user proves they own the address; login is refused until then
  emailVerifiedAt DateTime?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  memberships   Membership[]
  invitations   Invitation[]   @relation("InvitedBy")
  refreshTokens RefreshToken[]
  apiKeys       ApiKey[]       @relation("ApiKeyCreatedBy")
  auditLogs     AuditLog[]     @relation("AuditActor")
  emailTokens   EmailToken[]

  @@map("users")
}

model Organization {
  id               String   @id @default(uuid())
  name             String
  slug             String   @unique
  stripeCustomerId String?  @unique
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  memberships   Membership[]
  invitations   Invitation[]
  subscription  Subscription?
  invoices      Invoice[]
  apiKeys       ApiKey[]
  usageEvents   UsageEvent[]
  usageCounters UsageCounter[]
  usageRollups  UsageDailyRollup[]
  mrrSnapshots  MrrSnapshot[]
  auditLogs     AuditLog[]
  emails        EmailOutbox[]

  @@map("organizations")
}

model Membership {
  id             String   @id @default(uuid())
  userId         String
  organizationId String
  role           OrgRole
  createdAt      DateTime @default(now())

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([userId, organizationId])
  @@index([organizationId])
  @@map("memberships")
}

model Invitation {
  id             String    @id @default(uuid())
  organizationId String
  invitedById    String
  email          String
  role           OrgRole
  tokenHash      String    @unique
  expiresAt      DateTime
  acceptedAt     DateTime?
  createdAt      DateTime  @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  invitedBy    User         @relation("InvitedBy", fields: [invitedById], references: [id])

  @@index([organizationId, email])
  @@map("invitations")
}

model RefreshToken {
  id        String    @id // the JWT "jti" claim
  userId    String
  familyId  String // all rotations of one login share this
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([familyId])
  @@map("refresh_tokens")
}

// One-time links sent by email (verify address, reset password). Only the SHA-256 of
// the token is stored; the raw value exists only in the email
model EmailToken {
  id        String            @id @default(uuid())
  userId    String
  purpose   EmailTokenPurpose
  tokenHash String            @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime          @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, purpose])
  @@index([expiresAt])
  @@map("email_tokens")
}

// =============== BILLING ================

model Plan {
  id                   String   @id @default(uuid())
  code                 String   @unique // FREE | PRO | BUSINESS
  name                 String
  stripePriceId        String?  @unique // null for FREE
  stripeMeteredPriceId String?  @unique // overage price
  monthlyPriceCents    Int
  seatLimit            Int
  includedUnits        Int
  overageUnitMicros    Int // $0.002 per unit = 2000
  isActive             Boolean  @default(true)
  createdAt            DateTime @default(now())

  subscriptions Subscription[]
  mrrSnapshots  MrrSnapshot[]

  @@map("plans")
}

model Subscription {
  id                   String             @id @default(uuid())
  organizationId       String             @unique
  planId               String
  stripeSubscriptionId String?            @unique
  status               SubscriptionStatus
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean            @default(false)
  trialEndsAt          DateTime?
  graceEndsAt          DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  plan         Plan         @relation(fields: [planId], references: [id])
  invoices     Invoice[]

  @@index([status])
  @@map("subscriptions")
}

model Invoice {
  id               String        @id @default(uuid())
  organizationId   String
  subscriptionId   String?
  stripeInvoiceId  String        @unique
  status           InvoiceStatus
  amountDueCents   Int
  amountPaidCents  Int
  currency         String        @default("usd")
  periodStart      DateTime
  periodEnd        DateTime
  hostedInvoiceUrl String?
  paidAt           DateTime?
  createdAt        DateTime      @default(now())

  organization Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  subscription Subscription? @relation(fields: [subscriptionId], references: [id])

  @@index([organizationId, periodStart])
  @@map("invoices")
}

// Webhook inbox: the Stripe event id is the primary key (dedupe)
model StripeEvent {
  id            String             @id // evt_...
  type          String
  payload       Json
  status        WebhookEventStatus @default(RECEIVED)
  attempts      Int                @default(0)
  nextAttemptAt DateTime?
  lastError     String?
  receivedAt    DateTime           @default(now())
  processedAt   DateTime?
  updatedAt     DateTime           @updatedAt

  @@index([status, nextAttemptAt])
  @@map("stripe_events")
}

// ================ USAGE =================

model ApiKey {
  id             String    @id @default(uuid())
  organizationId String
  createdById    String
  name           String
  prefix         String // first 12 chars, shown in UI
  keyHash        String    @unique // sha256 of the full key
  lastUsedAt     DateTime?
  revokedAt      DateTime?
  createdAt      DateTime  @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdBy    User         @relation("ApiKeyCreatedBy", fields: [createdById], references: [id])
  usageEvents  UsageEvent[]

  @@index([organizationId])
  @@map("api_keys")
}

model UsageEvent {
  id                 BigInt    @id @default(autoincrement())
  organizationId     String
  apiKeyId           String
  metric             String // e.g. documents_processed
  quantity           Int
  idempotencyKey     String
  occurredAt         DateTime
  // The usage_counters period this event was added to (Stripe period or Free calendar month)
  periodStart        DateTime
  // Recorded while the organization had a paid subscription: reported to Stripe's meter
  billable           Boolean   @default(false)
  reportedToStripeAt DateTime?
  createdAt          DateTime  @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  apiKey       ApiKey       @relation(fields: [apiKeyId], references: [id])

  @@unique([organizationId, idempotencyKey])
  @@index([organizationId, metric, occurredAt])
  @@index([organizationId, periodStart])
  @@index([occurredAt])
  @@index([billable, reportedToStripeAt])
  @@map("usage_events")
}

// One row per org per billing period; incremented atomically to enforce limits
model UsageCounter {
  organizationId String
  periodStart    DateTime
  units          Int      @default(0)
  updatedAt      DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@id([organizationId, periodStart])
  @@map("usage_counters")
}

model UsageDailyRollup {
  organizationId String
  metric         String
  day            DateTime @db.Date
  quantity       Int

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@id([organizationId, metric, day])
  @@map("usage_daily_rollups")
}

// ======== ANALYTICS & OPERATIONS ========

model MrrSnapshot {
  day            DateTime @db.Date
  organizationId String
  planId         String
  mrrCents       Int

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  plan         Plan         @relation(fields: [planId], references: [id])

  @@id([day, organizationId])
  @@map("mrr_snapshots")
}

model AuditLog {
  id             BigInt   @id @default(autoincrement())
  organizationId String?
  actorId        String? // null when the actor is Stripe or a system job
  action         String // e.g. subscription.status_changed
  entityType     String
  entityId       String
  before         Json?
  after          Json?
  createdAt      DateTime @default(now())

  organization Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  actor        User?         @relation("AuditActor", fields: [actorId], references: [id])

  @@index([organizationId, createdAt])
  @@map("audit_logs")
}

model EmailOutbox {
  id             String      @id @default(uuid())
  organizationId String?
  toEmail        String
  template       String // e.g. payment_failed, invitation
  data           Json
  status         EmailStatus @default(PENDING)
  attempts       Int         @default(0)
  lastError      String?
  sentAt         DateTime?
  createdAt      DateTime    @default(now())

  organization Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([status, createdAt])
  @@map("email_outbox")
}

// Fixed-window counters for express-rate-limit, shared by every server instance
// (Vercel runs several, so in-memory counters would each see only part of the traffic)
model RateLimit {
  key     String   @id // e.g. auth:203.0.113.7
  hits    Int
  resetAt DateTime

  @@index([resetAt])
  @@map("rate_limits")
}
```

```ts
// server/prisma.config.ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema', // folder: one .prisma file per model
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  datasource: { url: env('DATABASE_URL') },
});
```

### 11.6 Seed data

`prisma/seed.ts` must create:

1. The three plans (Free, Pro, Business) with their limits and prices. The seed never touches the Stripe price ids; run `npm run stripe:setup` afterwards to create the Stripe Products, Prices and Meter and link them.
2. A super admin user (from `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`), already verified. Seeded demo users are verified too, so they can log in without an email.
3. Demo tenants (section 21.2): *Acme* on Pro, *Globex* past due, *Initech* on Free near its limit.
4. 90 days of `usage_daily_rollups` and 12 months of `mrr_snapshots` across about 40 fake organizations, with realistic upgrades, downgrades and cancellations, so the admin charts tell a story on first load.

---

## 12. Business rules and state machines

### 12.1 Subscription state machine

Only a verified Stripe webhook, the reconciliation job, or the Free-period job can change `subscriptions.status`.

```
                     trial starts                       trial ends, payment fails
        ┌──────────────────────────────► TRIALING ─────────────────────────────────┐
        │                                   │                                      │
        │                                   │ trial ends, paid                     ▼
  INCOMPLETE ──── first payment ────────► ACTIVE ◄──────── invoice paid ──────── PAST_DUE
                                            │  ──────── payment failed ─────────►   │
                                            │                                      │ retries exhausted
                                            │ canceled at period end               ▼
                                            ▼                                    UNPAID
                                         CANCELED ◄─────── canceled later ─────────┘
```

| Stripe status | LedgerFlow status | Access level | UI message |
| --- | --- | --- | --- |
| `incomplete` | `INCOMPLETE` | FREE | "Finish setting up your payment" |
| `trialing` | `TRIALING` | FULL | Trial end date, "Add a card" reminder |
| `active` | `ACTIVE` | FULL | Plan and renewal date; "Cancels on …" if `cancelAtPeriodEnd` |
| `past_due` | `PAST_DUE` | FULL until `graceEndsAt`, then FREE | Red banner with countdown and "Update card" |
| `unpaid`, `paused` | `UNPAID` | FREE | "Your plan is paused until payment is made" |
| `canceled`, `incomplete_expired` | `CANCELED` | FREE | "You're on Free" + subscribe button |

Whether repeated payment failure ends in `UNPAID` or `CANCELED` is a setting in the Stripe Dashboard (Billing → Revenue recovery). LedgerFlow handles both.

### 12.2 Webhook event handling

| Stripe event | LedgerFlow action |
| --- | --- |
| `checkout.session.completed` | Read `metadata.organizationId`; save `stripeCustomerId` if missing; re-fetch and upsert the subscription |
| `customer.subscription.created` / `.updated` | Re-fetch subscription; upsert plan (by price id), status, period dates, `cancelAtPeriodEnd`, `trialEndsAt`; audit status changes |
| `customer.subscription.deleted` | Status `CANCELED`; email `subscription_canceled` |
| `invoice.paid` | Upsert invoice as `PAID`; if subscription was `PAST_DUE`: set `ACTIVE`, clear `graceEndsAt`, email `payment_recovered` |
| `invoice.payment_failed` | Upsert invoice; set `PAST_DUE`; set `graceEndsAt = now + 7 days` only if it is not already set; email `payment_failed` |
| `customer.subscription.trial_will_end` | Email `trial_will_end` to Owners and Billing members |

How the handlers apply these rules (`server/src/modules/billing/billing.sync.ts`):

- **Which organization:** `metadata.organizationId` (set by our checkout), otherwise the organization whose `stripeCustomerId` matches. Objects matching neither are ignored, so a shared Stripe account can't write into LedgerFlow.
- **Plan:** the subscription's licensed (non-metered) item; its price must match a plan's `stripePriceId`, otherwise the event fails and is retried (and shows up as `FAILED`).
- **Period dates** come from the subscription **item** (Stripe API 2025+); `cancelAtPeriodEnd` is true when `cancel_at_period_end` or `cancel_at` is set and the subscription hasn't ended.
- **One writer at a time:** each sync locks the organization's `subscriptions` row (`SELECT … FOR UPDATE`) inside its transaction.
- **Stale events:** an event about an *older* subscription that has ended is ignored when the organization already points at another subscription.
- **Emails follow status changes**, not events: `→ PAST_DUE` sends `payment_failed` (with the grace end date), `PAST_DUE → ACTIVE/TRIALING` sends `payment_recovered`, `→ CANCELED` sends `subscription_canceled`. A repeated event never sends a second email. Recipients: Owners and Billing members with a verified email. They are sent right after the event is processed.
- **Audit (FR-BILL-09):** `plan.changed` and `subscription.status_changed` with `actorId = null`.

### 12.3 Entitlements

One function, `getEntitlements(organizationId)`, decides what an organization may do. Every limit check uses it.

1. Compute `accessLevel` from status and `graceEndsAt` (table 12.1).
2. If `accessLevel` is `FREE`, use the **Free plan's** limits, whatever `planId` says.
3. Otherwise use the subscription's plan limits.

| Rule | Detail |
| --- | --- |
| Seats | `members + pending invitations ≤ seatLimit`. Existing members are never removed automatically when access drops to Free; new invitations are blocked until under the limit. |
| Usage | Free access: hard limit at `includedUnits` (429). Full access on a paid plan: overage allowed. |
| Period | Paid plans: Stripe's period. Free plan: calendar month in UTC, rolled forward by the `roll-free-periods` job. |
| Grace | 7 days after the first failed payment of a past-due episode. |

### 12.4 Revenue metrics

MRR counts only recurring plan fees for organizations with `accessLevel = FULL` on a paid plan, **excluding trials** (`TRIALING`): a trial counts once it converts and pays. A past-due organization still inside its grace period counts. Overage is reported separately as usage revenue. The rules are in `server/src/shared/metrics.ts` (`mrrCentsOf`, `mrrMovements`, …), used by the snapshot job and the admin endpoints.

For each organization, compare MRR on the last day of month M−1 with the last day of month M:

| Movement | Rule |
| --- | --- |
| New | 0 before, > 0 now, never paid before |
| Expansion | > 0 before, higher now (increase only) |
| Contraction | > 0 before, lower now but > 0 (decrease only) |
| Churned | > 0 before, 0 now (whole previous MRR) |
| Reactivation | 0 before, > 0 now, had paid at some earlier time |

```
Net new MRR         = New + Expansion + Reactivation − Contraction − Churned
Customer churn rate = paying customers lost in month M ÷ paying customers at end of month M−1
NRR                 = (start MRR + Expansion − Contraction − Churned) ÷ start MRR
ARPA                = MRR ÷ number of paying organizations
```

**Worked example:** start MRR $10,000 from 100 customers. In the month: expansion $800, contraction $200, 4 customers churn with $300 MRR, 6 new customers add $400.

- Net new MRR = 400 + 800 − 200 − 300 = **$700** → end MRR $10,700
- Customer churn = 4 ÷ 100 = **4%**
- NRR = (10,000 + 800 − 200 − 300) ÷ 10,000 = **103%**
- ARPA = 10,700 ÷ 102 = **$104.90**

`npm run check:metrics` (in `server/`) runs this example through `shared/metrics.ts` and prints each number with PASS/FAIL.

---

## 13. Background jobs

Jobs live in `server/src/jobs/registry.ts`. On a long-lived server (local development) they run with node-cron when `ENABLE_JOBS=true`. In production on Vercel nothing keeps running between requests, so `ENABLE_JOBS=false` and each job is a route, `GET|POST /api/v1/internal/jobs/:name` with `Authorization: Bearer <CRON_SECRET>`, called by GitHub Actions (`.github/workflows/scheduled-jobs.yml`): frequent jobs every 10 minutes, daily jobs once a day (Vercel's free cron allows only daily jobs). Each job must be safe to run twice, even concurrently on different instances, and must log counts.

| Job | Schedule (UTC) | What it does |
| --- | --- | --- |
| `retry-webhooks` | Every minute (every 10 min in production) | Process `stripe_events` that are `RECEIVED` for over a minute or `FAILED` with `nextAttemptAt ≤ now`, `attempts < 5`, oldest first; reset `PROCESSING` rows older than 10 minutes to `FAILED` first |
| `send-emails` | Every minute (every 10 min in production) | Send `email_outbox` rows with status `PENDING` or `FAILED` and `attempts < 5`; claim each row by bumping `attempts` atomically |
| `report-usage` | Every 5 minutes (every 10 min in production) | Send `billable` events without `reportedToStripeAt` (up to 500 per run, 10 at a time) to the Stripe Billing Meter: every unit, since the graduated price makes the included units free. Identifier `lf-<organizationId>-<eventId>` (unique across the development and production databases, which share one Stripe test account); Stripe refuses a repeated identifier with a 400 "already exists", which counts as reported, so a re-run never bills twice. Timestamp = the later of `occurredAt` and the event's `periodStart`, so Stripe puts it in the same period as the counter. Rows are marked per group of 10; failures stay unreported and are retried next run. Events older than 33 days are skipped (Stripe accepts 35). Stripe accepts usage for a period until about an hour after it ends, which the 10-minute schedule meets |
| `usage-rollup` | Every hour at :05 (every 10 min in production) | Recompute the last three UTC days of `usage_daily_rollups` (per organization, metric and day of `occurredAt`) from `usage_events` in one `INSERT … SELECT … GROUP BY … ON CONFLICT DO UPDATE`; three days because usage may arrive 24 h late and a run may be late |
| `roll-free-periods` | Daily 00:01 (03:15 in production) | Move Free-plan subscriptions whose `currentPeriodEnd` has passed to the current calendar month (UTC). Only for display: the usage limit already follows the calendar month (FR-USE-06) |
| `mrr-snapshot` | Daily 00:15 (03:15 in production) | Write today's (UTC) `mrr_snapshots` row for every organization, zero included, in one `INSERT … SELECT FROM unnest(…) ON CONFLICT DO UPDATE`; a second run the same day overwrites with current values |
| `reconcile-stripe` | Daily 01:00 (03:15 with `cleanup` in production) | For every organization with a Stripe customer, re-sync its subscription from Stripe (also finding subscriptions whose webhooks never arrived) and audit each corrected field as `reconciliation.corrected` (FR-WH-09) |
| `verify-usage-counters` | Daily 01:30 (03:15 in production) | For counters of periods that started in the last 40 days, compare `units` with `SUM(quantity)` of the events with the same `periodStart`. A drift is repaired after locking the counter row (`FOR UPDATE`, so every ingest that touched it has committed and the sum is exact), audited as `usage.counter_corrected` and logged |
| `cleanup` | Daily 03:15 | Delete accounts unverified for 7 days (and organizations only they belong to), email tokens used or expired for more than a day, and ended `rate_limits` windows |

---

## 14. Non-functional requirements

### 14.1 Security (NFR-SEC)

| ID | Requirement |
| --- | --- |
| NFR-SEC-01 | Passwords hashed with bcrypt (cost 12). API keys, invitation tokens, email-verification and password-reset tokens hashed with SHA-256. Refresh tokens tracked by `jti` and revocable. |
| NFR-SEC-02 | Access token kept in memory on the client (Redux state), never in `localStorage`. Refresh token only in an `httpOnly` cookie scoped to `/api/v1/auth`. |
| NFR-SEC-03 | Every `/orgs/:orgId` route checks membership (404 if none) and permission (403 if missing). Tenant data is read and written only through the tenant-scoped Prisma client. |
| NFR-SEC-04 | All input validated with Zod; unknown fields stripped. |
| NFR-SEC-05 | helmet security headers; CORS allows only `CLIENT_URL` with `credentials: true`; JSON body limit 100 kb. |
| NFR-SEC-06 | Rate limits: auth 5/min/IP, email links (resend verification, forgot password) 3/15 min/IP, general API 300/min/IP, usage 100/sec/API key. Counters in PostgreSQL, shared by all instances, except the usage limit, which is counted in memory per instance (FR-USE-09). |
| NFR-SEC-07 | Secrets only in environment variables. `.env.example` committed; `.env` never. Separate Stripe keys and webhook secrets for development and production. |
| NFR-SEC-08 | Logs never contain passwords, tokens, API keys or full webhook payloads. |
| NFR-SEC-09 | No account can act until its email address is verified (FR-AUTH-12). Endpoints that send links answer identically for every address, so they can't be used to discover which emails have accounts. |
| NFR-SEC-10 | Scheduled-job routes require `CRON_SECRET` (compared in constant time) and don't exist when it isn't configured. |

### 14.2 Performance (NFR-PERF)

| ID | Target |
| --- | --- |
| NFR-PERF-01 | Usage ingestion: p95 under 150 ms at 50 concurrent requests on the production host. |
| NFR-PERF-02 | Dashboard endpoints (summary, daily, MRR): p95 under 300 ms with 12 months of seeded data. |
| NFR-PERF-03 | Webhook endpoint returns within 2 seconds (Stripe waits up to about 10–20 seconds before treating a delivery as failed). |
| NFR-PERF-04 | Lighthouse performance ≥ 90 on `/pricing` and `/[orgSlug]/dashboard`. |
| NFR-PERF-05 | Every foreign key and every column used in a `WHERE` clause on a large table is indexed (see `@@index` lines in the schema). |

### 14.3 Reliability and data integrity (NFR-REL)

| ID | Requirement |
| --- | --- |
| NFR-REL-01 | No webhook is lost: every verified event is stored before any processing. |
| NFR-REL-02 | Processing any webhook twice produces the same final database state. |
| NFR-REL-03 | Usage for a Free organization never exceeds its limit, under any number of concurrent requests. |
| NFR-REL-04 | Multi-step writes (register, accept invitation, webhook processing, usage ingestion) run in one Prisma transaction. |
| NFR-REL-05 | Database and Stripe agree within 24 hours even if webhooks are missed (reconciliation). |

### 14.4 Maintainability, usability and operations

| ID | Requirement |
| --- | --- |
| NFR-MNT-01 | TypeScript `strict` on client and server; ESLint passes with no errors in CI. |
| NFR-MNT-02 | Every module follows route → controller → service. Every controller uses `catchAsync` and `sendResponse`. |
| NFR-MNT-03 | Architecture decisions recorded as ADRs in `docs/adr`. |
| NFR-USE-01 | All pages work from 360 px wide; forms show field-level errors; every data view has loading, empty and error states. |
| NFR-USE-02 | Keyboard accessible (shadcn/ui components), visible focus, colour is never the only signal. |
| NFR-OPS-01 | `GET /health` returns database status. Request logs via morgan; job logs include counts and duration. |

---

## 15. Environment variables

### 15.1 Server (`server/.env`)

| Variable | Example | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | Environment |
| `PORT` | `5050` | HTTP port (not 5000: macOS AirPlay Receiver uses it) |
| `DATABASE_URL` | `postgresql://…` | PostgreSQL connection |
| `CLIENT_URL` | `http://localhost:3000` | Allowed CORS origin; used in email links and Stripe redirect URLs |
| `BCRYPT_SALT_ROUNDS` | `12` | Password hashing cost |
| `JWT_ACCESS_SECRET` | 64 random chars | Access token signing |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_SECRET` | 64 random chars (different) | Refresh token signing |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |
| `STRIPE_SECRET_KEY` | `sk_test_…` | Stripe API (test mode). Optional locally and in CI: without it the API starts, and billing endpoints fail with a clear error. Use a separate Stripe account or sandbox per project |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` | Webhook signature verification. Locally: printed by `npm run stripe:listen` (it changes per CLI login). Production: the Dashboard endpoint's signing secret |
| `STRIPE_METER_EVENT_NAME` | `ledgerflow_units` | Billing Meter event name |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Mailtrap Sandbox (development), Gmail SMTP with an App Password (production) | Email sending. Required in production; without them in development, emails are rendered but not delivered |
| `MAIL_FROM` | `LedgerFlow <no-reply@ledgerflow.dev>` | Sender |
| `ENABLE_JOBS` | `true` (`false` on Vercel) | Run node-cron jobs in this process |
| `CRON_SECRET` | 64 random chars | Bearer secret for `/internal/jobs/*`; required in production |
| `TRUST_PROXY` | `1` | Proxies in front of the API whose `X-Forwarded-For` is trusted (client IP for rate limits and logs) |
| `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` | — | Used by the seed only |
| `GRACE_PERIOD_DAYS` | `7` | Past-due grace period: full access for this many days after the first failed payment of a past-due episode |

### 15.2 Client (`client/.env.local`)

| Variable | Example | Purpose |
| --- | --- | --- |
| `API_URL` | `http://localhost:5050` | Target of the `/api/*` rewrite (server-side only) |
| `NEXT_PUBLIC_APP_NAME` | `LedgerFlow` | Display name |

---

# Part C — Build guide

## 16. Implementation guide (key code patterns)

These are the parts of the code that interviewers will ask about. Write them yourself from these patterns. Understanding every line matters more than copying it.

### 16.1 Express app and middleware order

Order matters: the Stripe webhook route must receive the **raw** body, so it is mounted **before** `express.json()`.

```ts
// server/src/app.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import './lib/passport'; // registers the local + jwt strategies
import config from './config';
import { WebhookRoutes } from './modules/webhook/webhook.route';
import router from './routes';
import { globalErrorHandler } from './middlewares/globalErrorHandler';
import { notFound } from './middlewares/notFound';
import { prisma } from './lib/prisma';

const app = express();
app.set('trust proxy', config.trustProxy); // behind Vercel and the Next.js rewrite, so rate limits see the client IP

app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(morgan(config.isProd ? 'combined' : 'dev'));

// 1) Raw body for Stripe signature verification — BEFORE express.json()
app.use('/api/v1/webhooks', WebhookRoutes);

// 2) Everything else
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

app.get('/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok', db: 'ok' });
});
app.use('/api/v1', router);

app.use(notFound);
app.use(globalErrorHandler);
export default app;
```

```ts
// server/src/modules/webhook/webhook.route.ts
import express, { Router } from 'express';
import { WebhookController } from './webhook.controller';

const router = Router();
router.post('/stripe', express.raw({ type: 'application/json' }), WebhookController.handleStripe);
export const WebhookRoutes = router;
```

### 16.2 Authentication with passport, jsonwebtoken and bcrypt

**Strategies:**

```ts
// server/src/lib/passport.ts
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcrypt';
import { prisma } from './prisma';
import config from '../config';
import AppError from '../errors/AppError';

passport.use(
  new LocalStrategy({ usernameField: 'email', session: false }, async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user || !(await bcrypt.compare(password, user.password))) return done(null, false);
      if (user.status === 'BLOCKED') return done(new AppError(403, 'USER_BLOCKED', 'Your account is blocked'));
      return done(null, { id: user.id, name: user.name, email: user.email, platformRole: user.platformRole });
    } catch (err) {
      return done(err);
    }
  }),
);

passport.use(
  new JwtStrategy(
    { jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), secretOrKey: config.jwt.accessSecret },
    async (payload: { sub: string }, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: { id: true, name: true, email: true, platformRole: true, status: true },
        });
        if (!user || user.status === 'BLOCKED') return done(null, false);
        return done(null, { id: user.id, name: user.name, email: user.email, platformRole: user.platformRole });
      } catch (err) {
        return done(err);
      }
    },
  ),
);
```

```ts
// server/src/types/express.d.ts — gives req.user a real type
import type { PlatformRole } from '../../generated/prisma/client';
declare global {
  namespace Express {
    interface User { id: string; name: string; email: string; platformRole: PlatformRole }
  }
}
export {};
```

**Guards that return LedgerFlow's error format** (instead of passport's default plain 401):

```ts
// server/src/middlewares/auth.ts
import passport from 'passport';
import type { RequestHandler } from 'express';
import AppError from '../errors/AppError';

const guard = (strategy: 'local' | 'jwt', error: AppError): RequestHandler => (req, res, next) =>
  passport.authenticate(strategy, { session: false }, (err: unknown, user: Express.User | false) => {
    if (err) return next(err);
    if (!user) return next(error);
    req.user = user;
    next();
  })(req, res, next);

export const authenticateLocal = guard('local', new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password'));
export const auth = guard('jwt', new AppError(401, 'UNAUTHORIZED', 'Please log in'));
```

**Tokens and refresh rotation:**

```ts
// server/src/utils/tokens.ts
import crypto from 'node:crypto';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import config from '../config';
import AppError from '../errors/AppError';

export const signAccessToken = (user: Express.User) =>
  jwt.sign({ sub: user.id, email: user.email, platformRole: user.platformRole }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'],
  });

export async function issueRefreshToken(userId: string, familyId: string = crypto.randomUUID()) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ sub: userId, fid: familyId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'],
    jwtid: jti,
  });
  const { exp } = jwt.decode(token) as JwtPayload;
  await prisma.refreshToken.create({ data: { id: jti, userId, familyId, expiresAt: new Date(exp! * 1000) } });
  return token;
}

const sessionExpired = () => new AppError(401, 'UNAUTHORIZED', 'Session expired, please log in again');

export async function rotateRefreshToken(oldToken: string) {
  let payload: JwtPayload;
  try {
    payload = jwt.verify(oldToken, config.jwt.refreshSecret) as JwtPayload;
  } catch {
    throw sessionExpired();
  }
  const row = await prisma.refreshToken.findUnique({ where: { id: payload.jti! } });
  if (!row) throw sessionExpired();

  // Revoke atomically: if two requests race, only one can win this update.
  const { count } = await prisma.refreshToken.updateMany({
    where: { id: row.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count === 0) {
    // Already used → possible theft. Kill the whole family.
    await prisma.refreshToken.updateMany({ where: { familyId: row.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
    throw new AppError(401, 'TOKEN_REUSED', 'Session ended for security reasons, please log in again');
  }
  return { userId: row.userId, refreshToken: await issueRefreshToken(row.userId, row.familyId) };
}

export const refreshCookieOptions = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'lax' as const, // same-origin thanks to the Next.js rewrite (section 5.2)
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
```

**Routes:**

```ts
// server/src/modules/auth/auth.route.ts
router.post('/register', authLimiter, validateRequest(AuthValidation.register), AuthController.register);
router.post('/login', authLimiter, validateRequest(AuthValidation.login), authenticateLocal, AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
```

### 16.3 Tenant isolation with a Prisma client extension

`requireOrgMember` loads the membership and attaches a tenant-scoped Prisma client to the request. Services use that client, so they **cannot forget** the `organizationId` filter.

```ts
// server/src/lib/tenantPrisma.ts
import { prisma } from './prisma';

const TENANT_MODELS = new Set([
  'Membership', 'Invitation', 'Subscription', 'Invoice', 'ApiKey', 'UsageEvent',
  'UsageCounter', 'UsageDailyRollup', 'MrrSnapshot', 'AuditLog', 'EmailOutbox',
]);
const FILTERED_OPS = new Set([
  'findMany', 'findFirst', 'findFirstOrThrow', 'findUnique', 'findUniqueOrThrow', 'count',
  'aggregate', 'groupBy', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert',
]);

export function tenantPrisma(organizationId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_MODELS.has(model)) return query(args);
          const a = args as Record<string, any>;
          if (FILTERED_OPS.has(operation)) a.where = { ...a.where, organizationId };
          if (operation === 'create') a.data = { ...a.data, organizationId };
          if (operation === 'createMany') a.data = [a.data].flat().map((d) => ({ ...d, organizationId }));
          if (operation === 'upsert') a.create = { ...a.create, organizationId };
          return query(a);
        },
      },
    },
  });
}
export type TenantPrisma = ReturnType<typeof tenantPrisma>;
```

```ts
// server/src/middlewares/requireOrgMember.ts
export const requireOrgMember: RequestHandler = async (req, _res, next) => {
  const organizationId = req.params.orgId as string;
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: req.user!.id, organizationId } },
  });
  if (!membership) return next(new AppError(404, 'ORG_NOT_FOUND', 'Organization not found'));
  req.org = { id: organizationId, role: membership.role, db: tenantPrisma(organizationId) };
  next();
};

// server/src/middlewares/requirePermission.ts
export const requirePermission = (permission: Permission): RequestHandler => (req, _res, next) =>
  can(req.org!.role, permission) ? next() : next(new AppError(403, 'FORBIDDEN', 'You do not have permission'));
```

Rules for this to work:

- In tenant services, always write `organizationId` as a plain field, never `organization: { connect: … }`.
- Only `requireOrgMember` and admin/job code use the base `prisma` client for tenant tables.
- Add `org?: { id: string; role: OrgRole; db: TenantPrisma }` to the Express `Request` type, the same way as `User` above.

Route example:

```ts
router.post('/:orgId/invitations', auth, requireOrgMember, requirePermission('members:manage'),
  validateRequest(InvitationValidation.create), InvitationController.create);
```

### 16.4 Concurrency-safe usage ingestion

The limit check and the increment happen in **one SQL statement**. PostgreSQL locks the row while it updates it, so concurrent requests queue up, and each one sees the previous one's result. The limit can never be overrun.

```ts
// server/src/modules/usage/usage.service.ts (simplified)
const ctx = await getUsageContext(organizationId); // periodStart, includedUnits, limit (null = overage allowed)

// A retry of something already recorded is a duplicate, even when the limit is reached
const existing = await findOriginal(organizationId, input.idempotencyKey);
if (existing) return { eventId: existing.id.toString(), duplicate: true, ... };

try {
  return await prisma.$transaction(async (tx) => {
    // Create the period's counter or add to it, only while it stays within the limit.
    // No row back = the limit would be exceeded.
    const rows = await tx.$queryRaw<{ units: number }[]>`
      INSERT INTO usage_counters ("organizationId", "periodStart", units, "updatedAt")
      SELECT ${organizationId}, ${ctx.periodStart}, ${input.quantity}, now()
      WHERE ${ctx.limit}::int IS NULL OR ${input.quantity} <= ${ctx.limit}::int
      ON CONFLICT ("organizationId", "periodStart") DO UPDATE
        SET units = usage_counters.units + EXCLUDED.units, "updatedAt" = now()
        WHERE ${ctx.limit}::int IS NULL OR usage_counters.units + EXCLUDED.units <= ${ctx.limit}::int
      RETURNING units`;
    if (rows.length === 0) throw limitReached(ctx.limit!); // 429 PLAN_LIMIT_USAGE

    const event = await tx.usageEvent.create({ data: { ... } });
    return { eventId: event.id.toString(), duplicate: false, periodUnits: rows[0].units, ... };
  });
} catch (err) {
  // Two identical requests at the same moment: the unique index (organizationId, idempotencyKey)
  // lets one win; the other's whole transaction, counter included, rolls back
  if (isP2002(err)) return { eventId: (await findOriginal(...)).id.toString(), duplicate: true, ... };
  throw err;
}
```

One `INSERT … ON CONFLICT DO UPDATE … WHERE` statement both creates a new period's counter and does the conditional increment, so there is no separate "create the row first" step. A request that is rejected or turns out to be a duplicate leaves no event and no units behind.

**Verified on the implementation** (PostgreSQL 16, branch `feat/server-usage-ingest`): 50 concurrent requests of 30 units each against the 1,000-unit Free limit → **exactly 33 accepted, 17 rejected with `PLAN_LIMIT_USAGE`, final counter 990** = the sum of the stored events; 10 more units fit exactly and 1 more is rejected. 20 concurrent requests with the same `idempotencyKey` → all `202`, one event, counted once. Reproduce it with the script in section 19.4 and put your own numbers in the README.

`BigInt` ids must be converted to strings before sending JSON (`event.id.toString()`), because `JSON.stringify` cannot serialise `BigInt`.

### 16.5 Webhook receiver and processor

```ts
// server/src/modules/webhook/webhook.controller.ts
const handleStripe = async (req: Request, res: Response) => {
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'] as string, config.stripe.webhookSecret);
  } catch {
    return res.status(400).json({ success: false, statusCode: 400, message: 'Invalid signature', errorCode: 'INVALID_SIGNATURE', errorDetails: [] });
  }

  try {
    await prisma.stripeEvent.create({ data: { id: event.id, type: event.type, payload: event as unknown as Prisma.InputJsonValue } });
  } catch (err) {
    if (isPrismaUniqueError(err)) return res.status(200).json({ received: true, duplicate: true }); // dedupe
    throw err;
  }

  await processStripeEvent(event.id); // records failures itself; never throws
  return res.status(200).json({ received: true });
};
```

```ts
// server/src/modules/webhook/webhook.processor.ts
export async function processStripeEvent(eventId: string) {
  // Atomic claim: only one caller (request or retry job) can move it to PROCESSING.
  const claimed = await prisma.stripeEvent.updateMany({
    where: { id: eventId, status: { in: ['RECEIVED', 'FAILED'] } },
    data: { status: 'PROCESSING', attempts: { increment: 1 } },
  });
  if (claimed.count === 0) return;

  const row = await prisma.stripeEvent.findUniqueOrThrow({ where: { id: eventId } });
  try {
    await handleEvent(row.payload as unknown as Stripe.Event);
    await prisma.stripeEvent.update({ where: { id: eventId }, data: { status: 'PROCESSED', processedAt: new Date(), lastError: null } });
  } catch (err) {
    const giveUp = row.attempts >= 5;
    await prisma.stripeEvent.update({
      where: { id: eventId },
      data: {
        status: 'FAILED',
        lastError: String(err).slice(0, 500),
        nextAttemptAt: giveUp ? null : new Date(Date.now() + 2 ** row.attempts * 60_000),
      },
    });
  }
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object;
      await linkCustomer(s.metadata!.organizationId, s.customer as string);
      if (s.subscription) await syncSubscription(s.subscription as string);
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await syncSubscription(event.data.object.id); // re-fetch: order of events no longer matters
      break;
    case 'invoice.paid':
    case 'invoice.payment_failed':
      await syncInvoice(event.data.object.id!);
      break;
    case 'customer.subscription.trial_will_end':
      await queueTrialEndingEmail(event.data.object.id);
      break;
    default:
      break; // stored for the record, nothing to do
  }
}
```

`syncSubscription(id)` outline:

1. `const sub = await stripe.subscriptions.retrieve(id)`.
2. Find the flat (non-metered) item; map its `price.id` to a `Plan`.
3. Read the period dates. In Stripe API versions from 2025 onward they live on the **subscription item** (`item.current_period_start`); older versions have them on the subscription. Pin your API version in `new Stripe(key, { apiVersion: '…' })` and read from the matching place.
4. In one transaction: read the current row (`before`), compute `graceEndsAt` (keep the existing value if already `PAST_DUE`, set `now + 7 days` when entering `PAST_DUE`, clear otherwise), upsert by `organizationId`, write an audit row and outbox emails if the status changed.

`syncInvoice(id)` re-fetches the invoice, upserts it by `stripeInvoiceId`, then calls `syncSubscription` for its subscription.

### 16.6 Subscription state helpers

```ts
// server/src/shared/subscriptionState.ts
import type Stripe from 'stripe';
import type { SubscriptionStatus } from '../../generated/prisma/client';

export type AccessLevel = 'FULL' | 'FREE';

export function fromStripeStatus(s: Stripe.Subscription.Status): SubscriptionStatus {
  const map: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'CANCELED',
    trialing: 'TRIALING',
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    unpaid: 'UNPAID',
    paused: 'UNPAID',
    canceled: 'CANCELED',
  };
  return map[s];
}

export function accessLevel(status: SubscriptionStatus, graceEndsAt: Date | null, now = new Date()): AccessLevel {
  switch (status) {
    case 'ACTIVE':
    case 'TRIALING':
      return 'FULL';
    case 'PAST_DUE':
      return graceEndsAt && now < graceEndsAt ? 'FULL' : 'FREE';
    default:
      return 'FREE'; // INCOMPLETE, UNPAID, CANCELED
  }
}
```

### 16.7 RTK Query base API with automatic token refresh

```ts
// client/src/redux/api/baseApi.ts
import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { setAccessToken, loggedOut } from '../features/authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api/v1', // goes through the Next.js rewrite
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

let refreshing: Promise<boolean> | null = null; // one refresh at a time

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  let result = await rawBaseQuery(args, api, extra);
  const url = typeof args === 'string' ? args : args.url;

  if (result.error?.status === 401 && !url.startsWith('/auth/')) {
    refreshing ??= (async () => {
      const r = await rawBaseQuery({ url: '/auth/refresh-token', method: 'POST' }, api, extra);
      const token = (r.data as { data?: { accessToken?: string } } | undefined)?.data?.accessToken;
      api.dispatch(token ? setAccessToken(token) : loggedOut());
      return Boolean(token);
    })().finally(() => { refreshing = null; });

    if (await refreshing) result = await rawBaseQuery(args, api, extra); // retry once
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Me', 'Org', 'Members', 'Invitations', 'Subscription', 'Invoices', 'ApiKeys', 'Usage', 'Audit', 'Admin'],
  endpoints: () => ({}),
});
```

```ts
// client/src/redux/api/billingApi.ts
type ApiResponse<T> = { success: boolean; statusCode: number; message: string; data: T };

export const billingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSubscription: build.query<Subscription, string>({
      query: (orgId) => `/orgs/${orgId}/billing/subscription`,
      transformResponse: (r: ApiResponse<Subscription>) => r.data,
      providesTags: ['Subscription'],
    }),
    createCheckout: build.mutation<{ url: string }, { orgId: string; planCode: string }>({
      query: ({ orgId, planCode }) => ({ url: `/orgs/${orgId}/billing/checkout-session`, method: 'POST', body: { planCode } }),
      transformResponse: (r: ApiResponse<{ url: string }>) => r.data,
    }),
    changePlan: build.mutation<void, { orgId: string; planCode: string; idempotencyKey: string }>({
      query: ({ orgId, planCode, idempotencyKey }) => ({
        url: `/orgs/${orgId}/billing/change-plan`, method: 'POST', body: { planCode },
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
      invalidatesTags: ['Subscription', 'Invoices', 'Org'],
    }),
  }),
});
export const { useGetSubscriptionQuery, useCreateCheckoutMutation, useChangePlanMutation } = billingApi;
```

**Polling after Checkout** (FR-BILL-03). The Free plan is already `ACTIVE`, so wait for a **paid** plan:

```tsx
const [polling, setPolling] = useState(searchParams.get('checkout') === 'success');
const { data: sub } = useGetSubscriptionQuery(orgId, { pollingInterval: polling ? 2000 : 0 });

useEffect(() => {
  if (sub && sub.plan.code !== 'FREE' && ['ACTIVE', 'TRIALING'].includes(sub.status)) setPolling(false);
}, [sub]);
useEffect(() => {
  if (!polling) return;
  const t = setTimeout(() => setPolling(false), 30_000); // give up after 30 s
  return () => clearTimeout(t);
}, [polling]);
```

---

## 17. Frontend specification

### 17.1 Pages

| Route | Who | Content | Key behaviour |
| --- | --- | --- | --- |
| `/` | Everyone | Landing page (Magic UI accents) | Static, fast |
| `/pricing` | Everyone | Plan cards from `GET /plans` | Static shell; plans rendered on the server per request inside `<Suspense>` (the build never calls the API) |
| `/login`, `/register` | Visitors | Forms (React Hook Form + Zod) | Register ends on a "Check your inbox" screen with resend; login shows a resend action for `EMAIL_NOT_VERIFIED`; "Forgot password?" link; demo-account buttons on login |
| `/verify-email` | Visitors | Verifies the token from the link | Logs in and continues to `?next=` or the first organization; expired link → resend |
| `/forgot-password`, `/reset-password` | Visitors | Request a reset link; set a new password from the link | Same confirmation for every email; after reset → login |
| `/onboarding` | Logged in, no organization | Create an organization | After leaving the last organization |
| `/invite/[token]` | Everyone | Org name, role, accept button | Prompts login/register if needed |
| `/[orgSlug]/dashboard` | Members | Usage vs quota, 30-day chart, plan badge, projection, seats | Banner at 80% (dismissible for the period) and 100% usage: Free → "limit reached", paid → "in overage" with the amount so far; past-due banner |
| `/[orgSlug]/usage` | Members | Daily usage table and chart with date range and metric filter | Range and metric stored in URL search params (`?from&to&metric`); presets 7/30/90 days; more than 90 days is caught before any request |
| `/[orgSlug]/billing` | Billing, Admin, Owner (actions: Billing, Owner) | Current plan, plan cards (Upgrade → Checkout; Switch → preview dialog), Manage billing (portal), invoices | After Checkout (`?checkout=success`) or a plan switch: polls the subscription every 2 s until the webhook has applied it (gives up after 30 s); a past-due/unpaid/incomplete banner shows on every org page |
| `/[orgSlug]/settings/members` | Members (manage: Admin, Owner) | Members table, invitations, invite dialog | Seat-limit message with upgrade link |
| `/[orgSlug]/settings/api-keys` | Admin, Owner | Keys table, create, revoke, a copyable `curl` example | Show-once dialog with copy button (can't be closed by a stray click; the key is dropped from memory when it closes); create disabled at 10 active keys |
| `/[orgSlug]/settings/audit` | Admin, Owner | Timeline of changes | Paginated |
| `/[orgSlug]/settings/profile` | Everyone | Name, password | — |
| `/admin` | Super admin | MRR chart, movements table, churn/NRR/ARPA cards | — |
| `/admin/tenants` | Super admin | Searchable organizations table | — |
| `/admin/webhooks` | Super admin | Failed webhook events | — |

### 17.2 State management rules

| Kind of state | Where it lives | Example |
| --- | --- | --- |
| Server data | RTK Query cache | Subscription, members, usage, invoices |
| Auth | `authSlice` (memory only) | `accessToken`, `user` |
| Active organization | `orgSlice` | `activeOrgId`, derived from the URL slug + `/users/me` memberships |
| UI | `uiSlice` | Sidebar open, dismissed banners |
| Filters and ranges | URL search params | `?from=2026-09-01&to=2026-09-30` |
| Forms | React Hook Form | Invite form, register form |

Never copy RTK Query data into a slice. After a mutation, invalidate tags instead of editing state by hand.

### 17.3 Session handling

1. On first load, an `AuthBootstrap` component calls `POST /auth/refresh-token` once. Success → store the access token; failure → user is logged out.
2. Protected layouts (`[orgSlug]/layout.tsx`, `admin/layout.tsx`) wait for bootstrap, then redirect to `/login` if there is no user.
3. Pages check `can(myRole, permission)` (shared permission map) to hide actions. The API still enforces everything.
4. Every list has loading skeletons, empty states with a call to action, and an error state with retry.

---

## 18. Build plan: 4 phases

Each phase ends with something deployed and demoable. Deploy from week 1 so deployment never becomes a last-minute risk.

### Phase 1 — Foundation, auth and tenancy (weeks 1–2)

- [ ] Create the repo with `server/` and `client/`; TypeScript strict; ESLint; `.env.example`
- [ ] Prisma schema (section 11.5), first migration, seed plans + super admin
- [ ] `AppError`, `catchAsync`, `sendResponse`, `validateRequest`, `globalErrorHandler`, `notFound`
- [ ] passport local + jwt strategies, register (transaction), login, refresh rotation, logout
- [ ] `requireOrgMember`, `tenantPrisma`, `requirePermission`, permission map
- [ ] Organizations, members, invitations (+ email outbox and `send-emails` job)
- [ ] Client: Redux store, `baseApi` with re-auth, login/register pages, org layout, members page
- [ ] GitHub Actions CI; deploy client, server and database

**Done when:** a stranger can register on the live URL, invite a second account, and a user of Org A gets `404` on every Org B endpoint (checklist 19.2).

### Phase 2 — Stripe billing (weeks 3–4)

- [x] Script to create Stripe Products/Prices and a Billing Meter; plans linked to their ids (`npm run stripe:setup`)
- [x] Checkout session, Customer Portal session (server); success-page polling comes with the billing page
- [x] Webhook receiver (raw body, signature, inbox) and processor (claim, exactly once, backoff, re-fetch, transaction)
- [x] `syncSubscription`, `syncInvoice`, state helpers, entitlements, grace period
- [x] Change-plan preview and apply (with Idempotency-Key); invoices list
- [x] Billing page, pricing page
- [x] `retry-webhooks` job
- [x] Payment emails
- [x] Past-due banner

**Done when:** upgrade, plan change, cancel and a failed payment each show the correct state in the UI without a manual refresh (checklist 19.3).

### Phase 3 — Usage metering and analytics (weeks 5–6)

- [x] API keys (create once-shown, list, revoke) and `apiKeyAuth` middleware
- [x] `POST /usage` with idempotency and atomic limits (section 16.4)
- [x] Jobs: `report-usage`, `usage-rollup`, `roll-free-periods`, `verify-usage-counters`
- [x] Usage summary and daily endpoints
- [x] Dashboard and usage pages with charts; API keys page (show-once dialog); 80%/100% usage banners
- [x] `mrr-snapshot` job, `shared/metrics.ts`, admin MRR/churn/tenants/webhook-events endpoints
- [ ] Admin pages
- [ ] Seed 12 months of history

**Done when:** the admin dashboard shows a believable year of MRR, and the concurrency script (19.4) never exceeds the Free limit.

### Phase 4 — Hardening and launch (weeks 7–8)

- [x] `reconcile-stripe` job
- [ ] Failed-webhooks admin page
- [ ] Rate limits, helmet, CORS, body limits; security checklist (20.3)
- [ ] Indexes checked with `EXPLAIN ANALYZE` on the dashboard queries; Lighthouse pass
- [ ] Audit log page; empty/loading/error states everywhere
- [ ] README, ERD in `docs/`, ADRs, demo accounts, 2-minute Loom walkthrough
- [ ] Full run of the manual verification checklist on production

**Done when:** every item in section 19 passes on the live site, and a recruiter can try the demo in under 60 seconds.

---

## 19. Manual verification checklist

Automated tests are deferred to a later phase. Until then, run this checklist before every release with Postman and the Stripe CLI, and tick each item. Save the Postman collection in the repo (`docs/postman/LedgerFlow.postman_collection.json`).

### 19.1 Setup

```bash
stripe login
stripe listen --forward-to localhost:5000/api/v1/webhooks/stripe   # prints whsec_… → STRIPE_WEBHOOK_SECRET
```

Stripe test cards: `4242 4242 4242 4242` (succeeds), `4000 0000 0000 0341` (attaches, then fails when charged), `4000 0025 0000 3155` (requires authentication). Any future expiry date and any CVC.

### 19.2 Auth, tenancy and roles

- [ ] Register creates user, organization, OWNER membership and Free subscription (check in Prisma Studio), sends a verification email, and does **not** log in
- [ ] Logging in before verifying → `403 EMAIL_NOT_VERIFIED`; the emailed link logs in; using it again → `410 TOKEN_EXPIRED`
- [ ] Forgot password → reset link → new password works, old one doesn't, other sessions end
- [ ] Registering from an invitation link with the invited email skips verification and lands in the organization
- [ ] Duplicate email → `409 EMAIL_TAKEN`; wrong password → `401 INVALID_CREDENTIALS`
- [ ] 6 quick login attempts → `429 RATE_LIMITED`
- [ ] Refresh returns a new token and a new cookie; reusing the **old** cookie → `401 TOKEN_REUSED`, and then even the new cookie fails
- [ ] User of Org A calling any `/orgs/<OrgB-id>/…` endpoint → `404 ORG_NOT_FOUND`
- [ ] Member calling invite or API-key endpoints → `403 FORBIDDEN`; Billing user cannot see members management
- [ ] Removing the last Owner → `409 LAST_OWNER`
- [ ] Inviting a 4th person on Free → `402 PLAN_LIMIT_SEATS`

### 19.3 Billing and webhooks

- [ ] Upgrade with `4242…`: billing page shows "Confirming…", then Pro within a few seconds
- [ ] Resend a `customer.subscription.updated` event (Stripe Dashboard → Developers → Events → Resend, or `stripe events resend <evt_id>`) → the second delivery returns `duplicate: true` and nothing changes
- [ ] Stop the server, upgrade in Stripe Dashboard, start the server: the event arrives on Stripe's retry and the plan updates
- [ ] Make a processor throw on purpose (temporary code): event becomes `FAILED` with `nextAttemptAt`; remove the error; the `retry-webhooks` job processes it
- [ ] Change-plan preview shows a prorated amount; applying it updates the plan after the webhook
- [ ] Customer Portal: change card, cancel at period end → UI shows "Cancels on …"
- [ ] Failed renewal: use a Stripe **test clock** (search "Test clocks" in the Stripe Dashboard), subscribe with `4000…0341`, advance one month → `PAST_DUE`, banner, `payment_failed` email in Mailtrap; update the card → `ACTIVE`
- [ ] Edit a subscription row in the database by hand, run `reconcile-stripe` → corrected, audit row written

### 19.4 Usage and concurrency

- [ ] Valid key → `202`; revoked key → `401 INVALID_API_KEY`
- [ ] Same `idempotencyKey` twice → second response `duplicate: true`, counter unchanged
- [ ] Concurrency script (below) on a Free org at 0 units → exactly 33 accepted, counter 990, never above 1,000

```ts
// server/scripts/concurrencyDemo.ts  — run: npx tsx scripts/concurrencyDemo.ts <API_KEY>
const key = process.argv[2];
const url = process.env.API_URL ?? 'http://localhost:5000';

const send = (i: number) =>
  fetch(`${url}/api/v1/usage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key },
    body: JSON.stringify({ metric: 'documents_processed', quantity: 30, idempotencyKey: `demo-${Date.now()}-${i}` }),
  }).then((r) => r.status);

const started = performance.now();
const statuses = await Promise.all(Array.from({ length: 50 }, (_, i) => send(i)));
const ms = Math.round(performance.now() - started);
console.log({ accepted: statuses.filter((s) => s === 202).length, rejected: statuses.filter((s) => s === 429).length, ms });
```

### 19.5 Analytics and jobs

- [ ] Seeded admin dashboard: MRR movements add up (`previous MRR + net new = current MRR` for every month)
- [ ] `npm run check:metrics` prints the worked example from section 12.4 correctly
- [ ] Usage chart total for today equals `SUM(quantity)` in `usage_events` for today
- [ ] Overage events get `reportedToStripeAt`, and the meter shows usage in the Stripe Dashboard

### 19.6 Later: automated tests

When you are ready, add Jest + Supertest in this order: `shared/` functions (state, metrics, permissions), then auth and tenancy endpoints, then webhooks with signed fixtures. The checklist above becomes your test plan.

---

## 20. Deployment and security

### 20.1 Hosting

Everything runs on free plans; the click-by-click setup is in [`docs/deployment.md`](./deployment.md).

| Component | Host | Notes |
| --- | --- | --- |
| `client` | Vercel (Hobby) | `API_URL` points at the API; deploys from `main` only (`client/vercel.json`) |
| `server` | Vercel (Hobby), Express as one function | `src/app.ts` is the entry; `npm run db:deploy` runs migrations on each deploy; scheduled jobs are routes called by GitHub Actions |
| PostgreSQL | Prisma Postgres | `ledgerflow-prod`, direct `postgres://` URL with `sslmode=verify-full` |
| Email | Mailtrap Sandbox (dev), Gmail SMTP with an App Password (prod) | With the email-verification gate, production email must work or nobody can sign up |
| Stripe | Test mode | Dashboard → Developers → Webhooks → add `https://<api>/api/v1/webhooks/stripe` with the 7 events from section 12.2; copy its signing secret into production env |

### 20.2 GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [server, client]
    defaults:
      run:
        working-directory: ${{ matrix.app }}
    env:
      DATABASE_URL: postgresql://user:pass@localhost:5432/ci   # prisma generate needs a value, not a live DB
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: ${{ matrix.app }}/package-lock.json
      - run: npm ci
      - run: npx prisma generate
        if: matrix.app == 'server'
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run build
```

Vercel deploys both projects automatically from `main`. Branch rulesets on GitHub require the three CI checks before merging into `development` or `main`.

### 20.3 Security checklist

- [ ] `.env` in `.gitignore`; `.env.example` lists every variable from section 15
- [ ] Different Stripe keys and webhook secrets for local and production
- [ ] Webhook verified on the raw body; route mounted before `express.json()`
- [ ] Refresh cookie: `httpOnly`, `secure` in production, `sameSite: 'lax'`, `path: '/api/v1/auth'`
- [ ] Access token only in Redux memory, never `localStorage`
- [ ] bcrypt for passwords; SHA-256 hashes for API keys and invitation tokens
- [ ] helmet, CORS allowlist with `credentials: true`, 100 kb body limit, rate limits
- [ ] All input validated with Zod; raw SQL only via tagged templates
- [ ] `404` for other organizations' resources; permission checked on every route
- [ ] No passwords, tokens, keys or card data in logs
- [ ] GitHub Dependabot alerts enabled

---

## 21. Portfolio presentation

A reviewer spends about 90 seconds on your repository. Show the product, the architecture and the hard problems before setup instructions.

### 21.1 README order

1. One-line pitch, live demo link, CI badge
2. 20-second GIF: upgrade flow → usage dashboard → admin MRR chart
3. **Try it:** demo accounts table (below) and test card `4242 4242 4242 4242`
4. Architecture diagram and the ERD image, with three sentences each
5. **Engineering highlights:** idempotent webhooks, atomic usage limits (with your concurrency numbers), tenant-scoped Prisma client, revenue analytics — each linked to the exact file
6. Tech stack and local setup (`npm install`, `.env`, `npx prisma migrate dev`, `npm run seed`, `npm run dev`, `stripe listen …`)
7. Links to the SRS (this document), ADRs and the Postman collection

### 21.2 Demo accounts (one-click buttons on the login page)

| Account | Shows |
| --- | --- |
| Owner, Acme (Pro) | Billing, plan change with proration preview, usage near 80% |
| Billing user, Acme | Can manage billing; cannot manage members or API keys |
| Owner, Globex (past due) | Dunning banner with grace countdown |
| Owner, Initech (Free) | Usage at 95% of the Free limit; upgrade prompts |
| Super admin | MRR, movements, churn, tenants, failed webhooks |

Reset demo data nightly by re-running the seed for demo organizations only.

### 21.3 Architecture decision records (one page each)

| ADR | Decision |
| --- | --- |
| ADR-001 | Shared-database multi-tenancy with a tenant-scoped Prisma client (vs one schema per tenant) |
| ADR-002 | Stripe is the source of truth; webhook inbox + nightly reconciliation |
| ADR-003 | Re-fetch Stripe objects instead of trusting event payloads |
| ADR-004 | PostgreSQL atomic counters for limits instead of Redis |
| ADR-005 | Daily MRR snapshots instead of computing analytics on request |
| ADR-006 | RTK Query for server data; Redux slices only for auth and UI state |
| ADR-007 | Next.js rewrite for same-origin cookies |

Template for each: **Context · Decision · Alternatives considered · Consequences.**

---

## 22. Resume bullets and interview preparation

### 22.1 Resume bullets (STAR)

Fill every bracket with a number you actually measured; interviewers will ask how you got it.

- Built a multi-tenant SaaS billing platform (Next.js, Redux Toolkit/RTK Query, Express 5, Prisma, PostgreSQL, Stripe) to replace manual subscription handling for [X] simulated organizations; enforced tenant isolation through a Prisma client extension that scopes every query by organization, and permission-based RBAC across 4 roles and [Y] protected endpoints.
- Designed an idempotent Stripe webhook pipeline (signature verification, database inbox deduplication, re-fetching objects from Stripe, exponential-backoff retries, nightly reconciliation) that kept subscription state correct across [X] duplicate and out-of-order deliveries, responding to Stripe in under [Y] ms.
- Implemented concurrency-safe usage metering with atomic PostgreSQL updates, accepting exactly [33 of 50] concurrent requests at a [1,000]-unit limit with zero overruns, and built MRR, churn and NRR analytics from daily snapshots that load in under [Z] ms p95.

### 22.2 Questions you should be ready to answer

| Likely question | Your answer |
| --- | --- |
| What happens if Stripe sends the same webhook twice? | The event id is the inbox's primary key, so the second insert fails and I return 200 without processing again. |
| What if `subscription.updated` arrives before `created`? | My processor re-fetches the subscription from Stripe and upserts it, so the order doesn't matter. |
| What if your server is down when Stripe sends an event? | Stripe retries for days. Also, a nightly job reconciles every subscription with Stripe. |
| How do you stop one company reading another's data? | Membership check returns 404, and services use a Prisma client extension that adds `organizationId` to every query on tenant tables. |
| How do you stop two requests both passing the usage limit? | The check and increment are one `UPDATE … WHERE units + n <= limit`. PostgreSQL locks the row, so requests run one after another. I tested 50 at once: exactly 33 accepted. |
| Why not Redis? | PostgreSQL gave the guarantees I needed at this scale. With more traffic I'd move counters to Redis and webhooks to a queue; the idempotency design stays the same. |
| Why passport? | It separates authentication strategies cleanly: `local` for login, `jwt` for API routes, and I can add Google login as another strategy without touching routes. |
| How does your refresh token work? | 15-minute access token in memory; 7-day refresh token in an httpOnly cookie, rotated on every use. Reusing an old one revokes the whole family, which detects theft. |
| Why RTK Query? | Caching, tag invalidation and polling built in. My base query refreshes the token once on a 401 and retries, and parallel requests share that one refresh. |
| Why not activate the plan on the success page? | The browser can be faked or closed early. Only a verified webhook or a Stripe API read can grant access. |
| How did you test it? | A written verification checklist run before each release: Postman for every endpoint, Stripe CLI to resend and trigger events, test clocks for renewals, and a script that fires concurrent requests. Automated Jest tests are my next step. |
| How do you define churn? | Paying customers lost in the month divided by paying customers at the start. Revenue churn is tracked separately as churned MRR. |
| How would you scale this 100×? | Run several API instances with Redis-backed rate limits, move jobs to a worker and a queue, partition `usage_events` by month, and add a read replica for analytics. |

Practise explaining the architecture diagram and the ERD aloud in two minutes each; system-design interviews usually open that way.
