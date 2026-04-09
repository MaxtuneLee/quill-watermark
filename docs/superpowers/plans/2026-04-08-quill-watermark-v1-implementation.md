# Quill Watermark V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the v1 template-first photo watermark web app with a reusable constraint-based template engine, categorized template library, panel-driven desktop/mobile editor, EXIF ingestion, local export, and social aspect-ratio presets.

**Architecture:** Migrate the starter app to a React + TypeScript single-page workspace with a clear split between UI features, template-engine domain logic, and browser services. Keep the template engine declarative and framework-agnostic: schema resolution, valibot-backed schema validation, preset resolution, layout resolution, and canvas rendering run as pure modules, while React + Jotai orchestrate state, panels, and preview. Build the local design system on top of Base UI headless primitives so desktop and mobile controls share accessibility and interaction behavior without constraining the visual language. Treat metadata extraction and reverse geocoding as service layers so the local-first flow stays intact when enhancements are unavailable, and isolate multiline text layout behind a dedicated Pretext adapter.

**Tech Stack:** Vite+, React, React DOM, Jotai, Valibot, `@base-ui/react`, `@vitejs/plugin-react-oxc`, `vite-plus/test`, Testing Library, jsdom, `exifr`, `simple-icons`, `@chenglou/pretext`, Oxc formatter/linter via `vp fmt` / `vp lint` / `vp check`, `lucide-animated` icons added locally via the shadcn registry workflow, optional reverse-geocoding via fetch + env-configured endpoint.

---

## Preconditions

- The current workspace snapshot does not include a `.git/` directory. Before executing the commit steps below, switch to the real repository checkout or initialize the missing git metadata; every task below assumes normal `git add` / `git commit` commands are available.
- Keep using `vp` for installs, checks, builds, and tests. Do not call `pnpm`, `npm`, `npx`, `vitest`, or `vite` directly.
- Use Vite+ wrappers for static analysis. Formatting and linting should remain `vp fmt`, `vp lint`, and `vp check`, which map to the Oxc toolchain already required by this repo.
- Add `.superpowers/` to `.gitignore` during the first task so brainstorming artifacts stay out of source control.

## Proposed File Structure

### App Shell and Styling

- Modify: `package.json`
  Add runtime and dev dependencies required for React, testing, EXIF parsing, and icon sourcing.
- Modify: `tsconfig.json`
  Enable JSX typing and include test/setup files under `src/`.
- Modify: `vite.config.ts`
  Add the React plugin and test configuration.
- Modify: `.gitignore`
  Ignore `.superpowers/` artifacts.
- Create: `src/main.tsx`
  React entrypoint.
- Create: `src/app/App.tsx`
  Root screen coordinator for template library vs editor.
- Create: `src/app/app-state.ts`
  Jotai atoms, derived atoms, and write-only action helpers for template selection, imported image state, and editor instance state.
- Create: `src/app/providers.tsx`
  Top-level Jotai provider wrapper and future cross-cutting providers.
- Create: `src/styles/tokens.css`
  Color, spacing, typography, radius, and surface tokens.
- Create: `src/styles/base.css`
  Global reset, layout primitives, and app-level styling.
- Create: `src/components/ui/button.tsx`
  Base button primitive styled for the Quill workspace.
- Create: `src/components/ui/tabs.tsx`
  Base UI-backed tab primitives for mobile `Data` / `Style` switching and any future segmented navigation.
- Create: `src/components/ui/select.tsx`
  Base UI-backed select primitive for ratio, font-style, and brand-position controls.
- Create: `src/components/ui/slider.tsx`
  Base UI-backed slider primitive for padding, corner radius, and other ranged controls.
- Create: `src/components/ui/switch.tsx`
  Base UI-backed switch primitive for card visibility and feature toggles.
- Create: `src/components/ui/dialog.tsx`
  Base UI-backed dialog primitive for confirmation or unsupported-action prompts.
- Create: `src/components/ui/index.ts`
  Re-export the local UI primitives so features never import directly from Base UI.
- Create: `src/icons/ui-icons.tsx`
  Local general-purpose icon exports backed by selected `lucide-animated` components added through the shadcn registry workflow.
- Create: `src/icons/brand-icons.ts`
  Brand/camera icon helpers backed by `simple-icons`.
- Delete or replace: `src/main.ts`, `src/counter.ts`, `src/style.css`
  Remove starter Vite template artifacts once the React shell is in place.

### Template Engine

- Create: `src/template-engine/types.ts`
  Shared types for templates, fields, controls, presets, layout nodes, and instance state.
- Create: `src/template-engine/schema/resolve-fields.ts`
  Resolve auto/manual/placeholder/fallback field values.
- Create: `src/template-engine/schema/validators.ts`
  Valibot validators for template schema definitions, control payloads, and field-group metadata.
- Create: `src/template-engine/schema/formatters.ts`
  Format ISO, aperture, shutter, focal length, date, and coordinates.
- Create: `src/template-engine/schema/create-data-cards.ts`
  Build UI-facing data card models from resolved schema output.
- Create: `src/template-engine/presets/resolve-preset.ts`
  Merge template defaults with output preset overrides.
- Create: `src/template-engine/layout/types.ts`
  Resolved box and layout result types.
- Create: `src/template-engine/layout/measure-text.ts`
  Wrap `@chenglou/pretext` so multiline measurement and line breaking stay isolated behind one adapter.
