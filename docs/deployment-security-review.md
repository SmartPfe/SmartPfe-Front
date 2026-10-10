# Deployment security review — 10 October 2026

Later local implementation status:
[Current security hardening status](security-hardening-status.md).

Target: https://pfeguide.tn

This updates the [local access-control review](access-control-review.md) with
deployment evidence. Checks were low-volume public GET/HEAD requests and local
source inspection, around 17:17–17:18 UTC. No production login, writes,
password guessing, load testing, or exploit payloads were used. Nothing was pushed
or deployed. This is not a penetration test or security certification.

## What we can now confirm

| Finding | Evidence and meaning |
| --- | --- |
| HTTPS works | HTTPS root returns 200 with normal certificate verification; HTTP root redirects to HTTPS with 301. This covers the tested URL, not every possible hostname or TLS setting. |
| Anonymous API requests are denied | `/api/admin/users` and `/api/projects/my-project` return 401 without a token. This does not prove all authenticated role/ownership paths are correct in the older live build. |
| A backend exists behind the same domain | `/api/health` responds with the application health JSON. Browser build uses `/api`; no separate API hostname is needed for normal use. |
| The live frontend is older than local work | Public HTML still defaults to English and contains an older asset name. The new local security changes are uncommitted and have not been released. |
| Deployment mechanism is visible | Both release workflows build commit-tagged Docker images in GHCR, SSH to a host held in GitHub secrets, then run Docker Compose in `/opt/apps/pfeguidance`. Host address, actual Compose configuration and environment values are not in the inspected files. |
| Some pipeline safeguards already exist | Releases require successful CI from a main-branch push, use the triggering commit SHA, and include basic health checks and attempted rollback. Backend Docker runs as the `node` user and sets production mode. Docker contexts exclude `.env` files. |
| Narrow public secret-pattern check found none | The downloaded public JavaScript contained no standard Google API-key pattern or private-key header. This is not a comprehensive secret scan. |
| An unrelated browser origin is rejected | A GET to health with `Origin: https://example.invalid` returned a CORS error, without permission for that origin. CORS is a browser rule, not a replacement for API authentication. The current error is 500 instead of a deliberate 403. |

## Newly confirmed gaps

| Priority | Concern in simple terms | Where to address it |
| --- | --- | --- |
| Before launch | CI does not run the app tests. Frontend runs TypeScript/build; backend checks JavaScript syntax/build. A broken permission test could still reach deployment. | Add `npm run test:i18n` to frontend CI and `npm test` to backend CI. Consider a separate dependency/container vulnerability gate with an explicit policy. |
| Before launch | Browser protection headers are missing on the tested live root and API responses: HSTS, CSP, frame protection, `X-Content-Type-Options`, and Referrer-Policy. HTTPS redirect is good but does not provide all these protections. | Set appropriate headers at the public gateway/container. HSTS belongs at HTTPS termination; deploy CSP in report-only mode first and verify Google sign-in, diagrams and exports. |
| Before releasing the limiter | The app now defaults to not trusting forwarded visitor IPs. Behind the real gateway, all users might appear as the gateway IP and share the same 30-attempt limit. Blindly trusting arbitrary forwarded IPs creates the opposite problem: spoofing and bypass. | Supervisor must confirm the trusted proxy topology and correct TRUST_PROXY setting. Test that real client IPs differ and client-supplied forwarding headers cannot override them. |
| Before launch | Public contact form has no app-level rate limiter. Its handler sends email, so bots could flood the inbox or exhaust email capacity. | Add a contact-specific app/gateway limit and test normal contact submissions. A hosting limit may already exist, but cannot be established from source. |
| Hardening | Both release workflows discover the SSH host key with `ssh-keyscan` at deployment time, rather than verifying a previously approved server key. | Supervisor supplies a verified SSH host fingerprint/known_hosts entry to the workflow. |
| Hardening | Release workflows have no explicit deployment concurrency rule. Two overlapping releases could finish out of order, leaving an older version running. Frontend/backend deploy separately. | Serialize deployments and coordinate compatible frontend/backend releases; confirm the version actually running after each release. |
| Hardening | GitHub Actions use movable version tags such as `@v4`, rather than exact action commit hashes. | Pin reviewed action commits and automate update review. |
| Lower priority | Responses advertise nginx version and Express. | Disable unnecessary version/framework headers. This is information disclosure, not evidence of a takeover. |

