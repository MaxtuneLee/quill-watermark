# Design System Inspiration of Quill Watermark

A professional watermark / photography metadata editor. The interface leans into a minimal, technical editorial sensibility: OKLCH color science, sharp `rounded-none` corners, variable serif headings paired with variable sans UI text, motion curves tuned for precision, and a morphing dark panel as the signature gesture. The product looks like a camera utility built by typographers.

---

## 1. Visual Theme & Atmosphere

Quill Watermark reads as a **technical editorial darkroom tool**. The dominant surface is pure white `oklch(1 0 0)` in light mode and near-black `oklch(0.148 0.004 228.8)` in dark mode, both cool-neutral with an almost imperceptible blue shift. The primary accent is a warm yellow-green `oklch(0.852 0.199 91.936)` — an olive / ochre mid-tone that nods to analog photography warning tape. Typography is the loudest element: **Noto Serif Variable** sets every heading, **Noto Sans Variable** drives the UI, **JetBrains Mono Variable** appears in data fields. Corners are unapologetically square (`rounded-none` is the dominant radius in primitives), elevation is sparse, and the signature motion is a custom **morph panel** that expands from a 36×36 trigger into a dark `#161515` sheet via animated `clip-path` with `cubic-bezier(0.22, 1, 0.36, 1)` over 350 ms.

**Key Characteristics**

- **Color space**: All design tokens authored in **OKLCH** (perceptually uniform); no hex in the token layer.
- **Accent**: Warm yellow-green primary `oklch(0.852 0.199 91.936)` on `oklch(0.421 0.095 57.708)` dark-olive foreground.
- **Type pairing**: Serif headings (`Noto Serif Variable`) over sans body (`Noto Sans Variable`); mono (`JetBrains Mono Variable`) reserved for numeric metadata.
- **Radius**: Base `--radius: 0.625rem` (10 px), but primitives deliberately override to `rounded-none` for a grid-aligned editor feel.
- **Signature motion**: `MorphPanel` with `transition-[clip-path,opacity,transform] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)]`.
- **Elevation**: Minimal — only `shadow-md` on popovers / selects and `shadow-2xl` on the morph panel; everything else sits flat with 1px borders.
- **Micro-press feedback**: Buttons nudge on press via `active:not-aria-[haspopup]:translate-y-px`.
- **Focus**: Always a 1px `focus-visible:ring-1 focus-visible:ring-ring/50` plus `border-ring` — never a thick glow.
- **Glass**: Dialog overlay is `bg-black/10 supports-backdrop-filter:backdrop-blur-xs` — a whisper of frost, not heavy glassmorphism.
- **Fluid type in hero**: `text-[clamp(1.75rem,2.2vw,2.35rem)]` so large marks scale between canvas sizes.

---

## 2. Color Palette & Roles

All values are extracted verbatim from `src/styles/base.css`. Light-mode is `:root`; dark-mode is `.dark`.

### Primary

- **Primary** (`oklch(0.852 0.199 91.936)` · `--primary`): Warm yellow-green accent. Drives active states, slider range fill, sidebar primary mark.
- **Primary Foreground** (`oklch(0.421 0.095 57.708)` · `--primary-foreground`): Dark olive used as legible text on `--primary`.
- **Primary (Dark)** (`oklch(0.795 0.184 86.047)` · `--primary` in `.dark`): Slightly desaturated yellow-green for dark surfaces.
- **Sidebar Primary** (`oklch(0.681 0.162 75.834)` · `--sidebar-primary`): Muted ochre for sidebar emphasis.
- **Sidebar Primary Foreground** (`oklch(0.987 0.026 102.212)` · `--sidebar-primary-foreground`): Near-white with a warm tint.

### Interactive

- **Destructive** (`oklch(0.577 0.245 27.325)` · `--destructive`): Orange-red for destructive actions; buttons render at 10 % tint (`bg-destructive/10 text-destructive hover:bg-destructive/20`).
- **Destructive (Dark)** (`oklch(0.704 0.191 22.216)`): Lighter destructive for dark mode legibility.
- **Ring** (`oklch(0.723 0.014 214.4)` · `--ring`): Cool neutral used for focus outlines at 50 % opacity.
- **Ring (Dark)** (`oklch(0.56 0.021 213.5)`): Dark-mode focus ring.
- **Secondary** (`oklch(0.967 0.001 286.375)` · `--secondary`): Very light gray-blue surface for chips and passive buttons.
- **Secondary Foreground** (`oklch(0.21 0.006 285.885)`): Near-black text on `--secondary`.

