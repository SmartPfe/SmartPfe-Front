# Application security hardening — current status

Implemented locally on 10 October 2026. Administrator MFA was deliberately excluded.
No `.github` workflows were changed. Live deployment status must be checked separately.
This document supersedes the implementation statuses in the earlier reviews.

| Step | Result |
| --- | --- |
| Contact spam | Five attempts per IP per 15 minutes; 16 KB body limit before parsing; existing field limits remain. |
| Browser protections | Frontend nginx adds HSTS, anti-framing, no-sniff, no-referrer and an enforced policy restricting frames/objects/base URLs. Script restrictions start in report-only mode. Backend uses Helmet without forcing HTTPS on local development. |
| Diagram safety | DOMPurify SVG profile strips executable attributes, scripts, foreign HTML, diagram links, external images/references, animations and URL-bearing styles; geometry and ordinary styles survive. |
| AI dependencies | Migrated from `@xenova/transformers` to `@huggingface/transformers` 4.x; retained the same multilingual MiniLM model, mean pooling, normalization and 384 dimensions with q8 CPU inference. Production dependency audits now report zero findings in both repos. |
| Session cancellation | Per-account session version checked against every authenticated request. Password reset cancels old tokens; password change cancels them and returns a replacement for the current device. Account settings includes EN/FR “Sign out everywhere,” including Google accounts. Existing pre-migration tokens remain valid until their account session version changes or they expire. |
| Notification credentials | Fetch-based SSE uses the Authorization header. URL tokens are rejected. Connections re-check revocation/expiry every 30 seconds; normal polling remains as fallback. Existing open streams can remain connected for up to 30 seconds after revocation. |
| Audio resource protection | Actual container bytes determine MIME type before credits are reserved. Unknown/truncated formats are rejected. One concurrent audio job per account and four per backend process, before buffering; existing 40 MB upload and database-backed two-AI-request limits remain. An aborted audio response does not release capacity until its processing finishes. |

Authentication JSON bodies now also have a 16 KB limit before the larger document
parser. Security feedback and new session controls have matching English/French text.
Fixed an account-settings response mismatch so updated profile data and replacement
tokens are stored correctly.

## Validation

- 82 frontend tests, 73 backend tests, TypeScript check and production build pass.
- Regression cases cover admin permissions, old-token rejection after reset/change/
  logout-all, authenticated SSE and URL-token rejection, contact limits, disguised
  audio, upload capacity on abort, and SVG attack samples.
- Actual model inference produced finite unit-normalized 384-dimensional vectors
  for English, French and Arabic. Same-meaning example cosine similarities were
  0.960 (English/French) and 0.948 (English/Arabic). This is a smoke check, not a
  full retrieval-quality benchmark against the real database.
- Existing local student session visibly received live notifications and showed
  the new session controls; no real password/reset/logout action was performed.
- Nginx header configuration was inspected but not exercised in a running Docker
  container here. Vite development responses do not use the nginx configuration.
  Verify the built application's headers after deployment; the outer gateway may
  override them. Report-only script policy is intentionally not a full script ban.
- Upload validation recognizes a supported container; it is not a complete media
  decoder or malware scan. WebM/MP4 containers can contain video tracks.
- Rate-limit and upload counters are process-local. Proxy visitor-IP handling and
  multi-instance deployment still need operator verification; pipelines were untouched.
- Production audits exclude development tools. Backend dev-only nodemon/chokidar/
  braces advisories remain; they are not installed by the production Dockerfile.
- Existing unrelated RAG experiments and `reportStudioRagService.js` edits were preserved.

## Follow-up: three additional findings fixed

| Concern | Implemented behavior |
| --- | --- |
| Google account linking | Matching emails never link/sign into an existing account. Login returns a clear EN/FR instruction to sign in normally and connect Google in Account & Security. The protected connection endpoint verifies the current password, the signed Google token, audience, verified email and matching account email; a conditional database update and unique Google subject prevent replacement/cross-account races. Existing account IDs, role, password, name, projects and credits are retained. Connecting rotates sessions and returns a replacement token. Linked login uses Google's immutable subject. New Gmail/Workspace identities create students only; external-email identities must verify their mailbox through SmartPFE before receiving a session. |
| Password consistency | Registration, password reset, password change and model validation enforce at least 15 Unicode characters and at most 72 UTF-8 bytes. EN/FR forms use the same rule; long passphrases work without mandatory uppercase/digit mixtures. The upper limit prevents bcrypt silently truncating secrets. Existing shorter passwords remain valid for login and current-password confirmation. Connected accounts with a native password retain their password controls. |
| Aborted AI requests | Socket closure alone never refunds normal jobs or releases their database concurrency slot. Success still settles after disconnect; actual failure refunds after processing ends. Streaming settles before exposing its first generated text and retains the slot until the provider attempt stops. Closing a stream signals cancellation; no refund happens in the close handler. Empty streams refund; partial text followed by cancellation/error remains charged. The provider reader awaits accounting callbacks, propagates their errors, cancels its reader and avoids fallback after cancellation or partial output. |

Live jobs renew their database lock/reservation leases once per minute independently
of the HTTP socket. Stale automatic recovery applies only to incomplete admission
records; a started reservation with an uncertain outcome is retained for review.
Successful generation is marked before settlement, so an accounting failure does
not trigger a refund or expose free output. Request finalization is shared and
runs once, including the streaming and middleware paths. Normal provider calls
may continue after the user disconnects; their server outcome determines charging.

The task dock now says “Stop waiting” and explains that stopping the wait does not
guarantee a refund. Terms credit descriptions reflect successful/partial-stream
charging. No credit prices, free-use allowances or purchase flow were changed.

Validation includes a real local HTTP disconnect, partial-stream cancellation,
cancellation before provider work, delayed callback settlement, accounting-write
failure, credit/free-quota persistence, Google email collisions for both roles,
current-password proof, changed Google email, external mailbox verification,
old-token revocation, native login/password controls after linking, and Unicode/
bcrypt-boundary validation. Google tokens and database operations were controlled
fixtures; no real account was linked or altered and no live exploit was attempted.
The running public signup page was visually checked. Local Google linking still
needs a user-driven end-to-end check with their real Google account.

### Google account management follow-up

The account card displays one connection badge, explicitly explains direct Google
sign-in and shows the name/email obtained from a verified Google identity. Existing
links without these details are refreshed on the next Google sign-in. Disconnect
requires an authenticated session and current SmartPFE password, removes the link
and stored Google profile, and revokes previous sessions while issuing a replacement
for the current device. Google-only accounts must first set a password using the
existing email reset flow to retain a sign-in method. Conditional database updates
prevent concurrent link changes from restoring a disconnected identity.

Tests cover missing sessions, structured/wrong passwords, Google-only lockout
protection, account preservation, session revocation and concurrent changes. The
EN/FR card, light/dark themes, wrong-password feedback and successful disconnect
were checked in an isolated browser preview using a simulated account.

### Operational limit requiring a separate follow-up

If the backend crashes or accounting storage fails mid-generation, a reserved
charge can remain unresolved. It is deliberately retained rather than refunded
without knowing whether generated output was already used. A durable job ledger
and idempotent reconciliation would automate safe recovery; that broader recovery
feature is not part of this patch. Financial changes still span several database
documents rather than one transactional job/ledger operation. Review unresolved
reserved records with support until that workflow exists.

Reference guidance:
[Google ID-token verification and account-linking guidance](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token),
[NIST password-length guidance](https://www.nist.gov/cybersecurity-and-privacy/how-do-i-create-good-password).
