# UI / UX Design & Icon Standards Handover Guide

> **Quick Context for Agents**: Follow these design rules, component conventions, icon patterns, and layout formulas whenever redesigning or modernizing pages across `SmartPfe-Front`. The benchmark implementation lives in [`Actors.tsx`](file:///c:/Users/hamma/Documents/GitHub/PfeMentor-front/SmartPfe-Front/src/pages/workspace/Actors.tsx).

---

## 1. Iconography Standards (`HugeiconsIcon`)

- **Strict Rule**: Never use legacy `material-symbols-outlined` text fonts or low-res emojis. Always use the stroke-rounded SVG vector component [`HugeiconsIcon.tsx`](file:///c:/Users/hamma/Documents/GitHub/PfeMentor-front/SmartPfe-Front/src/components/ui/HugeiconsIcon.tsx).
- **Icon Sizing Formula**:
  - **Toolbar / Action Buttons**: `size={17}` with `strokeWidth={1.65}` (optically balanced with 13px label text).
  - **Inline Badges & Indicators**: `size={12}` to `14}` with `strokeWidth={1.8}`.
  - **Action Row Mini Buttons (Edit, Delete, Check)**: `size={16}` with `strokeWidth={1.8}`.
  - **Empty State Icons**: `size={20}` with `strokeWidth={1.6}` in a 40px rounded container.
  - **Tooltips (`InfoTooltip.tsx`)**: `size={16}` with `strokeWidth={1.8}`.

### Dedicated AI Action Icons:
| Action | Icon Name / Component | Vector Description |
| :--- | :--- | :--- |
| **Generate with AI** | `"ai-beautify"` / `AiBeautifyIcon` | Diagonal magic wand with burst rays |
| **Refine with AI** | `"ai-refine"` / `AiRefineIcon` | Magic wand with upper-right star sparkle |
| **Translate with AI** | `"globe-02"` | Clean globe with latitude/longitude lines |
| **Add / Create Item** | `"add"` | Stroke-rounded plus sign |
| **Edit Item** | `"edit"` | Pencil/pen vector |
| **Delete / Remove Item** | `"delete"` | Trash can vector |

---

## 2. Action Toolbar & Button Formulas

All action toolbars should follow this unified container and button height formula:

### Toolbar Wrapper:
```tsx
<div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest/80 border border-outline-variant/80 rounded-xl p-2 sm:p-2.5 backdrop-blur-xs shadow-2xs">
  {/* Left: AI Generation & Modification Buttons */}
  <div className="flex flex-wrap items-center gap-2">...</div>
  {/* Right: Primary Create Action */}
  <div>...</div>
</div>
```

### Standardized Button Classes:

```tsx
// AI Generate & Refine Button
const aiButtonClass =
  "inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 text-primary text-[13px] font-medium tracking-tight hover:from-primary/15 hover:to-secondary/15 hover:border-primary/40 transition-all duration-150 shadow-2xs active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale select-none cursor-pointer";

// AI Translate Button (Dynamic Language Notice)
const translateButtonClass =
  "inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg border border-secondary/30 bg-secondary/10 text-secondary text-[13px] font-medium tracking-tight hover:bg-secondary/15 hover:border-secondary/50 transition-all duration-150 shadow-2xs active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale select-none cursor-pointer";

// Primary Page Action (e.g. Add Actor / Add Solution)
const primaryActionClass =
  "w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-primary text-on-primary rounded-lg text-[13px] font-semibold tracking-tight hover:bg-primary/90 transition-all duration-150 shadow-2xs active:scale-[0.98] disabled:opacity-50 select-none cursor-pointer";
```

---

## 3. Section Headers & Tooltips

- **Eyebrow Tag**: `text-xs font-bold uppercase tracking-wider text-primary`
- **Main Heading**: `text-2xl sm:text-3xl font-bold tracking-tight text-on-surface flex items-center`
- **Info Tooltip**: Use [`InfoTooltip`](file:///c:/Users/hamma/Documents/GitHub/PfeMentor-front/SmartPfe-Front/src/components/ui/InfoTooltip.tsx) with clear executive context.
- **Autosave / Status Pill**:
  - Saved: `bg-secondary/10 text-secondary border-secondary/20`
  - Saving: `bg-surface-container text-on-surface-variant border-outline-variant`
  - Unsaved: `bg-error/10 text-error border-error/20`

---

## 4. Table & Entity Card Layouts

- **Outer Card**: `bg-surface-container-lowest border border-outline-variant/80 rounded-2xl overflow-hidden shadow-2xs`
- **Card Header**:
  - `px-5 py-3.5 border-b border-outline-variant/70 bg-surface-container-low/40`
  - Title: `text-sm font-bold text-on-surface tracking-tight`
  - Category Badge: `text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant border border-outline-variant/60`
  - Item Count: `text-xs font-mono font-semibold text-on-surface-variant/80 ml-1`
- **Table Column Headers**:
  - `hidden md:grid gap-4 px-5 py-2.5 bg-surface-container-low/60 border-b border-outline-variant/60 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider`
- **Item Rows**:
  - Row Padding: `px-5 py-3.5`
  - Active Editing State: `bg-primary/5`
  - Row Hover: `hover:bg-surface-container-low/30 transition-colors group`
  - Actions Hover: `opacity-100 md:opacity-0 md:group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity`
  - Edit/Delete Button size: `w-8 h-8 rounded-lg flex items-center justify-center`

---

## 5. Summary Checklist for Future Page Conversions

When adapting other workspace pages (e.g. Existing Solutions, Functional Backlog, Pitch, etc.):
1. [ ] Import `<HugeiconsIcon />` and replace all `<span className="material-symbols-outlined">`.
2. [ ] Update `Generate with AI` to `icon="ai-beautify"`.
3. [ ] Update `Refine with AI` to `icon="ai-refine"`.
4. [ ] Standardize toolbar button heights to `h-9` (`36px`) and icons to `size={17}` `strokeWidth={1.65}`.
5. [ ] Upgrade tables and card lists with `rounded-2xl`, item count badges `(N)`, and 8px action icons.