### Neutral Scale

- **Background** (`oklch(1 0 0)` · `--background`): Pure white (light); `oklch(0.148 0.004 228.8)` in dark.
- **Foreground** (`oklch(0.148 0.004 228.8)` · `--foreground`): Near-black with a trace of cool tint; `oklch(0.987 0.002 197.1)` in dark.
- **Muted** (`oklch(0.963 0.002 197.1)` · `--muted`): Light gray surface for tabs and disabled fills; `oklch(0.275 0.011 216.9)` in dark.
- **Muted Foreground** (`oklch(0.56 0.021 213.5)` · `--muted-foreground`): Mid-gray label text; `oklch(0.723 0.014 214.4)` in dark.
- **Accent** (`oklch(0.963 0.002 197.1)` · `--accent`): Same as muted in light; `oklch(0.275 0.011 216.9)` in dark — hover surface for list items.
- **Accent Foreground** (`oklch(0.218 0.008 223.9)` · `--accent-foreground`): Dark gray text on accent surfaces.

### Surface & Borders

- **Card** (`oklch(1 0 0)` · `--card`): White card surface; `oklch(0.218 0.008 223.9)` in dark.
- **Card Foreground** (`oklch(0.148 0.004 228.8)` · `--card-foreground`): Near-black text on cards.
- **Popover** (`oklch(1 0 0)` · `--popover`): Popover surface; `oklch(0.218 0.008 223.9)` in dark.
- **Border** (`oklch(0.925 0.005 214.3)` · `--border`): Subtle 1 px divider; in dark: `oklch(1 0 0 / 10%)` — translucent white at 10 %.
- **Input** (`oklch(0.925 0.005 214.3)` · `--input`): Input outline; in dark: `oklch(1 0 0 / 15%)`.
- **MorphPanel Surface** (`#161515` · literal hex in `morph-panel.tsx`): The only raw-hex color in the UI layer — a warmer near-black for the signature morphing sheet.
- **MorphPanel Border** (`rgba(255,255,255,0.10)` · `border-white/10`): Hairline highlight on the panel edge.
- **MorphPanel Text** (`oklch(0.96 0.01 95)`): Warm off-white set as inline style on panel content.

### Sidebar

- **Sidebar** (`oklch(0.987 0.002 197.1)` · `--sidebar`): Near-white sidebar fill; `oklch(0.218 0.008 223.9)` in dark.
- **Sidebar Foreground** (`oklch(0.148 0.004 228.8)` · `--sidebar-foreground`): Sidebar text, near-black.
- **Sidebar Accent** (`oklch(0.963 0.002 197.1)` · `--sidebar-accent`): Hover surface for sidebar items.
- **Sidebar Border** (`oklch(0.925 0.005 214.3)` · `--sidebar-border`): Vertical divider.

### Chart Ramp (warm ochre-to-olive)

- **Chart 1** (`oklch(0.905 0.182 98.111)`): Lightest yellow.
- **Chart 2** (`oklch(0.795 0.184 86.047)`): Yellow-green.
- **Chart 3** (`oklch(0.681 0.162 75.834)`): Ochre.
- **Chart 4** (`oklch(0.554 0.135 66.442)`): Olive.
- **Chart 5** (`oklch(0.476 0.114 61.907)`): Deep olive.

### Overlay Colors

- **Dialog Overlay** (`rgba(0, 0, 0, 0.10)` · `bg-black/10`): Subtle scrim with backdrop blur.
- **Panel Highlight** (`rgba(255, 255, 255, 0.08)` / `rgba(255, 255, 255, 0.10)`): Template library border tints (`border-white/8`, `border-white/10`).
- **Field Muted** (`rgba(255, 255, 255, 0.02)`): Near-invisible fill used as hover base on dark panels.

### Shadow Colors

- **Elevation Shadow** (browser-default `shadow-sm` / `shadow-md` tokens from Tailwind v4): Cool neutral black at low alpha, used only on popovers, selects, and dropdowns.
- **Morph Shadow** (`shadow-2xl`): Heaviest shadow in the system, reserved exclusively for `MorphPanel`.
- **Focus Ring Tint** (`oklch(0.723 0.014 214.4 / 50%)` · `ring-ring/50`): 1 px focus outline at half alpha.

---

## 3. Typography Rules

Font stack is declared in `src/styles/base.css` via `@theme inline`:

