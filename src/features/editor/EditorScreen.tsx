import { useAtomValue } from "jotai";
import { useRef, useState, type RefObject } from "react";
import {
  editorDataCardsAtom,
  editorControlsAtom,
  editorExportOptionsAtom,
  editorResolvedFieldsAtom,
  fieldOverridesAtom,
  type EditorAction,
  type EditorInstance,
} from "../../app/app-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui";
import { getCameraBrandName } from "../../icons/camera-brand-icons";
import { exportImage } from "../../services/export/export-image";
import { shareImage } from "../../services/export/share-image";
import { resolvePresetLayout } from "../../template-engine/presets/resolve-preset";
import { loadImageAsset } from "../../template-engine/render/load-image-asset";
import type {
  ResolvedFieldMap,
  TemplateDataCard,
  WatermarkTemplate,
} from "../../template-engine/types";
import { templates } from "../../template-engine/templates";
import { TemplateLibraryScreen } from "../template-library/TemplateLibraryScreen";
import { PreviewStage, type PreviewRenderState, type PreviewStageHandle } from "./PreviewStage";
import { DataPanel } from "./panels/DataPanel";
import { ExportPanel } from "./panels/ExportPanel";
import type {
  ExportFormat,
  ExportMultiplier,
  ExportPanelValues,
  StylePanelValues,
} from "./panels/panel-state";
import {
  PREVIEW_LONG_EDGE,
  renderEditorCanvas,
  resolveAspectRatio,
  resolveCanvasSize,
} from "./render-editor-canvas";
import { StylePanel } from "./panels/StylePanel";
import { toast } from "sonner";

interface EditorScreenProps {
  template: WatermarkTemplate;
  instance: EditorInstance | null;
  importError: string | null;
  dispatch: (action: EditorAction) => Promise<void> | void;
}

