---
name: design-system
description: Executive UI/UX Design System standards for modern, responsive, high-contrast, Notion-like and iOS-smooth interfaces.
---

# Agent Skill: Executive UI/UX Design System (Notion & iOS Aesthetics)
# Description: Enforces top-tier UI/UX aesthetics, typography hierarchy, responsive layouts, tactile micro-interactions, and modern design standards across SmartPFE.

## 🎯 Core Design Philosophy

1. **Notion-like Clarity**: Clean, breathable, clutter-free layouts. Zero yapping texts. High scannability with structured cards, tables, and pills.
2. **iOS-Smooth Tactile Feel ("YUMMI")**: Snappy transitions (150–200ms), active scale presses (`active:scale-[0.99]`), refined focus rings, and buttery smooth progress bars.
3. **No Raw Emojis / No Material Symbols**: Strictly use stroke-rounded SVG icons from [`HugeiconsIcon.tsx`](file:///c:/Users/hamma/Documents/GitHub/PfeMentor-front/SmartPfe-Front/src/components/ui/HugeiconsIcon.tsx) or `@hugeicons/react`.

---

## 🎨 Design Tokens & Hierarchy

### 1. Typography Hierarchy
- **Page / Hero Titles**: `text-2xl sm:text-3xl font-bold tracking-tight text-on-surface`
- **Section Headers**: `text-lg sm:text-xl font-bold tracking-tight text-on-surface`
- **Card & Subsection Headers**: `text-sm sm:text-base font-semibold text-on-surface`
- **Eyebrows / Section Tags**: `text-xs font-bold uppercase tracking-wider text-primary`
- **Body Text**: `text-sm text-on-surface-variant leading-relaxed`
- **Secondary Captions**: `text-xs text-on-surface-variant/80`
- **Numbers / Metrics**: `text-2xl sm:text-3xl font-bold tracking-tight font-mono text-on-surface`
- **Line Clamping & Safety**: Always pair wrapping text with `truncate`, `line-clamp-1` or `line-clamp-2` with `min-w-0`. Keep button labels `whitespace-nowrap`.

### 2. Cards, Surfaces & Visual Depth
- **Primary Surface**: `bg-surface text-on-surface`
- **Elevated Cards**: `bg-surface-container-lowest border border-outline-variant/80 rounded-2xl shadow-xs transition-all`
- **Interactive Cards**: `hover:border-primary/40 hover:shadow-sm hover:bg-surface-container-low/40`
- **Backdrops & Modals**: `bg-surface/80 backdrop-blur-md border border-outline-variant/60`
- **Ambient Accents**: Use soft, intentional tints (`bg-primary/5`, `border-primary/20`) instead of heavy, muddy gradients.

### 3. Inputs & Form Controls
- **Input Containers**: `h-11 rounded-xl bg-surface border border-outline-variant/80 px-3.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none`
- **Icon Prefixes**: `HugeiconsIcon` with `size={18}` and `text-on-surface-variant/60`
- **Field Labels**: `block text-xs font-semibold text-on-surface mb-1.5`
- **Password Strength**: 4-segment animated bar (`bg-error`, `bg-amber-500`, `bg-emerald-500`) with smooth width/color transitions.
- **Verification / OTP Inputs**: Segmented 6-box square digit cells with auto-advance and paste support.

### 4. Buttons & Interactive States
- **Primary Action**: `h-11 px-5 rounded-xl bg-primary text-on-primary font-semibold text-sm shadow-xs hover:bg-primary/90 active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`
- **Secondary Action**: `h-11 px-5 rounded-xl bg-surface border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-low active:scale-[0.99] transition-all cursor-pointer`
- **Ghost / Text Button**: `text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer`
- **Mini Table / Row Actions**: `w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all cursor-pointer`
- **Loading Spinner**: Non-jumping layout with a `w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin`.

### 5. Alerts & Feedback Banners
- **Error Banner**: `p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium flex items-center gap-2.5`
- **Success Banner**: `p-3.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-xs font-medium flex items-center gap-2.5`
- **Info Banner**: `p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium flex items-center gap-2.5`

### 6. Iconography Guidelines (`HugeiconsIcon`)
- Always use [`HugeiconsIcon.tsx`](file:///c:/Users/hamma/Documents/GitHub/PfeMentor-front/SmartPfe-Front/src/components/ui/HugeiconsIcon.tsx).
- **Toolbar Buttons**: `size={17}` with `strokeWidth={1.65}`
- **Form Inputs**: `size={18}` with `strokeWidth={1.6}`
- **Action Icons (Edit, Delete, Check)**: `size={16}` with `strokeWidth={1.8}`
- **Empty States / Headers**: `size={24}` to `32}` with `strokeWidth={1.6}` in rounded container.

---

## 🏛️ Golden Layout Template

```tsx
<div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col justify-center items-center p-4">
  <div className="w-full max-w-[420px] bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
    <div className="flex flex-col items-center text-center mb-6">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mb-3">
        <HugeiconsIcon icon="mortarboard-02" size={24} strokeWidth={1.8} />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-on-surface">Welcome back</h1>
      <p className="text-xs text-on-surface-variant mt-1">Sign in to your SmartPFE workspace</p>
    </div>
    
    <form className="space-y-4">
      {/* Form controls */}
      <button className="w-full h-11 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90 active:scale-[0.99] transition-all cursor-pointer">
        Continue
      </button>
    </form>
  </div>
</div>
```
