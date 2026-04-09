import { useAtomValue } from "jotai";
import { useRef, useState, type RefObject } from "react";
import {
  editorDataCardsAtom,
  editorControlsAtom,
  editorExportOptionsAtom,
  fieldOverridesAtom,
  editorResolvedFieldsAtom,
  type EditorAction,
  type EditorInstance,
} from "../../app/app-state";
import { Button } from "../../components/ui";
import { ArrowLeftIcon, DownloadIcon, SparklesIcon } from "../../icons/ui-icons";
import { exportImage } from "../../services/export/export-image";
import { shareImage } from "../../services/export/share-image";
import type { WatermarkTemplate } from "../../template-engine/types";
import type { ResolvedFieldMap, TemplateDataCard } from "../../template-engine/types";
import { ImageImporter } from "./ImageImporter";
import { PreviewStage, type PreviewRenderState, type PreviewStageHandle } from "./PreviewStage";
import "./editor.css";
import { DataPanel } from "./panels/DataPanel";
import { ExportPanel } from "./panels/ExportPanel";
import type {
  ExportFormat,
  ExportMultiplier,
  ExportPanelValues,
  StylePanelValues,
} from "./panels/panel-state";
import { StylePanel } from "./panels/StylePanel";

interface EditorScreenProps {
  template: WatermarkTemplate;
  instance: EditorInstance | null;
  importError: string | null;
  dispatch: (action: EditorAction) => Promise<void> | void;
}

function TemplateSummary({ template }: { template: WatermarkTemplate }) {
  return (
    <section aria-label="Template summary" className="editor-template-summary">
      <p className="editor-shell-kicker">Template locked</p>
      <h2>{template.name}</h2>
      <p>{template.description}</p>
      <dl>
        <dt>Family</dt>
        <dd>{template.family}</dd>
        <dt>Aspect ratios</dt>
        <dd>Original, {template.aspectSupport.join(", ")}</dd>
      </dl>
    </section>
  );
}

function previewStatusLabel(renderState: PreviewRenderState) {
  switch (renderState) {
    case "ready":
      return "Preview ready";
    case "loading":
      return "Rendering preview";
    case "error":
      return "Render issue";
    default:
      return "Awaiting photo";
  }
}

function TemplateStatus({ template }: { template: WatermarkTemplate }) {
  return (
    <div className="editor-template-status">
      <p className="editor-shell-kicker">Template locked</p>
      <p className="editor-template-status-name">{template.name}</p>
      <p className="editor-template-status-meta">
        {template.family} · Original, {template.aspectSupport.join(", ")}
      </p>
    </div>
  );
}

function EditorHeader({
  exportFormat,
  hasLoadedImage,
  onBackToLibrary,
  onExport,
  onReplacePhoto,
  previewRenderState,
  template,
}: {
  exportFormat: ExportFormat;
  hasLoadedImage: boolean;
  onBackToLibrary: () => void;
  onExport: () => void;
  onReplacePhoto: () => void;
  previewRenderState: PreviewRenderState;
  template: WatermarkTemplate;
}) {
  return (
    <header className="editor-shell-header">
      <div className="editor-shell-brand">
        <span className="editor-shell-brand-mark" aria-hidden="true">
          <SparklesIcon className="editor-shell-brand-icon" />
        </span>
        <div>
          <p className="editor-shell-kicker">Quill Studio</p>
          <h1>Desktop workspace</h1>
        </div>
      </div>

      <div className="editor-shell-status-group">
        <TemplateStatus template={template} />
        <div className="editor-shell-status-pill" data-state={previewRenderState}>
          {previewStatusLabel(previewRenderState)}
        </div>
      </div>

      <div className="editor-shell-actions">
        <Button size="compact" variant="workspace-ghost" onClick={onBackToLibrary}>
          <ArrowLeftIcon className="editor-action-icon" />
          Back to library
        </Button>
        <Button
          disabled={!hasLoadedImage}
          size="compact"
          variant="workspace-secondary"
          onClick={onReplacePhoto}
        >
          Replace photo
        </Button>
        <Button
          disabled={!hasLoadedImage || previewRenderState !== "ready"}
          size="compact"
          variant="workspace-primary"
          onClick={onExport}
        >
          <DownloadIcon className="editor-action-icon" />
          Export {exportFormat.toUpperCase()}
        </Button>
      </div>
    </header>
  );
}

