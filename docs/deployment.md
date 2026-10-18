# Deployment (free)

Everything runs on free plans, and no payment card is needed anywhere.

| Part | Where | Deploys from |
| --- | --- | --- |
| Website (`client/`) | Vercel project #1 | `main` |
| API (`server/`) | Vercel project #2 | `main` (applies database migrations on each deploy) |
| Database | Prisma Postgres, database `ledgerflow-prod` | — |
| Email | Gmail SMTP with an App Password (real delivery). Development uses the Mailtrap Sandbox | — |
| Scheduled jobs | GitHub Actions, [`scheduled-jobs.yml`](../.github/workflows/scheduled-jobs.yml) | — |

```
Browser → Website (Vercel) ──/api/* rewrite──► API (Vercel) ──► Prisma Postgres
                                                 ▲
             GitHub Actions, every 10 min ───────┘  POST /api/v1/internal/jobs/<job>
```

**How the background jobs work:** on Vercel nothing keeps running between requests, so the API's built-in timers (node-cron) never fire there. Instead, every job is a secret-protected route, and GitHub Actions calls it every 10 minutes. Invitation emails are also sent straight after the request, so they don't wait for the schedule. Locally, `npm run dev` still uses the built-in timers.

Only `main` is deployed. Both `vercel.json` files skip every other branch, so a feature branch never runs migrations against the production database.

---

## 0. Before you start

Merge your work into `main` (PR `development → main`). Vercel deploys from `main` only.

Generate three secrets on your Mac and keep them for the steps below. Each must be different.

```bash
openssl rand -hex 32   # JWT_ACCESS_SECRET
openssl rand -hex 32   # JWT_REFRESH_SECRET
openssl rand -hex 32   # CRON_SECRET
```

## 1. Production database

