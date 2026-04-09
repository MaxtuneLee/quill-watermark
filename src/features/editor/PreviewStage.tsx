import { useAtomValue } from "jotai";
import { useEffect, useId, useRef, useState } from "react";
import {
  activeTemplateAtom,
  editorInstanceAtom,
  editorResolvedFieldsAtom,
} from "../../app/app-state";
import { resolveLayout } from "../../template-engine/layout/resolve-layout";
import { loadImageAsset } from "../../template-engine/render/load-image-asset";
import { renderCanvas } from "../../template-engine/render/render-canvas";
import type { RenderCanvasScene } from "../../template-engine/render/render-canvas";
import type { TemplateLayoutNode } from "../../template-engine/types";

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

export function PreviewStage() {
  const template = useAtomValue(activeTemplateAtom);
  const instance = useAtomValue(editorInstanceAtom);
  const resolvedFields = useAtomValue(editorResolvedFieldsAtom);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const zoomControlId = useId();
  const [viewMode, setViewMode] = useState<ViewMode>("fit");
  const [zoomPercent, setZoomPercent] = useState(100);
  const [renderState, setRenderState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    width: PREVIEW_LONG_EDGE,
    height: PREVIEW_LONG_EDGE,
  });

  useEffect(() => {
    if (template === null || instance === null) {
      setRenderState("idle");
      return;
    }

    let disposed = false;
    let disposeAsset = () => {};

    const paint = async () => {
      setRenderState("loading");

      try {
        const imageAsset = await loadImageAsset(instance.sourceFile);
        disposeAsset = imageAsset.dispose;

        if (disposed) {
          imageAsset.dispose();
          return;
        }

        const templateRatio =
          template.canvas.aspectRatio === null
            ? null
            : template.canvas.aspectRatio.width / Math.max(template.canvas.aspectRatio.height, 1);
        const nextCanvasSize = resolveCanvasSize(
          imageAsset.width,
          imageAsset.height,
          templateRatio,
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

        const layoutResult = resolveLayout({
          canvas: {
            width: nextCanvasSize.width,
            height: nextCanvasSize.height,
            padding: template.canvas.padding,
            background: template.canvas.background,
          },
          layout: withPhotoIntrinsicSize(template.layout, imageAsset.width, imageAsset.height),
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
            background: template.canvas.background,
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
                  source: imageAsset.source,
                };
              }

              return {
                type: "text" as const,
                frame: node.frame,
                value: node.text.lines.join(" "),
                lines: node.text.lines,
                font: node.font,
                lineHeight: node.lineHeight,
                color: pickTextColor(template.canvas.background),
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
      disposeAsset();
    };
  }, [instance, resolvedFields, template]);

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

  return (
    <section aria-label="Preview stage" role="region">
      <header>
        <h2>Preview Stage</h2>
        <p>Loaded file: {instance.sourceFile.name}</p>
      </header>
      <div>
        <button
          type="button"
          onClick={() => {
            setViewMode("fit");
          }}
        >
          Fit
        </button>
        <label htmlFor={zoomControlId}>
          Zoom
          <input
            id={zoomControlId}
            type="range"
            min={25}
            max={200}
            value={zoomPercent}
            onChange={(event) => {
              setViewMode("zoom");
              setZoomPercent(Number(event.target.value));
            }}
          />
        </label>
        <output aria-live="polite">{zoomPercent}%</output>
      </div>
      <div style={{ overflow: "auto", maxHeight: "70vh", border: "1px solid var(--color-border)" }}>
        <canvas ref={canvasRef} aria-label="Template preview" role="img" style={canvasStyle} />
      </div>
      {renderState === "loading" ? <p>Rendering preview…</p> : null}
      {renderState === "error" ? <p role="alert">Unable to render preview.</p> : null}
    </section>
  );
}
