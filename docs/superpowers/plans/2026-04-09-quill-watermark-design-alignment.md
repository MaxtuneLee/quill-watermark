# Quill Watermark Design Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the editor so desktop and mobile match the approved design language and information architecture while preserving the current template-engine, metadata, preview, and export pipeline.

**Architecture:** Keep the existing engine and app-state layers as the source of truth, but rebuild the editor shell around them. Treat the redesign as a workspace refactor: desktop becomes a three-zone production console, mobile becomes a stacked preview-plus-tab editor, and preview/export must consume the same preset/control state so the rendered result matches what the user sees. Implement the redesign primarily through Tailwind utility classes and shadcn component variants instead of standalone feature CSS files.

**Tech Stack:** Vite+, React, Jotai, existing local UI wrappers in `src/components/ui/*`, template engine modules in `src/template-engine/*`, current preview/export services in `src/services/export/*`.

---

## Scope Notes

- This plan supersedes the visual and layout assumptions in Task 7 and Task 8 of `docs/superpowers/plans/2026-04-08-quill-watermark-v1-implementation.md`.
- The approved direction is: preserve the design language of the supplied desktop/mobile mockups, while allowing small structural adaptations to the current implementation.
- Do not continue adding editor features on top of the current workspace layout until the redesign shell is in place.
- The working tree may already contain partial Task 7 changes. Integrate or replace them deliberately; do not assume a clean slate.

## Proposed File Structure

### Workspace Shell

- Modify: `src/app/App.tsx`
  Add the explicit return-to-library path while keeping template switching out of the editor workspace itself.
- Modify: `src/app/app-state.ts`
  Expose an editor-exit action that returns to the library without resetting the whole app model incorrectly.
- Modify: `src/app/App.test.tsx`
  Verify library → editor → library navigation still works after the redesign.
- Modify: `src/features/editor/EditorScreen.tsx`
  Compose the desktop and mobile shells, wire top-bar actions, and keep template status read-only.

### Panels And Preview Chrome

- Modify: `src/features/editor/panels/StylePanel.tsx`
  Reorganize controls into the desktop left-rail structure and mobile `STYLE` tab structure.
- Modify: `src/features/editor/panels/DataPanel.tsx`
  Reorganize data cards into the desktop right-rail list and mobile `EXIF DATA` card grid.
- Modify: `src/features/editor/panels/ExportPanel.tsx`
  Match the desktop export block and mobile top export CTA behavior.
- Modify: `src/features/editor/panels/panel-state.ts`
  Narrow or rename controls so they match the mockups rather than the current generic set.
- Modify: `src/features/editor/PreviewStage.tsx`
  Make the center stage match the mockup framing, preview chrome, and preset/export readiness contract.
- Modify: `src/features/editor/PreviewStage.test.tsx`
  Cover preset application, preview/export parity, and readiness gating.

### Shared UI

- Modify: `src/components/ui/button.tsx`
  Support the bold yellow primary button and dark secondary tool buttons used in the mockups.
- Modify: `src/components/ui/tabs.tsx`
  Support the mobile bottom tab strip style.
- Modify: `src/components/ui/select.tsx`
  Support dense dark selects used in the desktop right rail.
- Modify: `src/components/ui/slider.tsx`
  Support the left-rail slider styling used by the desktop mockup.
- Modify: `src/components/ui/switch.tsx`
  Support the square/yellow enabled state used by data cards.
- Modify: `src/components/ui/input.tsx`
  Keep text entry aligned with the new visual system.
- Modify: `src/components/ui/index.ts`
  Re-export any wrapper changes.
- Modify: `src/icons/ui-icons.tsx`
  Add only the specific workspace icons needed by the approved layout.

### State And Tests

- Modify: `src/app/app-state.ts`
  Make preset selection, preview readiness, export readiness, and card state explicit so desktop/mobile shells read the same state.
- Modify: `src/app/app-state.test.ts`
  Add regression coverage for preset-driven preview state and export gating.
- Modify: `src/features/editor/EditorScreen.test.tsx`
  Replace the current generic workspace tests with design-driven layout and interaction expectations.
- Create or modify: `src/features/editor/test-fixtures.ts`
  Provide stable desktop/mobile workspace fixture builders.

### Styling Direction

- Apply workspace styling inline through Tailwind classes in the editor, panel, and library components.
- Express reusable visual states through shadcn component variants or helper utilities, not page-scoped CSS files.
- Do not add new standalone files like `src/features/editor/editor.css`; if shared theme work is needed, keep it in Tailwind config or component-level abstractions.

## Task 1: Lock The Visual System And Desktop Shell

**Files:**

- Modify: `src/app/App.tsx`
- Modify: `src/app/app-state.ts`
- Modify: `src/app/App.test.tsx`
- Modify: `src/features/editor/EditorScreen.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/icons/ui-icons.tsx`
- Test: `src/features/editor/EditorScreen.test.tsx`

