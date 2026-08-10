# PFE Guidance Frontend Documentation

## 1. Repository Purpose

This repository contains the frontend application for PFE Guidance / Smart PFE. It is the user interface used by students and administrators.

The frontend is built with:

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Tiptap rich-text editor
- Lucide icons

The application helps a student build a complete final year project file step by step: onboarding, project analysis, requirements, backlog, UML preparation, report structure, report writing, presentation, pitch, and jury simulation.

## 2. How To Run The Frontend

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

By default, the app runs on:

```text
http://localhost:3000
```

Build for production:

```bash
npm run build
```

Run TypeScript verification:

```bash
npm run lint
```

In this project, `npm run lint` runs:

```bash
tsc --noEmit
```

## 3. Environment Configuration

The frontend reads environment variables through Vite. The main variables are:

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL of the backend API. If not provided, the app uses `http://localhost:5000/api`. |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID used by the Google login button. |
| `GEMINI_API_KEY` | Present from earlier AI Studio setup. The production AI calls for the app are mainly handled by the backend. |
| `APP_URL` | Public app URL when deployed. |

The frontend stores the JWT token and user object in `localStorage` after login. API requests automatically attach the token as a Bearer token through `src/lib/api.ts`.

## 4. Main Application Flow

The routing is defined in:

```text
src/App.tsx
```

There are four main route groups:

| Area | Route | Description |
| --- | --- | --- |
| Landing | `/` | Public landing page. |
| Authentication | `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password/:token` | Account access and recovery screens. |
| Onboarding | `/onboarding/*` | Student project setup wizard. |
| Workspace | `/workspace/*` | Main guided PFE work area. |
| Admin | `/admin/*` | Backoffice dashboard for admin users. |

Protected pages use:

```text
src/components/ProtectedRoute.tsx
```

This component checks the logged-in user and can also restrict pages by role, for example the admin area.

## 5. Onboarding

The onboarding process collects the base project information required by the rest of the platform.

Main files:

```text
src/pages/onboarding/ProjectBasics.tsx
src/pages/onboarding/ProjectDescription.tsx
src/pages/onboarding/TechnicalContext.tsx
src/pages/onboarding/SummaryReview.tsx
src/context/OnboardingContext.tsx
src/types/onboarding.ts
```

The steps are:

1. Project basics: title, type, domain, language, university, academic year.
2. Project description: problem statement, objective, company, stakeholders, deliverables.
3. Technical context: development type, methodology, technologies, target users, duration, team size.
4. Summary review: final check before saving the project.

The onboarding context:

- Loads an existing project from `/projects/my-project` when possible.
- Saves draft data to `localStorage` per user.
- Normalizes custom technical values so custom development types and technologies become real selected values.
- Sends the final onboarding payload to the backend using `/projects/onboarding`.

## 6. Workspace Workflow

The workspace is the main student experience. Its layout is managed by:

```text
src/layouts/WorkspaceLayout.tsx
src/components/layout/Sidebar.tsx
src/components/layout/Topbar.tsx
src/context/WorkflowContext.tsx
```

`WorkflowContext` loads the current project and evaluates the state of each step. Steps can be:

- `Locked`
- `Available`
- `Completed`

The workflow is mostly sequential until the report structure is finished. After the report structure is ready, the student can work on:

- Report Builder
- Presentation
- Pitch

Jury simulation unlocks after both presentation and pitch content exist.

Workspace pages:

| Page | Route | Purpose |
| --- | --- | --- |
| Overview | `/workspace/overview` | Project summary and progress. |
| Problem Statement | `/workspace/problem-statement` | Write, generate, refine, and translate the problem statement. |
| Actors | `/workspace/actors` | Define system actors. |
| Existing Solutions | `/workspace/solutions` | Analyze competitors or existing systems. |
| Functional Requirements | `/workspace/functional-requirements` | Define functional requirements. |
| Non-functional Requirements | `/workspace/non-functional-requirements` | Define quality constraints such as security and performance. |
| Product Backlog | `/workspace/backlog` | Build user stories, priorities, durations, sprints, and notes. |
| UML Preparation | `/workspace/uml-preparation` | Prepare class, use case, sequence, and activity model data. |
| Report Structure | `/workspace/report-structure` | Build the table of contents. This page uses backend RAG support. |
| Report Builder | `/workspace/report-builder` | Write the final report chapter by chapter. |
| Presentation | `/workspace/presentation` | Generate and refine defense slides. |
| Pitch | `/workspace/pitch` | Generate and refine spoken pitch content. |
| Jury Simulation | `/workspace/jury-simulation` | Upload/record defense audio and receive feedback. |

## 7. API Communication

All normal JSON API calls go through:

```text
src/lib/api.ts
```

The helper:

