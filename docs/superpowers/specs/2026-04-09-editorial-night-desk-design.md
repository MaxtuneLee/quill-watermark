# Quill Watermark Editorial Night Desk Design

**Date:** 2026-04-09

## Summary

This document defines the approved visual redesign direction for Quill Watermark's application shell and editor workspace. The target aesthetic is an editorial production desk: content-first, typographically disciplined, and tuned for photographers exporting polished work and creators building social cover images.

The design should inherit the strongest traits of the supplied reference UI without copying its camera-brand aesthetic literally. The goal is to translate that high-focus workspace into a magazine-like editing environment where the preview behaves like a proof on a desk and the controls behave like a compact professional toolset.

## Design Context

### Primary Users

- Photographers exporting finished images with watermark and metadata treatments
- Creators preparing social cover assets with controlled typography and branded framing

### Working Context

- Focused editing and export sessions
- Output quality and final composition matter more than exploratory layout play
- Users need fast, legible control over style, metadata visibility, and export settings

### Product Tone

- Editorial
- Precise
- Composed

## Core Design Thesis

Quill Watermark should look and feel like a publication desk for visual assets, not like a generic SaaS dashboard and not like a camera settings utility. The product centers the final composition and uses surrounding controls to support refinement, inspection, and export.

The memorable quality of the redesign should come from three elements working together:

1. A central proof-like preview stage that feels elevated above the surrounding interface
2. Strict editorial typography led by `Noto Serif` for titles and `Noto Sans` for operational UI
3. A controlled black-and-yellow workspace system, extended into a fully resolved light theme for proofing

## Visual Style Translation

### What To Preserve From The Reference

- Three-zone production layout with side rails and a dominant center stage
- Dark primary workspace with bright content focus
- Sparse but forceful yellow emphasis
- Dense, compact controls with strong grouping and clear state feedback
- Fine-grain background texture that reinforces the sense of a production desk

### What To Change For Quill Watermark

- Remove camera-brand-specific cues and reframe the product as an editorial finishing tool
- Reduce gadget-like instrumentation in favor of typographic structure and content framing
- Make field groups read like configurable publication blocks rather than hardware metadata panels
- Ensure the light theme feels intentional, like a proofing desk, not a simple inversion

## Experience Goals

1. Users should understand within seconds that the output image is the primary artifact.
2. The workspace should feel calm and exact under prolonged use.
3. Controls should read as part of a coherent system, not a collection of default form elements.
4. Dark and light themes should both feel native to the product.
5. The interface should support professional taste without becoming ornamental.

## Layout System

### Global Structure

The application should use a persistent workspace frame with three primary zones:

- Left rail: style and composition controls
- Center stage: preview and zoom/status tools
- Right rail: export options and display-field management

This preserves the current working model while clarifying hierarchy. The artwork remains central; both side rails act as instrument panels supporting a single primary artifact.

### Header

The top bar should be compact and purposeful.

- Left side: brand, workspace identity, and current template context
- Right side: back action, replace image, theme access if exposed, and the primary export action
- Status should be compressed into one clear production signal such as preview readiness or export readiness

The header should avoid broad explanatory copy. It is a command strip, not a marketing surface.

### Preview Stage

The center stage should read like a proof placed on an editorial desk.

- Outer stage: dark textured field with a subtle grid or point pattern
- Inner content shell: restrained framing around the actual preview
- Preview artifact: the brightest and most visually stable object in the interface
- Auxiliary controls: zoom and state tools should sit below or around the stage without dominating it

The stage should be spacious on desktop and still retain a sense of ceremonial focus on smaller screens.

### Left Rail

The left rail should organize controls by visual outcome rather than by implementation detail.

Recommended groups:

- Format
- Image fit
- Framing
- Typography
- Brand placement

Controls should feel like part of one continuous tool drawer. Avoid turning every subsection into an isolated card.

### Right Rail

The right rail should begin with export settings, because export is the decisive action in the workflow. Beneath that, display fields should appear as configurable editorial blocks.

Recommended groups:

- Export format and multiplier
- Export/share actions
- Display fields and metadata blocks

Data cards should feel like compact publication modules. Their enabled state, editability, and current value mode should be obvious at a glance.

## Typography

### Font Pairing

- Display and section titles: `Noto Serif`
- Operational UI, labels, values, body copy, and controls: `Noto Sans`