- Create: `src/template-engine/layout/resolve-layout.ts`
  Resolve container boxes, image-fit regions, and text block positions.
- Create: `src/template-engine/render/load-image-asset.ts`
  Decode uploaded images and icon/image assets for preview/export.
- Create: `src/template-engine/render/render-canvas.ts`
  Draw resolved template instances onto a 2D canvas.
- Create: `src/template-engine/templates/index.ts`
  Template registry exports.
- Create: `src/template-engine/templates/*.ts`
  Eight built-in template definitions, one file per template.

### Features

- Create: `src/features/template-library/TemplateLibraryScreen.tsx`
  Categorized template browsing screen.
- Create: `src/features/template-library/template-library.css`
  Template library styles.
- Create: `src/features/editor/EditorScreen.tsx`
  Desktop/mobile editor entry shell.
- Create: `src/features/editor/PreviewStage.tsx`
  Canvas stage with zoom, fit, and loading/error states.
- Create: `src/features/editor/test-fixtures.ts`
  Shared editor props/builders for component tests.
- Create: `src/features/editor/panels/StylePanel.tsx`
  Left-column or mobile style controls.
- Create: `src/features/editor/panels/DataPanel.tsx`
  Right-column or mobile field cards and manual overrides.
- Create: `src/features/editor/panels/ExportPanel.tsx`
  Export format, multiplier, and share/download actions.
- Create: `src/features/editor/panels/panel-state.ts`
  Panel-specific selectors and action helpers.

### Services

- Create: `src/services/metadata/types.ts`
  Raw extractor result and normalized metadata types.
- Create: `src/services/metadata/extract-metadata.ts`
  Browser EXIF/GPS reader built on `exifr`.
- Create: `src/services/metadata/normalize-metadata.ts`
  Normalize raw EXIF keys into app-level field names.
- Create: `src/services/geocode/reverse-geocode.ts`
  Optional reverse-geocoding client with graceful failure.
- Create: `src/services/geocode/providers.ts`
  Provider selection and disable/no-op behavior.
- Create: `src/services/export/export-image.ts`
  Blob generation and file download naming.
- Create: `src/services/export/share-image.ts`
  Web Share API integration with fallback.
- Create: `src/config/env.ts`
  Read optional runtime configuration such as geocoding endpoint.
- Create: `.env.example`
  Document optional geocoding configuration.

### Tests

- Create: `src/test/setup.ts`
  Testing Library and DOM matchers.
- Create: `src/app/App.test.tsx`
- Create: `src/template-engine/templates/index.test.ts`
- Create: `src/features/template-library/TemplateLibraryScreen.test.tsx`
- Create: `src/services/metadata/normalize-metadata.test.ts`
- Create: `src/services/metadata/extract-metadata.test.ts`
- Create: `src/template-engine/schema/resolve-fields.test.ts`
- Create: `src/template-engine/schema/create-data-cards.test.ts`
- Create: `src/template-engine/presets/resolve-preset.test.ts`
- Create: `src/template-engine/layout/resolve-layout.test.ts`
- Create: `src/template-engine/render/render-canvas.test.ts`
- Create: `src/features/editor/EditorScreen.test.tsx`
- Create: `src/features/editor/PreviewStage.test.tsx`
- Create: `src/services/geocode/reverse-geocode.test.ts`

## Task 1: Replace the Starter Template with a React App Shell

**Files:**

- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `vite.config.ts`
- Modify: `.gitignore`
- Modify: `index.html`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/app-state.ts`
- Create: `src/app/providers.tsx`
- Create: `src/styles/tokens.css`
- Create: `src/styles/base.css`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/tabs.tsx`
- Create: `src/components/ui/select.tsx`
- Create: `src/components/ui/slider.tsx`
- Create: `src/components/ui/switch.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/index.ts`
- Create: `src/icons/ui-icons.tsx`
- Create: `src/icons/brand-icons.ts`
- Create: `src/test/setup.ts`
- Test: `src/app/App.test.tsx`
- Delete: `src/main.ts`
- Delete: `src/counter.ts`
- Delete: `src/style.css`

- [ ] **Step 1: Add the runtime and test dependencies**

Run:

```bash
vp add react react-dom jotai valibot @base-ui/react exifr simple-icons @chenglou/pretext @vitejs/plugin-react-oxc
vp add -D @types/react @types/react-dom jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected: dependencies are added to `package.json` and lockfile without using `pnpm` directly.

- [ ] **Step 2: Write the failing root app test**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vite-plus/test";
import { App } from "./App";

test("shows the template library before a template is selected", () => {
  render(<App />);

  expect(screen.getByRole("heading", { name: /template library/i })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: /editor/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 3: Run the app-shell test to verify it fails**

Run: `vp test run src/app/App.test.tsx`

Expected: FAIL because `src/app/App.tsx`, `src/main.tsx`, and the React test setup do not exist yet.

- [ ] **Step 4: Implement the React bootstrap and global shell**

Create `src/main.tsx` so the old DOM-string starter is removed:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import { AppProviders } from "./app/providers";
import "./styles/tokens.css";
import "./styles/base.css";

ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);
```

Create `src/app/App.tsx` with a minimal library-first shell backed by Jotai:

