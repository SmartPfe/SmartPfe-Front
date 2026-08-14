---
name: design-system
description: Executive UI/UX Design System standards for modern, responsive, high-contrast and clutter-free interfaces.
---

# Agent Skill: Executive UI/UX Design System
# Description: Automatically intercepts page-generation requests to enforce top-tier UI aesthetics, typography hierarchy, responsive layouts, and modern design standards.

## Global Design Rules

### 1. Typography & Hierarchy
- **Strict Font Scale Hierarchy**:
  - Page Titles / Headers: `text-2xl sm:text-3xl font-bold tracking-tight text-on-surface`
  - Section Titles: `text-lg sm:text-xl font-bold tracking-tight text-on-surface`
  - Card & Subsection Headers: `text-sm sm:text-base font-semibold text-on-surface`
  - Eyebrows / Section Tags: `text-xs font-bold uppercase tracking-wider text-primary`
  - Body Text: `text-sm text-on-surface-variant leading-relaxed`
  - Stats / Metric Numbers: `text-2xl sm:text-3xl font-bold tracking-tight font-mono text-on-surface`
- **Line Clamping & Wrapping Safety**:
  - Never allow long titles to wrap into awkward single-word columns.
  - Always pair titles with `truncate`, `line-clamp-1` or `line-clamp-2` with appropriate minimum column widths (`min-w-0`).
  - Keep button labels and badges concise and `whitespace-nowrap`.

### 2. Cards, Surfaces & Visual Depth
- **Modern Clean Surfaces**:
  - Primary Cards: `bg-surface-container-lowest border border-outline-variant/80 rounded-xl shadow-xs transition-all hover:border-outline`
  - Interactive Cards: `hover:border-primary/40 hover:shadow-sm hover:bg-surface-container-low/40`
  - Subtle Backdrops: `bg-surface/80 backdrop-blur-md border border-outline-variant/60`
  - Avoid heavy, muddy gradients and visual noise. Use intentional, soft accents (`bg-primary/5`, `border-primary/20`).

### 3. Metric Cards & KPI Bars
- Structure KPI cards cleanly:
  - Small uppercase label (`text-xs font-semibold text-on-surface-variant tracking-wider uppercase`).
  - Large crisp stat value (`text-2xl sm:text-3xl font-bold tracking-tight text-on-surface font-mono`).
  - Secondary context / pill (`text-xs text-on-surface-variant` with color-coded highlight).
  - Micro progress bar: thin (`h-1.5`), smooth corners (`rounded-full`), high contrast track.

### 4. Interactive Components & States
- **Component Completeness**: Every interactive component must natively handle:
  - Default state
  - Hover state (`hover:bg-... transition-colors duration-150`)
  - Active / Selected state (`bg-primary-container text-primary font-semibold border-primary/30`)
  - Disabled state (`disabled:opacity-40 disabled:cursor-not-allowed`)
  - Loading state (clear spinner with matching color, non-jumping dimensions)
  - Empty state (clean icon, concise title, single prominent CTA)

### 5. Layout & Spacing Discipline
- **Avoid Cramming**: Give data and text breathing room.
  - Generous padding: `p-5 sm:p-6` for main containers, `gap-4 sm:gap-6` for grids.
  - List tables and structured rows over cluttered multi-nested mini-boxes.
  - Single-column or clean two-column responsive matrices rather than crammed 4-column sub-grids inside narrow sidebars.

---

## Example Golden Layout (The AI Reference Point)

```html
<div class="min-h-screen bg-surface text-on-surface antialiased flex flex-col justify-center">
  <div class="max-w-md w-full mx-auto p-8 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl">
    <span class="text-xs font-bold tracking-wider text-primary uppercase">Executive Overview</span>
    <h1 class="mt-2 text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">Streamline your workflow</h1>
    <p class="mt-3 text-sm text-on-surface-variant leading-relaxed">The intelligent orchestration layer engineered for modern research and academic reporting.</p>
    <div class="mt-6 flex items-center gap-x-3">
      <button class="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary/90 transition-all duration-200 shadow-sm cursor-pointer">
        Get Started
      </button>
      <button class="text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-all duration-200 cursor-pointer">
        Documentation &rarr;
      </button>
    </div>
  </div>
</div>
```
