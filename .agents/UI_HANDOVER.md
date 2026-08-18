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
| **Translate with AI** | `"ai-translate"` / `AiTranslateIcon` | Asian/Latin character translation glyph with sparkle |
| **Add / Create Item** | `"add"` | Stroke-rounded plus sign |
| **Edit Item** | `"edit"` | Pencil/pen vector |
| **Delete / Remove Item** | `"delete"` | Trash can vector |

---

## 2. Global Shared Components

### 2.1 `<SaveStatusHeader />` (`src/components/ui/SaveStatusHeader.tsx`)
Replaces ad-hoc status texts and inline "Save now" buttons:
```tsx
import SaveStatusHeader from "@/components/ui/SaveStatusHeader";

<SaveStatusHeader
  status={saveStatus} // "saved" | "saving" | "unsaved"
  onSave={() => saveActors(actors, true)}
  isBusy={isAiBusy}
/>
```

### 2.2 `<AiActionToolbar />` (`src/components/ai/AiActionToolbar.tsx`)
Provides unified `Generate with AI`, `Refine with AI` (with popover), `Translate with AI`, and an optional right-aligned primary action button:
```tsx
import AiActionToolbar from "@/components/ai/AiActionToolbar";

<AiActionToolbar
  onGenerate={generateWithAi}
  onRefine={refineWithAi}
  onTranslate={translateWithAi}
  isGenerating={aiState === "generating"}
  isRefining={aiState === "refining"}
  isTranslating={aiState === "translating"}
  isBusy={isAiBusy || aiState === "suggestion_ready"}
  canGenerate={isEditorEmpty /* or true */}
  canRefine={!isEditorEmpty /* or items.length > 0 */}
  generateDisabledTitle="Editor already has content — use Refine instead"
  refineDisabledTitle="Write or generate content first before refining"
  refinePlaceholder="Tell AI what you'd like to improve..."
  showTranslate={shouldShowTranslate}
  translateLabel={`Translate to ${getLanguageLabel(projectLanguage)}`}
  primaryAction={
    <button
      type="button"
      onClick={handleAddActor}
      disabled={isAiBusy}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-primary text-on-primary rounded-lg text-[13px] font-semibold tracking-tight hover:bg-primary/90 transition-all duration-150 shadow-2xs active:scale-[0.98] disabled:opacity-50 select-none cursor-pointer"
    >
      <HugeiconsIcon icon="add" size={16} strokeWidth={2} />
      <span>Add Actor</span>
    </button>
  }
/>
### 2.3 Item Actions (Edit / Delete / Done Buttons)
Standardized interactive icon button pairs for rows, table items, and cards:
```tsx
{/* Edit / Done Button */}
<button
  type="button"
  onClick={() => onEdit(isEditing ? null : id)}
  className={cn(
    "w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer",
    isEditing
      ? "bg-primary text-on-primary hover:bg-primary/90 shadow-2xs"
      : "text-on-surface-variant hover:text-primary hover:bg-surface-container"
  )}
  title={isEditing ? "Save edit" : "Edit"}
>
  <HugeiconsIcon icon={isEditing ? "check" : "edit"} size={16} strokeWidth={1.8} />
</button>

{/* Delete Button */}
<button
  type="button"
  onClick={() => onDelete(id)}
  className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-all cursor-pointer"
  title="Delete"
>
  <HugeiconsIcon icon="delete" size={16} strokeWidth={1.8} />
</button>
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
