# SmartPFE legal pages — launch review

Prepared 2026-10-10. Public routes: `/terms` and `/privacy`.

These are bilingual **drafts**, not finalized production policies. The visible
draft notice and section-level pending items are intentional. Do not remove them
or add an effective date until the missing operating facts and policies are
confirmed. No legal compliance certification is implied.

## Confirmed by the owner

- Operator name: Bee Coders.
- Country: Tunisia.
- Public contact for these pages: contact@9antra.tn.
- Registered legal identity and business address were not supplied.

## Source-backed implementation facts

| Topic | Source inspected | Finding |
| --- | --- | --- |
| Account | `src/models/User.js` and `src/controllers/authController.js` in backend | Name, email, hashed password, Google ID/avatar, verification/recovery state, role and UI language. |
| Projects | Backend `src/models/Project.js`; frontend/backend documentation | Project context and saved deliverables, reports, slides, speeches, jury feedback and Q&A transcripts. |
| AI | Backend `src/services/geminiService.js`, prompt builders and Gemini jury service | Relevant project context/instructions go to Gemini. RAG examples can be included. `openRouterService.js` is a compatibility bridge, not evidence of a separate active OpenRouter provider. |
| Audio | Backend `src/routes/aiRoutes.js`, `jurySimulationService.js`, `juryQAService.js` | Memory uploads sent to Gemini; project persistence stores analysis/metadata and Q&A transcripts, not raw audio. Provider retention remains separate and unconfirmed. |
| Tracing | Backend `src/services/observabilityService.js`, `geminiService.js` | Optional Langfuse tracing, configured through environment keys; can contain email/name/IDs, prompts and responses. Production enablement and destination not confirmed. |
| Credits | Backend `CreditPurchaseRequest.js`, credit services; both documentation.md files | Phone/contact details and purchase records; payment arranged externally and verified by team; AI reservation rollback differs from a monetary refund. |
| Admin | Backend `src/controllers/adminController.js` and credit request services | Account details, project basics/description/technical context, purchase and wallet information accessible to authorized admins. |
| Contact/email | Backend contact controller and email service | Contact form content goes to configured inbox. SMTP configuration is not evidence of the final production email provider. |
| Browser | Frontend auth, onboarding, theme and UI language contexts | Local token/user/preferences/drafts/pinned tools; pending verification email in session storage. Clearing local data does not erase server data. |
| External resources | Frontend `index.html`, `src/index.css` | Google Fonts, Google Identity SDK and PlantUML library from unpkg load externally. No claim of zero cookies or zero tracking is made. |
| Deletion/retention | Auth routes/account UI, models and service review | No self-service account deletion or complete automatic retention schedule established. Manual request process needs definition. |

Existing unrelated backend RAG/evaluation modifications were preserved. No
production secrets were read or copied into the legal pages. No account,
payment, credit or project records were changed.

## Decisions needed from Bee Coders

1. Registered entity/person name, business address, public production domain,
   effective date and countries served.
2. Minimum age and enforcement. Google's Gemini API terms restrict API clients
   directed towards or likely to be accessed by under-18s; do not assume parental
   permission alone resolves this restriction.
3. Paid credit offer, taxes/payment methods, expiry/validity, cancellations and
   monetary refunds. Landing currently advertises `19 DT / month` Premium while
   the implemented flow handles credits; reconcile before publishing final terms.
4. Production hosting/database/email providers, processing countries, Gemini
   billing tier and whether Langfuse will be enabled. Check logs and tracing for
   personal/project data and define redaction and retention.
5. Retention/deletion schedule for accounts, projects, payment records, mail,
   diagnostics, traces and backups; verified request workflow and response times.
6. Applicable legal grounds, rights/complaint process, Tunisian INPDP formalities
   and international-transfer requirements. Confirm applicability with qualified
   Tunisian advice rather than asserting approval or compliance.
7. Account closure/suspension procedure, access to saved work, treatment of
   unused purchased credits, liability/warranty and dispute provisions.
8. Deployed-site cookie/storage/network audit and any required consent mechanism.
9. Terms acceptance/version history for email and Google signup, and notification
   of material changes. This change only adds pages and links; it does not collect
   or store acceptance. Signup says “read” while policies remain drafts; final
   acceptance wording and recording need a deliberate implementation.
10. Review rights/permissions for the offline RAG reference reports separately;
    their presence in the knowledge base is not proof of licensing permission.

## Research references

Structure and topics were informed by original-provider examples, without
copying their company-specific commitments:

- [Overleaf legal pages](https://www.overleaf.com/legal): account obligations,
  content permissions, AI limitations, paid service terms and privacy topics.
- [Notion personal-use terms](https://www.notion.so/notion/Personal-Use-Terms-of-Service-00e4e5d0f2b9411cbee6493f15779500)
  and [AI terms](https://www.notion.so/Notion-AI-Supplementary-Terms-fa9034c8b5a04818a6baf3eac2adddbb):
  user content and AI input/output responsibilities. Search excerpts were available;
  the Notion privacy page could not be fetched reliably, so its terms are not
  treated as evidence about SmartPFE data practices.
- [Google Gemini API terms](https://ai.google.dev/gemini-api/terms): paid/unpaid
  data-use distinction, age restrictions and regional requirements. Confirm the
  exact production account terms before promising no model training.
- [Tunisian Law 2004-63 — official ministry copy](https://www.mtc.gov.tn/fileadmin/texte_juridiques/L2004-0063.pdf)
  and [INPDP transfer guidance](https://www.inpdp.tn/bos.pdf): review declaration,
  authorization and cross-border-transfer requirements. These sources do not
  establish that Bee Coders has completed any required formalities.

## Implementation

`src/pages/Legal.tsx` shares the layout; `src/locales/en/legal.json` and
`src/locales/fr/legal.json` contain all copy. The `legal` namespace is registered
in the existing i18next engine, independent of project generation language.
Pages are public and linked from landing/auth footers. Signup links open in a
new tab so existing form input is retained. No backend behavior changed.

## Verification

- Existing 64 interface-language tests pass, including dictionary key and
  interpolation parity across the new namespace.
- TypeScript and production build pass; existing large-bundle warning remains.
- Live English and French page rendering, document navigation, section anchor
  targets, signup new-tab links and landing footer destinations checked.
- Desktop screenshots inspected. A narrow-browser check rendered at a measured
  288 CSS-pixel content width despite a requested 390px viewport override;
  both documents had no page-width overflow. This is a narrow layout check,
  not a claim of an exact 390px device test. Temporary viewport override reset.
- Preview saved in the chat workspace at
  `runtime-logs/legal-privacy-preview.jpg`.
- Graphify refreshed code-only, with no model calls.
- No commit, push or deployment performed.