```tsx
import { useAtomValue } from "jotai";
import { appScreenAtom } from "./app-state";

export function App() {
  const screen = useAtomValue(appScreenAtom);

  return (
    <main className="app-shell">
      <header className="app-header">
        <span className="app-brand">QUILL STUDIO</span>
      </header>
      {screen === "library" ? (
        <section aria-label="Template Library">
          <h1>Template Library</h1>
        </section>
      ) : (
        <section aria-label="Editor">
          <h1>Editor</h1>
        </section>
      )}
    </main>
  );
}
```

- [ ] **Step 5: Configure Vite+, React, and test setup**

Update `vite.config.ts` with the React plugin and jsdom test setup:

```ts
import react from "@vitejs/plugin-react-oxc";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
  staged: {
    "*": "vp check --fix",
  },
  lint: { options: { typeAware: true, typeCheck: true } },
});
```

Also:

- add `.superpowers/` to `.gitignore`
- switch `tsconfig.json` to `jsx: "react-jsx"`
- create `src/test/setup.ts` with `import "@testing-library/jest-dom/vitest";`
- create `src/app/providers.tsx` with a Jotai `<Provider>`
- create the local `src/components/ui/*` wrappers on top of Base UI, even if the first pass only covers Button, Tabs, Select, Slider, Switch, and Dialog
- create `src/icons/ui-icons.tsx` and `src/icons/brand-icons.ts` as the local icon boundary
- when general-purpose icons are needed, add them locally with `vp dlx shadcn add @lucide-animated/<icon-name>` and re-export them from `src/icons/ui-icons.tsx`

- [ ] **Step 6: Run the root test and then the full project checks**

Run: `vp test run src/app/App.test.tsx`

Expected: PASS

Run: `vp check`

Expected: PASS with no type, lint, or format issues.

- [ ] **Step 7: Commit the bootstrap slice**

```bash
git add -A .gitignore package.json pnpm-lock.yaml tsconfig.json vite.config.ts index.html src/main.ts src/counter.ts src/style.css src/main.tsx src/app/App.tsx src/app/app-state.ts src/app/providers.tsx src/styles/tokens.css src/styles/base.css src/components/ui src/icons/ui-icons.tsx src/icons/brand-icons.ts src/test/setup.ts src/app/App.test.tsx
git commit -m "feat(app): replace starter template with react shell"
```

## Task 2: Add the Template Registry and Library Screen

**Files:**

- Create: `src/template-engine/types.ts`
- Create: `src/template-engine/templates/index.ts`
- Create: `src/template-engine/templates/classic-info-strip.ts`
- Create: `src/template-engine/templates/minimal-info-strip.ts`
- Create: `src/template-engine/templates/centered-device-mark.ts`
- Create: `src/template-engine/templates/centered-brand-meta.ts`
- Create: `src/template-engine/templates/full-screen-signature.ts`
- Create: `src/template-engine/templates/quiet-white-margin.ts`
- Create: `src/template-engine/templates/story-cover.ts`
- Create: `src/template-engine/templates/framed-editorial-card.ts`
- Create: `src/features/template-library/TemplateLibraryScreen.tsx`
- Create: `src/features/template-library/template-library.css`
- Modify: `src/app/App.tsx`
- Modify: `src/app/app-state.ts`
- Test: `src/template-engine/templates/index.test.ts`
- Test: `src/features/template-library/TemplateLibraryScreen.test.tsx`

- [ ] **Step 1: Write the failing registry and library-screen tests**

`src/template-engine/templates/index.test.ts`

```ts
import { expect, test } from "vite-plus/test";
import { templates } from "./index";

test("ships at least eight built-in templates across six families", () => {
  expect(templates).toHaveLength(8);
  expect(new Set(templates.map((template) => template.family)).size).toBeGreaterThanOrEqual(6);
});
```

`src/features/template-library/TemplateLibraryScreen.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vite-plus/test";
import { TemplateLibraryScreen } from "./TemplateLibraryScreen";
import { templates } from "../../template-engine/templates";

test("groups templates by family and emits selection", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();

  render(<TemplateLibraryScreen templates={templates} onSelect={onSelect} />);

  await user.click(screen.getByRole("button", { name: /use template classic info strip/i }));

  expect(screen.getByRole("heading", { name: /info bar/i })).toBeInTheDocument();
  expect(onSelect).toHaveBeenCalledWith("classic-info-strip");
});
```

- [ ] **Step 2: Run the new template-library tests to verify they fail**

Run: `vp test run src/template-engine/templates/index.test.ts src/features/template-library/TemplateLibraryScreen.test.tsx`

Expected: FAIL because the registry files and library screen do not exist.

- [ ] **Step 3: Define the shared template types**

Create `src/template-engine/types.ts` with the core shapes used by the whole app:

```ts
export type TemplateFamily =
  | "Info Bar"
  | "Center Brand"
  | "Full Overlay"
  | "Minimal White Space"
  | "Social Cover"
  | "Card Frame";

export type TemplateDefinition = {
  id: string;
  name: string;
  family: TemplateFamily;
  cover: string;
  description: string;
  canvas: CanvasDefinition;
  schema: FieldSchema;
  layout: LayoutNode;
  presets: PresetDefinition[];
  controls: ControlDefinition[];
};
```

- [ ] **Step 4: Author the eight built-in templates and the registry**

For each template file, export a concrete `TemplateDefinition` using existing assets in `public/templates/*` for cover thumbnails. Keep the first version intentionally lean: enough schema, layout, presets, and controls to validate the engine without overfitting.

`src/template-engine/templates/index.ts`

