# Import Image Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a handwritten English guidance overlay that points at the mobile add-image button before any image has been imported.

**Architecture:** Keep the behavior local to the editor screen so the shared `ImageImporter` stays reusable. Render a non-interactive overlay only while `instance === null`, and verify the guidance disappears once an image is loaded.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, Testing Library

---

### Task 1: Define the expected guidance behavior

**Files:**

- Modify: `src/features/editor/EditorScreen.test.tsx`

- [ ] Add a failing mobile test that renders the pending editor state and expects the handwritten English guidance text to appear.
- [ ] Run `vp test src/features/editor/EditorScreen.test.tsx` and confirm the new assertion fails for the missing guidance.

### Task 2: Implement the mobile guidance overlay

**Files:**

- Modify: `src/features/editor/EditorScreen.tsx`
- Modify: `src/styles/base.css`
- Reuse: `src/components/handy-arrow.tsx`

- [ ] Add a small overlay component in `EditorScreen.tsx` that renders only for the pending mobile state.
- [ ] Position the arrow and label so they visually point to the header add button without blocking clicks.
- [ ] Add a handwritten font stack utility in `base.css` for the guidance text.

### Task 3: Verify regression coverage

**Files:**

- Modify: `src/features/editor/EditorScreen.test.tsx`

- [ ] Extend the tests to assert the guidance does not appear once the editor has a loaded image.
- [ ] Run `vp test src/features/editor/EditorScreen.test.tsx`, `vp check`, and confirm all commands pass.
