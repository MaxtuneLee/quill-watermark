import { useAtomValue } from "jotai";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  activeTemplateAtom,
  editorControlsAtom,
  editorInstanceAtom,
  editorPreviewResolvedFieldsAtom,
  type EditorAction,
} from "../../app/app-state";
import { resolvePresetLayout } from "../../template-engine/presets/resolve-preset";
import { loadImageAsset } from "../../template-engine/render/load-image-asset";
import type { LoadedImageAsset } from "../../template-engine/render/load-image-asset";
import {
  PREVIEW_LONG_EDGE,
  renderEditorCanvas,
  resolveAspectRatio,
  resolveCanvasSize,
} from "./render-editor-canvas";

const DESKTOP_PREVIEW_SCALE = 0.7;
const MOBILE_PREVIEW_SCALE = 0.9;

interface CanvasSize {
  width: number;
  height: number;
}

interface ViewportSize {
  width: number;
  height: number;
}

export type PreviewRenderState = "idle" | "loading" | "ready" | "error";

export interface PreviewStageHandle {
  getCanvas: () => HTMLCanvasElement | null;
  getRenderState: () => PreviewRenderState;
}

interface PreviewStageProps {
  dispatch?: (action: EditorAction) => Promise<void> | void;
  importError?: string | null;
  onRenderStateChange?: (state: PreviewRenderState) => void;
}

