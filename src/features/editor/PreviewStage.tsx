import { useAtomValue } from "jotai";
import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  activeTemplateAtom,
  editorControlsAtom,
  editorInstanceAtom,
  editorPreviewResolvedFieldsAtom,
} from "../../app/app-state";
import { Button, Slider } from "../../components/ui";
import { resolveLayout } from "../../template-engine/layout/resolve-layout";
import { resolvePresetLayout } from "../../template-engine/presets/resolve-preset";
import { loadImageAsset } from "../../template-engine/render/load-image-asset";
import type { LoadedImageAsset } from "../../template-engine/render/load-image-asset";
import { renderCanvas } from "../../template-engine/render/render-canvas";
import type { RenderCanvasScene } from "../../template-engine/render/render-canvas";
import type { TemplateLayoutNode, WatermarkTemplate } from "../../template-engine/types";
import type { StylePanelValues } from "./panels/panel-state";

const PREVIEW_LONG_EDGE = 1200;

type ViewMode = "fit" | "zoom";

interface CanvasSize {
  width: number;
  height: number;
}

function resolveCanvasSize(
  imageWidth: number,
  imageHeight: number,
  aspectRatio: number | null,
): CanvasSize {
  const ratio = aspectRatio ?? imageWidth / Math.max(imageHeight, 1);
  const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;

  if (safeRatio >= 1) {
    return {
      width: PREVIEW_LONG_EDGE,
      height: Math.max(1, Math.round(PREVIEW_LONG_EDGE / safeRatio)),
    };
  }

  return {
    width: Math.max(1, Math.round(PREVIEW_LONG_EDGE * safeRatio)),
    height: PREVIEW_LONG_EDGE,
  };
}

function hexToRgb(hexColor: string): { r: number; g: number; b: number } | null {
  const normalized = hexColor.trim();
  const shortMatch = /^#([\da-f]{3})$/i.exec(normalized);
  if (shortMatch) {
    const digits = shortMatch[1];
    return {
      r: Number.parseInt(`${digits[0]}${digits[0]}`, 16),
      g: Number.parseInt(`${digits[1]}${digits[1]}`, 16),
      b: Number.parseInt(`${digits[2]}${digits[2]}`, 16),
    };
  }

  const fullMatch = /^#([\da-f]{6})$/i.exec(normalized);
  if (!fullMatch) {
    return null;
  }

  const digits = fullMatch[1];
  return {
    r: Number.parseInt(digits.slice(0, 2), 16),
    g: Number.parseInt(digits.slice(2, 4), 16),
    b: Number.parseInt(digits.slice(4, 6), 16),
  };
}

function pickTextColor(background: string): string {
  const rgb = hexToRgb(background);
  if (rgb === null) {
    return "#ffffff";
  }

  const perceivedLuma = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return perceivedLuma > 150 ? "#111111" : "#ffffff";
}

function withPhotoIntrinsicSize(
  layout: TemplateLayoutNode,
  width: number,
  height: number,
): TemplateLayoutNode {
  const nextWidth = Math.max(1, Math.round(width));
  const nextHeight = Math.max(1, Math.round(height));

  if (layout.type === "image") {
    if (layout.binding !== "photo") {
      return layout;
    }

    return {
      ...layout,
      intrinsicSize: {
        width: nextWidth,
        height: nextHeight,
      },
    };
  }

  if (layout.type === "text") {
    return layout;
  }

  return {
    ...layout,
    children: layout.children.map((child) => withPhotoIntrinsicSize(child, nextWidth, nextHeight)),
  };
}

function withPhotoFit(
  layout: TemplateLayoutNode,
  fit: StylePanelValues["imageFit"],
): TemplateLayoutNode {
  if (layout.type === "image") {
    return layout.binding === "photo"
      ? {
          ...layout,
          fit,
        }
      : layout;
  }

  if (layout.type === "text") {
    return layout;
  }

  return {
    ...layout,
    children: layout.children.map((child) => withPhotoFit(child, fit)),
  };
}

function withTypographyTheme(
  layout: TemplateLayoutNode,
  theme: StylePanelValues["typographyTheme"],
): TemplateLayoutNode {
  const family =
    theme === "editorial" ? "Georgia" : theme === "mono" ? "SFMono-Regular" : "Avenir Next";

  if (layout.type === "text") {
    return {
      ...layout,
      font: layout.font.replace(/"[^"]+"/, `"${family}"`),
    };
  }

  if (layout.type === "image") {
    return layout;
  }

  return {
    ...layout,
    children: layout.children.map((child) => withTypographyTheme(child, theme)),
  };
}