```
--font-sans:    "Noto Sans Variable", sans-serif;
--font-heading: "Noto Serif Variable", serif;
```

Mono is imported via `@fontsource-variable/jetbrains-mono` and consumed with Tailwind's `font-mono`.

| Role                          | Font                    | Size                                                               | Weight                | Line Height                        | Letter Spacing                  | Notes                                                   |
| ----------------------------- | ----------------------- | ------------------------------------------------------------------ | --------------------- | ---------------------------------- | ------------------------------- | ------------------------------------------------------- |
| Editorial Hero                | Noto Serif Variable     | clamp(28px, 2.2vw, 37.6px) · `text-[clamp(1.75rem,2.2vw,2.35rem)]` | 600                   | 1.05 (tight) · `leading-[1.05]`    | −0.56px · `tracking-[-0.035em]` | Template library hero; fluid between canvas sizes       |
| Page Title (H1)               | Noto Serif Variable     | 36px (2.25rem) · `text-4xl`                                        | 700 · `font-bold`     | 1.11 (tight)                       | −0.32px · `tracking-[-0.02em]`  | `font-heading` applied                                  |
| Section Heading (H2)          | Noto Serif Variable     | 18px (1.125rem) · `text-lg`                                        | 600 · `font-semibold` | 1.33                               | normal                          | Panel group labels                                      |
| Card Title                    | Noto Serif Variable     | 16px (1.00rem) · `text-base`                                       | 600                   | 1.50                               | normal                          | Used on template cards                                  |
| Body Default                  | Noto Sans Variable      | 14px (0.875rem) · `text-sm`                                        | 400                   | 1.50                               | normal                          | Dialog descriptions use `text-sm/relaxed`               |
| UI Default (Buttons / Inputs) | Noto Sans Variable      | 12px (0.75rem) · `text-xs`                                         | 500 · `font-medium`   | 1.33                               | normal                          | The dominant UI size — used 36× in source               |
| Tab Trigger                   | Noto Sans Variable      | 12px (0.75rem) · `text-xs`                                         | 500                   | 1.33                               | normal                          | `text-foreground/60` inactive, `text-foreground` active |
| Micro Label                   | Noto Sans Variable      | 12.48px · `text-[0.78rem]`                                         | 500                   | 1.40                               | +1.20px · `tracking-[0.1em]`    | Compact panel captions                                  |
| Tag / Eyebrow                 | Noto Sans Variable      | 9.6px · `text-[0.6rem]`                                            | 500                   | 1.20                               | +1.68px · `tracking-[0.14em]`   | Uppercase section markers                               |
| Editorial Caption             | Noto Serif Variable     | 14px (0.875rem) · `text-sm` + `font-serif`                         | 400                   | 1.60 (relaxed) · `text-sm/relaxed` | normal                          | Used inside template cards                              |
| Tooltip / Helper              | Noto Sans Variable      | 12px (0.75rem) · `text-xs`                                         | 400                   | 1.60 (relaxed) · `text-xs/relaxed` | normal                          | Dialog descriptions                                     |
| Numeric Metadata              | JetBrains Mono Variable | 12px (0.75rem) · `text-xs font-mono`                               | 400                   | 1.33                               | normal                          | EXIF / shooting parameter fields                        |

**Canvas-rendered text** (from `template-engine`) uses integer line-height values directly: `lineHeight: 22` and `lineHeight: 16` on info strips — these are raster-space pixels, not CSS.

**Tracking scale** used throughout templates: `tracking-[0.06em]`, `tracking-[0.08em]`, `tracking-[0.1em]`, `tracking-[0.12em]`, `tracking-[0.14em]` for positive spacing; `tracking-[-0.02em]`, `tracking-[-0.035em]` for negative (headlines only).

---

## 4. Component Stylings

Component library is a hybrid of `@base-ui/react` v1.3.0 + `radix-ui` v1.4.3 + **shadcn/ui** (configured as `style: "base-lyra"`, `baseColor: "mist"` in `components.json`). All primitives live under `src/components/ui/`.

### Buttons (`src/components/ui/button.tsx`)

**Default (Primary-on-Surface)**

- Background: `transparent` (inherits) with `border-transparent`
- Text: `text-foreground`
- Height: `h-8` (32 px)
- Padding: `px-2.5 py-1` (10 px / 4 px)
- Gap (icon + label): `gap-1.5` (6 px)
- Radius: `rounded-none`
- Transition: `transition-all`
- Active press: `active:not-aria-[haspopup]:translate-y-px`
- Focus: `focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50`
- Disabled: `disabled:opacity-50 disabled:pointer-events-none`