export const PreviewStage = forwardRef<PreviewStageHandle, PreviewStageProps>(function PreviewStage(
  { dispatch: _dispatch, importError = null, onRenderStateChange },
  ref,
) {
  const template = useAtomValue(activeTemplateAtom);
  const controls = useAtomValue(editorControlsAtom);
  const instance = useAtomValue(editorInstanceAtom);
  const resolvedFields = useAtomValue(editorPreviewResolvedFieldsAtom);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasViewportRef = useRef<HTMLDivElement | null>(null);
  const [renderState, setRenderState] = useState<PreviewRenderState>("idle");
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    width: PREVIEW_LONG_EDGE,
    height: PREVIEW_LONG_EDGE,
  });
  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    width: 0,
    height: 0,
  });
  const [decodedAsset, setDecodedAsset] = useState<LoadedImageAsset | null>(null);
  const decodedAssetRef = useRef<LoadedImageAsset | null>(null);

  if (sourceCanvasRef.current === null && typeof document !== "undefined") {
    sourceCanvasRef.current = document.createElement("canvas");
  }

  useEffect(() => {
    decodedAssetRef.current = decodedAsset;
  }, [decodedAsset]);

  useImperativeHandle(
    ref,
    () => ({
      getCanvas: () => sourceCanvasRef.current,
      getRenderState: () => renderState,
    }),
    [renderState],
  );

  useEffect(() => {
    onRenderStateChange?.(renderState);
  }, [onRenderStateChange, renderState]);

  useEffect(() => {
    const viewport = canvasViewportRef.current;
    if (viewport === null || typeof ResizeObserver === "undefined") {
      return;
    }

    const updateViewportSize = () => {
      const bounds = viewport.getBoundingClientRect();
      setViewportSize({
        width: Math.max(0, Math.round(bounds.width)),
        height: Math.max(0, Math.round(bounds.height)),
      });
    };

    updateViewportSize();

    const observer = new ResizeObserver(() => {
      updateViewportSize();
    });

    observer.observe(viewport);

    return () => {
      observer.disconnect();
    };
  }, [instance]);

  useEffect(() => {
    const previewCanvas = canvasRef.current;
    const sourceCanvas = sourceCanvasRef.current;
    if (previewCanvas === null || sourceCanvas === null) {
      return;
    }

    const viewportWidth = Math.max(1, viewportSize.width);
    const viewportHeight = Math.max(1, viewportSize.height);
    const devicePixelRatio = window.devicePixelRatio || 1;
    const nextPixelWidth = Math.max(1, Math.round(viewportWidth * devicePixelRatio));
    const nextPixelHeight = Math.max(1, Math.round(viewportHeight * devicePixelRatio));

    if (previewCanvas.width !== nextPixelWidth) {
      previewCanvas.width = nextPixelWidth;
    }
    if (previewCanvas.height !== nextPixelHeight) {
      previewCanvas.height = nextPixelHeight;
    }

    const nextStyleWidth = `${viewportWidth}px`;
    const nextStyleHeight = `${viewportHeight}px`;
    if (previewCanvas.style.width !== nextStyleWidth) {
      previewCanvas.style.width = nextStyleWidth;
    }
    if (previewCanvas.style.height !== nextStyleHeight) {
      previewCanvas.style.height = nextStyleHeight;
    }

    if (renderState !== "ready" || viewportSize.width === 0 || viewportSize.height === 0) {
      return;
    }

    const context = previewCanvas.getContext("2d");
    if (context === null) {
      return;
    }

    if (typeof context.setTransform === "function") {
      context.setTransform(1, 0, 0, 1, 0, 0);
    }
    if (typeof context.clearRect === "function") {
      context.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    }
    if (typeof context.scale === "function") {
      context.scale(devicePixelRatio, devicePixelRatio);
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    const fitScale = Math.min(
      viewportWidth / Math.max(canvasSize.width, 1),
      viewportHeight / Math.max(canvasSize.height, 1),
    );
    const previewScale =
      fitScale *
      (typeof window !== "undefined" && window.innerWidth < 781
        ? MOBILE_PREVIEW_SCALE
        : DESKTOP_PREVIEW_SCALE);
    const drawWidth = canvasSize.width * previewScale;
    const drawHeight = canvasSize.height * previewScale;
    const drawX = (viewportWidth - drawWidth) / 2;
    const drawY = (viewportHeight - drawHeight) / 2;

    context.drawImage(sourceCanvas, drawX, drawY, drawWidth, drawHeight);
  }, [canvasSize, renderState, viewportSize]);

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
        const { preset } = resolvePresetLayout(template, controls.outputRatio);
        const nextCanvasSize = resolveCanvasSize(
          decodedAsset.width,
          decodedAsset.height,
          resolveAspectRatio(preset.canvas),
        );
        const canvas = sourceCanvasRef.current;
        if (canvas === null) {
          return;
        }

        await renderEditorCanvas({
          canvas,
          cameraMake: instance.metadata.camera.make,
          controls,
          decodedAsset,
          outputSize: nextCanvasSize,
          resolvedFields,
          template,
        });

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

  if (template === null) {
    return (
      <section
        aria-label="Preview stage"
        className="editor-preview-stage grid min-h-full w-full content-center gap-5 px-8 py-10"
        role="region"
      >
        <div className="editor-preview-empty mx-auto grid max-w-xl gap-3 px-8 py-10 text-left">
          <p className="editor-shell-kicker text-[0.72rem] font-bold tracking-[0.18em] text-white/45 uppercase">
            Preview stage
          </p>
          <h2 className="font-heading text-4xl font-semibold tracking-[-0.03em] text-white">
            Place a photo on the desk
          </h2>
          <p className="text-base leading-7 text-white/68">
            Import an image to preview this template and inspect framing before export.
          </p>
        </div>
      </section>
    );
  }

  if (instance === null) {
    return (
      <section
        aria-label="Preview stage"
        className="editor-preview-stage grid min-h-full w-full content-center gap-6 py-8 min-[781px]:py-10"
        role="region"
      >
        <div className="editor-preview-placeholder-wrap grid min-h-[min(40vh,24rem)] w-full place-items-center min-[781px]:min-h-[min(74vh,54rem)]">
          <div className="editor-preview-placeholder-frame relative flex min-h-[min(40vh,24rem)] w-full max-w-full items-center justify-center overflow-hidden rounded-none border border-white/10 shadow-[0_20px_68px_rgba(0,0,0,0.28)] min-[781px]:min-h-0 min-[781px]:max-h-[calc(100vh-14rem)] min-[781px]:max-w-[min(64vw,50rem)]">
            <img
              alt={`${template.name} template preview`}
              className="editor-preview-placeholder-image block max-h-[min(40vh,24rem)] h-auto w-full object-contain opacity-60 min-[781px]:max-h-[calc(100vh-14rem)]"
              src={template.coverImage}
            />
          </div>
          {importError ? (
            <p className="text-center text-xs leading-5 text-red-200" role="alert">
              {importError}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Preview stage"
      className="editor-preview-stage relative grid h-full min-h-full w-full min-w-0 grid-rows-[minmax(0,1fr)]"
      role="region"
    >
      <div
        ref={canvasViewportRef}
        className="editor-preview-canvas-wrap editor-preview-canvas-wrap-live relative min-h-[19rem] min-w-0 w-full overflow-hidden min-[781px]:min-h-0"
      >
        <canvas
          ref={canvasRef}
          aria-label="Template preview"
          className="editor-preview-canvas block h-full w-full"
          role="img"
        />
      </div>
      {renderState === "error" ? (
        <p role="alert" className="text-center text-sm text-red-200">
          Unable to render preview.
        </p>
      ) : null}
    </section>
  );
});
