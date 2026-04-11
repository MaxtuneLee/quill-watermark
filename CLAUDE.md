# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Toolchain: Vite+ (`vp`)

This project uses **Vite+**, a unified toolchain wrapping Vite, Rolldown, Vitest, Oxlint, Oxfmt, and tsdown behind a single `vp` CLI. **Never call `pnpm`, `npm`, `yarn`, `vite`, `vitest`, or `oxlint` directly** — always go through `vp`. See `AGENTS.md` for the full rationale.

| Task                      | Command                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| Install deps              | `vp install`                                                         |
| Dev server                | `vp dev`                                                             |
| Format + lint + typecheck | `vp check` (type-aware lint is on by default — no extra flag needed) |
| Lint only                 | `vp lint`                                                            |
| Format only               | `vp fmt`                                                             |
| Run all tests             | `vp test`                                                            |
| Run a single test file    | `vp test path/to/file.test.ts`                                       |
| Run tests matching a name | `vp test -t "fragment of test name"`                                 |
| Production build          | `vp build` (runs `tsc` first, then `vp build`)                       |
| Preview built output      | `vp preview`                                                         |

Before submitting changes, the repo convention is to run **both** `vp check` and `vp test`.

Important gotchas:

- `vp dev`/`vp build`/`vp test` always invoke the Vite+ built-in, not `package.json` scripts of the same name. To run a custom `package.json` script, use `vp run <script>`.
- Test utilities must be imported from `vite-plus/test`, e.g. `import { expect, test, vi } from "vite-plus/test"`. Do not add `vitest` as a dependency.
- `defineConfig` comes from `vite-plus`, not `vite`.
- Use `vp dlx` instead of `npx`/`pnpm dlx` for one-off binaries.
- `vp staged` is wired to `vp check --fix` via `vite.config.ts`.

## Path alias

`@/`_ resolves to `src/_`(defined in both`tsconfig.json`and`vite.config.ts`). Prefer `@/...` imports over long relative paths.

## Architecture

Quill Watermark is a client-only React 19 app that takes an input photo, extracts its EXIF metadata, composes a watermark via a declarative template, renders it onto a canvas, and exports. The important boundary is between the **template engine** (pure, testable, canvas-driven) and the **features layer** (React UI + interaction state).

### Data flow

1. **Import** (`src/app/app-state.ts`) — Jotai atoms own the entire session state machine: `library → editor-pending-image → editor`. An imported `File` and its normalized metadata become an `EditorInstance`.
2. **Metadata** (`src/services/metadata/`) — `exifr` extracts EXIF, then `extract-metadata.ts` normalizes it into a stable `NormalizedMetadata` shape that templates consume. Missing fields degrade gracefully to empty/placeholder states.
3. **Template resolution** (`src/template-engine/`) — A three-stage pipeline that is deliberately pure:

- `schema/resolve-fields.ts` — binds template field definitions to `TemplateFieldSources` (metadata, user input, overrides, style controls) and produces a `ResolvedFieldMap`.
- `schema/create-data-cards.ts` — groups resolved fields into togglable "data cards" that the editor side panel surfaces.
- `presets/resolve-preset.ts` — picks a layout preset for the current aspect ratio (1:1, 4:5, 3:2, 16:9).
- `layout/resolve-layout.ts` — takes the preset layout tree (`TemplateLayoutNode`) and computes measured positions via `measure-text.ts`.
- `render/render-canvas.ts` — rasterizes the laid-out tree onto an `HTMLCanvasElement`. This is the only place that touches `CanvasRenderingContext2D`.

4. **Templates** (`src/template-engine/templates/`) — Each template file exports a `WatermarkTemplate`: field definitions, default layout tree, cover asset, and per-preset layout overrides. `shared.ts` holds common helpers. `index.ts` is the registry; tests live in `index.test.ts`.
5. **Export** (`src/services/export/`) — Takes the rendered canvas and encodes PNG/JPEG/WEBP at 1x/2x/3x.

### Session state

All interaction state lives in Jotai atoms in `src/app/app-state.ts`. The session is a discriminated union (`LibrarySession | EditorPendingImageSession | EditorSession`) and every mutation goes through an `EditorAction` reducer-style atom. When a template is switched, style-control values, field overrides, and card-enabled flags are re-initialized from the new template's definitions — do not hold template-scoped state outside this file.

### Feature UI

- `src/features/template-library/` — the landing screen picker.
- `src/features/editor/` — the editor shell, preview stage, and the left (style) / right (metadata) panels. Panel state shape is defined in `features/editor/panels/panel-state.ts` and imported back into `app-state.ts`; keep them in sync.

### UI primitives

Components in `src/components/ui/` are a hybrid of **@base-ui/react**, **radix-ui**, and **shadcn/ui** (configured as `style: "base-lyra"`, `baseColor: "mist"` in `components.json`). Follow the design language documented in `design.md` — in particular: OKLCH tokens only (the sole hex exception is `#161515` in `morph-panel.tsx`), `rounded-none` for editor primitives, `h-8` / `text-xs` as the default control size, and the house easing `cubic-bezier(0.22, 1, 0.36, 1)` for all motion via `motion/react`.

### Brand direction

`.impeccable.md` defines the product's editorial-desk aesthetic: dark mode primary, `Noto Serif` for titles with `Noto Sans` for controls, sparse saturated-yellow accent. New UI should honor these principles — the interface frames the artwork, it does not compete with it.

## Testing

- Runner: Vitest (via `vp test`), jsdom environment, setup file at `src/test/setup.ts`.
- Test files sit next to the code they cover (e.g. `resolve-layout.test.ts`, `render-canvas.test.ts`, `app-state.test.ts`).
- The template engine is the most densely tested area — any change to `schema/`, `layout/`, `presets/`, or `render/` should run the engine tests first.
- Import from `vite-plus/test`, not `vitest`.

## TypeScript

Strict mode with `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, and `noFallthroughCasesInSwitch` all enabled. `verbatimModuleSyntax` means type-only imports must use `import type { ... }` — the lint will flag mixed imports.

## Extending templates

When adding a new template:

1. Create `src/template-engine/templates/your-template.ts` following the shape of existing templates (look at `classic-info-strip.ts` for a full-featured example or `minimal-info-strip.ts` for a lean one).
2. Reuse helpers from `templates/shared.ts` and the existing `schema` / `layout` pipeline — do not fork rendering.
3. Register it in `templates/index.ts`.
4. Add coverage in `templates/index.test.ts` and, if the layout is non-trivial, a `resolve-layout` case.
5. Cover assets for the template library picker live alongside each template file.