This pairing should establish a clear distinction between editorial voice and operational clarity.

### Typography Roles

- Brand and panel titles use `Noto Serif` with moderate contrast and tight spacing
- Labels, toggles, field names, and metadata values use `Noto Sans`
- Small uppercase utility labels remain allowed, but should be used sparingly and with measured tracking

### Typographic Intent

Typography should carry much of the interface's character. The serif moments should feel like publication hierarchy, while the sans moments should feel efficient and exact. The product should never drift into a default app aesthetic where all text reads like neutral software scaffolding.

## Color And Theme System

### Dark Theme

Dark mode is the hero theme and should feel like a night editing desk.

- Backgrounds should be near-black but subtly warm-tinted rather than pure black
- Surfaces should separate through tone and material contrast, not heavy glow or glossy effects
- Accent yellow should be used sparingly for primary actions, active states, and enabled toggles
- Text should stay warm-neutral and highly legible without becoming stark white

### Light Theme

Light mode should feel like a proofing desk or paper-based review surface.

- Backgrounds should shift to warm off-white and paper-gray values
- Borders become finer and more visible through tonal contrast rather than darkness
- The preview still remains the focal object, but the surrounding workspace should feel brighter and airier
- Accent yellow remains the same brand signal, but should be balanced to avoid visual harshness

### Accent Usage

Yellow must remain rare enough to mean something.

Use yellow for:

- Primary export action
- Selected segmented controls
- Active toggles and key check states
- Focused or selected workspace elements

Do not use yellow as a fill color for large surfaces or repeated decorative accents.

## Surfaces And Components

### Panel Language

Panels should feel machined and calm rather than soft and generic.

- Corners should be controlled and moderately rounded
- Borders should be thin and quiet
- Surfaces should use depth through tonal layering, not large drop shadows
- Background changes should signal grouping more than ornament

### Buttons

Button hierarchy should be obvious:

- Primary: yellow, compact, assertive
- Secondary: dark or light neutral with clear border definition
- Ghost: minimal, for low-priority workspace actions

Buttons should feel precise and dense, not oversized.

### Data Cards

Display-field items should look like editorial modules that can be turned on, edited, or left empty.

Each block should clearly show:

- Field label
- Current value
- Enabled state
- Whether the value is auto, placeholder, or manually overridden when relevant

The visual treatment should emphasize information architecture rather than decorative card stacking.

## Motion

Motion should be restrained and functional.

- Use subtle fade and translate transitions for panel content and state shifts
- Keep hover movement minimal
- Use motion to confirm interaction and preserve focus, not to add spectacle
- Respect reduced-motion preferences

The interface should feel polished, not animated for its own sake.

## Content Strategy

Copy in the editor should stay compact and operational.

- Prefer short labels over explanatory sentences
- Reduce repeated headings and duplicated status text
- Make empty states teach the next action without sounding generic

The UI should read like a professional desk, where each word earns its place.

## Mapping To Current Product Areas

### Template Library

The library should reflect the same editorial system, but remain lighter and more browseable than the editor. It should act as an intake surface rather than a separate product.

### Editor Workspace

This is the primary redesign target. It should embody the full editorial night desk language, especially in the preview stage, control rails, and export area.

### Preview Output

The preview must feel like the artifact under production. The surrounding chrome should always reinforce that the user is preparing a finished share image, not editing a raw canvas.

## Implementation Priorities

1. Establish shared theme tokens for dark and light variants
2. Refactor the editor shell into a stronger three-zone hierarchy
3. Redesign the preview stage as a proofing surface
4. Rebuild left and right rails with unified control styling
5. Apply the `Noto Serif` and `Noto Sans` typography system
6. Align the template library to the same design language after the editor is stable

## Non-Goals For This Design Pass

- Changing the template engine model
- Introducing freeform canvas editing
- Adding decorative motion systems
- Mimicking hardware-brand UI tropes literally
- Sacrificing editing density for dramatic presentation

## Acceptance Criteria

The redesign should be considered aligned when:

- The editor reads as a professional editorial workspace on first glance
- The preview is visually dominant in both themes
- The typography pairing is consistently applied with clear role separation
- Yellow functions as a high-signal accent rather than a general brand wash
- Left and right rails feel like one coherent tool system
- Light mode feels intentionally designed, not mechanically inverted from dark mode