function Workspace({
  activeDataCards,
  controlValues,
  dispatch,
  exportStatusMessage,
  exportValues,
  fieldOverrides,
  inferredCameraBrand,
  resolvedFields,
  handleCardEnabledChange,
  handleControlChange,
  handleExport,
  handleExportOptionChange,
  handleOverrideChange,
  handleShare,
  instance,
  importError,
  previewRenderState,
  previewStageRef,
  setPreviewRenderState,
  template,
  handleTemplateSelect,
}: {
  activeDataCards: TemplateDataCard[];
  controlValues: StylePanelValues;
  dispatch: (action: EditorAction) => Promise<void> | void;
  exportStatusMessage: string | null;
  exportValues: ExportPanelValues;
  fieldOverrides: Record<string, string>;
  inferredCameraBrand: ReturnType<typeof getCameraBrandName>;
  resolvedFields: ResolvedFieldMap;
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
  instance: EditorInstance | null;
  importError: string | null;
  previewRenderState: PreviewRenderState;
  previewStageRef: RefObject<PreviewStageHandle | null>;
  setPreviewRenderState: (state: PreviewRenderState) => void;
  template: WatermarkTemplate;
  handleTemplateSelect: (templateId: string) => void;
}) {
  const [leftRailTab, setLeftRailTab] = useState<"presets" | "details">("presets");

  return (
    <div className="editor-workspace grid h-screen grid-cols-[17.5rem_minmax(0,1fr)_20rem] overflow-hidden max-[1180px]:h-auto max-[1180px]:min-h-screen max-[1180px]:grid-cols-[17rem_minmax(0,1fr)] max-[1180px]:overflow-visible max-[1180px]:[&>.editor-workspace-rail-right]:col-span-2 max-[1180px]:[&>.editor-workspace-rail-right]:border-t max-[1180px]:[&>.editor-workspace-rail-right]:border-l-0 max-[780px]:grid-cols-1 max-[780px]:[&>.editor-workspace-rail-left]:border-r-0">
      <section
        aria-label="Template and style rail"
        className="editor-workspace-rail editor-workspace-rail-left min-h-0 overflow-y-auto border-r border-white/8 bg-black/12 px-5 py-6 backdrop-blur-[2px] [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-thumb:hover]:bg-white/40 max-[1180px]:min-h-fit max-[1180px]:overflow-visible max-[780px]:border-b"
        role="region"
      >
        <Tabs
          value={leftRailTab}
          onValueChange={(value) => {
            setLeftRailTab((value as "presets" | "details") ?? "presets");
          }}
          className="gap-4"
        >
          <TabsList aria-label="Editor left rail" className="w-full" variant="line">
            <TabsTrigger value="presets">Preset Templates</TabsTrigger>
            <TabsTrigger value="details">Detailed Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="presets" className="mt-0">
            <TemplateLibraryScreen
              templates={templates}
              selectedTemplateId={template.id}
              layout="sidebar"
              onSelect={(templateId) => {
                handleTemplateSelect(templateId);
                setLeftRailTab("details");
              }}
            />
          </TabsContent>
          <TabsContent value="details" className="mt-0">
            <StylePanel
              template={template}
              values={controlValues}
              onControlChange={handleControlChange}
            />
          </TabsContent>
        </Tabs>
      </section>

      <section
        aria-label="Preview workspace"
        className="editor-workspace-stage relative flex min-h-0 items-stretch justify-center overflow-hidden bg-[radial-gradient(circle_at_1px_1px,rgba(255,236,173,0.1)_1px,transparent_0),radial-gradient(circle_at_top,rgba(255,214,63,0.09),transparent_28%),linear-gradient(180deg,rgba(31,27,18,0.96),rgba(13,11,7,0.995))] bg-[size:18px_18px,auto,auto] max-[1180px]:min-h-[calc(100vh-18rem)] max-[780px]:min-h-[calc(100vh-6rem)]"
        role="region"
      >
        <PreviewStage
          ref={previewStageRef}
          dispatch={dispatch}
          importError={importError}
          onRenderStateChange={setPreviewRenderState}
        />
      </section>

      <section
        aria-label="Export and data rail"
        className="editor-workspace-rail editor-workspace-rail-right grid min-h-0 content-start gap-8 overflow-y-auto border-l border-white/8 bg-black/12 px-5 py-6 backdrop-blur-[2px] [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-thumb:hover]:bg-white/40 max-[1180px]:min-h-fit max-[1180px]:overflow-visible"
        role="region"
      >
        <ExportPanel
          disabled={instance === null || previewRenderState !== "ready"}
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
          hasImage={instance !== null}
          dataCards={activeDataCards}
          cardEnabled={Object.fromEntries(activeDataCards.map((card) => [card.id, card.enabled]))}
          inferredCameraBrand={inferredCameraBrand}
          overrides={fieldOverrides}
          resolvedFields={resolvedFields}
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

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
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
  const resolvedFields = useAtomValue(editorResolvedFieldsAtom);
  const activeDataCards = atomDataCards;
  const inferredCameraBrand = getCameraBrandName(instance?.metadata.camera.make);
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
    if (previewRenderState !== "ready" || instance === null) {
      throw new Error("Preview canvas is not ready yet.");
    }

    const { preset } = resolvePresetLayout(template, controlValues.outputRatio);
    const decodedAsset = await loadImageAsset(instance.sourceFile);

    try {
      const exportCanvas = document.createElement("canvas");
      const exportSize = resolveCanvasSize(
        decodedAsset.width,
        decodedAsset.height,
        resolveAspectRatio(preset.canvas),
        PREVIEW_LONG_EDGE * exportValues.multiplier,
      );

      await renderEditorCanvas({
        canvas: exportCanvas,
        cameraMake: instance.metadata.camera.make,
        controls: controlValues,
        decodedAsset,
        outputSize: exportSize,
        resolvedFields,
        template,
      });

      return exportImage({
        canvas: exportCanvas,
        fileBaseName: instance.sourceFile.name.replace(/\.[^.]+$/, "") ?? "quill-watermark",
        mimeType: mimeTypeFromFormat(exportValues.format),
        quality: qualityFromFormat(exportValues.format),
      });
    } finally {
      decodedAsset.dispose();
    }
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
      if (result.method === "share") {
        toast.success("Image shared successfully.");
      } else {
        toast.info("Sharing is not supported. Download started instead.");
      }
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      setExportStatusMessage(error instanceof Error ? error.message : "Unable to share preview.");
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === template.id) {
      return;
    }

    void dispatch({
      type: "select-template",
      templateId,
    });
  };

  return (
    <section aria-label="Editor" className="editor-screen dark" data-theme="dark">
      <Workspace
        activeDataCards={activeDataCards}
        controlValues={controlValues}
        dispatch={dispatch}
        exportStatusMessage={exportStatusMessage}
        exportValues={exportValues}
        fieldOverrides={fieldOverrides}
        inferredCameraBrand={inferredCameraBrand}
        resolvedFields={resolvedFields}
        handleCardEnabledChange={handleCardEnabledChange}
        handleControlChange={handleControlChange}
        handleExport={handleExport}
        handleExportOptionChange={handleExportOptionChange}
        handleOverrideChange={handleOverrideChange}
        handleShare={handleShare}
        importError={importError}
        instance={instance}
        previewRenderState={previewRenderState}
        previewStageRef={previewStageRef}
        setPreviewRenderState={setPreviewRenderState}
        template={template}
        handleTemplateSelect={handleTemplateSelect}
      />
    </section>
  );
}