function PendingWorkspace({
  dispatch,
  importError,
  template,
}: {
  dispatch: (action: EditorAction) => Promise<void> | void;
  importError: string | null;
  template: WatermarkTemplate;
}) {
  return (
    <div className="editor-empty-shell">
      <section aria-label="Preview workspace" className="editor-empty-stage" role="region">
        <div className="editor-stage-shell">
          <div className="editor-stage-shell-chrome">
            <p>Preview workspace</p>
            <span>Load a photo to enter the production stage</span>
          </div>
          <div className="editor-empty-stage-content">
            <ImageImporter dispatch={dispatch} importError={importError} />
          </div>
        </div>
      </section>
      <TemplateSummary template={template} />
    </div>
  );
}

function LoadedWorkspace({
  activeDataCards,
  activeResolvedFields,
  controlValues,
  exportStatusMessage,
  exportValues,
  fieldOverrides,
  handleCardEnabledChange,
  handleControlChange,
  handleExport,
  handleExportOptionChange,
  handleOverrideChange,
  handleShare,
  previewRenderState,
  previewStageRef,
  setPreviewRenderState,
  template,
}: {
  activeDataCards: TemplateDataCard[];
  activeResolvedFields: ResolvedFieldMap;
  controlValues: StylePanelValues;
  exportStatusMessage: string | null;
  exportValues: ExportPanelValues;
  fieldOverrides: Record<string, string>;
  handleCardEnabledChange: (cardId: string, enabled: boolean) => void;
  handleControlChange: (
    id: keyof StylePanelValues,
    value: StylePanelValues[keyof StylePanelValues],
  ) => void;
  handleExport: () => Promise<void>;
  handleExportOptionChange: (
    id: "format" | "multiplier",
    value: ExportFormat | ExportMultiplier,
  ) => void;
  handleOverrideChange: (fieldId: string, value: string) => void;
  handleShare: () => Promise<void>;
  previewRenderState: PreviewRenderState;
  previewStageRef: RefObject<PreviewStageHandle | null>;
  setPreviewRenderState: (state: PreviewRenderState) => void;
  template: WatermarkTemplate;
}) {
  return (
    <div className="editor-workspace">
      <section
        aria-label="Style rail"
        className="editor-workspace-rail editor-workspace-rail-left"
        role="region"
      >
        <div className="editor-rail-heading">
          <p className="editor-shell-kicker">Style</p>
          <p>Controls grouped for ratio, framing, and brand treatment.</p>
        </div>
        <StylePanel
          template={template}
          values={controlValues}
          onControlChange={handleControlChange}
        />
      </section>

      <section aria-label="Preview workspace" className="editor-workspace-stage" role="region">
        <div className="editor-stage-shell">
          <div className="editor-stage-shell-chrome">
            <p>Preview workspace</p>
            <span>{previewStatusLabel(previewRenderState)}</span>
          </div>
          <div className="editor-stage-shell-body">
            <PreviewStage ref={previewStageRef} onRenderStateChange={setPreviewRenderState} />
          </div>
        </div>
      </section>

      <section
        aria-label="Export and data rail"
        className="editor-workspace-rail editor-workspace-rail-right"
        role="region"
      >
        <div className="editor-rail-heading">
          <p className="editor-shell-kicker">Output</p>
          <p>Export settings first, then inspect the active metadata cards below.</p>
        </div>
        <ExportPanel
          disabled={previewRenderState !== "ready"}
          values={exportValues}
          statusMessage={exportStatusMessage}
          onFormatChange={(value) => {
            handleExportOptionChange("format", value);
          }}
          onMultiplierChange={(value) => {
            handleExportOptionChange("multiplier", value);
          }}
          onExport={handleExport}
          onShare={handleShare}
        />
        <DataPanel
          dataCards={activeDataCards}
          resolvedFields={activeResolvedFields}
          cardEnabled={Object.fromEntries(activeDataCards.map((card) => [card.id, card.enabled]))}
          overrides={fieldOverrides}
          onCardEnabledChange={handleCardEnabledChange}
          onOverrideChange={handleOverrideChange}
        />
      </section>
    </div>
  );
}

function mimeTypeFromFormat(format: ExportFormat): "image/png" | "image/jpeg" | "image/webp" {
  switch (format) {
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    default:
      return "image/png";
  }
}

function qualityFromFormat(format: ExportFormat): number | undefined {
  switch (format) {
    case "jpeg":
      return 0.92;
    case "webp":
      return 0.95;
    default:
      return undefined;
  }
}