- [ ] **Step 1: Write failing desktop-shell tests**

Add expectations that loaded desktop editor state renders:

- a left `Style` rail
- a centered preview workspace
- a right rail with export first and data cards below
- no in-editor template switcher
- a top export CTA matching the new shell structure
- a way to leave the editor and return to the template library without switching templates inside the editor

- [ ] **Step 2: Run the desktop-shell test to verify it fails**

Run: `vp test run src/features/editor/EditorScreen.test.tsx -t "desktop workspace"`

Expected: FAIL because the current workspace layout and labels still reflect the old generic shell.

- [ ] **Step 3: Rebuild the desktop workspace shell**

Implement the mockup-aligned desktop frame:

- compact dark header with brand, utility actions, status, and export CTA
- explicit “back to library” action in the app shell / editor header flow
- left dark control rail with grouped sections
- large dotted-background stage area
- right dark rail with export module and data cards

Keep the implementation focused on shell/layout structure first; do not add new editor behaviors in this step beyond what the shell needs.

- [ ] **Step 4: Re-run the desktop-shell test**

Run: `vp test run src/features/editor/EditorScreen.test.tsx -t "desktop workspace"`

Expected: PASS

- [ ] **Step 5: Commit the shell slice**

```bash
git add src/app/App.tsx src/app/app-state.ts src/app/App.test.tsx src/features/editor/EditorScreen.tsx src/components/ui/button.tsx src/icons/ui-icons.tsx src/features/editor/EditorScreen.test.tsx
git commit -m "feat(editor): align desktop workspace shell to approved design"
```

## Task 2: Align The Style Rail And Data Card System

**Files:**

- Modify: `src/features/editor/panels/StylePanel.tsx`
- Modify: `src/features/editor/panels/DataPanel.tsx`
- Modify: `src/features/editor/panels/panel-state.ts`
- Modify: `src/components/ui/select.tsx`
- Modify: `src/components/ui/slider.tsx`
- Modify: `src/components/ui/switch.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/index.ts`
- Modify: `src/features/editor/EditorScreen.test.tsx`
- Modify: `src/app/app-state.ts`
- Modify: `src/app/app-state.test.ts`

- [ ] **Step 1: Write failing interaction tests for the redesigned controls**

Add tests that cover:

- desktop style rail section labels and control groups
- toggling data cards in the redesigned card UI
- manual override entry through the wrapped input component
- control updates persisting through app state rather than local-only component state
- card state communication for `auto`, `placeholder`, and `manual`
- required-card behavior and visible placeholder/missing-value messaging

- [ ] **Step 2: Run the panel tests to verify they fail**

Run: `vp test run src/features/editor/EditorScreen.test.tsx src/app/app-state.test.ts`

Expected: FAIL because the current panels and state model still reflect the generic editor controls.

- [ ] **Step 3: Narrow the control model to the approved mockup language**

Update `panel-state.ts` and `app-state.ts` so the visible controls map to the design:

- aspect ratio presets
- image fill mode
- stroke/border/shadow behavior only if it can affect render/export
- padding
- corner radius only if it is a true output style
- font style
- brand position
- display field enablement

Remove or relabel controls that are not in the mockups unless they are required for current behavior.

- [ ] **Step 4: Rebuild the panels using only local UI wrappers**

Implement:

- a dense, dark left style rail
- right-rail data cards with icon, label, value, yellow enable toggle, and visible mode/missing-state messaging
- mobile-safe labels and states so the same components can be reused later

Preserve the existing metadata semantics:

- `auto`, `placeholder`, and `manual` must remain visible to the user
- `previewValue`, `editable`, and `requiredByTemplate` behavior must remain intact
- redesign may restyle these states, but may not collapse them away

- [ ] **Step 5: Re-run the panel tests**

Run: `vp test run src/features/editor/EditorScreen.test.tsx src/app/app-state.test.ts`

Expected: PASS

- [ ] **Step 6: Commit the panel slice**

```bash
git add src/features/editor/panels src/components/ui src/app/app-state.ts src/app/app-state.test.ts src/features/editor/EditorScreen.test.tsx
git commit -m "feat(editor): align control rail and data cards to approved design"
```

## Task 3: Make Preview And Export Match The Visible Result

**Files:**

- Modify: `src/features/editor/PreviewStage.tsx`
- Modify: `src/template-engine/presets/resolve-preset.ts`
- Modify: `src/template-engine/render/render-canvas.ts`
- Modify: `src/template-engine/render/render-canvas.test.ts`
- Modify: `src/services/export/export-image.ts`
- Modify: `src/services/export/share-image.ts`
- Modify: `src/services/export/share-image.test.ts`
- Modify: `src/features/editor/PreviewStage.test.tsx`
- Modify: `src/features/editor/EditorScreen.tsx`

- [ ] **Step 1: Write failing parity and readiness tests**

Add tests that cover:

- switching ratio in the style rail applies template presets, not just raw canvas dimensions
- export/share stay disabled until preview render state is `ready`
- any retained visible style controls affect both preview and exported output, or are removed from the visible control set

