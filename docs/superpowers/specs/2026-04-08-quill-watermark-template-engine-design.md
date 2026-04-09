# Quill Watermark Template Engine Design

**Date:** 2026-04-08

## Summary

Quill Watermark is a template-first photo watermark editor for desktop and mobile web. Users choose an internal template from a categorized library, import a single photo, let the app extract EXIF and GPS metadata, optionally fill missing values, and export a polished image for social publishing.

The core of v1 is not a single watermark style. It is a reusable, constraint-based template engine that supports multiple template families, original image ratio output, social aspect ratio presets, and panel-driven instance editing without freeform drag-and-drop.

## Goals

- Build a single template engine that can drive at least 8 built-in templates across multiple template families.
- Support a template-first workflow: choose template first, then import image, then edit instance values and style parameters.
- Keep the editing model consistent across desktop and mobile while preserving a professional, production-tool feel.
- Run the core pipeline locally in the browser, with optional service-backed enhancements for data enrichment such as GPS reverse geocoding.
- Make the v1 data and template model extensible enough that template import or template authoring can be added later without rewriting the rendering core.

## Non-Goals

- User-authored templates in v1
- Template import in v1
- Freeform drag-and-drop canvas editing
- Multi-image collage workflows
- Cloud-hosted share pages
- Account system or team collaboration
- Batch export
- Video or animation output
- A full expression language for templates

## Product Principles

1. Template first, not canvas first
   Users commit to a template before they enter the editor. The editor only edits a template instance.

2. Constraint-based editing, not freeform editing
   Templates can be flexible internally, but the user edits only the controls exposed by the template.

3. Professional tool UI
   The UI should feel like a focused production workspace: dense, clear, dark, and structured, with a restrained accent color and no consumer-grade ornamental styling.

4. Single runtime model
   The same template definition should power desktop and mobile editing, preview rendering, and final export.

5. Honest metadata states
   The UI must always communicate whether a displayed value is automatically extracted, placeholder-generated, or manually overridden.

## Primary User Flow

1. Open the template library.
2. Browse built-in templates grouped by family.
3. Select a template and enter the editor.
4. Import a single image.
5. Extract EXIF and GPS metadata locally.
6. Resolve template fields using auto values, placeholders, formatting rules, fallbacks, and manual overrides.
7. Adjust instance style controls such as output ratio, canvas padding, image fit, brand alignment, and display toggles.
8. Preview the result in real time.
9. Export locally or invoke system sharing with download fallback.

If the user wants a different template, they must leave the editor and return to the template library.

## Architecture Overview

The v1 architecture has five major layers:

1. Input and metadata extraction
2. Normalized content and field resolution
3. Template preset resolution
4. Constraint-based layout resolution
5. Canvas rendering and export

The product should be implemented as a browser-first app. The local browser pipeline handles image ingestion, EXIF parsing, preview generation, canvas drawing, and export. Optional network-backed enhancements can enrich data, for example GPS reverse geocoding or future afilmory integration.

## Runtime Data Flow

1. The user imports a single image.
2. The extractor reads EXIF, GPS, shooting time, camera model, lens data, ISO, aperture, shutter speed, and focal length.
3. The app normalizes extracted values into a stable metadata model.
4. Optional enhancement services enrich the normalized model, for example by resolving GPS coordinates into a location string.
5. The template schema resolves field values using source bindings, placeholder strings, formatting rules, and fallback rules.
6. The selected output preset composes canvas sizing rules and layout overrides.
7. The layout engine resolves actual boxes, container sizing, text wrapping, truncation, and image fit behavior.
8. The canvas renderer paints the preview and export output.

## Template Engine

### Core Definition

Each built-in template is a declarative `TemplateDefinition`. Templates should be authored as TypeScript objects in v1, with the structure kept serializable so they can later be exported or imported as JSON.

```ts
type TemplateDefinition = {
  id: string;
  name: string;
  family: string;
  cover: string;
  description?: string;

  canvas: CanvasDefinition;
  schema: FieldSchema;
  layout: LayoutNode;
  presets: PresetDefinition[];
  controls: ControlDefinition[];
};
```

### Key Properties

- `canvas`
  Defines default canvas behavior such as background, default padding, safe area, and export strategy.
- `schema`
  Defines which fields the template can consume and how they are resolved.
- `layout`
  Defines the constraint-based node tree used for layout and rendering.
- `presets`
  Defines output ratio presets such as original, 1:1, 4:5, and 9:16.
- `controls`
  Defines which instance parameters the editor exposes and how they map into the layout and rendering model.