```ts
import { classicInfoStrip } from "./classic-info-strip";
import { minimalInfoStrip } from "./minimal-info-strip";
import { centeredDeviceMark } from "./centered-device-mark";
import { centeredBrandMeta } from "./centered-brand-meta";
import { fullScreenSignature } from "./full-screen-signature";
import { quietWhiteMargin } from "./quiet-white-margin";
import { storyCover } from "./story-cover";
import { framedEditorialCard } from "./framed-editorial-card";

export const templates = [
  classicInfoStrip,
  minimalInfoStrip,
  centeredDeviceMark,
  centeredBrandMeta,
  fullScreenSignature,
  quietWhiteMargin,
  storyCover,
  framedEditorialCard,
];
```

- [ ] **Step 5: Implement the template library UI**

Create `TemplateLibraryScreen.tsx` to:

- group templates by `family`
- render card grids
- show tags for family and aspect support
- provide a `Use Template` button per card

Use the local Base UI-backed button and tab-like segmented controls where appropriate, rather than raw HTML controls, so the design system starts paying off immediately.

Wire `App.tsx` so selecting a template moves the Jotai state from `library` to `editor-pending-image`.

- [ ] **Step 6: Run the library tests and a smoke build**

Run: `vp test run src/template-engine/templates/index.test.ts src/features/template-library/TemplateLibraryScreen.test.tsx`

Expected: PASS

Run: `vp build`

Expected: PASS and produce a production build without starter-template remnants.

- [ ] **Step 7: Commit the library slice**

```bash
git add src/template-engine/types.ts src/template-engine/templates src/features/template-library src/app/App.tsx src/app/app-state.ts src/template-engine/templates/index.test.ts src/features/template-library/TemplateLibraryScreen.test.tsx
git commit -m "feat(library): add built-in template registry and picker"
```

## Task 3: Support Image Import and EXIF Normalization

**Files:**

- Create: `src/services/metadata/types.ts`
- Create: `src/services/metadata/extract-metadata.ts`
- Create: `src/services/metadata/normalize-metadata.ts`
- Create: `src/features/editor/EditorScreen.tsx`
- Create: `src/features/editor/ImageImporter.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/app-state.ts`
- Test: `src/services/metadata/normalize-metadata.test.ts`
- Test: `src/services/metadata/extract-metadata.test.ts`
- Test: `src/features/editor/EditorScreen.test.tsx`

- [ ] **Step 1: Write the failing metadata and editor-entry tests**

`src/services/metadata/normalize-metadata.test.ts`

```ts
import { expect, test } from "vite-plus/test";
import { normalizeMetadata } from "./normalize-metadata";

test("maps raw exif values into the app metadata shape", () => {
  const normalized = normalizeMetadata({
    Make: "Leica",
    Model: "Q2",
    ISO: 400,
    FNumber: 1.7,
    ExposureTime: 1 / 125,
    FocalLength: 28,
  });

  expect(normalized.camera.make).toBe("Leica");
  expect(normalized.camera.model).toBe("Q2");
  expect(normalized.exposure.iso).toBe(400);
});
```

`src/features/editor/EditorScreen.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vite-plus/test";
import { EditorScreen } from "./EditorScreen";
import { templates } from "../../template-engine/templates";

test("shows an image importer before a photo is loaded", () => {
  render(<EditorScreen template={templates[0]} instance={null} dispatch={vi.fn()} />);
  expect(screen.getByRole("button", { name: /add photo/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run: `vp test run src/services/metadata/normalize-metadata.test.ts src/features/editor/EditorScreen.test.tsx`

Expected: FAIL because metadata services and the editor shell are not implemented.

- [ ] **Step 3: Implement metadata extraction and normalization**

Create `extract-metadata.ts` as the browser entrypoint:

```ts
import * as exifr from "exifr";
import { normalizeMetadata } from "./normalize-metadata";

export async function extractMetadata(file: File) {
  const raw = await exifr.parse(file, { gps: true, tiff: true, xmp: true });
  return normalizeMetadata(raw ?? {});
}
```

Create `normalize-metadata.ts` so all downstream code sees stable keys:

```ts
export function normalizeMetadata(raw: Record<string, unknown>): NormalizedMetadata {
  return {
    camera: {
      make: String(raw.Make ?? ""),
      model: String(raw.Model ?? ""),
      lens: String(raw.LensModel ?? raw.LensInfo ?? ""),
    },
    exposure: {
      iso: Number(raw.ISO ?? 0),
      aperture: Number(raw.FNumber ?? 0),
      shutterSeconds: Number(raw.ExposureTime ?? 0),
      focalLength: Number(raw.FocalLength ?? 0),
    },
    location: {
      latitude: Number(raw.latitude ?? raw.GPSLatitude ?? Number.NaN),
      longitude: Number(raw.longitude ?? raw.GPSLongitude ?? Number.NaN),
    },
    shotAt: raw.DateTimeOriginal ? new Date(String(raw.DateTimeOriginal)) : null,
  };
}
```

- [ ] **Step 4: Implement the editor entry shell and image importer**

`EditorScreen.tsx` should render one of two states:

- no image yet: import CTA and template read-only summary
- image loaded: preview stage + panels

`ImageImporter.tsx` should:

- accept a single image
- dispatch loading state
- call `extractMetadata`
- store the source file and normalized metadata in app state

- [ ] **Step 5: Run the metadata and editor tests**

Run: `vp test run src/services/metadata/normalize-metadata.test.ts src/services/metadata/extract-metadata.test.ts src/features/editor/EditorScreen.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit the metadata ingestion slice**