**Outline**

- Background: `bg-transparent` (light) · `dark:bg-input/30`
- Border: `1px solid var(--border)` · `border-input`
- Text: `text-foreground`
- Hover: `hover:bg-accent hover:text-accent-foreground`

**Secondary**

- Background: `bg-secondary` (`oklch(0.967 0.001 286.375)`)
- Text: `text-secondary-foreground`
- Hover: `hover:bg-secondary/80`

**Ghost**

- Background: `transparent`
- Text: `text-foreground`
- Hover: `hover:bg-accent hover:text-accent-foreground`

**Destructive**

- Background: `bg-destructive/10` (`oklch(0.577 0.245 27.325 / 10%)`)
- Text: `text-destructive`
- Hover: `hover:bg-destructive/20`

**Link**

- Background: none
- Text: `text-primary underline-offset-4 hover:underline`

**Size Scale**

- `xs`: `h-6` (24 px)
- `sm`: `h-7` (28 px)
- `default`: `h-8` (32 px)
- `lg`: `h-9` (36 px)
- `icon-xs`: `size-6` (24 px)
- `icon-sm`: `size-7` (28 px)
- `icon`: `size-8` (32 px)
- `icon-lg`: `size-9` (36 px)

### Input (`src/components/ui/input.tsx`)

- Height: `h-8` (32 px)
- Padding: `px-2.5 py-1`
- Text: `text-xs` (12 px)
- Background: `bg-transparent` · `dark:bg-input/30`
- Border: `1px solid var(--input)` · `border-input`
- Radius: `rounded-none`
- Focus: `focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50`
- Invalid: `aria-invalid:border-destructive aria-invalid:ring-destructive/20`
- Disabled: `disabled:bg-input/50 dark:disabled:bg-input/80`

### Textarea

Inherits Input styling; adds `resize-none` and auto height. Same radius, border, focus, and disabled rules.

### Slider (`src/components/ui/slider.tsx`)

- Track: `h-1` (4 px), `bg-muted`, `rounded-none`
- Range (filled portion): `bg-primary` (`oklch(0.852 0.199 91.936)`)
- Thumb: `size-3` (12 px), `bg-white`, `1px solid var(--ring)`, `rounded-none`
- Thumb hover / focus: `hover:ring-1 focus-visible:ring-1`

### Switch (`src/components/ui/switch.tsx`)

- Default track: `h-[18.4px] w-[32px]`; small: `h-[14px] w-[24px]`
- Checked: `data-checked:bg-primary`
- Unchecked: `data-unchecked:bg-input`
- Thumb: `size-4` default / `size-3` small, `bg-background`, `rounded-full`
- Translate on check: `translate-x-[calc(100%-2px)]`
- Radius: track is pill (`rounded-full` implicit via Base UI), thumb is circular

### Tabs (`src/components/ui/tabs.tsx`)

- List: `p-[3px]`, `bg-muted`, `rounded-none`, `gap-2 data-horizontal:flex-col`
- Trigger: `text-xs font-medium`, idle `text-foreground/60`, hover `text-foreground`
- Active indicator: `after:absolute after:bg-foreground` (bottom bar on horizontal, right bar on vertical)
- Variant `line`: `bg-transparent` list with only the active indicator — no pill fill

### Dialog (`src/components/ui/dialog.tsx`)

- Overlay: `bg-black/10 supports-backdrop-filter:backdrop-blur-xs`
- Content: `max-w-[calc(100%-2rem)]`, `p-4`, `rounded-none`, `ring-1 ring-foreground/10`
- Entry: `data-open:fade-in-0 data-open:zoom-in-95`
- Exit: `data-closed:fade-out-0 data-closed:zoom-out-95`
- Close button: top-right, `icon-xs` ghost variant with lucide `XIcon`

### Popover (`src/components/ui/popover.tsx`)

- Width: `w-72` (288 px)
- Padding: `p-2.5`, interior `gap-2.5` (10 px)
- Background: `bg-popover`
- Border: `ring-1 ring-foreground/10`
- Shadow: `shadow-md`
- Radius: `rounded-none`
- Motion: `slide-in-from-*-2`, `fade-in-0`, `zoom-in-95`

### Select (`src/components/ui/select.tsx`)

