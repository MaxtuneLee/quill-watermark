import { useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";
import {
  editorDataCardsAtom,
  editorResolvedFieldsAtom,
  type EditorAction,
  type EditorInstance,
} from "../../app/app-state";
import { exportImage } from "../../services/export/export-image";
import { shareImage } from "../../services/export/share-image";
import type { WatermarkTemplate } from "../../template-engine/types";
import type { ResolvedFieldMap, TemplateDataCard } from "../../template-engine/types";
import { ImageImporter } from "./ImageImporter";
import { PreviewStage } from "./PreviewStage";
import "./editor.css";
import { DataPanel } from "./panels/DataPanel";
import { ExportPanel } from "./panels/ExportPanel";
import type {
  EditorPanelState,
  ExportFormat,
  ExportMultiplier,
  StylePanelValues,
} from "./panels/panel-state";
import { createInitialPanelState } from "./panels/panel-state";
import { StylePanel } from "./panels/StylePanel";

interface EditorScreenProps {
  template: WatermarkTemplate;
  instance: EditorInstance | null;
  importError: string | null;
  dispatch: (action: EditorAction) => Promise<void> | void;
  dataCards?: TemplateDataCard[];
  resolvedFields?: ResolvedFieldMap;
}

function TemplateSummary({ template }: { template: WatermarkTemplate }) {
  return (
    <section aria-label="Template summary">
      <h2>Template Summary</h2>
      <p>{template.description}</p>
      <dl>
        <dt>Name</dt>
        <dd>{template.name}</dd>
        <dt>Family</dt>
        <dd>{template.family}</dd>
        <dt>Aspect Ratios</dt>
        <dd>{template.aspectSupport.join(", ")}</dd>
      </dl>
    </section>
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

function TemplateStatus({ template }: { template: WatermarkTemplate }) {
  return (
    <section aria-label="Current template" className="editor-template-status">
      <h2>Current Template</h2>
      <p>{template.description}</p>
      <dl>
        <dt>Name</dt>
        <dd>{template.name}</dd>
        <dt>Family</dt>
        <dd>{template.family}</dd>
        <dt>Ratios</dt>
        <dd>Original, {template.aspectSupport.join(", ")}</dd>
      </dl>
    </section>
  );
}

export function EditorScreen({
  template,
  instance,
  importError,
  dispatch,
  dataCards,
  resolvedFields,
}: EditorScreenProps) {
  const atomDataCards = useAtomValue(editorDataCardsAtom);
  const atomResolvedFields = useAtomValue(editorResolvedFieldsAtom);
  const activeDataCards = dataCards ?? atomDataCards;
  const activeResolvedFields = resolvedFields ?? atomResolvedFields;
  const stateKey = useMemo(
    () => `${template.id}:${activeDataCards.map((card) => card.id).join("|")}`,
    [template.id, activeDataCards],
  );
  const [panelState, setPanelState] = useState<EditorPanelState>(() =>
    createInitialPanelState(template, activeDataCards, activeResolvedFields),
  );
  const [exportStatusMessage, setExportStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setPanelState(createInitialPanelState(template, activeDataCards, activeResolvedFields));
    setExportStatusMessage(null);
  }, [stateKey, template, activeDataCards, activeResolvedFields]);

  const handleControlChange = (
    id: keyof StylePanelValues,
    value: StylePanelValues[keyof StylePanelValues],
  ) => {
    setPanelState((currentState) => ({
      ...currentState,
      controls: {
        ...currentState.controls,
        [id]: value,
      },
    }));

    void dispatch({
      type: "editor/set-control",
      payload: { id, value },
    });
  };

  const handleCardEnabledChange = (cardId: string, enabled: boolean) => {
    setPanelState((currentState) => ({
      ...currentState,
      cardEnabled: {
        ...currentState.cardEnabled,
        [cardId]: enabled,
      },
    }));

    void dispatch({
      type: "editor/set-card-enabled",
      payload: { id: cardId, enabled },
    });
  };

  const handleOverrideChange = (fieldId: string, value: string) => {
    setPanelState((currentState) => ({
      ...currentState,
      overrides: {
        ...currentState.overrides,
        [fieldId]: value,
      },
    }));

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
    setPanelState((currentState) => ({
      ...currentState,
      export: {
        ...currentState.export,
        [id]: value,
      },
    }));

    void dispatch({
      type: "editor/set-export-option",
      payload: { id, value },
    });
  };

  const buildExportedImage = async () => {
    const previewCanvas = document.querySelector<HTMLCanvasElement>(
      '[aria-label="Template preview"]',
    );
    if (previewCanvas === null) {
      throw new Error("Preview canvas is not ready yet.");
    }

    const scaledCanvas = createScaledCanvas(previewCanvas, panelState.export.multiplier);
    return exportImage({
      canvas: scaledCanvas,
      fileBaseName: instance?.sourceFile.name.replace(/\.[^.]+$/, "") ?? "quill-watermark",
      mimeType: mimeTypeFromFormat(panelState.export.format),
      quality: qualityFromFormat(panelState.export.format),
    });
  };

  const handleExport = async () => {
    try {
      const exportedImage = await buildExportedImage();
      downloadExport(exportedImage.blob, exportedImage.fileName);
      setExportStatusMessage(
        `Exported ${panelState.export.format.toUpperCase()} at ${panelState.export.multiplier}x.`,
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

  return (
    <section aria-label="Editor" className="editor-screen">
      <header className="editor-screen-header">
        <h1>{template.name}</h1>
        <TemplateStatus template={template} />
      </header>
      {instance === null ? (
        <>
          <ImageImporter dispatch={dispatch} importError={importError} />
          <TemplateSummary template={template} />
        </>
      ) : (
        <div className="editor-workspace">
          <div className="editor-side-column">
            <StylePanel
              template={template}
              values={panelState.controls}
              onControlChange={handleControlChange}
            />
          </div>
          <div className="editor-stage-column">
            <PreviewStage />
          </div>
          <div className="editor-side-column">
            <ExportPanel
              values={panelState.export}
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
              cardEnabled={panelState.cardEnabled}
              overrides={panelState.overrides}
              onCardEnabledChange={handleCardEnabledChange}
              onOverrideChange={handleOverrideChange}
            />
          </div>
        </div>
      )}
    </section>
  );
}