## Field Schema

The schema layer exists to separate raw data sources from rendered template values.

```ts
type FieldSchema = {
  fields: Record<string, FieldDefinition>;
};

type FieldDefinition = {
  kind: "text" | "image";
  source: "exif" | "gps" | "user" | "derived" | "afilmory" | "brand";
  path?: string;
  editable: boolean;
  placeholder?: string;
  format?: FormatRule[];
  fallback?: FallbackRule[];
};
```

### Supported Sources

- `exif`
  Raw metadata read from the image locally
- `gps`
  Raw or enhanced geolocation information
- `user`
  Manual user-entered values
- `derived`
  Composed strings such as camera summaries
- `afilmory`
  Optional future platform values like profile URL or work URL
- `brand`
  Brand assets such as logos or brand labels

### Placeholder Capability

v1 supports placeholders with:

- Variable interpolation
- Formatting
- Fallback behavior
- Field concatenation

v1 does not support a full general-purpose expression language.

### Example Intent

A derived `cameraSummary` field can be generated from ISO, aperture, shutter speed, and focal length. A `locationLine` can format lat/long when full place names are not available. An `authorLine` can fall back from afilmory name to manual author name to a template placeholder.

## Layout Model

The layout layer is a general-purpose, constraint-based node tree. It must not be limited to a fixed set of semantic slots such as `heroImage` or `metaBlock`.

The engine should support arbitrary node counts and arbitrary semantic aliases, while still exposing only template-approved controls to users.

### Node Types

At the rendering leaf level, nodes are only:

- `text`
- `image`

At the container level, nodes can use layout primitives such as:

- `stack`
- `inline`
- `overlay`
- `grid`
- `absolute`

### Semantic Alias

Nodes may have human-friendly aliases for editor and analytics use, but aliases are not the engine itself. The engine works on generic layout nodes and constraints. Aliases only help surface meaning in UI, for example:

- `photo-frame`
- `meta-strip`
- `brand-mark`
- `author-line`

### Example Shape

```ts
type LayoutNode = ContainerNode | TextNode | ImageNode;
```

The engine must be able to:

- Resolve container sizing and ordering
- Apply padding, gap, alignment, and justification
- Render image fit modes similar to object-fit
- Track focal point rules for images
- Measure text for wrapping, line limits, scaling, and truncation
- Apply per-preset overrides without cloning full templates

## Presets and Output Ratios

The output system should support:

- `original`
- `1:1`
- `4:5`
- `9:16`

The default export should preserve the uploaded image ratio. Users may switch to supported social presets. When the output ratio changes:

- The canvas size changes
- Template overrides adjust layout behavior
- The image fit strategy behaves like object-fit rather than stretching
- Canvas padding remains editable

Presets should override only the parts of the template that need to change, such as:

- Root padding
- Image region proportion
- Text scale
- Alignment
- Visibility

They should not duplicate an entire template definition.

## Editing Model

The editor never edits a template directly. It edits a `TemplateInstanceState`.

```ts
type TemplateInstanceState = {
  templateId: string;
  presetId: string;
  sourceImage: ImageAsset;
  extractedMetadata: NormalizedMetadata;
  userOverrides: Record<string, unknown>;
  resolvedFields: Record<string, string>;
  controlValues: Record<string, unknown>;
};
```

This distinction is critical because:

- Built-in templates remain static definitions
- Each edit session is a template instance
- Returning to the template library creates a new instance rather than mutating the template catalog

## Editor Information Architecture

### Global Rule

Templates are chosen only in the template library. Once a user enters the editor, template switching is not available. The current template may be shown as read-only status, but not edited or swapped in place.

### Desktop

The desktop editor uses a three-zone workspace:

- Left column: instance style controls
- Center stage: preview-only canvas workspace
- Right column: export settings and data cards

#### Left Column

This column manages appearance and structure controls exposed by the current template instance. Suggested groups:

- `Canvas`
- `Image`
- `Typography`
- `Brand`
- `Layout`

Typical controls include:

- Output ratio
- Image fit mode
- Canvas padding
- Corner radius
- Border and shadow intensity
- Background theme
- Information alignment
- Metadata order
- Brand position

#### Center Stage

The center stage is preview only. It supports:

- Live preview
- Zoom
- Fit-to-stage
- Undo/redo

It does not support direct manipulation of template elements.

#### Right Column

The right column manages:

- Export format
- Export multiplier
- Data cards
- Missing-value handling
- Display toggles
- Manual overrides