- Trigger: `h-8` (default) · `data-[size=sm]:h-7` (28 px), `px-2.5 py-2`, `text-xs`, `rounded-none`, `border-input`, `bg-transparent dark:bg-input/30`
- Content: `rounded-none`, `shadow-md`, `ring-1 ring-foreground/10`

### Color Picker (`src/components/ui/color-picker.tsx`)

- Saturation area: `h-40 w-full` (160 px tall), `rounded-sm`, `cursor-crosshair`
- Hue slider: `h-3` (12 px), `rounded-full`, CSS gradient background
- Swatch indicator: `size-3`, `rounded-full`, `border-2 border-white`, `shadow-sm`
- Container: `w-[340px]`, `p-4`

### MorphPanel (`src/components/ui/morph-panel.tsx`) — Signature Component

- Trigger: `36px × 36px` default
- Panel background: `#161515` (literal hex)
- Panel border: `1px solid rgba(255,255,255,0.10)` · `border-white/10`
- Text: `text-[oklch(0.96_0.01_95)]` (warm near-white)
- Shadow: `shadow-2xl`
- Morph transition: `transition-[clip-path,opacity,transform] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)]`
- Secondary transition: `transition-[opacity,transform] duration-220`
- Tracks open dimensions via `--morph-panel-open-height` / `--morph-panel-open-width`

### Badges / Eyebrow Tags (composed from Button base + `text-[0.6rem] tracking-[0.14em] uppercase`)

- Padding: `px-2 py-0.5`
- Background: `bg-white/[0.02]` or `bg-muted`
- Border: `border border-white/10`
- Radius: `rounded-none`
- Text: `text-[0.6rem] font-medium uppercase tracking-[0.14em] text-foreground/70`

### Cards (Template Library)

- Background: `bg-white/[0.02]` on dark
- Border: `border border-white/8`
- Radius: `rounded-none`
- Padding: `p-4`
- Hover / tap: Framer Motion `whileTap={{ scale: 0.975 }}`

---

## 5. Layout Principles

### Base Unit

Tailwind's default **4 px** base unit (Tailwind v4.2.2 with `@tailwindcss/vite`). No custom spacing scale override — the team uses stock Tailwind values plus a handful of arbitrary `clamp()` and `[Npx]` escapes.

### Spacing Scale (observed in source)

| Token               | Value | Typical use                                         |
| ------------------- | ----- | --------------------------------------------------- |
| `gap-1` / `p-1`     | 4 px  | Tight icon/label pairs                              |
| `gap-1.5` / `p-1.5` | 6 px  | Default button icon gap                             |
| `gap-2` / `p-2`     | 8 px  | Panel interior                                      |
| `gap-2.5` / `p-2.5` | 10 px | Input / button horizontal padding; popover interior |
| `gap-3` / `p-3`     | 12 px | Field stacks                                        |
| `gap-3.5`           | 14 px | Editor grid gaps                                    |
| `gap-4` / `p-4`     | 16 px | Dialog / card interior                              |
| `gap-6`             | 24 px | Section separation                                  |

**Fluid gaps**: `gap-[clamp(1.5rem,2vw,2.5rem)]` (24–40 px) for editor grid responsive to viewport width.

**Canvas-layer padding** (template engine, not CSS): `{ x: 12, y: 14 }` in raster pixels for info strips.

### Radius Scale (`--radius: 0.625rem`)

- `--radius-sm`: 6 px
- `--radius-md`: 8 px
- `--radius-lg`: 10 px (base)
- `--radius-xl`: 14 px
- `--radius-2xl`: 18 px
- `--radius-3xl`: 22 px
- `--radius-4xl`: 26 px

In practice, **primitives override to `rounded-none`** — the radius scale exists for surfaces that genuinely need softness (color-picker saturation area uses `rounded-sm`, switch thumbs use `rounded-full`).

### Container Widths

- Popover: `w-72` (288 px)
- Color picker: `w-[340px]`
- Template library content: `w-[56rem]` (896 px)
- Dialog: `max-w-[calc(100%-2rem)]` (fills viewport minus 16 px per side)

### Whitespace Philosophy

**Dense by default.** UI primitives run at `h-8` / 32 px with `text-xs` / 12 px — the editor favors information density so more controls fit into a side panel at once.

**Rhythm via typographic spacing, not padding.** Vertical rhythm is governed by line-height and letter-spacing choices (tight leading on headlines, relaxed leading on body) rather than large vertical gaps.