```bash
git add src/services/metadata src/features/editor/EditorScreen.tsx src/features/editor/ImageImporter.tsx src/app/App.tsx src/app/app-state.ts src/services/metadata/normalize-metadata.test.ts src/services/metadata/extract-metadata.test.ts src/features/editor/EditorScreen.test.tsx
git commit -m "feat(metadata): import a photo and normalize exif data"
```

## Task 4: Resolve Fields, Placeholders, and Data Card Modes

**Files:**

- Create: `src/template-engine/schema/resolve-fields.ts`
- Create: `src/template-engine/schema/validators.ts`
- Create: `src/template-engine/schema/formatters.ts`
- Create: `src/template-engine/schema/create-data-cards.ts`
- Modify: `src/template-engine/types.ts`
- Modify: `src/template-engine/templates/*.ts`
- Modify: `src/app/app-state.ts`
- Test: `src/template-engine/schema/resolve-fields.test.ts`
- Test: `src/template-engine/schema/create-data-cards.test.ts`

- [ ] **Step 1: Write the failing schema-resolution tests**

`src/template-engine/schema/resolve-fields.test.ts`

```ts
import { expect, test } from "vite-plus/test";
import { resolveFields } from "./resolve-fields";

test("prefers auto values and falls back to placeholder text", () => {
  const resolved = resolveFields({
    schema: {
      fields: {
        authorLine: {
          kind: "text",
          source: "user",
          editable: true,
          placeholder: "By {{user.authorName}}",
          fallback: [{ whenMissing: ["user.authorName"], use: "By Anonymous" }],
        },
      },
    },
    sources: {
      user: {},
      exif: {},
      gps: {},
      derived: {},
      afilmory: {},
      brand: {},
    },
    overrides: {},
  });

  expect(resolved.authorLine.value).toBe("By Anonymous");
  expect(resolved.authorLine.mode).toBe("placeholder");
});
```

`src/template-engine/schema/create-data-cards.test.ts`

```ts
import { expect, test } from "vite-plus/test";
import { createDataCards } from "./create-data-cards";

test("maps resolved fields into auto, placeholder, and manual data-card states", () => {
  const cards = createDataCards({
    groups: [
      {
        id: "camera-model",
        title: "Camera Model",
        bindings: ["cameraModel"],
      },
    ],
    resolvedFields: {
      cameraModel: { value: "Leica Q2", mode: "auto" },
    },
  });

  expect(cards[0]).toMatchObject({
    title: "Camera Model",
    mode: "auto",
    previewValue: "Leica Q2",
  });
});
```

- [ ] **Step 2: Run the resolver tests to verify they fail**

Run: `vp test run src/template-engine/schema/resolve-fields.test.ts src/template-engine/schema/create-data-cards.test.ts`

Expected: FAIL because the schema modules do not exist.

- [ ] **Step 3: Implement the field resolver**

Use a resolver contract like:

```ts
export function resolveFields(input: ResolveFieldsInput): ResolvedFieldMap {
  // 1. read source value
  // 2. apply manual override if present
  // 3. interpolate placeholder string
  // 4. apply formatter chain
  // 5. choose mode: auto | placeholder | manual
}
```

Support exactly the v1 rules:

- interpolation
- formatting
- fallback
- manual overrides
- no general expression language

Use Valibot here to validate the schema input and field-group metadata before resolution. Keep the validation layer narrow and explicit; do not turn the runtime into a dynamic expression system.

- [ ] **Step 4: Implement UI-facing data card generation**

Generate cards with stable state so the editor can show:

- enabled/disabled
- auto/manual/placeholder mode
- preview value
- required-by-template lock behavior

Also update the template definitions so each built-in template declares the field groups it uses.

- [ ] **Step 5: Store resolved fields and cards in app state**

Update `app-state.ts` so changing metadata or manual values recomputes:

- `resolvedFields`
- `dataCards`

This recomputation should stay in pure helper functions so it is unit-testable.

- [ ] **Step 6: Run the schema tests and a targeted UI smoke test**

Run: `vp test run src/template-engine/schema/resolve-fields.test.ts src/template-engine/schema/create-data-cards.test.ts src/features/editor/EditorScreen.test.tsx`

Expected: PASS

- [ ] **Step 7: Commit the schema/data-card slice**

```bash
git add src/template-engine/schema src/template-engine/types.ts src/template-engine/templates src/app/app-state.ts src/template-engine/schema/resolve-fields.test.ts src/template-engine/schema/create-data-cards.test.ts src/features/editor/EditorScreen.test.tsx
git commit -m "feat(schema): resolve template fields and card states"
```

## Task 5: Implement Preset Resolution and Constraint-Based Layout

**Files:**

- Create: `src/template-engine/presets/resolve-preset.ts`
- Create: `src/template-engine/layout/types.ts`
- Create: `src/template-engine/layout/measure-text.ts`
- Create: `src/template-engine/layout/resolve-layout.ts`
- Modify: `src/template-engine/types.ts`
- Modify: `src/template-engine/templates/*.ts`
- Test: `src/template-engine/presets/resolve-preset.test.ts`
- Test: `src/template-engine/layout/resolve-layout.test.ts`

