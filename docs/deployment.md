# Deployment (free)

Everything runs on free plans, and no payment card is needed anywhere.

| Part | Where | Deploys from |
| --- | --- | --- |
| Website (`client/`) | Vercel project #1 | `main` |
| API (`server/`) | Vercel project #2 | `main` (applies database migrations on each deploy) |
| Database | Prisma Postgres, database `ledgerflow-prod` | — |
| Email | Mailtrap Sandbox (emails are caught, not delivered) | — |
| Scheduled jobs | GitHub Actions, [`scheduled-jobs.yml`](../.github/workflows/scheduled-jobs.yml) | — |

```
Browser → Website (Vercel) ──/api/* rewrite──► API (Vercel) ──► Prisma Postgres
                                                 ▲
             GitHub Actions, every 10 min ───────┘  POST /api/v1/internal/jobs/send-emails
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
   | `SMTP_HOST` | `sandbox.smtp.mailtrap.io` |
   | `SMTP_PORT` | `2525` |
   | `SMTP_USER` / `SMTP_PASS` | your Mailtrap values (the same as in `server/.env`) |

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

Then **Actions → Scheduled jobs → Run workflow**. The run should be green, and its log ends with `"job":"send-emails"`.

## 6. Check the live site

- [ ] `https://<api>/health` → `{"status":"ok","db":"ok"}`
- [ ] Register on the website → you land on your organization's dashboard
- [ ] Reload the page → still logged in (the refresh cookie works through the rewrite)
- [ ] Invite someone → the email appears in your Mailtrap inbox within a few seconds
- [ ] API project → **Logs**: each request line starts with an IP address. It should be **your** IP (look it up on any "what is my IP" site). If every request shows the same Vercel address instead, set `TRUST_PROXY=2` on the API project and redeploy. The login rate limit relies on this.

## Staying within the free limits

| Service | Free limit | How LedgerFlow stays inside it |
| --- | --- | --- |
| Vercel Hobby | Personal, non-commercial projects | A portfolio fits |
| Vercel Cron (Hobby) | Once a day per job, ±59 min | Not used for frequent jobs; GitHub Actions calls them instead |
| Prisma Postgres | 200K operations/month (whole workspace, dev included) | The 10-minute email job costs one query when nothing is queued (about 4.3K/month). Check **Usage** in the console now and then |
| GitHub Actions | Unlimited for public repositories | Keep the repository public. Private repos get 2,000 free minutes/month, and this schedule alone would use them |
| Mailtrap Sandbox | Monthly email cap | Only invitations and, later, payment emails are sent. At the cap, sending pauses; nothing is charged |

GitHub pauses scheduled workflows in repositories with no activity for 60 days. Any push turns them back on.

## Releasing

```text
feature branch ──PR──► development ──PR "Release: …"──► main ──► Vercel deploys API + website
```

Migrations run automatically when the API deploys (`npm run db:deploy` in `server/vercel.json`).