Public HTML also loads PlantUML JavaScript from unpkg without an integrity hash.
The local SVG renderer inserts the library's rendered SVG directly into the DOM.
This warrants a focused review of diagram sanitization, links and external script
trust. An exploitable XSS vulnerability has **not** been demonstrated by these checks.

## Previous concerns, revised

| Earlier concern | Updated status |
| --- | --- |
| Students reaching admin APIs | Local API regression tests deny students on all 12 admin read/write endpoints, including a misleading signed role claim. Live anonymous checks also deny access. Live authenticated checks still require designated test accounts after deployment. |
| Completed users opening onboarding | Fixed and verified locally: redirect to project specifications; API prevents repeat creation. Not yet deployed. |
| Admins opening student screens | Fixed locally at frontend and project/AI API levels. Admins keep their own admin UI and shared profile/notification services. Not yet deployed. |
| Authentication input and profile exposure | Local code rejects structured credentials and removes reset/verification secrets from profile responses. Not yet deployed. |
| Dependency warnings | Latest local production audits: frontend 0; backend 2 high findings in the legacy Transformers/Sharp chain. Live image versions were not established. A supported migration and RAG compatibility tests remain necessary. |
| Revocable login sessions | Still outstanding: password reset does not cancel already-issued JWTs; tokens last 30 days. Add server-side revocation/session management. |
| Administrator second-factor authentication | Still outstanding. A stolen admin password should not be enough to enter the backoffice. |
| Shared rate limits | App counters are in memory. Compose suggests container deployment but does not prove instance count. A shared store/gateway policy is needed if there are multiple backend instances; restart resets remain relevant even with one instance. |
| Notification tokens in URLs | Still present in code. Ask supervisor whether access/error/monitoring logs record query strings; migrate away from URL credentials. |
| Database exposure, backups and server secrets | Unknown from public website and workflow files. Requires supervisor verification. Same source code does not imply identical environment, firewall, database permissions or proxy configuration. |
| Upload/resource limits | Code limits one audio upload to 40 MB and JSON bodies to 50 MB. Concurrency, content validation and gateway limits still need review; file-size limits alone do not bound total memory usage. |
| Production security testing | Still needed. Use dedicated student/admin accounts and disposable test data; confirm allowed endpoints, timing and test limits with the operator before invasive testing on the live deployment. |

## Questions the supervisor can answer without sharing secret values

1. Which server/gateway terminates HTTPS and forwards `/api`? What is the verified
   proxy topology, and what TRUST_PROXY setting should this application use?
2. Are application ports 5500/5600 and the database inaccessible directly from the
   internet, with the intended public gateway as the entry point?
3. Is JWT_SECRET strong, unique and configured in production? Please confirm this
   without sending the secret. Where are other secrets stored and rotated?
4. How many backend instances run? Are request limits enforced centrally, and do
   logs redact URL tokens and authorization headers?
5. Are backups automated, protected and restore-tested? Who receives incident alerts?
6. Which mirrored repository is intended to trigger deployment, and could both
   repositories launch overlapping deployments to the same host?
7. Can we have a staging deployment or designated production test accounts/data
   for role, account-recovery and ownership verification after release?

Knowing the URL is not an access control. The site is publicly reachable now;
scanners can discover public services before a launch announcement.

References:
- [OWASP HTTP security headers](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)
- [OWASP content security policy](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [GitHub Actions secure-use guidance](https://docs.github.com/en/actions/reference/security/secure-use)