- [ ] **Step 1: Write the failing preset and layout tests**

`src/template-engine/presets/resolve-preset.test.ts`

```ts
import { expect, test } from "vite-plus/test";
import { resolvePreset } from "./resolve-preset";
import { classicInfoStrip } from "../templates/classic-info-strip";

test("applies 4:5 overrides without cloning a second template", () => {
  const preset = resolvePreset(classicInfoStrip, "4:5");

  expect(preset.canvas.width).toBe(4);
  expect(preset.canvas.height).toBe(5);
  expect(preset.overrides.length).toBeGreaterThan(0);
});
```

`src/template-engine/layout/resolve-layout.test.ts`

```ts
import { expect, test } from "vite-plus/test";
import { resolveLayout } from "./resolve-layout";

test("resolves cover image and metadata strip boxes inside the canvas", () => {
  const result = resolveLayout({
    canvas: { width: 1200, height: 1500, padding: 48 },
    layout: {
      id: "root",
      type: "stack",
      direction: "column",
      children: [
        { id: "photo", type: "image", binding: "photo" },
        { id: "meta", type: "text", binding: "cameraSummary" },
      ],
    },
    resolvedFields: {
      cameraSummary: { value: "ISO 200 • f/2.8 • 1/33 • 9 mm", mode: "auto" },
    },
  });

  expect(result.nodes.photo.frame.width).toBeGreaterThan(0);
  expect(result.nodes.meta.frame.y).toBeGreaterThan(result.nodes.photo.frame.y);
});
```

- [ ] **Step 2: Run the preset/layout tests to verify they fail**

Run: `vp test run src/template-engine/presets/resolve-preset.test.ts src/template-engine/layout/resolve-layout.test.ts`

Expected: FAIL because preset and layout resolvers are not implemented.

- [ ] **Step 3: Implement preset composition**

Use a narrow resolver that:

- starts from template defaults
- selects the requested preset
- applies only that preset's override set
- falls back to `original` if the preset is unavailable

```ts
export function resolvePreset(template: TemplateDefinition, presetId: string) {
  const selected = template.presets.find((preset) => preset.id === presetId) ?? template.presets[0];
  return {
    canvas: applyCanvasOverride(template.canvas, selected.canvasSize),
    overrides: selected.overrides,
  };
}
```

- [ ] **Step 4: Implement the layout resolver and measurement adapter**

Create `measure-text.ts` as a small adapter around `@chenglou/pretext`. Keep the Pretext dependency contained here so the rest of the engine consumes normalized measurement results instead of package-specific APIs.

`resolve-layout.ts` should:

- calculate canvas-safe bounds
- resolve container children in order
- apply gap/padding/alignment
- compute image fit boxes for `cover` / `contain`
- compute text block width/height with max lines and truncation

- [ ] **Step 5: Add layout metadata to the built-in templates**

Update the eight template files so each template defines:

- root layout node
- container primitives
- preset overrides
- editor control mappings

Keep the first layout definitions minimal. The goal is shared engine coverage, not maximum template complexity.

- [ ] **Step 6: Run preset/layout tests and the full template-registry suite**

Run: `vp test run src/template-engine/presets/resolve-preset.test.ts src/template-engine/layout/resolve-layout.test.ts src/template-engine/templates/index.test.ts`

Expected: PASS

- [ ] **Step 7: Commit the layout-engine slice**

```bash
git add src/template-engine/presets src/template-engine/layout src/template-engine/types.ts src/template-engine/templates src/template-engine/presets/resolve-preset.test.ts src/template-engine/layout/resolve-layout.test.ts
git commit -m "feat(engine): add preset resolution and layout constraints"
```

## Task 6: Render Canvas Output and Add Export/Share Services

**Files:**

- Create: `src/template-engine/render/load-image-asset.ts`
- Create: `src/template-engine/render/render-canvas.ts`
- Create: `src/services/export/export-image.ts`
- Create: `src/services/export/share-image.ts`
- Create: `src/features/editor/PreviewStage.tsx`
- Create: `src/features/editor/PreviewStage.test.tsx`
- Modify: `src/features/editor/EditorScreen.tsx`
- Test: `src/template-engine/render/render-canvas.test.ts`
- Test: `src/features/editor/PreviewStage.test.tsx`

- [ ] **Step 1: Write the failing renderer and preview-stage tests**

`src/template-engine/render/render-canvas.test.ts`

```ts
import { expect, test, vi } from "vite-plus/test";
import { renderCanvas } from "./render-canvas";

test("draws background, image, and text in the expected order", async () => {
  const ctx = {
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
  } as unknown as CanvasRenderingContext2D;

  await renderCanvas(ctx, {
    canvas: { width: 1200, height: 1500, background: "#111111" },
    nodes: [
      {
        type: "image",
        frame: { x: 0, y: 0, width: 100, height: 100 },
        source: {} as CanvasImageSource,
      },
      { type: "text", frame: { x: 0, y: 120, width: 300, height: 24 }, value: "Leica Q2" },
    ],
  });

  expect(ctx.fillRect).toHaveBeenCalled();
  expect(ctx.drawImage).toHaveBeenCalled();
  expect(ctx.fillText).toHaveBeenCalledWith("Leica Q2", expect.any(Number), expect.any(Number));
});
```

- [ ] **Step 2: Run the renderer test to verify it fails**

Run: `vp test run src/template-engine/render/render-canvas.test.ts`