- [ ] **Step 2: Run the focused preview/export tests to verify they fail**

Run: `vp test run src/features/editor/PreviewStage.test.tsx src/template-engine/render/render-canvas.test.ts src/services/export/share-image.test.ts`

Expected: FAIL because current ratio handling and export readiness/parity are incomplete.

- [ ] **Step 3: Resolve presets through the actual preset layer**

Update the preview pipeline so ratio selection:

- selects a real preset id
- applies preset canvas values
- applies preset node overrides before layout resolution

- [ ] **Step 4: Remove preview/export mismatch**

For each visible style control in the redesigned UI:

- either render it into the real canvas/export pipeline
- or remove/relabel it so the preview no longer promises an effect the export cannot reproduce

- [ ] **Step 5: Add an explicit preview/export contract**

Replace implicit DOM querying with an explicit ref or callback contract between `EditorScreen` and `PreviewStage`, and gate export/share by render readiness.

- [ ] **Step 6: Re-run focused tests and a build**

Run: `vp test run src/features/editor/PreviewStage.test.tsx src/template-engine/render/render-canvas.test.ts src/services/export/share-image.test.ts`

Expected: PASS

Run: `vp build`

Expected: PASS

- [ ] **Step 7: Commit the parity slice**

```bash
git add src/features/editor/PreviewStage.tsx src/features/editor/PreviewStage.test.tsx src/features/editor/EditorScreen.tsx src/template-engine/presets/resolve-preset.ts src/template-engine/render/render-canvas.ts src/template-engine/render/render-canvas.test.ts src/services/export/export-image.ts src/services/export/share-image.ts src/services/export/share-image.test.ts
git commit -m "fix(editor): align preview and export behavior with workspace controls"
```

## Task 4: Build The Mobile Editor To Match The Approved Mockup

**Files:**

- Modify: `src/features/editor/EditorScreen.tsx`
- Modify: `src/features/editor/editor.css`
- Modify: `src/components/ui/tabs.tsx`
- Modify: `src/features/editor/panels/DataPanel.tsx`
- Modify: `src/features/editor/panels/StylePanel.tsx`
- Modify: `src/features/editor/panels/ExportPanel.tsx`
- Modify: `src/features/editor/EditorScreen.test.tsx`
- Modify: `src/features/editor/test-fixtures.ts`

- [ ] **Step 1: Write failing mobile-layout tests**

Add tests that cover:

- mobile top bar with brand + main export action
- centered preview above the tab strip
- bottom tab structure matching the spec’s final two-tab model only
- `Data` tab copy may use `EXIF DATA` as a label treatment, but there must be no `Template` tab
- data cards rendering as compact mobile cards rather than desktop sidebars

- [ ] **Step 2: Run the mobile tests to verify they fail**

Run: `vp test run src/features/editor/EditorScreen.test.tsx -t "mobile"`

Expected: FAIL because the current editor still reflects the desktop-first shell.

- [ ] **Step 3: Rebuild the mobile shell**

Implement the approved mobile structure:

- portrait stack layout
- preview first
- tab strip under preview with only `Data` and `Style`
- export emphasized at the top
- mobile card density and spacing aligned with the mockup

- [ ] **Step 4: Re-run the mobile tests**

Run: `vp test run src/features/editor/EditorScreen.test.tsx -t "mobile"`

Expected: PASS

- [ ] **Step 5: Commit the mobile slice**

```bash
git add src/features/editor/EditorScreen.tsx src/features/editor/editor.css src/components/ui/tabs.tsx src/features/editor/panels src/features/editor/EditorScreen.test.tsx src/features/editor/test-fixtures.ts
git commit -m "feat(editor): align mobile workspace to approved design"
```

## Task 5: Final Visual Polish And Full Verification

**Files:**

- Modify: any files touched above as needed for polish

- [ ] **Step 1: Run the full automated suite**

Run: `vp test`

Expected: PASS

Run: `vp check`

Expected: PASS

Run: `vp build`

Expected: PASS

- [ ] **Step 2: Manually verify against the approved mockups**

Verify at desktop and mobile widths:

- black/gunmetal/yellow design language is consistent
- desktop information architecture matches the approved desktop mockup
- mobile information architecture matches the approved mobile mockup
- no in-editor template switching appears
- preview/export stay visually and behaviorally aligned
- export CTA emphasis matches the approved layout

- [ ] **Step 3: Commit any final polish**

```bash
git add -A
git commit -m "refactor(editor): finish design-aligned workspace polish"
```

## Final Verification Checklist

- [ ] `vp test`
- [ ] `vp check`
- [ ] `vp build`
- [ ] Desktop workspace matches approved information architecture
- [ ] Mobile workspace matches approved information architecture
- [ ] Preview/export parity verified for retained controls
- [ ] Export/share blocked until preview is ready
- [ ] No template switching inside editor