**Fluid editor, fixed chrome.** The canvas region uses `clamp()`-based gaps so the frame breathes on wide screens, while side panels and dialogs stay at fixed `w-72` / `w-[340px]` widths to keep muscle memory intact.

**Borders over shadows.** Separation is handled with 1 px `border-border` lines and 10 %-alpha white rings, not drop shadows — shadows are reserved for true elevation.

---

## 6. Depth & Elevation

| Level                 | Treatment                                                                                                                             | Use                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 0 (Flat)              | `border: 1px solid var(--border)` · `oklch(0.925 0.005 214.3)` (light) / `oklch(1 0 0 / 10%)` (dark)                                  | Cards, panels, inputs — the default. No shadow.          |
| 1 (Subtle)            | `shadow-sm` (Tailwind v4 default: `rgba(0,0,0,0.05) 0px 1px 2px 0px`)                                                                 | Color picker swatches, minor chips                       |
| 2 (Popover)           | `shadow-md` (Tailwind v4 default: `rgba(0,0,0,0.1) 0px 4px 6px -1px, rgba(0,0,0,0.1) 0px 2px 4px -2px`) + `ring-1 ring-foreground/10` | Popovers, select content, dropdowns                      |
| 3 (Dialog)            | `ring-1 ring-foreground/10` + overlay `bg-black/10 backdrop-blur-xs`                                                                  | Modal dialogs — ring, not shadow, defines the edge       |
| 4 (Signature)         | `shadow-2xl` (Tailwind v4 default: `rgba(0,0,0,0.25) 0px 25px 50px -12px`) on `#161515` panel                                         | `MorphPanel` only — the heaviest elevation in the system |
| Focus (Accessibility) | `1px solid var(--ring)` border + `ring-1 ring-ring/50` outline                                                                        | Keyboard focus on every interactive primitive            |

**Shadow Philosophy.** Quill treats shadow as narrative, not decoration — the system is mostly flat with 1 px borders, and every step up the elevation ladder earns its place. Popovers get `shadow-md` because they must visually detach from the canvas. The dialog uses a hairline ring plus `backdrop-blur-xs` instead of a shadow, reinforcing the editorial-layered feel. The `MorphPanel` alone is allowed `shadow-2xl` because it is the product's signature gesture: a floating dark surface expanding over the canvas via animated `clip-path`, and the deep shadow is what sells the morph.

---

## 7. Do's and Don'ts

**Do**

- Use `rounded-none` for all editor primitives (buttons, inputs, tabs, dialogs, popovers) to match the grid-aligned aesthetic. Reserve `rounded-full` only for switch thumbs and hue-slider swatches, and `rounded-sm` only for the color-picker saturation area.
- Size UI controls at `h-8` / 32 px with `text-xs` / 12 px `font-medium` as the default. Drop to `h-7` / `h-6` only in compact toolbars.
- Set all new color tokens in `src/styles/base.css` using OKLCH. Never introduce hex or hsl() into the token layer.
- Pair **Noto Serif Variable** with `font-heading` class for headings and **Noto Sans Variable** via `font-sans` for UI text; use JetBrains Mono only for numeric metadata (`text-xs font-mono`).
- Apply the standard focus ring `focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50` on every interactive element — it is 1 px, not 2 px or 3 px.
- Use `transition-all` with the house easing `cubic-bezier(0.22, 1, 0.36, 1)` at `duration-[160ms]` for taps and `duration-[240ms]` for panels.
- Reach for `motion/react` (`v12.38.0`) — not a different animation library — and respect `useReducedMotion()`.
- Use `shadow-md` + `ring-1 ring-foreground/10` together for popovers and selects; the ring is non-optional.
- Use `bg-black/10 supports-backdrop-filter:backdrop-blur-xs` for modal overlays — never a solid black `bg-black/50`.
- Write destructive buttons as `bg-destructive/10 text-destructive hover:bg-destructive/20`, not as a filled `bg-destructive` solid.

**Don't**