function withBrandPosition(
  layout: TemplateLayoutNode,
  position: StylePanelValues["brandPosition"],
): TemplateLayoutNode {
  if (layout.type === "text") {
    if (layout.binding !== "brandLine") {
      return layout;
    }

    return {
      ...layout,
      align: position === "center" ? "center" : position === "bottom-right" ? "right" : "left",
    };
  }

  if (layout.type === "image") {
    return layout;
  }

  return {
    ...layout,
    children: layout.children.map((child) => withBrandPosition(child, position)),
  };
}

function resolveAspectRatio(templateCanvas: WatermarkTemplate["canvas"]): number | null {
  return templateCanvas.aspectRatio === null
    ? null
    : templateCanvas.aspectRatio.width / Math.max(templateCanvas.aspectRatio.height, 1);
}

function resolveSurfaceInset(surfaceStyle: StylePanelValues["surfaceStyle"]): number {
  if (surfaceStyle === "shadow" || surfaceStyle === "border-shadow") {
    return 28;
  }

  if (surfaceStyle === "border") {
    return 2;
  }

  return 0;
}

export type PreviewRenderState = "idle" | "loading" | "ready" | "error";

export interface PreviewStageHandle {
  getCanvas: () => HTMLCanvasElement | null;
  getRenderState: () => PreviewRenderState;
}

interface PreviewStageProps {
  onRenderStateChange?: (state: PreviewRenderState) => void;
}

