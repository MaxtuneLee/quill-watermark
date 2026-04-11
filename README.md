<p align="center">
  <img src="./public/quill-logo.png" alt="Quill logo" width="192" />
</p>

# Quill Watermark

A watermark editor for photography workflows.

## Current Features

- Import a local image to start editing
- Load a remote image on first visit with `/?imageUrl=<remote-image-url>`
- Extract EXIF metadata automatically
  - Camera make
  - Camera model
  - ISO
  - Aperture
  - Shutter speed
  - Focal length
  - Capture time
  - Latitude and longitude
- Ship 4 currently enabled built-in templates
  - `Classic Info Strip`
  - `Minimal Info Strip`
  - `Centered Device Mark`
  - `Centered Brand + Meta`
- Adapt template presets to common aspect ratios
  - `1:1`
  - `4:5`
  - `3:2`
  - `16:9`
- Override selected fields inside the editor, such as brand copy and author text
- Export with configurable format and scale
  - `PNG`
  - `JPEG`
  - `WEBP`
  - `1x / 2x / 3x`

This project uses Vite+ as the unified toolchain for development, build, testing, and checks. Do not replace the documented `vp` commands with direct `pnpm`, `npm`, or `yarn` usage.

## Local Development

Make sure `vp` is installed on your machine first.

```bash
vp install
vp dev
```

To build and preview locally:

```bash
vp build
vp preview
```

## Validation

```bash
vp check
vp test
```

If you changed code, the repository convention is to run both commands before you submit the change.

## Basic Usage

1. Start the app and open it in the browser
2. Choose a template
3. Import a photo
4. Let the app read available EXIF metadata
5. Review or override the fields shown in the right panel
6. Adjust styles and template settings in the left panel
7. Pick export format and output scale
8. Export or share the final image

## Template Families

### Info Bar

Best for bottom-aligned compositions that emphasize capture details and a restrained signature.

- `Classic Info Strip`
  - A more traditional lower-third information bar
  - Fits cases where capture settings and a brand mark both need to be visible
- `Minimal Info Strip`
  - Lighter and more restrained
  - Fits cases where the watermark should stay present but subtle

### Center Brand

Best for compositions where the brand mark is the main overlay element in the center of the image.

- `Centered Device Mark`
  - A center-aligned device or brand icon only
- `Centered Brand + Meta`
  - Adds a brand text line under the centered icon

## Metadata Handling

The app uses `exifr` to read EXIF data from the image, then normalizes it into a stable internal shape that templates and editor panels can consume.

The built-in templates currently rely on this data for:

- Camera model
- Brand logo inference
- Combined shooting parameter strings
- Location strings
- Capture time strings

If the original image has missing EXIF data, the editor still works. Related fields will fall back to empty states or placeholders, and some fields can still be overridden manually.

## Remote Image Loading

The app can import a remote image through a query parameter:

```text
/?imageUrl=https://example.com/photo.jpg
```

This is useful when another system needs to hand off an image directly into the editor. The target URL must allow browser-side cross-origin access. If the request fails, the editor stays in its pending import state and shows an error.

## Project Structure

```text
src/
  app/                    App routes and global state
  features/editor/        Main editor screen, preview stage, and side panels
  features/template-library/
                          Template picker UI
  services/metadata/      EXIF extraction and normalization
  services/export/        Export and share flows
  template-engine/        Template definitions, field resolution, layout, and rendering
  components/ui/          Base UI components
  icons/                  Brand and interface icons
```

If you plan to continue development, these areas matter most:

- `src/template-engine/templates/`
  - Defines templates, cover assets, field bindings, and layout structures
- `src/template-engine/render/`
  - Renders resolved templates onto canvas
- `src/app/app-state.ts`
  - Handles image import, metadata extraction, and editor session state
- `src/features/editor/`
  - Owns the editor interaction model and panel composition

## Development Notes

- Use `vp` for development, checks, tests, and builds
- Do not install wrapped tools like `vite` or `vitest` directly to bypass the unified toolchain
- Test imports should come from `vite-plus/test`
- When adding new templates, reuse the existing `template-engine` schema, preset, and render pipeline where possible

## Next Steps

- Add more template families and cover assets
- Support saving and reusing custom templates
- Expand the brand field model
- Offer finer layout and typography controls
- Make remote import and sharing flows more robust
