# SmartPFE — Project Overview & Architecture Guide

> **Quick Context for AI Agents**: Read this file to instantly understand the entire SmartPFE application, its domain, module workflows, and technical stack without re-explaining the basics.

---

## 🎯 1. What is SmartPFE?
**SmartPFE** (PFE Mentor) is an AI-powered SaaS platform designed to assist university engineering and computer science students throughout their **End-of-Studies Projects (PFE — Projet de Fin d'Études)**. It guides students from initial problem formulation and UML modeling to full report writing and defense preparation.

---

## 🏗️ 2. Core Modules & End-to-End Workflow

The platform is structured into synchronized workspace modules:

1. **Project Setup & Context**:
   - Captures Title, Domain, University, Academic Year, Problem Statement, Objectives, Tech Stack, Methodology (e.g. Scrum), and Actors/Personas.
2. **Requirements Engineering (Backlog)**:
   - Functional (RF-xx) & Non-Functional (RNF-xx) requirements with priorities, descriptions, and actor mappings.
3. **State of the Art (SOTA / Existing Solutions)**:
   - Comparative matrix of existing market tools, their weaknesses, and project differentiation.
4. **UML Preparation & Modeling**:
   - Generates and refines UML entities (Actors, Use Cases, Class Diagrams, Sequence Diagrams).
   - Diagram rendering is done client-side using PlantUML (`plantuml-encoder` $\rightarrow$ SVG/PNG).
5. **Report Structure (Table of Contents)**:
   - Generates a compliant 5–8 chapter university thesis outline conforming to engineering school standards.
   - Enhanced with Corrective RAG (CRAG) over a database of real PFE theses.
6. **Report Builder (Report Studio)**:
   - Section-by-section academic report editor (HTML/Markdown) with two AI interaction scopes:
     - **Full-Section Generation / Enrichment**: Powered by Section-level CRAG for literature grounding.
     - **Floating Selection Dock**: Instant (~2s) in-place text transformation (Expand, Simplify, Academic Tone, Translate).
   - Generates the final compiled thesis report (HTML, Markdown, LaTeX).
7. **Pitch & Defense Simulator**:
   - Generates presentation slides, timed defense speech scripts, and jury Q&A simulation.

---

## 💻 3. Technology Stack & Key Libraries

### Frontend (`SmartPfe-Front`)
- **Core**: React 18, Vite, TypeScript.
- **Styling**: Tailwind CSS, Lucide React icons, modern dark/light card-based executive UI.
- **State & Data**: Modular custom hooks per page (`useReportStudio.ts`, `useUmlPreparation.ts`, etc.) connecting to Axios API endpoints.
- **Rendering**: Client-side PlantUML renderer component (`PlantUmlRenderer.tsx`).

### Backend (`SmartPfe-Backend`)
- **Runtime & Server**: Node.js, Express (REST API).
- **Database**: MongoDB Atlas via Mongoose.
  - Core collections: `projects` (unified project document containing all modules), `users`, `pfe_chunks` (3,092 indexed thesis chunks for vector search).
- **AI Engine**: Google Gemini API (`geminiService.js`) with task-tiered routing (`reasoning`, `default`, `fast`) and automatic multi-model fallback chain.
- **RAG & Search**:
  - Native MongoDB Atlas `$vectorSearch` (`pfe_chunks_vector_index`, 384 dimensions).
  - Python bridge script (`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`) for dense embeddings.
  - Native Corrective RAG (CRAG) loop with relevance grading and single-retry query rewriting.

---

## 🔑 4. Architecture & Coding Conventions

- **Unified Project Model**: Most module data lives inside the student's single `Project` document in MongoDB under dedicated fields (`technicalContext`, `functionalRequirements`, `umlPreparation`, `reportStructure`, `reportChapters`, `finalReport`).
- **Prompt Builders**: AI prompt assembly is modularized into dedicated builders (`reportStudioPromptBuilder.js`, `reportStructurePromptBuilder.js`, `umlPreparationPromptBuilder.js`).
- **Bilingual Support**: All AI generations strictly respect the student's selected language (`French` or `English`).
- **Resilient AI Parsing**: AI responses are validated and sanitized via JSON extraction helpers with fallback schema normalizers.

---

## 💳 5. Credit Economy & Admin Refresh (Implemented September 2026)

### Current implementation status

- Implemented on branch `feature/credit-system-admin-refresh` in both repositories without modifying `main` directly. The changes are currently uncommitted for review.
- Verification completed: backend credit tests 5/5, frontend TypeScript validation, frontend production build, and Git diff checks all pass.

### Product rules and default economy

- Verified users receive **110 promotional welcome credits** exactly once. The daily allowance refills promotional credits **up to 20** once per day (`Africa/Tunis` by default); it is not an unconditional +20, and purchased credits are unaffected.
- Promotional credits are spent before purchased credits. The server stores both buckets independently and exposes their combined total.
- Runtime prices and limits are persisted in MongoDB and editable in Admin; defaults live in backend `src/config/creditDefaults.js`.

| Policy key | Cost | Notes |
| --- | ---: | --- |
| Foundation generation/refinement | 5 | Problem statement, actors, existing solutions, functional/non-functional requirements, backlog and UML |
| `report_structure` | 12 | CRAG-assisted outline |
| `report_section` | 10 | Same cost for every output length |
| `report_polish_light` | 0 | Context-free; 5/minute, 20/day |
| `report_polish_contextual` | 2 | First 2/day free; 4/minute, 20/day |
| `final_report_compile` | 0 | 1/minute, 2/day; cached where possible |
| `presentation_full` / `presentation_slide` | 8 / 2 | Full deck / one slide |
| `pitch_full` / `pitch_slide` | 6 / 2 | Full pitch / one slide speech |
| `jury_simulation` | 20 | Context, defense assets and recording analysis |
| `jury_qa_session` | 10 | One charge covers question generation and response analysis |
| `translation` | 0 | 5/minute, 30/day |

### Security and backend contract

- Backend `creditService.js` is authoritative. `creditMiddleware.js` runs reserve → AI execution → settle, refunds failures/disconnects, and recovers reservations older than 15 minutes.
- The browser sends idempotency and `X-Credit-Policy-Version` headers, but never supplies the trusted price. Reused keys, changed policies, insufficient funds and unregistered actions fail safely.
- MongoDB atomic updates prevent negative balances. `AiConcurrencyLock` limits users to two simultaneous AI requests. Transactions, admin adjustments and configuration changes are audited; adjustment reasons are mandatory.
- User API: `GET /api/credits/me`, `/catalog`, and `/transactions`. Admin API: `/api/admin/credits/economy`, policy/settings patch routes, per-user adjustment, and per-user history.
- Enforcement supports `off`, `shadow`, and `enforce`; production should normally use `enforce`.

### Frontend integration and UI conventions

- `src/context/CreditContext.tsx` owns wallet, catalog and transaction state. `src/lib/api.ts` registers policy versions, adds request headers and emits `smartpfe:credits-updated` after relevant responses.
- Credit UI primitives are in `src/components/credits/`; the standard coin artwork is in `src/assets/`. Reuse it rather than creating another credit icon.
- Keep prices compact: coin plus number (for example, coin + `5`). Do not bloat AI button text with phrases such as “Generate · 5 credits.” Alerts and insufficient-balance messages must stay short and match the app theme.
- Balance/activity appear in the top bar and Account Settings. The refreshed Admin UI matches the student frontend; `/admin/credits` controls the economy, and Admin Users supports wallet adjustments and ledger history.
- `AdminLayout` owns admin navigation so back/navigation actions remain inside the admin area instead of leaking into the student workspace.
- Workflow prerequisites remain content-driven. Credits price an action but do not bypass the existing foundation → report structure → report/presentation/pitch → jury flow.

### Future-agent guardrails

- Treat policy keys as stable shared identifiers. Every new AI endpoint must be mapped to an explicit backend policy/gate; unknown actions intentionally fail closed.
- Preserve idempotency, refunds, policy-version conflicts, audit reasons, limits, separate balance buckets, and server-authoritative pricing.
- Payments/top-up purchasing are not implemented yet; purchased credits can currently be populated through audited admin adjustments only.
- Before production rollout, review settings in Admin, confirm enforcement mode, and smoke-test using the production-like MongoDB environment.