function createScaledCanvas(sourceCanvas: HTMLCanvasElement, multiplier: ExportMultiplier) {
  const scaledCanvas = document.createElement("canvas");
  scaledCanvas.width = Math.max(1, Math.round(sourceCanvas.width * multiplier));
  scaledCanvas.height = Math.max(1, Math.round(sourceCanvas.height * multiplier));

  const context = scaledCanvas.getContext("2d");
  if (context === null) {
    throw new Error("Scaled export canvas could not be created.");
  }

  context.drawImage(sourceCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
  return scaledCanvas;
}

function downloadExport(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function EditorScreen({ template, instance, importError, dispatch }: EditorScreenProps) {
  const atomDataCards = useAtomValue(editorDataCardsAtom);
  const controlValues = useAtomValue(editorControlsAtom);
  const exportValues = useAtomValue(editorExportOptionsAtom);
  const fieldOverrides = useAtomValue(fieldOverridesAtom);
  const atomResolvedFields = useAtomValue(editorResolvedFieldsAtom);
  const activeDataCards = atomDataCards;
  const activeResolvedFields = atomResolvedFields;
  const previewStageRef = useRef<PreviewStageHandle | null>(null);
  const [previewRenderState, setPreviewRenderState] = useState<PreviewRenderState>("idle");

  const handleControlChange = (
    id: keyof StylePanelValues,
    value: StylePanelValues[keyof StylePanelValues],
  ) => {
    void dispatch({
      type: "editor/set-control",
      payload: { id, value },
    });
  };

  const handleCardEnabledChange = (cardId: string, enabled: boolean) => {
    void dispatch({
      type: "editor/set-card-enabled",
      payload: { id: cardId, enabled },
    });
  };

  const handleOverrideChange = (fieldId: string, value: string) => {
    void dispatch({
      type: "set-field-override",
      fieldId,
      value,
    });
  };

  const handleExportOptionChange = (
    id: "format" | "multiplier",
    value: ExportFormat | ExportMultiplier,
  ) => {
    void dispatch({
      type: "editor/set-export-option",
      payload: { id, value },
    });
  };

  const buildExportedImage = async () => {
    const previewCanvas = previewStageRef.current?.getCanvas() ?? null;
    if (previewRenderState !== "ready" || previewCanvas === null) {
      throw new Error("Preview canvas is not ready yet.");
    }

    const scaledCanvas = createScaledCanvas(previewCanvas, exportValues.multiplier);
    return exportImage({
      canvas: scaledCanvas,
      fileBaseName: instance?.sourceFile.name.replace(/\.[^.]+$/, "") ?? "quill-watermark",
      mimeType: mimeTypeFromFormat(exportValues.format),
      quality: qualityFromFormat(exportValues.format),
    });
  };

  const [exportStatusMessage, setExportStatusMessage] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      const exportedImage = await buildExportedImage();
      downloadExport(exportedImage.blob, exportedImage.fileName);
      setExportStatusMessage(
        `Exported ${exportValues.format.toUpperCase()} at ${exportValues.multiplier}x.`,
      );
    } catch (error) {
      setExportStatusMessage(error instanceof Error ? error.message : "Unable to export preview.");
    }
  };

  const handleShare = async () => {
    try {
      const exportedImage = await buildExportedImage();
      const result = await shareImage(exportedImage);
      setExportStatusMessage(
        result.method === "share"
          ? "Share sheet opened with the rendered image."
          : "Download started because sharing was unavailable.",
      );
    } catch (error) {
      setExportStatusMessage(error instanceof Error ? error.message : "Unable to share preview.");
    }
  };

  const handleBackToLibrary = () => {
    void dispatch({
      type: "return-to-library",
    });
  };

  const handleReplacePhoto = () => {
    void dispatch({
      type: "clear-image",
    });
  };

  return (
    <section aria-label="Editor" className="editor-screen">
      <EditorHeader
        exportFormat={exportValues.format}
        hasLoadedImage={instance !== null}
        onBackToLibrary={handleBackToLibrary}
        onExport={() => {
          void handleExport();
        }}
        onReplacePhoto={handleReplacePhoto}
        previewRenderState={previewRenderState}
        template={template}
      />
      {instance === null ? (
        <PendingWorkspace dispatch={dispatch} importError={importError} template={template} />
      ) : (
        <LoadedWorkspace
          activeDataCards={activeDataCards}
          activeResolvedFields={activeResolvedFields}
          controlValues={controlValues}
          exportStatusMessage={exportStatusMessage}
          exportValues={exportValues}
          fieldOverrides={fieldOverrides}
          handleCardEnabledChange={handleCardEnabledChange}
          handleControlChange={handleControlChange}
          handleExport={handleExport}
          handleExportOptionChange={handleExportOptionChange}
          handleOverrideChange={handleOverrideChange}
          handleShare={handleShare}
          previewRenderState={previewRenderState}
          previewStageRef={previewStageRef}
          setPreviewRenderState={setPreviewRenderState}
          template={template}
        />
      )}
    </section>
  );
}
