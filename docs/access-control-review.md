# Access control review — 10 October 2026

For the latest implemented protections and remaining findings, see
[Current security hardening status](security-hardening-status.md).

Updated hosting evidence and refined priorities:
[Deployment security review](deployment-security-review.md).

Scope: latest settings/onboarding UI commit `80bd653`, frontend navigation,
backend authorization, authentication inputs, onboarding creation, and dependency audits.
This is a focused code review and regression check, not a penetration test or a
certification that the production deployment is secure.

## Findings and changes

- Completed students could open first-time onboarding. The route now checks the
  server profile and redirects them to `/workspace/settings/onboarding`.
- Frontend role checks trusted editable localStorage. Protected routes now wait
  for `/auth/profile` and use its database-derived role; failed checks render no
  protected content. Unknown roles are denied. Administrators opening student
  routes are redirected to `/admin/dashboard`.
- Every admin API already used `protect` and `adminOnly`, with the role loaded
  from the database. Tests verify all 12 admin read/write endpoints deny students,
  including tokens with a misleading admin claim. Missing/forged tokens are denied.
- Project services query by both project ID and authenticated owner. An API
  regression verifies another student's project ID cannot return actors.
  Credit request ownership tests also continue to pass.
- Project and AI routers now require a verified student role. Admins cannot use
  these student APIs even by skipping the frontend.
- Onboarding creation previously allowed repeat project creation. It now checks
  existing projects and atomically claims the user's incomplete onboarding state
  before creation, rejecting repeats with 409. Creation failure releases the claim.
  A process crash between claim and creation still needs operational recovery;
  a MongoDB transaction/unique-owner migration is a future reliability improvement.
- Profile responses previously exposed reset/verification fields alongside user
  data. The endpoint now returns an explicit public-field allowlist.
- Public authentication POST routes now share a 30-request / 15-minute IP limit.
  Structured credential values (including MongoDB operator objects in reset tokens
  and email addresses) are rejected before controller/database queries.
- JWT signing and notification-stream verification now share the same secret
  policy as protected APIs. Production startup fails if JWT_SECRET is missing;
  validation allows only HS256. Proxy trust defaults to off instead of trusting
  one proxy automatically.
- Removed the user settings JSON export controls and download handler.

## Validation

- 76 frontend tests and 39 backend tests pass; TypeScript and production build pass.
- Live existing student session: `/onboarding/2` redirects to project specifications;
  `/admin/users` redirects to workspace overview; settings has no JSON export.
- API tests run through Express with mocked database models. They do not replace
  staging checks against the real database and deployed reverse proxy.
- Updated compatible dependencies and aligned Tiptap packages, upgraded Nodemailer
  to 10.x, and constrained transitive protobufjs to a patched 7.x release.
  Email tests use mocks; staging SMTP delivery must be checked after the upgrade.
- Production dependency audit initially: frontend 41 findings, backend 10.
  After changes: frontend 0; backend 2 high findings in
  `@xenova/transformers` / `sharp`. No critical findings remain in these audits.

## Outstanding production work

1. Resolve the legacy Transformers/Sharp advisories with a supported runtime
   migration and embedding/RAG regression checks. Do not apply the audit's suggested
   Transformers downgrade blindly. Audit counts alone do not establish exploitability.
2. Confirm HTTPS, FRONTEND_URL allowlist, database/network access, secrets, backups,
   and reverse-proxy configuration in the actual deployment. Set TRUST_PROXY only
   to the verified proxy topology; spoofed forwarded IPs must not bypass rate limits.
3. The limiter uses an in-process store. Multiple backend replicas need a shared
   limiter store or an enforced gateway limit; restarts clear the current counters.
4. Bearer sessions remain in localStorage with 30-day token lifetimes. Password
   reset does not revoke existing JWT sessions. Plan revocable sessions/short-lived
   access tokens, secure cookie handling, and administrator MFA.
5. Notification SSE still carries its token in the URL. Redact query strings in
   access logs and migrate to a transport that avoids URL credentials.
6. Review production security headers/CSP, contact and generation abuse limits,
   upload validation, payload limits (currently 50 MB), and public error disclosure.
7. Run a staging security assessment including XSS/SSRF, account recovery, abuse,
   real database ownership checks, and concurrent onboarding failures before launch.

Reference: [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
requires permission enforcement on every server request and denying access by default.
