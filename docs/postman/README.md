# Postman collection

Every endpoint of the LedgerFlow API (SRS section 10), grouped by feature, for the manual verification checklist (SRS section 19).

## Import

1. Postman → **Import** → select `LedgerFlow.postman_collection.json` and both `*.postman_environment.json` files.
2. Pick the **LedgerFlow local** (`http://localhost:5050`) or **LedgerFlow production** environment.
3. In the environment, set `email` and `password` (your account), and `cronSecret` if you want to run scheduled jobs. Leave the other values empty; requests fill them in.

## Use

- Start with **Auth → Login** (or **Demo → Demo login**), then **Users → Me**. They save `accessToken` and `orgId`, which every other request uses. The refresh cookie lives in Postman's cookie jar, so **Auth → Refresh token** works as in the browser.
- Requests save what later ones need: **API keys → Create key** saves `apiKey` (used by **Usage**), **Billing → Change plan: preview** saves `prorationDate`, **Members → List members** saves a `membershipId`, **Invitations → Invite** saves an `invitationId`.
- Tokens from emails (`emailToken`, `inviteToken`) are pasted into the environment by hand: locally they arrive in Mailtrap.
- Each request has a small test (expected status, and for example `duplicate: true` on the repeated usage report). Use **Run collection** on a folder to check it in one go.
- Stripe webhooks aren't in the collection: they need Stripe's signature. Use `npm run stripe:listen` and `stripe trigger <event>` instead.

The demo organizations refuse invitations, member changes and renaming (`403 DEMO_RESTRICTED`); use your own account for those requests.

Checked with Newman against a local API: 26 requests (a demo-owner run and a super-admin run), all assertions passing.