1. [console.prisma.io](https://console.prisma.io) → project `ledgerflow` → **Create database** → name `ledgerflow-prod`. **Note the region** you pick; you'll match it in step 3.
2. Open it → **Connect** → generate a **direct `postgres://…`** connection string. Change `sslmode=require` to `sslmode=verify-full` at the end.
3. Create the tables and seed the plans and super admin, from your Mac:

```bash
cd server
DATABASE_URL="<ledgerflow-prod connection string>" npm run db:deploy
DATABASE_URL="<ledgerflow-prod connection string>" \
SUPER_ADMIN_EMAIL="you@example.com" \
SUPER_ADMIN_PASSWORD="<a strong password>" \
npm run db:seed
```

Values given on the command line win over `server/.env`, so your local `.env` is not used for these two commands.

## Production email (Gmail)

New accounts can't log in until they click the link in their verification email, so production email **must** deliver to real inboxes. The free option without owning a domain is Gmail:

1. Create a Gmail account just for the app (e.g. `ledgerflow.app@gmail.com`), not your personal one.
2. [myaccount.google.com/security](https://myaccount.google.com/security) → turn on **2-Step Verification**.
3. [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) → name `LedgerFlow` → **Create**. Copy the 16 letters without spaces; Google shows them only once.

Gmail allows about 500 emails a day. `MAIL_FROM` must use the same address as `SMTP_USER`, or Gmail rejects or spam-folders the mail. Your local `server/.env` stays on Mailtrap, so development never emails real people.

## Stripe (test mode)

Billing runs in Stripe **test mode**: fake cards (`4242 4242 4242 4242`), no real money. Use a Stripe account (or sandbox) just for LedgerFlow, so its products and webhooks don't mix with other projects.

1. Stripe Dashboard → **Developers → API keys** → copy the **Secret key** (`sk_test_…`). It goes into `STRIPE_SECRET_KEY` locally (`server/.env`) and on the API's Vercel project.
2. Create the products, prices and usage meter and link them to the plans in **each** database you use:

```bash
cd server
npm run stripe:setup                                            # development database (.env)
DATABASE_URL="<ledgerflow-prod connection string>" npm run stripe:setup   # production database
```

Both databases can share the same test-mode Stripe account: the script finds the existing products by lookup key and only writes their ids into the database it is pointed at.

**Webhooks locally:** in a separate terminal, `cd server && npm run stripe:listen`. It prints `Your webhook signing secret is whsec_…`: put that in `server/.env` as `STRIPE_WEBHOOK_SECRET` and restart the API. Keep it running while you test payments; each delivery shows up as `--> event` / `<-- [200]`.

**Webhooks in production** (after the API is deployed):

1. Stripe Dashboard → **Developers → Webhooks** → **Add endpoint**.
2. Endpoint URL: `https://<your-api>.vercel.app/api/v1/webhooks/stripe`.
3. Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.trial_will_end`.
4. Open the endpoint → **Signing secret** → reveal → set it as `STRIPE_WEBHOOK_SECRET` on the API's Vercel project and redeploy. This is a different secret from the one `stripe listen` prints.

## 2. API on Vercel

1. [vercel.com](https://vercel.com) → sign in with GitHub → **Add New → Project** → import `Multi-Tenant-SaaS`.
2. **Root Directory:** `server`. The framework should be detected as **Express**. Leave the build and output settings alone; `server/vercel.json` sets them.
3. **Environment Variables:**

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | the `ledgerflow-prod` string from step 1 |
   | `CLIENT_URL` | `https://placeholder.vercel.app` for now (fixed in step 5) |
   | `JWT_ACCESS_SECRET` | secret #1 |
   | `JWT_REFRESH_SECRET` | secret #2 |
   | `CRON_SECRET` | secret #3 |
   | `ENABLE_JOBS` | `false` |
   | `BCRYPT_SALT_ROUNDS` | `12` |
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `465` |
   | `SMTP_USER` | the app's Gmail address (see "Production email" above) |
   | `SMTP_PASS` | its 16-letter App Password, without spaces |
   | `MAIL_FROM` | `LedgerFlow <that same Gmail address>` |
   | `STRIPE_SECRET_KEY` | your Stripe test-mode secret key (`sk_test_…`) |
   | `STRIPE_WEBHOOK_SECRET` | the production webhook endpoint's signing secret (see "Webhooks in production") |

4. **Deploy.** When it finishes, open `https://<your-api>.vercel.app/health`. It should show `{"status":"ok","db":"ok"}`.
5. **Settings → Git → Production Branch:** make sure it's `main`. If your GitHub default branch is `development`, Vercel picks that, and `vercel.json` would then skip every deploy.
6. **Settings → Functions → Function Region:** pick the region closest to your database's region from step 1. A distant region adds a delay to every database query.

## 3. Website on Vercel

1. **Add New → Project** → import the **same repository again**.
2. **Root Directory:** `client`. The framework is detected as Next.js.
3. **Environment Variables:**

   | Name | Value |
   | --- | --- |
   | `API_URL` | `https://<your-api>.vercel.app`, with no trailing slash |
   | `NEXT_PUBLIC_APP_NAME` | `LedgerFlow` |

4. **Deploy.** Then **Settings → Git → Production Branch** = `main`, as in step 2.5.

`API_URL` is read when the website is built. If you change it later, redeploy the website.

## 4. Connect the two

API project → **Settings → Environment Variables** → set `CLIENT_URL` to the website URL (e.g. `https://ledgerflow-xyz.vercel.app`) → **Deployments → ⋯ → Redeploy**. Invitation emails link to this URL.

## 5. Turn on the scheduled jobs

GitHub repository → **Settings → Secrets and variables → Actions**:

- **Variables** tab → New variable: `API_BASE_URL` = `https://<your-api>.vercel.app`
- **Secrets** tab → New secret: `CRON_SECRET` = secret #3 (the same value as in step 2)

Then **Actions → Scheduled jobs → Run workflow**. The run should be green. Every 10 minutes it runs `send-emails`, `retry-webhooks`, `report-usage` and `usage-rollup`; once a day (03:15 UTC) `reconcile-stripe`, `cleanup`, `roll-free-periods`, `verify-usage-counters` and `mrr-snapshot`.

## 6. Check the live site

- [ ] `https://<api>/health` → `{"status":"ok","db":"ok"}`
- [ ] Register on the website → "Check your inbox" → the verification email arrives (check Spam the first time) → its link logs you in to your organization's dashboard
- [ ] Reload the page → still logged in (the refresh cookie works through the rewrite)
- [ ] Invite someone → the invitation arrives in their real inbox within a few seconds
- [ ] Log out → **Forgot password?** → the reset email arrives → the new password works
- [ ] API project → **Logs**: each request line starts with an IP address. It should be **your** IP (look it up on any "what is my IP" site). If every request shows the same Vercel address instead, set `TRUST_PROXY=2` on the API project and redeploy. The login rate limit relies on this.

## Staying within the free limits

| Service | Free limit | How LedgerFlow stays inside it |
| --- | --- | --- |
| Vercel Hobby | Personal, non-commercial projects | A portfolio fits |
| Vercel Cron (Hobby) | Once a day per job, ±59 min | Not used for frequent jobs; GitHub Actions calls them instead |
| Prisma Postgres | 200K operations/month (whole workspace, dev included) | The 10-minute run (emails, webhook retries, usage reporting, usage rollup) costs about 5 queries when there is nothing to do, about 22K a month. Check **Usage** in the console now and then |
| GitHub Actions | Unlimited for public repositories | Keep the repository public. Private repos get 2,000 free minutes/month, and this schedule alone would use them |
| Gmail SMTP | About 500 emails/day | Verification, password-reset and invitation emails, plus payment emails later. Link emails are rate-limited (3 per 15 min per IP, one per minute per account) |

GitHub pauses scheduled workflows in repositories with no activity for 60 days. Any push turns them back on.

## Releasing

```text
feature branch ──PR──► development ──PR "Release: …"──► main ──► Vercel deploys API + website
```

Migrations run automatically when the API deploys (`npm run db:deploy` in `server/vercel.json`).