- Don't replace `rounded-none` primitives with `rounded-md` or `rounded-lg` to "soften" them — the square edges are the point.
- Don't add `shadow-sm` / `shadow-md` to cards or panels. Use `border border-border` for separation instead; shadows are reserved for popovers, dialogs, and the morph panel.
- Don't introduce raw hex (`#xxxxxx`) colors outside `morph-panel.tsx`. That single `#161515` is the deliberate exception; every other surface uses OKLCH tokens.
- Don't use `font-bold` (700) for body copy — the hierarchy is `font-medium` (500) for UI, `font-semibold` (600) for serif headings, and `font-bold` only for `text-4xl` page titles.
- Don't exceed a 2 px focus ring. The standard is exactly `ring-1` (1 px) at 50 % `--ring` alpha.
- Don't animate with linear or default cubic easing. Use `MOTION_EASE = [0.22, 1, 0.36, 1]` exported from `EditorScreen.tsx`.
- Don't create new button variants. The six (`default`, `outline`, `secondary`, `ghost`, `destructive`, `link`) cover every editor affordance.
- Don't use emoji or decorative pictographs in UI copy. Metadata is set in Noto Serif; labels are set in Noto Sans; that is the entire vocabulary.
- Don't hard-code font sizes in pixels inside components — use Tailwind `text-xs` / `text-sm` / `text-base`. Arbitrary `text-[0.6rem]` / `text-[0.78rem]` are allowed only for micro labels that match existing precedent.
- Don't use positive letter-spacing (`tracking-[0.06em]`–`tracking-[0.14em]`) on regular body copy — it is reserved for uppercase eyebrow labels and section captions.

---

## 8. Responsive Behavior

Breakpoints use Tailwind v4 defaults; the app additionally branches on a layout-mode state (`"full" | "sidebar" | "mobile" | "mobile-strip"`) observed in `EditorScreen.tsx` and `DesktopWorkspace.tsx`.

| Breakpoint | Width   | Behavior                                                                                                                                 |
| ---------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `sm`       | 640 px  | Mobile editor layout: side panels collapse into a bottom strip. Morph panel triggers remain 36×36 but open centered on canvas.           |
| `md`       | 768 px  | Tablet: single-column side panel reappears; template library grid becomes 2 columns.                                                     |
| `lg`       | 1024 px | Desktop threshold: `DesktopWorkspace` kicks in with a canvas-plus-sidebar split. Fluid gap `clamp(1.5rem, 2vw, 2.5rem)` begins to widen. |
| `xl`       | 1280 px | Full editor chrome: left template rail, center canvas, right inspector all visible simultaneously.                                       |
| `2xl`      | 1536 px | Hero type reaches its clamp ceiling at `2.35rem` (37.6 px); editor grid stops growing beyond `gap-10`.                                   |

**Collapsing Strategy.** Panels collapse from inspector-right → bottom-strip → single morph panel trigger as viewport narrows. The layout-mode state machine in `EditorScreen.tsx` drives which composition renders, so there is a discrete handoff at each breakpoint rather than continuous reflow. `useReducedMotion()` is consulted in the template library so collapse animations are skipped when the OS requests reduced motion.

**Image Behavior.** The rendered canvas preserves aspect ratio via the template engine (`template-engine/render/`), which computes raster dimensions separately from the DOM. Preview images in the template library use `object-cover` within their card containers (`w-[56rem]` cap on the content column). No `srcset` usage in the editor shell — the canvas output handles its own DPI scaling via `devicePixelRatio`.

**Touch Targets.** Minimum touch size is the `icon` button at `size-8` (32×32 px). On mobile-strip layout, primary controls upsize to `size-9` (36×36 px) and the morph panel trigger stays at 36×36 px to meet WCAG touch recommendations.

---

## 9. Agent Prompt Guide

### Example Component Prompts