### Mobile

Mobile keeps the same logical model but collapses the UI:

- Top bar: branding, settings, export, return action
- Middle: preview stage
- Bottom segmented panels: `Data` and `Style`

Mobile explicitly does not include a `Template` tab. Template choice happens before editor entry.

## Data Cards

Each data card corresponds to a schema-backed field group rather than a single input.

Suggested v1 cards:

- Camera Model
- Lens Info
- Shooting Parameters
- Shot Time
- Location
- Author
- Brand Mark
- Afilmory Link, only when future reserved data is present or a template explicitly requests it

### Data Card State

Each card should track:

- `enabled`
- `mode`
- `bindings`
- `previewValue`
- `editable`
- `requiredByTemplate`

Where `mode` is one of:

- `auto`
- `placeholder`
- `manual`

This state is necessary so users can see whether displayed information came from extraction, fallback content, or manual overrides.

## UI Direction

The visual direction should be a professional production tool:

- Near-black primary background
- Deep stage background with subtle structure
- A single strong yellow accent
- High-contrast typography
- Dense but disciplined control layout
- Clear border-driven surfaces instead of soft, decorative cards

The editor should feel closer to a serious studio tool than a marketing page or soft consumer app.

## Template Library

### Purpose

The template library is a separate entry point that helps users find the right template before image import and editing.

### Structure

Suggested template library regions:

- Header with product identity, recent templates, and start action
- Family and scenario filters
- Template card grid

Each template card should show:

- Cover thumbnail
- Name
- Family tag
- Recommended aspect ratios
- Best-for use cases
- Supported field highlights
- Primary action such as `Use Template`

### Library Filters

v1 should keep filtering simple:

- By template family
- By usage scenario
- By aspect orientation

v1 should not include search.

## v1 Template Families

The built-in template library should cover multiple families so the engine is validated beyond a single layout style.

Suggested v1 families:

- `Info Bar`
- `Center Brand`
- `Full Overlay`
- `Minimal White Space`
- `Social Cover`
- `Card Frame`

Suggested v1 template set:

- `Classic Info Strip`
- `Minimal Info Strip`
- `Centered Device Mark`
- `Centered Brand + Meta`
- `Full Screen Signature`
- `Quiet White Margin`
- `Story Cover`
- `Framed Editorial Card`

## Third-Party and Future Data

The app should reserve optional schema capacity for future afilmory integration, including:

- Photographer profile URL
- Work URL
- Platform attribution

This information should not block v1 shipping. It should exist as optional fields that templates may consume later.

## External Packages and Helpers

The current design assumes:

- `simple-icons` for brand mark sourcing
- `pretext` for text measurement and placement support

These packages support the design intent but do not change the product model.

## v1 Included Scope

- Built-in template library
- Single image input
- Local EXIF extraction
- GPS enhancement with manual fallback
- Placeholder, formatting, and fallback field resolution
- Constraint-based template engine
- Panel-driven instance editing
- Original ratio plus social ratio presets
- Optional reserved afilmory fields without requiring live platform integration
- Desktop and mobile web editing
- Local export and system share fallback

## v1 Excluded Scope

- User template creation
- Template import
- In-canvas direct manipulation
- Multi-image collage support
- Cloud-hosted share pages
- Accounts and collaboration
- Freeform expression-based templates
- Arbitrary custom output sizes
- Batch export
- Animated outputs

## Success Criteria

v1 is successful if:

1. Users can reliably pick a template from the library and finish a full edit/export flow on desktop and mobile.
2. Multiple template families are driven by the same template engine rather than one-off rendering paths.
3. Missing metadata is handled transparently through data card states and manual fallback, without breaking template rendering.
4. Switching between original output and social presets preserves quality and layout integrity.

## Risks and Implementation Watchouts

- The layout engine can become too rigid if it hardcodes semantic slots instead of generic nodes and aliases.
- The layout engine can become too broad if it drifts toward freeform scene editing.
- Data card complexity can explode if every node becomes separately editable instead of exposing template-level controls.
- Mobile can become cramped if too many controls are surfaced at once instead of grouping them into `Data` and `Style`.
- Reverse geocoding must remain an enhancement, not a runtime dependency for export.

## Open Questions Resolved by This Spec

- Templates are chosen outside the editor.
- The editor is panel-driven, not direct manipulation.
- The engine is constraint-based, not fixed-slot only and not freeform scene editing.
- Placeholders support interpolation, formatting, and fallback, but not a full template language.
- Mobile removes template editing and keeps only data and style editing.
