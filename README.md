# SmartPFE — Frontend

React 19 + TypeScript + Vite client for the SmartPFE platform.

---

## Prerequisites

- **Node.js** ≥ 18 (v20+ recommended)
- **Backend running** on `http://localhost:5000` (see [SmartPfe-Backend](https://github.com/your-username/PfeMentor-back))

---

## Quick Start

```bash
# 1. Clone & enter the project
git clone https://github.com/your-username/PfeMentor-front.git
cd PfeMentor-front/SmartPfe-Front

# 2. Install dependencies
npm install

# 3. (Optional) Configure environment
cp .env.example .env   # if .env.example exists
# Or create .env manually — see below

# 4. Start the dev server
npm run dev
```

The app starts on **http://localhost:3000**.

---

## Environment Variables (`.env`)

Both are optional — sensible defaults are built in.

```env
# Backend API URL (defaults to http://localhost:5000/api)
VITE_API_URL=http://localhost:5000/api

# Google OAuth Client ID (for Google Sign-In)
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Build for production (`/dist`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | TypeScript type-check (no emit) |

---

## Tech Stack

| | |
|---|---|
| **Framework** | React 19, TypeScript, Vite 6 |
| **Routing** | React Router DOM v7 |
| **Styling** | Tailwind CSS v4 |
| **Editor** | TipTap v3 |
| **UML** | PlantUML (client-side) |
| **Animation** | Motion |
| **Icons** | Lucide React, HugeIcons |

---

## Related

- **Backend**: [SmartPfe-Backend](https://github.com/your-username/PfeMentor-back)