Expected: FAIL because the render module does not exist.

- [ ] **Step 3: Implement the canvas renderer**

`render-canvas.ts` should accept already-resolved layout output and paint it in order:

```ts
export async function renderCanvas(ctx: CanvasRenderingContext2D, scene: ResolvedScene) {
  paintBackground(ctx, scene.canvas);

  for (const node of scene.nodes) {
    if (node.type === "image") {
      paintImageNode(ctx, node);
      continue;
    }

    paintTextNode(ctx, node);
  }
}
```

- [ ] **Step 4: Implement preview/export/share services**

Create:

- `load-image-asset.ts` to decode uploaded files and SVG icons
- `export-image.ts` to return a `Blob` and file name
- `share-image.ts` to use `navigator.share` when available, with download fallback

`PreviewStage.tsx` should:

- render the preview canvas
- recompute on instance changes
- expose zoom and fit state only at the stage level

Use Jotai atoms/selectors for preview inputs instead of prop-drilling large instance objects through multiple panel layers.

- [ ] **Step 5: Run renderer and preview tests**

Run: `vp test run src/template-engine/render/render-canvas.test.ts src/features/editor/PreviewStage.test.tsx`

Expected: PASS

- [ ] **Step 6: Run a production build smoke test**

Run: `vp build`

Expected: PASS and produce static assets without runtime import errors.

- [ ] **Step 7: Commit the rendering/export slice**

```bash
git add src/template-engine/render src/services/export src/features/editor/PreviewStage.tsx src/features/editor/PreviewStage.test.tsx src/features/editor/EditorScreen.tsx src/template-engine/render/render-canvas.test.ts
git commit -m "feat(render): preview and export rendered templates"
```

## Task 7: Build the Desktop Editor Panels

**Files:**

- Modify: `src/features/editor/EditorScreen.tsx`
- Create: `src/features/editor/panels/StylePanel.tsx`
- Create: `src/features/editor/panels/DataPanel.tsx`
- Create: `src/features/editor/panels/ExportPanel.tsx`
- Create: `src/features/editor/panels/panel-state.ts`
- Create: `src/features/editor/editor.css`
- Create: `src/features/editor/test-fixtures.ts`
- Modify: `src/icons/ui-icons.tsx`
- Test: `src/features/editor/EditorScreen.test.tsx`

- [ ] **Step 1: Write the failing editor-interaction tests**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vite-plus/test";
import { EditorScreen } from "./EditorScreen";
import { makeLoadedEditorProps } from "./test-fixtures";