- Uses `VITE_API_URL` or `http://localhost:5000/api`.
- Reads `token` from `localStorage`.
- Adds `Authorization: Bearer <token>` when a token exists.
- Parses JSON responses.
- Throws a readable error when the backend returns a non-success status.

Typical examples:

```ts
fetchApi("/projects/my-project")
fetchApi("/ai/report-structure/generate", { method: "POST" })
fetchApi(`/projects/${projectId}/product-backlog`, {
  method: "PUT",
  body: JSON.stringify({ productBacklog })
})
```

## 8. AI Features In The Frontend

The frontend does not directly implement the language model logic. It presents controls and sends requests to the backend.

Most AI-assisted pages follow the same pattern:

1. Load the current project.
2. Load the saved artifact for that page.
3. Let the user generate, refine, translate, or manually edit content.
4. Save the accepted result back into the project document.

Examples:

| Feature | Frontend hook | Backend API |
| --- | --- | --- |
| Actors | `useActors.ts` | `/ai/actors/generate`, `/ai/actors/refine`, `/ai/actors/translate` |
| Existing solutions | `useExistingSolutions.ts` | `/ai/existing-solutions/*` |
| Functional requirements | `useFunctionalRequirements.ts` | `/ai/functional-requirements/*` |
| Non-functional requirements | `useNonFunctionalRequirements.ts` | `/ai/non-functional-requirements/*` |
| Product backlog | `useProductBacklog.ts` | `/ai/product-backlog/*` |
| UML preparation | `useUmlPreparation.ts` | `/ai/uml-preparation/*` |
| Report structure | `useReportStructure.ts` | `/ai/report-structure/*` |
| Report writing | `useReportStudio.ts` | `/ai/report-studio/*` |
| Presentation | `usePresentation.ts` | `/ai/presentation/*` |
| Pitch | `usePitch.ts` | `/ai/pitch/*` |

## 9. Report Structure And Report Builder

The report workflow has two important parts.

### Report Structure

The report structure page manages a hierarchical table of contents:

```text
src/pages/workspace/ReportStructure/index.tsx
src/pages/workspace/ReportStructure/hooks/useReportStructure.ts
```

The structure supports nested sections. The application computes numbering visually; section titles are stored without numbering.

The student can:

- Generate a suggested structure with AI.
- Refine an existing structure with instructions.
- Translate the structure into the project language.
- Accept or discard suggestions.
- Manually add, remove, rename, and reorder sections.

The backend uses the RAG knowledge base when generating or refining this structure. The frontend only calls the backend endpoint; it does not query MongoDB directly.

### Report Builder

The report builder is a professional editor for writing report content after the structure exists:

```text
src/pages/workspace/ReportBuilder/index.tsx
src/pages/workspace/ReportBuilder/hooks/useReportStudio.ts
```

Important behavior:

- Parent sections are treated as containers.
- AI chapter generation targets leaf sections only.
- The student can manually edit AI-generated content.
- Content is saved as HTML, Markdown, and LaTeX.
- The final report can be generated from completed leaf sections.

## 10. Authentication And Roles

Authentication pages are in:

```text
src/pages/auth
```

Supported flows:

- Email/password registration.
- Email verification code.
- Login.
- Google login.
- Forgot password.
- Reset password.

Admin pages are under:

```text
src/pages/admin
```

Admin routes require a logged-in user with the `admin` role.

## 11. Notifications

Notifications are displayed through:

```text
src/components/layout/NotificationBell.tsx
```

The frontend uses:

- `/notifications` to load recent notifications.
- `/notifications/read` to mark them as read.
- `/notifications/stream` for server-sent events.

## 12. Important Frontend Concepts

### Project Data Is Central

Almost every page depends on the current project returned from:

```text
GET /projects/my-project
```

The project document contains onboarding information and all generated artifacts.

### AI Suggestions Are User Controlled

The UI keeps the student in control. AI can generate or improve content, but the student can accept, discard, edit, or save manually.

### Autosave

Several workspace hooks mark content as unsaved, wait briefly, then save automatically. This is used to make the editor feel smooth while still preserving data in MongoDB.

### Branching Workflow

The application guides the student in a logical PFE order. Report writing, presentation, and pitch are unlocked after the report structure because they all depend on that structure.

## 13. Frontend Folder Structure

```text
src/
  components/      Shared UI and layout components.
  context/         Onboarding and workflow state providers.
  layouts/         Auth, onboarding, workspace, and admin shells.
  lib/             API helper and utilities.
  pages/           Route-level pages.
  types/           Shared TypeScript data types.
```

## 14. Relationship With The Other Repositories

This frontend depends on the backend repository for:

- Authentication.
- Project persistence.
- AI generation, refinement, and translation.
- RAG-assisted report structure generation.
- Jury simulation analysis.
- Admin dashboard data.

It does not communicate directly with the RAG ingestion repository. The RAG ingestion repository prepares MongoDB data. The backend reads that data during report structure generation.

