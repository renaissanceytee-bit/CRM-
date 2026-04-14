# Step 3: Launch Runbook (Service Mafia)

_Last updated: 2026-04-14_

## 1. Pre-Launch (T-60 to T-15)

- Confirm prod environment variables are loaded.
- Verify database backup exists and restore command is known.
- Start app and verify health endpoint.
- Run smoke and e2e test suites.

Commands:

```bash
npm start
curl -sS http://localhost:8080/api/health
node browser-tests.js
npx playwright test
```

## 2. Launch Window (T-0)

- Deploy release build.
- Validate these live flows in order:
  1. Sign in
  2. Forgot password reset
  3. Owner onboarding email verification
  4. Employee onboarding email verification
  5. Affiliate signup email verification
  6. Core dashboard load and page navigation
- Confirm PWA install flow works on mobile browser.

## 3. Immediate Post-Launch (T+15 to T+120)

- Monitor server logs for auth, verification, and payment errors.
- Verify no spike in failed login/reset requests.
- Confirm notification/email queue stability.
- Watch support inbox for first-user issues.

## 4. Rollback Criteria

Rollback immediately if any occur:

- Auth endpoint instability or repeated login failures
- Verification code flow failing for new signups
- Data corruption or severe booking/save failures
- Health endpoint degraded repeatedly

## 5. Rollback Actions

- Redeploy previous stable build.
- Restore database from latest backup if needed.
- Re-run health and smoke checks.
- Publish incident note and ETA for relaunch.

## 6. Final Signoff Template

- Health: PASS/FAIL
- Auth login: PASS/FAIL
- Password reset: PASS/FAIL
- Verification flows: PASS/FAIL
- Smoke tests: PASS/FAIL
- E2E tests: PASS/FAIL
- Decision: GO / NO-GO
- Approved by: __________________
- Time: __________________
