# Step 2: Production Preflight Checklist (Service Mafia)

_Last run: 2026-04-14_

## Purpose

Validate that launch-critical paths work before full production rollout.

## Preflight Gates

- [ ] Environment variables set
  - `JWT_SECRET` (non-default)
  - `STRIPE_SECRET_KEY`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- [ ] Health endpoint passes
  - `GET /api/health`
- [ ] Auth path passes
  - Owner/employee login
  - Password reset flow
- [ ] Verification path passes
  - Send and verify owner signup code
  - Send and verify employee signup code
  - Send and verify affiliate signup code
- [ ] Billing path ready
  - Stripe key presence validated
- [ ] Notifications path ready
  - SMTP delivery tested
- [ ] Regression suite passes
  - `node browser-tests.js`
  - `npx playwright test`

## Current Validation Snapshot

- Health check: PASS
- Browser smoke test suite: PASS (5/5)
- Playwright e2e suite: PASS (3/3)
- App launch blockers remaining: production credentials/config only

## Go/No-Go Rule

- **GO** when all gates above are checked.
- **NO-GO** if Stripe or SMTP is missing for full production release.

## Fast Verification Commands

```bash
npm start
curl -sS http://localhost:8080/api/health
node browser-tests.js
npx playwright test
```