1. **Editor inspector panel.** "Create a vertical inspector panel 288px wide with `background: oklch(1 0 0)`, `border: 1px solid oklch(0.925 0.005 214.3)` on the left edge only, and internal padding of 16px. Stack field groups with 12px gaps. Each label is 9.6px Noto Sans Variable weight 500 uppercase, letter-spacing +1.68px, color `oklch(0.56 0.021 213.5)`. Each input is 32px tall, 12px Noto Sans Variable weight 400, `border: 1px solid oklch(0.925 0.005 214.3)`, `border-radius: 0`, padding 10px / 4px, transparent background, `focus: border-color oklch(0.723 0.014 214.4) + 1px ring oklch(0.723 0.014 214.4 / 50%)`. No shadow. In dark mode, swap background to `oklch(0.218 0.008 223.9)` and borders to `oklch(1 0 0 / 10%)`."
2. **Morph panel trigger.** "Create a 36×36px square button with `background: transparent`, `border: 1px solid oklch(0.925 0.005 214.3)`, `border-radius: 0`, centered 16px lucide icon `SlidersHorizontal` in `color: oklch(0.148 0.004 228.8)`. On active press, translate the button 1px down (`transform: translateY(1px)`). On click, expand via animated `clip-path` over 350ms with `cubic-bezier(0.22, 1, 0.36, 1)` into a 288px-wide panel with `background: #161515`, `border: 1px solid rgba(255,255,255,0.10)`, `box-shadow: rgba(0,0,0,0.25) 0px 25px 50px -12px`, text color `oklch(0.96 0.01 95)`, padding 16px, and `border-radius: 0`. Children fade in with a separate 220ms opacity-and-transform transition."
3. **Template card.** "Create a clickable card 272px wide with `background: rgba(255,255,255,0.02)`, `border: 1px solid rgba(255,255,255,0.08)`, `border-radius: 0`, padding 16px. Inside, stack: a 9.6px Noto Sans Variable weight 500 uppercase eyebrow tag with letter-spacing +1.68px color `rgba(255,255,255,0.70)`, then a 16px Noto Serif Variable weight 600 title color `oklch(0.987 0.002 197.1)`, then a 14px Noto Serif Variable weight 400 description with line-height 1.60 color `oklch(0.723 0.014 214.4)`, separated by 12px gaps. On tap, animate `transform: scale(0.975)` via motion/react."
4. **Primary yellow-green slider.** "Create a horizontal slider 256px long. Track is 4px tall `background: oklch(0.963 0.002 197.1)`, `border-radius: 0`. Filled range is `background: oklch(0.852 0.199 91.936)`. Thumb is a 12×12px square with `background: #ffffff`, `border: 1px solid oklch(0.723 0.014 214.4)`, `border-radius: 0`. On hover or keyboard focus, add `ring: 1px solid oklch(0.723 0.014 214.4 / 50%)`. Transition thumb position at 160ms `cubic-bezier(0.22, 1, 0.36, 1)`."
5. **Modal dialog.** "Create a centered dialog with overlay `background: rgba(0,0,0,0.10)` and `backdrop-filter: blur(4px)`. Dialog content is white `oklch(1 0 0)` in light or `oklch(0.218 0.008 223.9)` in dark, `max-width: calc(100% - 32px)`, padding 16px, `border-radius: 0`, surrounded by `ring: 1px solid oklch(0.148 0.004 228.8 / 10%)`. Title is 18px Noto Serif Variable weight 600 color `oklch(0.148 0.004 228.8)`, line-height 1.33. Description is 12px Noto Sans Variable weight 400, line-height 1.60, color `oklch(0.56 0.021 213.5)`. Top-right close button is a 24×24px ghost icon button with lucide `XIcon` at `size-4`. Enter animation: `fade-in + zoom-in from 95%` over 240ms; exit reverses at the same duration."

### Iteration Guide

1. **Never soften the corners first.** If a component feels aggressive, adjust spacing, weight, or motion before touching `rounded-none`. The sharp corners are load-bearing.
2. **Reach for tokens, not raw values.** Any new color must be added as an OKLCH CSS variable in `src/styles/base.css` before it is consumed. The sole hex exception is `#161515` in `morph-panel.tsx`.
3. **Density first, then breathing room.** Default to `h-8` / `text-xs` / `gap-2.5` and only loosen to `h-9` / `text-sm` / `gap-4` when a surface is explicitly hero-scale (dialogs, template library).
4. **Shadows are earned.** If a proposed component gets `shadow-lg` or larger, it must be a floating overlay (popover, dialog, morph panel). Inline cards and panels use `border` only.
5. **Serif for meaning, sans for function.** Headlines, card titles, and data-rich captions go in Noto Serif Variable. Every button label, input, and tab goes in Noto Sans Variable. Mono is only for numeric metadata.
6. **Motion with intent.** All custom animations use `cubic-bezier(0.22, 1, 0.36, 1)`. Taps are 160 ms; panels are 240 ms; morphs are 350 ms. Always wire up `useReducedMotion()` for any sequence longer than a single transition.
7. **Focus is always 1 px.** Do not invent 2 px or 3 px focus rings. The whole system is calibrated around `ring-1 ring-ring/50`; thickening the ring breaks visual parity.
8. **Six button variants is the whole vocabulary.** If a design calls for a seventh, it almost certainly means an existing variant with a different size or icon. Refuse the temptation to add `info`, `warning`, or `success` — Quill does not have them.