export const PreviewStage = forwardRef<PreviewStageHandle, PreviewStageProps>(function PreviewStage(
  { onRenderStateChange },
  ref,
) {
  const template = useAtomValue(activeTemplateAtom);
  const controls = useAtomValue(editorControlsAtom);
  const instance = useAtomValue(editorInstanceAtom);
  const resolvedFields = useAtomValue(editorPreviewResolvedFieldsAtom);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const zoomControlId = useId();
  const [viewMode, setViewMode] = useState<ViewMode>("fit");
  const [zoomPercent, setZoomPercent] = useState(100);
  const [renderState, setRenderState] = useState<PreviewRenderState>("idle");
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    width: PREVIEW_LONG_EDGE,
    height: PREVIEW_LONG_EDGE,
  });
  const [decodedAsset, setDecodedAsset] = useState<LoadedImageAsset | null>(null);
  const decodedAssetRef = useRef<LoadedImageAsset | null>(null);

  useEffect(() => {
    decodedAssetRef.current = decodedAsset;
  }, [decodedAsset]);

  useImperativeHandle(
    ref,
    () => ({
      getCanvas: () => canvasRef.current,
      getRenderState: () => renderState,
    }),
    [renderState],
  );

  useEffect(() => {
    onRenderStateChange?.(renderState);
  }, [onRenderStateChange, renderState]);

  useEffect(() => {
    const sourceFile = instance?.sourceFile ?? null;

    if (sourceFile === null) {
      setDecodedAsset((previousAsset) => {
        previousAsset?.dispose();
        return null;
      });
      setRenderState("idle");
      return;
    }

    let cancelled = false;

    setRenderState("loading");

    void loadImageAsset(sourceFile)
      .then((nextAsset) => {
        if (cancelled) {
          nextAsset.dispose();
          return;
        }

        setDecodedAsset((previousAsset) => {
          previousAsset?.dispose();
          return nextAsset;
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setDecodedAsset((previousAsset) => {
          previousAsset?.dispose();
          return null;
        });
        setRenderState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [instance?.sourceFile]);

  useEffect(() => {
    return () => {
      decodedAssetRef.current?.dispose();
      decodedAssetRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (template === null || instance === null) {
      setRenderState("idle");
      return;
    }

    if (decodedAsset === null) {
      setRenderState((currentState) => (currentState === "error" ? currentState : "loading"));
      return;
    }

    let disposed = false;

    const paint = async () => {
      setRenderState("loading");

      try {
        const { preset, layout: presetLayout } = resolvePresetLayout(
          template,
          controls.outputRatio,
        );
        const surfaceInset = resolveSurfaceInset(controls.surfaceStyle);
        const nextCanvasSize = resolveCanvasSize(
          decodedAsset.width,
          decodedAsset.height,
          resolveAspectRatio(preset.canvas),
        );
        const canvas = canvasRef.current;
        if (canvas === null) {
          return;
        }

        canvas.width = nextCanvasSize.width;
        canvas.height = nextCanvasSize.height;

        const context = canvas.getContext("2d");
        if (context === null) {
          throw new Error("Canvas context unavailable.");
        }

        const transformedLayout = withBrandPosition(
          withTypographyTheme(
            withPhotoFit(
              withPhotoIntrinsicSize(presetLayout, decodedAsset.width, decodedAsset.height),
              controls.imageFit,
            ),
            controls.typographyTheme,
          ),
          controls.brandPosition,
        );

        const layoutResult = resolveLayout({
          canvas: {
            width: nextCanvasSize.width,
            height: nextCanvasSize.height,
            padding: controls.canvasPadding + surfaceInset,
            background: preset.canvas.background,
          },
          layout: transformedLayout,
          resolvedFields: Object.fromEntries(
            Object.entries(resolvedFields).map(([fieldId, field]) => [
              fieldId,
              {
                value: field.value,
                mode: field.mode,
              },
            ]),
          ),
        });

        const scene: RenderCanvasScene = {
          canvas: {
            width: nextCanvasSize.width,
            height: nextCanvasSize.height,
            background: preset.canvas.background,
            cornerRadius: controls.cornerRadius,
            surfaceStyle: controls.surfaceStyle,
            surfaceInset,
          },
          nodes: layoutResult.drawOrder
            .map((nodeId) => layoutResult.nodes[nodeId])
            .filter((node): node is NonNullable<typeof node> => Boolean(node))
            .map((node) => {
              if (node.type === "image") {
                return {
                  type: "image" as const,
                  frame: node.frame,
                  contentBox: node.contentBox,
                  source: decodedAsset.source,
                };
              }

              return {
                type: "text" as const,
                frame: node.frame,
                value: node.text.lines.join(" "),
                lines: node.text.lines,
                font: node.font,
                lineHeight: node.lineHeight,
                color: pickTextColor(preset.canvas.background),
                align: node.align,
              };
            }),
        };

        await renderCanvas(context, scene);

        if (!disposed) {
          setCanvasSize(nextCanvasSize);
          setRenderState("ready");
        }
      } catch {
        if (!disposed) {
          setRenderState("error");
        }
      }
    };

    void paint();

    return () => {
      disposed = true;
    };
  }, [controls, decodedAsset, instance, resolvedFields, template]);

  if (template === null || instance === null) {
    return (
      <section aria-label="Preview stage" role="region">
        <h2>Preview Stage</h2>
        <p>Import an image to preview this template.</p>
      </section>
    );
  }

  const zoomScale = zoomPercent / 100;
  const canvasStyle =
    viewMode === "fit"
      ? { width: "100%", height: "auto", display: "block", maxWidth: "100%" }
      : {
          width: `${Math.max(1, Math.round(canvasSize.width * zoomScale))}px`,
          height: `${Math.max(1, Math.round(canvasSize.height * zoomScale))}px`,
          display: "block",
          maxWidth: "none",
        };
  const previewFrameStyle = {
    overflow: "auto",
    maxHeight: "70vh",
    border: "1px solid var(--color-border)",
  } satisfies CSSProperties;

  return (
    <section aria-label="Preview stage" role="region">
      <header>
        <h2>Preview Stage</h2>
        <p>Loaded file: {instance.sourceFile.name}</p>
      </header>
      <div className="editor-preview-toolbar">
        <Button
          className="editor-pill-button"
          aria-pressed={viewMode === "fit"}
          onClick={() => {
            setViewMode("fit");
          }}
        >
          Fit
        </Button>
        <div className="editor-preview-zoom">
          <label htmlFor={zoomControlId}>Zoom</label>
          <Slider.Root
            aria-labelledby={zoomControlId}
            className="editor-zoom-slider"
            max={200}
            min={25}
            step={1}
            value={zoomPercent}
            onValueChange={(value) => {
              setViewMode("zoom");
              setZoomPercent(value);
            }}
          >
            <Slider.Control className="editor-zoom-slider-control">
              <Slider.Track className="editor-zoom-slider-track">
                <Slider.Indicator className="editor-zoom-slider-indicator" />
              </Slider.Track>
              <Slider.Thumb className="editor-zoom-slider-thumb" getAriaLabel={() => "Zoom"} />
            </Slider.Control>
          </Slider.Root>
        </div>
        <output aria-live="polite">{zoomPercent}%</output>
      </div>
      <div style={previewFrameStyle}>
        <canvas ref={canvasRef} aria-label="Template preview" role="img" style={canvasStyle} />
      </div>
      {renderState === "loading" ? <p>Rendering preview…</p> : null}
      {renderState === "error" ? <p role="alert">Unable to render preview.</p> : null}
    </section>
  );
});
