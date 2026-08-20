# 🎓 SmartPFE — Frontend Client

A modern, responsive web application built with **React 19**, **TypeScript**, and **Vite** serving as the client interface for **SmartPFE (PFE Mentor)**.

---

## 🎯 About the Application

**SmartPFE** is an AI-augmented workspace built to assist engineering and computer science students throughout their **End-of-Studies Projects (PFE — Projet de Fin d'Études)**. It guides students through structured academic and technical milestones:

* **Project Formulation & Context**: Capturing domain, problem statement, technical stack, actors/personas, and methodologies (Scrum/Agile).
* **Requirements Engineering**: Specifying structured Functional ($RF$) and Non-Functional ($RNF$) requirement backlogs with actor mappings.
* **State of the Art (SOTA)**: Building comparative benchmark matrices of existing market solutions vs. proposed project value.
* **UML Studio & Modeling**: Interactive UML generation (Use Case, Class, Sequence) with live client-side PlantUML rendering.
* **Report Studio**: Section-by-section academic thesis editor (HTML / Markdown / LaTeX) backed by Corrective RAG (CRAG) for grounded academic citations and in-place AI text transformations.
* **Defense & Pitch Simulator**: Generating defense slides, timed speech scripts, and simulated jury Q&A.

---

## 🏗️ Architecture & Technical Design

### Key Architectural Highlights
* **Component-Driven Modular Architecture**: Separated into atomic UI components, feature-specific workspace modules, and reusable layouts.
* **Client-Side UML Compilation**: Dynamic rendering of UML diagrams using `@plantuml/core` encoding pipeline without requiring server roundtrips for syntax previews.
* **Rich Text Editing Engine**: Integrated [TipTap](https://tiptap.dev/) ecosystem (`@tiptap/pm`, `@tiptap/react`, `@tiptap/starter-kit`) with custom extensions for character counts, placeholders, and AI selection docks.
* **Modular Data & Hook Pattern**: Encapsulated state machines and API synchronization per workspace module (`useReportStudio`, `useUmlPreparation`, etc.).
* **Styling & Design System**: Tailwind CSS v4 paired with custom executive UI tokens, dark/light contrast modes, and fluid micro-interactions via `motion`.

### Directory Structure
```
SmartPfe-Front/
├── src/
│   ├── components/       # Reusable atomic & composite UI components
│   │   ├── layout/       # Drawers, headers, sidebars, navigation
│   │   ├── ui/           # Buttons, inputs, modals, cards, icons
│   │   └── workspace/    # Module-specific feature widgets (UML, Studio, etc.)
│   ├── context/          # Global React contexts (Auth, Theme, Workspace)
│   ├── hooks/            # Modular feature hooks & API controllers
│   ├── layouts/          # Top-level page wrappers and shell layouts
│   ├── lib/              # Client utilities, API client configs, PlantUML helpers
│   ├── pages/            # View routes (Auth, Workspace, Report Studio, etc.)
│   ├── types/            # TypeScript interfaces and domain schemas
│   ├── App.tsx           # Route tree & provider orchestration
│   ├── index.css         # Tailwind directives, theme variables, custom styles
│   └── main.tsx          # Application entrypoint
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 💻 Tech Stack & Dependencies

| Category | Technology / Library |
| :--- | :--- |
| **Core Framework** | React 19, TypeScript (~5.8), Vite 6 |
| **Routing** | React Router DOM v7 |
| **Styling & CSS** | Tailwind CSS v4, `@tailwindcss/vite`, clsx, tailwind-merge |
| **Editor & Processing** | TipTap v3 Suite, Diff (`diff`) |
| **Diagrams & Visuals** | `@plantuml/core`, `canvas-confetti`, `html-to-image` |
| **Icons & Animation** | HugeIcons (`@hugeicons/react`), Lucide React, Motion (`motion`) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `>= 18.x` (v20+ recommended)
- **npm** or **pnpm / yarn**

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/PfeMentor-front.git
cd PfeMentor-front/SmartPfe-Front
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory (or copy from `.env.example` if provided):
```env
# Optional: Point to local or deployed backend instance
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Development Server
Start the local Vite dev server:
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

---

## 🛠️ Build & Scripts

```bash
# Start dev server with hot reload
npm run dev

# Run TypeScript type check (no emit)
npm run lint

# Compile production build to /dist
npm run build

# Locally preview production build
npm run preview
```

---

## 🔗 Related Service

- **Backend Repository**: [`SmartPfe-Backend`](https://github.com/your-username/PfeMentor-back) — Express REST API, MongoDB Atlas `$vectorSearch`, Gemini AI routing, and Corrective RAG (CRAG) pipeline.