test("updates canvas padding from the style panel", async () => {
  const user = userEvent.setup();
  const props = makeLoadedEditorProps();

  render(<EditorScreen {...props} />);

  await user.clear(screen.getByLabelText(/canvas padding/i));
  await user.type(screen.getByLabelText(/canvas padding/i), "64");

  expect(props.dispatch).toHaveBeenCalledWith({
    type: "editor/set-control",
    payload: { id: "canvasPadding", value: 64 },
  });
});
```

- [ ] **Step 2: Run the editor interaction test to verify it fails**

Run: `vp test run src/features/editor/EditorScreen.test.tsx`

Expected: FAIL because the desktop panels and action wiring do not exist yet.

- [ ] **Step 3: Implement the desktop panel split**

`EditorScreen.tsx` should render:

- left column: style controls
- center: preview stage
- right column: export and data cards

Do not include template switching anywhere inside the editor. The current template may appear only as read-only status.

- [ ] **Step 4: Implement the style, data, and export panels**

Left-panel controls should cover only template-approved instance controls:

- output ratio
- image fit
- padding
- corner radius
- border/shadow
- typography theme
- brand position
- metadata order

Right-panel data cards should support:

- enabled toggle
- mode display
- manual override input
- placeholder visibility

Top-right export panel should support:

- format
- multiplier
- export button
- share fallback

Use the local icon layer in `src/icons/ui-icons.tsx` for general-purpose controls. Add the selected `lucide-animated` icons locally with the shadcn registry workflow, for example `vp dlx shadcn add @lucide-animated/<icon-name>`, then re-export them from `src/icons/ui-icons.tsx` so the rest of the app does not depend on registry-specific paths.

Build the interactive controls for these panels on top of the local Base UI wrappers in `src/components/ui/*`, not ad hoc DOM inputs. The feature layer should import only the wrapped primitives.

- [ ] **Step 5: Run the editor suite**

Run: `vp test run src/features/editor/EditorScreen.test.tsx`

Expected: PASS

Run: `vp check`

Expected: PASS

- [ ] **Step 6: Commit the desktop editor slice**

```bash
git add src/features/editor/EditorScreen.tsx src/features/editor/panels src/features/editor/editor.css src/features/editor/test-fixtures.ts src/features/editor/EditorScreen.test.tsx
git commit -m "feat(editor): add desktop panel-driven workspace"
```

## Task 8: Make the Editor Work on Mobile with Data/Style Panels

**Files:**

- Modify: `src/features/editor/EditorScreen.tsx`
- Modify: `src/features/editor/editor.css`
- Modify: `src/features/editor/panels/StylePanel.tsx`
- Modify: `src/features/editor/panels/DataPanel.tsx`
- Test: `src/features/editor/EditorScreen.test.tsx`

- [ ] **Step 1: Write the failing mobile-layout test**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vite-plus/test";
import { EditorScreen } from "./EditorScreen";
import { makeLoadedEditorProps } from "./test-fixtures";

test("shows data and style tabs on narrow screens without a template tab", () => {
  window.innerWidth = 390;
  render(<EditorScreen {...makeLoadedEditorProps()} />);

  expect(screen.getByRole("tab", { name: /data/i })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: /style/i })).toBeInTheDocument();
  expect(screen.queryByRole("tab", { name: /template/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the mobile test to verify it fails**

Run: `vp test run src/features/editor/EditorScreen.test.tsx -t "shows data and style tabs on narrow screens"`

Expected: FAIL because the mobile segmented layout is not implemented.

- [ ] **Step 3: Implement the responsive editor shell**

At mobile widths:

- keep the preview stage centered
- move panel selection to a bottom segmented control
- expose only `Data` and `Style`
- keep export in the top bar
- keep template status read-only

Do not create a separate mobile editor codepath with different business logic. Reuse the same selectors and dispatch actions.

- [ ] **Step 4: Re-run the mobile and desktop editor tests**

Run: `vp test run src/features/editor/EditorScreen.test.tsx`

Expected: PASS for both desktop and mobile expectations.

- [ ] **Step 5: Commit the responsive editor slice**

```bash
git add src/features/editor/EditorScreen.tsx src/features/editor/editor.css src/features/editor/panels/StylePanel.tsx src/features/editor/panels/DataPanel.tsx src/features/editor/EditorScreen.test.tsx
git commit -m "feat(editor): adapt the workspace for mobile"
```

## Task 9: Add Optional Geocoding, Final Polish, and Verification

**Files:**

- Create: `src/config/env.ts`
- Create: `src/services/geocode/providers.ts`
- Create: `src/services/geocode/reverse-geocode.ts`
- Create: `.env.example`
- Modify: `src/services/metadata/extract-metadata.ts`
- Modify: `src/app/app-state.ts`
- Modify: `src/features/editor/panels/DataPanel.tsx`
- Test: `src/services/geocode/reverse-geocode.test.ts`
- Modify: `docs/superpowers/specs/2026-04-08-quill-watermark-template-engine-design.md` (only if clarifying notes are needed after implementation learning)

- [ ] **Step 1: Write the failing reverse-geocode test**

```ts
import { expect, test } from "vite-plus/test";
import { reverseGeocode } from "./reverse-geocode";

test("returns null instead of throwing when the provider is unavailable", async () => {
  const result = await reverseGeocode({
    latitude: 30.7629,
    longitude: 120.7476,
    endpoint: "",
  });

  expect(result).toBeNull();
});
```

- [ ] **Step 2: Run the geocode test to verify it fails**

Run: `vp test run src/services/geocode/reverse-geocode.test.ts`

Expected: FAIL because the geocoding module does not exist.

- [ ] **Step 3: Implement the optional geocoding layer**

Create `env.ts` and `.env.example` so geocoding stays optional:

```ts
import * as v from "valibot";

const EnvSchema = v.object({
  VITE_REVERSE_GEOCODE_ENDPOINT: v.optional(v.string()),
});

export const env = v.parse(EnvSchema, import.meta.env);
```

`reverse-geocode.ts` should:

- no-op when no endpoint is configured
- return `null` on provider failure
- never block export or preview

`DataPanel.tsx` should let users manually fill location when auto/enhanced values are absent.

- [ ] **Step 4: Run the focused tests, then the full validation suite**

Run: `vp test run src/services/geocode/reverse-geocode.test.ts`

Expected: PASS

Run: `vp test`

Expected: PASS

Run: `vp check`

Expected: PASS

Run: `vp build`

Expected: PASS

- [ ] **Step 5: Manually verify the end-to-end flow**

Verify in the browser on both desktop and mobile widths:

- open template library
- choose a template
- import a photo with EXIF data
- see resolved field cards
- toggle between `original`, `1:1`, `4:5`, and `9:16`
- edit manual values
- export PNG/JPEG
- attempt share and confirm fallback

- [ ] **Step 6: Commit the final v1 slice**

```bash
git add .env.example src/config/env.ts src/services/geocode src/services/metadata/extract-metadata.ts src/app/app-state.ts src/features/editor/panels/DataPanel.tsx src/services/geocode/reverse-geocode.test.ts
git commit -m "feat(location): add optional geocoding with manual fallback"
```

## Final Verification Checklist

- [ ] `vp test`
- [ ] `vp check`
- [ ] `vp build`
- [ ] Desktop manual flow verified
- [ ] Mobile manual flow verified
- [ ] All 8 templates load from the shared registry
- [ ] Template switch is unavailable inside the editor
- [ ] Placeholder / auto / manual states are visible in data cards

## Notes for the Implementer

- Keep the template engine pure. Do not let React components own layout math, placeholder resolution, or rendering rules.
- Do not re-introduce template switching into the editor. That requirement has already been settled.
- Avoid a freeform scene graph UI. The spec and this plan both assume panel-driven instance editing only.
- Use `@chenglou/pretext` behind `src/template-engine/layout/measure-text.ts`. Keep the adapter boundary intact so the rest of the engine is not tied directly to Pretext-specific APIs.
- Keep Base UI usage behind `src/components/ui/*` wrappers. Do not scatter direct `@base-ui/react` imports throughout feature components.
- Reuse the existing `public/templates/*` images as template library covers until the project has dedicated cover assets.
