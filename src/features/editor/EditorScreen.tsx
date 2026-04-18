import { useAtomValue } from "jotai";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
  type RefObject,
  type TransitionStartFunction,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useWebHaptics } from "web-haptics/react";
import {
  FrameIcon,
  TypeIcon,
  ScanTextIcon,
  CameraIcon,
  MapPinIcon,
  BadgeInfoIcon,
  PaletteIcon,
} from "lucide-react";
import HandyArrow from "../../components/handy-arrow";
import {
  editorDataCardsAtom,
  editorControlsAtom,
  editorExportOptionsAtom,
  editorResolvedFieldsAtom,
  editorTemplateControlValuesAtom,
  fieldOverridesAtom,
  type EditorAction,
  type EditorInstance,
} from "../../app/app-state";
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui";
import {
  cameraBrandOptions,
  getCameraBrandName,
} from "../../icons/camera-brand-icons";
import { cn } from "../../lib/utils";
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
import {
  PreviewStage,
  type PreviewRenderState,
  type PreviewStageHandle,
} from "./PreviewStage";
import { DataPanel } from "./panels/DataPanel";
import { ExportPanel } from "./panels/ExportPanel";
import type {
  BrandPosition,
  ExportFormat,
  ExportMultiplier,
  ExportPanelValues,
  StylePanelValues,
  TypographyTheme,
} from "./panels/panel-state";
import {
  brandPositionOptions,
  imageFillOptions,
  typographyThemeOptions,
} from "./panels/panel-state";
import {
  PREVIEW_LONG_EDGE,
  renderEditorCanvas,
  resolveAspectRatio,
  resolveCanvasSize,
} from "./render-editor-canvas";
import { StylePanel } from "./panels/StylePanel";
import { toast } from "sonner";
import { ImageImporter } from "./ImageImporter";

const MOTION_EASE = [0.22, 1, 0.36, 1] as const;
const TAP_TRANSITION = { duration: 0.16, ease: MOTION_EASE } as const;
const PANEL_TRANSITION = { duration: 0.24, ease: MOTION_EASE } as const;
const SLIDER_HAPTIC_THROTTLE_MS = 120;
const SLIDER_HAPTIC_PATTERN = [{ duration: 24, intensity: 0.55 }];
const MotionButton = motion.create(Button);

interface EditorScreenProps {
  template: WatermarkTemplate;
  instance: EditorInstance | null;
  importError: string | null;
  dispatch: (action: EditorAction) => Promise<void> | void;
}

export function scheduleControlChange(
  startTransition: TransitionStartFunction,
  dispatch: (action: EditorAction) => Promise<void> | void,
  id: keyof StylePanelValues,
  value: StylePanelValues[keyof StylePanelValues],
) {
  startTransition(() => {
    void dispatch({
      type: "editor/set-control",
      payload: { id, value },
    });
  });
}

function MobileControlRow({
  children,
  label,
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <div className="grid gap-1.5">
      {label && (
        <span className="text-[0.6rem] font-semibold tracking-[0.1em] text-white/48 uppercase">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

function CompactChoiceRow<TValue extends string | number>({
  onPressFeedback,
  onChange,
  options,
  prefersReducedMotion,
  value,
}: {
  onPressFeedback?: () => void;
  onChange: (value: TValue) => void;
  options: ReadonlyArray<{ label: string; value: TValue }>;
  prefersReducedMotion: boolean;
  value: TValue;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <MotionButton
          key={String(option.value)}
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-none border-white/10 bg-transparent px-2.5 text-[0.72rem] text-white/72 hover:bg-white/[0.08] aria-pressed:border-primary/55 aria-pressed:bg-primary/12 aria-pressed:text-primary"
          aria-pressed={value === option.value}
          onClick={() => {
            onPressFeedback?.();
            onChange(option.value);
          }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
          transition={TAP_TRANSITION}
        >
          {option.label}
        </MotionButton>
      ))}
    </div>
  );
}

function CompactSliderInput({
  label,
  max,
  min = 0,
  onChange,
  value,
}: {
  label: string;
  max: number;
  min?: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3 text-[0.72rem] text-white/56">
        <span>{label}</span>
        <output className="tabular-nums text-white/72">{value}</output>
      </div>
      <Slider
        aria-label={`Padding ${label}`}
        variant="panel"
        min={min}
        max={max}
        step={1}
        value={value}
        onValueChange={(nextValue) => {
          onChange(
            Array.isArray(nextValue) ? (nextValue[0] ?? value) : nextValue,
          );
        }}
      />
    </div>
  );
}

function CompactColorInput({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[0.68rem] text-white/48">{label}</span>
      <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-2">
        <input
          aria-label={`${label} color`}
          type="color"
          className="h-8 w-8 rounded-none border border-white/10 bg-transparent p-1"
          value={/^#([\da-f]{6}|[\da-f]{3})$/i.test(value) ? value : "#111111"}
          onChange={(event) => onChange(event.target.value)}
        />
        <Input
          aria-label={label}
          type="text"
          className="h-8 rounded-none border-white/10 bg-white/[0.03] px-2 text-xs text-white"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </label>
  );
}

function MobileSpacingControls({
  controlValues,
  onControlChange,
}: {
  controlValues: StylePanelValues;
  onControlChange: (
    id: keyof StylePanelValues,
    value: StylePanelValues[keyof StylePanelValues],
  ) => void;
}) {
  return (
    <MobileControlRow>
      <div className="flex flex-col gap-3">
        <div
          aria-hidden="true"
          className="m-[0_auto] grid h-min w-min place-items-center border border-dashed border-white/10 bg-[#16120d] box-border"
          style={{
            paddingTop: `${controlValues.canvasPaddingTop / 2}px`,
            paddingRight: `${controlValues.canvasPaddingRight / 2}px`,
            paddingBottom: `${controlValues.canvasPaddingBottom / 2}px`,
            paddingLeft: `${controlValues.canvasPaddingLeft / 2}px`,
          }}
        >
          <div className="grid aspect-[4/3] w-32 place-items-center border border-primary/35 bg-primary/10 px-3 text-[0.65rem] font-semibold tracking-[0.12em] text-primary/80 uppercase">
            Image
          </div>
        </div>
        <div className="grid gap-3">
          <CompactSliderInput
            label="Top"
            max={200}
            value={controlValues.canvasPaddingTop}
            onChange={(value) => onControlChange("canvasPaddingTop", value)}
          />
          <CompactSliderInput
            label="Right"
            max={200}
            value={controlValues.canvasPaddingRight}
            onChange={(value) => onControlChange("canvasPaddingRight", value)}
          />
          <CompactSliderInput
            label="Bottom"
            max={200}
            value={controlValues.canvasPaddingBottom}
            onChange={(value) => onControlChange("canvasPaddingBottom", value)}
          />
          <CompactSliderInput
            label="Left"
            max={200}
            value={controlValues.canvasPaddingLeft}
            onChange={(value) => onControlChange("canvasPaddingLeft", value)}
          />
        </div>
      </div>
    </MobileControlRow>
  );
}

function MobileImportGuidance({
  prefersReducedMotion,
}: {
  prefersReducedMotion: boolean;
}) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+4.1rem)] z-10 flex flex-col items-center px-6"
      animate={
        prefersReducedMotion
          ? undefined
          : {
              y: [0, -6, 0],
            }
      }
      transition={
        prefersReducedMotion
          ? undefined
          : {
              duration: 2.8,
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
            }
      }
    >
      <HandyArrow className="mb-[-0.1rem] h-auto w-[4.3rem] translate-x-5 -rotate-[82deg] text-primary drop-shadow-[0_6px_18px_rgba(255,193,7,0.2)]" />
      <p className="font-handwritten max-w-[12ch] text-center text-[clamp(1.35rem,5.8vw,2rem)] leading-[0.98] font-semibold tracking-[0.01em] text-primary drop-shadow-[0_3px_10px_rgba(0,0,0,0.45)]">
        Click here to import an image.
      </p>
    </motion.div>
  );
}

function VisualTileButton({
  active,
  children,
  className,
  label,
  onClick,
  prefersReducedMotion,
}: {
  active: boolean;
  children: ReactNode;
  className?: string;
  label: string;
  onClick: () => void;
  prefersReducedMotion: boolean;
}) {
  return (
    <motion.button
      type="button"
      aria-pressed={active}
      className={cn(
        "grid gap-2 border border-white/10 bg-transparent p-2 text-left transition-colors",
        active && "border-primary/60 bg-white/[0.04]",
        className,
      )}
      onClick={onClick}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
      transition={TAP_TRANSITION}
    >
      {children}
      <span className="text-[0.65rem] font-medium tracking-[0.08em] text-white/58 uppercase">
        {label}
      </span>
    </motion.button>
  );
}

function DesktopWorkspace({
  activeDataCards,
  controlValues,
  dispatch,
  exportStatusMessage,
  exportValues,
  fieldOverrides,
  inferredCameraBrand,
  resolvedFields,
  templateControlValues,
  handleCardEnabledChange,
  handleControlChange,
  handleExport,
  handleExportOptionChange,
  handleOverrideChange,
  handleTemplateControlChange,
  handleShare,
  instance,
  importError,
  previewRenderState,
  previewStageRef,
  setPreviewRenderState,
  template,
  handleTemplateSelect,
  onSelectionFeedback,
}: {
  activeDataCards: TemplateDataCard[];
  controlValues: StylePanelValues;
  dispatch: (action: EditorAction) => Promise<void> | void;
  exportStatusMessage: string | null;
  exportValues: ExportPanelValues;
  fieldOverrides: Record<string, string>;
  inferredCameraBrand: ReturnType<typeof getCameraBrandName>;
  resolvedFields: ResolvedFieldMap;
  templateControlValues: Record<string, string | number | boolean>;
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
  handleTemplateControlChange: (controlId: string, value: string) => void;
  handleShare: () => Promise<void>;
  instance: EditorInstance | null;
  importError: string | null;
  previewRenderState: PreviewRenderState;
  previewStageRef: RefObject<PreviewStageHandle | null>;
  setPreviewRenderState: (state: PreviewRenderState) => void;
  template: WatermarkTemplate;
  handleTemplateSelect: (templateId: string) => void;
  onSelectionFeedback: () => void;
}) {
  const [leftRailTab, setLeftRailTab] = useState<"presets" | "details">(
    "presets",
  );

  return (
    <div className="editor-workspace hidden grid-cols-[17.5rem_minmax(0,1fr)_20rem] overflow-hidden min-[781px]:grid min-[1181px]:min-h-0 min-[1181px]:flex-1 max-[1180px]:h-auto max-[1180px]:min-h-screen max-[1180px]:grid-cols-[17rem_minmax(0,1fr)] max-[1180px]:overflow-visible max-[1180px]:[&>.editor-workspace-rail-right]:col-span-2 max-[1180px]:[&>.editor-workspace-rail-right]:border-t max-[1180px]:[&>.editor-workspace-rail-right]:border-l-0">
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
          <TabsList
            aria-label="Editor left rail"
            className="w-full"
            variant="line"
          >
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
              onSliderHaptic={onSelectionFeedback}
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
          cardEnabled={Object.fromEntries(
            activeDataCards.map((card) => [card.id, card.enabled]),
          )}
          inferredCameraBrand={inferredCameraBrand}
          overrides={fieldOverrides}
          resolvedFields={resolvedFields}
          templateControlValues={templateControlValues}
          onCardEnabledChange={handleCardEnabledChange}
          onOverrideChange={handleOverrideChange}
          onTemplateControlChange={handleTemplateControlChange}
        />
      </section>
    </div>
  );
}

function MobileStyleDetail({
  controlValues,
  onPressFeedback,
  onControlChange,
  prefersReducedMotion,
  section,
  template,
}: {
  controlValues: StylePanelValues;
  onPressFeedback: () => void;
  onControlChange: (
    id: keyof StylePanelValues,
    value: StylePanelValues[keyof StylePanelValues],
  ) => void;
  prefersReducedMotion: boolean;
  section: "frame" | "color" | "type" | "brand";
  template: WatermarkTemplate;
}) {
  const [activeColorField, setActiveColorField] = useState<
    "canvasBackground" | "textColor" | "logoColor" | null
  >(null);
  const [isSpacingDrawerOpen, setSpacingDrawerOpen] = useState(false);
  const ratioOptions = [
    { label: "Original", value: "original" as const },
    ...template.aspectSupport.map((aspect) => ({
      label: aspect,
      value: aspect,
    })),
  ];
  const colorFieldMeta = {
    canvasBackground: {
      label: "Canvas",
      value: controlValues.canvasBackground,
    },
    textColor: { label: "Text", value: controlValues.textColor },
    logoColor: { label: "Logo", value: controlValues.logoColor },
  } as const;

  if (section === "frame") {
    return (
      <div className="grid gap-3 p-2">
        <MobileControlRow label="Ratio">
          <div className="grid grid-cols-4 gap-1.5">
            {ratioOptions.map((option) => (
              <VisualTileButton
                key={option.value}
                active={controlValues.outputRatio === option.value}
                className="min-h-0 gap-1 px-1.5 py-1.5"
                label={option.label}
                onClick={() => {
                  onPressFeedback();
                  onControlChange("outputRatio", option.value);
                }}
                prefersReducedMotion={prefersReducedMotion}
              >
                <div
                  className={cn(
                    "mx-auto border border-white/20",
                    option.value === "original" && "h-4 w-7",
                    option.value === "1:1" && "size-5",
                    option.value === "4:5" && "h-6 w-5",
                    option.value === "3:2" && "h-4 w-6",
                    option.value === "16:9" && "h-3.5 w-7",
                    option.value === "9:16" && "h-7 w-3.5",
                  )}
                />
              </VisualTileButton>
            ))}
          </div>
        </MobileControlRow>
        <MobileControlRow label="Image">
          <div className="grid grid-cols-2 gap-1.5">
            {imageFillOptions.map((option) => (
              <VisualTileButton
                key={option.value}
                active={controlValues.imageFit === option.value}
                className="grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-2 py-1.5"
                label={option.label}
                onClick={() => {
                  onPressFeedback();
                  onControlChange("imageFit", option.value);
                }}
                prefersReducedMotion={prefersReducedMotion}
              >
                <div className="grid h-8 place-items-center border border-white/12 bg-white/[0.02]">
                  <div
                    className={cn(
                      "border border-white/28 bg-white/10",
                      option.value === "cover" ? "h-5 w-5" : "h-4 w-6",
                    )}
                  />
                </div>
              </VisualTileButton>
            ))}
          </div>
        </MobileControlRow>
        <div className="flex justify-center pt-1">
          <MotionButton
            type="button"
            variant="outline"
            size="sm"
            aria-label="Open spacing controls"
            className="h-9 min-w-32 rounded-none border-white/10 bg-white/[0.03] px-4 text-[0.68rem] font-semibold tracking-[0.12em] text-white/72 uppercase hover:bg-white/[0.08] hover:text-white"
            onClick={() => {
              onPressFeedback();
              setSpacingDrawerOpen(true);
            }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
            transition={TAP_TRANSITION}
          >
            <ScanTextIcon className="size-3.5" />
            Spacing
          </MotionButton>
        </div>
        <Drawer open={isSpacingDrawerOpen} onOpenChange={setSpacingDrawerOpen}>
          <DrawerContent className="dark border-white/10 bg-[#121110] p-0 text-white">
            <div className="grid gap-4 p-4">
              <DrawerHeader className="gap-1 p-0 text-left">
                <DrawerTitle className="text-sm font-semibold text-white">
                  Spacing
                </DrawerTitle>
                <DrawerDescription className="text-xs text-white/48">
                  Adjust the canvas padding around the artwork.
                </DrawerDescription>
              </DrawerHeader>
              <MobileSpacingControls
                controlValues={controlValues}
                onControlChange={onControlChange}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  if (section === "color") {
    return (
      <div className="grid gap-2.5 p-2">
        <MobileControlRow label="Color">
          <div className="grid grid-cols-3 gap-2">
            {(
              Object.entries(colorFieldMeta) as Array<
                [
                  "canvasBackground" | "textColor" | "logoColor",
                  { label: string; value: string },
                ]
              >
            ).map(([fieldId, meta]) => (
              <motion.button
                key={fieldId}
                type="button"
                className="grid gap-2 border border-white/10 p-2 text-left"
                onClick={() => {
                  onPressFeedback();
                  setActiveColorField(fieldId);
                }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                transition={TAP_TRANSITION}
              >
                <div
                  className="h-10 border border-white/12"
                  style={{ backgroundColor: meta.value }}
                />
                <span className="text-[0.68rem] text-white/58">
                  {meta.label}
                </span>
              </motion.button>
            ))}
          </div>
        </MobileControlRow>
        <Drawer
          open={activeColorField !== null}
          onOpenChange={(open) => !open && setActiveColorField(null)}
        >
          <DrawerContent className="border-white/10 bg-[#121110] p-0 text-white">
            {activeColorField ? (
              <div className="grid gap-4 p-4">
                <DrawerHeader className="gap-1 p-0 text-left">
                  <DrawerTitle className="text-sm font-semibold text-white">
                    {colorFieldMeta[activeColorField].label}
                  </DrawerTitle>
                  <DrawerDescription className="text-xs text-white/48">
                    Adjust the active color here.
                  </DrawerDescription>
                </DrawerHeader>
                <CompactColorInput
                  label={colorFieldMeta[activeColorField].label}
                  value={colorFieldMeta[activeColorField].value}
                  onChange={(value) => onControlChange(activeColorField, value)}
                />
              </div>
            ) : null}
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  if (section === "type") {
    return (
      <div className="grid gap-3 p-2">
        <MobileControlRow label="Typography">
          <div className="grid grid-cols-3 gap-2">
            {typographyThemeOptions.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                aria-pressed={controlValues.typographyTheme === option.value}
                className={cn(
                  "grid min-h-16 place-items-center border border-white/10 px-2 py-3 text-white/76",
                  controlValues.typographyTheme === option.value &&
                    "border-primary/60 bg-white/[0.04] text-primary",
                  option.value === "signature" && "font-heading text-[1rem]",
                  option.value === "editorial" && "font-serif text-[1.05rem]",
                  option.value === "mono" && "font-mono text-[0.9rem]",
                )}
                onClick={() => {
                  onPressFeedback();
                  onControlChange(
                    "typographyTheme",
                    option.value as TypographyTheme,
                  );
                }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                transition={TAP_TRANSITION}
              >
                {option.label}
              </motion.button>
            ))}
          </div>
        </MobileControlRow>
      </div>
    );
  }

  return (
    <div className="grid gap-3 p-2">
      <MobileControlRow label="Logo Size">
        <div className="grid gap-2">
          <div className="flex items-center justify-between text-[0.72rem] text-white/56">
            <span>Scale</span>
            <span>{controlValues.logoScale.toFixed(1)}x</span>
          </div>
          <Slider
            aria-label="Logo Size"
            variant="panel"
            min={0.5}
            max={3}
            step={0.1}
            value={controlValues.logoScale}
            onHaptic={onPressFeedback}
            onValueChange={(nextValue) => {
              const resolvedValue = Array.isArray(nextValue)
                ? (nextValue[0] ?? controlValues.logoScale)
                : nextValue;
              onControlChange("logoScale", resolvedValue);
            }}
          />
        </div>
      </MobileControlRow>
      <MobileControlRow label="Position">
        <CompactChoiceRow
          options={brandPositionOptions}
          value={controlValues.brandPosition}
          prefersReducedMotion={prefersReducedMotion}
          onPressFeedback={onPressFeedback}
          onChange={(value) =>
            onControlChange("brandPosition", value as BrandPosition)
          }
        />
      </MobileControlRow>
    </div>
  );
}

function MobileInfoDetail({
  card,
  cardEnabled,
  inferredCameraBrand,
  overrides,
  resolvedFields,
  templateControlValues,
  onCardEnabledChange,
  onOverrideChange,
  onTemplateControlChange,
}: {
  card: TemplateDataCard | null;
  cardEnabled: Record<string, boolean>;
  inferredCameraBrand: ReturnType<typeof getCameraBrandName>;
  overrides: Record<string, string>;
  resolvedFields: ResolvedFieldMap;
  templateControlValues: Record<string, string | number | boolean>;
  onCardEnabledChange: (cardId: string, enabled: boolean) => void;
  onOverrideChange: (fieldId: string, value: string) => void;
  onTemplateControlChange: (controlId: string, value: string) => void;
}) {
  if (card === null) {
    return null;
  }

  return (
    <div className="grid gap-2.5 p-2">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 className="text-sm font-semibold text-white">{card.title}</h3>
          {card.mode === "placeholder" ? (
            <span className="text-[0.66rem] font-semibold tracking-[0.12em] text-white/44 uppercase">
              Missing
            </span>
          ) : null}
        </div>
        {card.requiredByTemplate ? null : (
          <Switch
            checked={cardEnabled[card.id] ?? false}
            aria-label={`Display ${card.title}`}
            className="border-white/15 bg-white/10 data-checked:border-primary/70 data-checked:bg-primary [&_[data-slot=switch-thumb]]:bg-white [&_[data-slot=switch-thumb]]:shadow-none"
            onCheckedChange={(checked) => onCardEnabledChange(card.id, checked)}
          />
        )}
      </div>
      {card.bindings.map((binding) => {
        if (binding === "cameraBrandLogo") {
          const currentBrand = overrides[binding] ?? inferredCameraBrand ?? "";
          return (
            <MobileControlRow key={binding} label="Camera Brand">
              <Select
                value={currentBrand}
                onValueChange={(value) =>
                  onOverrideChange(binding, value ?? "")
                }
              >
                <SelectTrigger
                  aria-label="Camera brand logo"
                  className="h-8 rounded-none border-white/10 bg-white/[0.03] text-xs text-white"
                >
                  <SelectValue placeholder="Auto detect" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Auto detect</SelectItem>
                  {cameraBrandOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </MobileControlRow>
          );
        }

        const field = resolvedFields[binding];
        if (!field || field.kind !== "text") {
          return null;
        }

        const templateControlValue = templateControlValues[binding];
        const isTemplateControlledText =
          typeof templateControlValue === "string";
        const hasOverride = Object.hasOwn(overrides, binding);
        const inputValue = isTemplateControlledText
          ? templateControlValue
          : hasOverride
            ? (overrides[binding] ?? "")
            : `{${binding}}`;

        return (
          <MobileControlRow key={binding} label={binding}>
            <Input
              aria-label={`Manual value for ${card.title}`}
              type="text"
              className="h-8 rounded-none border-white/10 bg-white/[0.03] px-2 text-xs text-white"
              value={inputValue}
              onChange={(event) => {
                if (isTemplateControlledText) {
                  onTemplateControlChange(binding, event.target.value);
                  return;
                }

                onOverrideChange(binding, event.target.value);
              }}
            />
          </MobileControlRow>
        );
      })}
    </div>
  );
}

function MobileWorkspace({
  activeDataCards,
  controlValues,
  dispatch,
  exportStatusMessage,
  exportValues,
  fieldOverrides,
  inferredCameraBrand,
  resolvedFields,
  templateControlValues,
  handleCardEnabledChange,
  handleControlChange,
  handleExport,
  handleExportOptionChange,
  handleOverrideChange,
  handleTemplateControlChange,
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
  templateControlValues: Record<string, string | number | boolean>;
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
  handleTemplateControlChange: (controlId: string, value: string) => void;
  handleShare: () => Promise<void>;
  instance: EditorInstance | null;
  importError: string | null;
  previewRenderState: PreviewRenderState;
  previewStageRef: RefObject<PreviewStageHandle | null>;
  setPreviewRenderState: (state: PreviewRenderState) => void;
  template: WatermarkTemplate;
  handleTemplateSelect: (templateId: string) => void;
}) {
  const [mobileTab, setMobileTab] = useState<
    "template" | "style" | "info" | null
  >(null);
  const [mobileStyleSection, setMobileStyleSection] = useState<
    "frame" | "color" | "type" | "brand"
  >("frame");
  const [mobileInfoSection, setMobileInfoSection] = useState<string>(
    () => activeDataCards[0]?.id ?? "",
  );
  const isMobilePanelOpen = mobileTab !== null;
  const haptic = useWebHaptics();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const selectedMobileInfoCard =
    activeDataCards.find((card) => card.id === mobileInfoSection) ??
    activeDataCards[0] ??
    null;
  const lastSelectionHapticAtRef = useRef<number>(0);
  const mobileInfoItems = activeDataCards.map((card, index) => {
    const icon = card.id.includes("location")
      ? MapPinIcon
      : card.id.includes("brand")
        ? BadgeInfoIcon
        : index === 0
          ? CameraIcon
          : BadgeInfoIcon;
    return {
      id: card.id,
      label: card.title,
      icon,
    };
  });
  const secondaryItems =
    mobileTab === "style"
      ? [
          { id: "frame", label: "Frame", icon: FrameIcon },
          { id: "color", label: "Color", icon: PaletteIcon },
          { id: "type", label: "Type", icon: TypeIcon },
          { id: "brand", label: "Brand", icon: CameraIcon },
        ]
      : mobileTab === "info"
        ? mobileInfoItems
        : [];

  const triggerImpact = (type: "" | "light" | "medium" | "heavy" = "light") => {
    void haptic.trigger(type);
  };

  const triggerSelection = () => {
    const now = Date.now();
    if (now - lastSelectionHapticAtRef.current < SLIDER_HAPTIC_THROTTLE_MS) {
      return;
    }

    lastSelectionHapticAtRef.current = now;
    void haptic.trigger(SLIDER_HAPTIC_PATTERN);
  };

  useEffect(() => {
    if (mobileInfoItems.length === 0) {
      return;
    }

    if (!mobileInfoItems.some((item) => item.id === mobileInfoSection)) {
      setMobileInfoSection(mobileInfoItems[0]?.id ?? "");
    }
  }, [mobileInfoItems, mobileInfoSection]);

  return (
    <div className="editor-mobile-workspace relative grid h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-[radial-gradient(circle_at_1px_1px,rgba(255,236,173,0.1)_1px,transparent_0),radial-gradient(circle_at_top,rgba(255,214,63,0.09),transparent_28%),linear-gradient(180deg,rgba(31,27,18,0.96),rgba(13,11,7,0.995))] bg-[size:18px_18px,auto,auto] min-[781px]:hidden">
      {instance === null ? (
        <MobileImportGuidance prefersReducedMotion={prefersReducedMotion} />
      ) : null}
      <section
        aria-label="Mobile editor header"
        className="px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <div className="flex min-w-0 items-center">
            <img
              src="/quill-logo.png"
              alt="Quill Studio"
              className="h-7 w-7 object-contain"
            />
          </div>
          <div className="flex justify-center">
            <ImageImporter
              dispatch={dispatch}
              importError={importError}
              buttonAriaLabel="Add image"
              buttonLabel={instance === null ? "Add Image" : "Change"}
              buttonSize="icon-lg"
              description=""
              className=" justify-items-center gap-0 w-22"
              buttonClassName="rounded-none"
              iconOnly
              onPressFeedback={() => triggerImpact("medium")}
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
          <div className="flex justify-end">
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
              layout="mobile"
              onImpactFeedback={triggerImpact}
              onSelectionFeedback={triggerSelection}
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
        </div>
        {importError ? (
          <p role="alert" className="text-sm text-red-200">
            {importError}
          </p>
        ) : null}
      </section>

      <section
        aria-label="Preview workspace"
        className={cn(
          "editor-mobile-stage relative flex min-h-0 items-stretch justify-center overflow-hidden bg-transparent px-2 transition-[padding] duration-200 ease-out",
          isMobilePanelOpen ? "py-2" : "py-1",
        )}
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
        aria-label="Mobile controls"
        className="relative z-20 bg-transparent px-4 pt-1 pb-[calc(0.65rem+env(safe-area-inset-bottom))]"
      >
        <div
          className={cn(
            "overflow-hidden transition-[height,opacity,margin] duration-200 ease-out",
            isMobilePanelOpen ? "mt-0.5 h-52 opacity-100" : "h-0 opacity-0",
          )}
        >
          <AnimatePresence initial={false} mode="wait">
            {mobileTab ? (
              <motion.div
                key={`${mobileTab}:${mobileTab === "style" ? mobileStyleSection : mobileInfoSection}`}
                initial={
                  prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }
                }
                animate={{ opacity: 1, y: 0 }}
                exit={
                  prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }
                }
                transition={PANEL_TRANSITION}
                className={cn(
                  "flex h-full w-full flex-col pt-1 pb-2 [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/25",
                  mobileTab === "template"
                    ? "justify-end overflow-x-auto overflow-y-hidden pb-3 [&::-webkit-scrollbar]:h-1.5"
                    : "justify-end overflow-x-hidden overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5",
                )}
              >
                {mobileTab === "template" ? (
                  <TemplateLibraryScreen
                    templates={templates}
                    selectedTemplateId={template.id}
                    layout="mobile-strip"
                    onSelect={handleTemplateSelect}
                    onPressFeedback={triggerSelection}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                ) : null}
                {mobileTab === "style" ? (
                  <MobileStyleDetail
                    template={template}
                    controlValues={controlValues}
                    onControlChange={handleControlChange}
                    section={mobileStyleSection}
                    onPressFeedback={triggerSelection}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                ) : null}
                {mobileTab === "info" ? (
                  <MobileInfoDetail
                    card={selectedMobileInfoCard}
                    cardEnabled={Object.fromEntries(
                      activeDataCards.map((card) => [card.id, card.enabled]),
                    )}
                    inferredCameraBrand={inferredCameraBrand}
                    overrides={fieldOverrides}
                    resolvedFields={resolvedFields}
                    templateControlValues={templateControlValues}
                    onCardEnabledChange={handleCardEnabledChange}
                    onOverrideChange={handleOverrideChange}
                    onTemplateControlChange={handleTemplateControlChange}
                  />
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        {secondaryItems.length > 0 ? (
          <div
            aria-label="Mobile secondary controls"
            className="mb-1 grid grid-cols-[repeat(auto-fit,minmax(3.75rem,1fr))] gap-1 pt-0.5"
          >
            {secondaryItems.map((item) => {
              const isActive =
                mobileTab === "style"
                  ? mobileStyleSection === item.id
                  : mobileInfoSection === item.id;
              const Icon = item.icon;
              return (
                <MotionButton
                  key={item.id}
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-pressed={isActive}
                  className={cn(
                    "flex h-auto min-h-10 flex-col items-center justify-center gap-0.5 rounded-none border border-transparent px-1 py-1 text-white/62 hover:bg-white/[0.04] hover:text-white",
                    isActive && "border-white/10 bg-white/[0.06] text-primary",
                  )}
                  onClick={() => {
                    triggerSelection();
                    if (mobileTab === "style") {
                      setMobileStyleSection(
                        item.id as "frame" | "color" | "type" | "brand",
                      );
                    } else {
                      setMobileInfoSection(item.id);
                    }
                  }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                  transition={TAP_TRANSITION}
                >
                  <Icon className="size-3.5" />
                  <span className="line-clamp-1 text-[0.56rem] font-medium tracking-[0.06em] uppercase">
                    {item.label}
                  </span>
                </MotionButton>
              );
            })}
          </div>
        ) : null}
        <div
          role="tablist"
          data-slot="mobile-tablist"
          aria-label="Editor mobile tabs"
          className="grid w-full grid-cols-3"
        >
          {(
            [
              { id: "template", label: "Template" },
              { id: "style", label: "Style" },
              { id: "info", label: "Info" },
            ] as const
          ).map((tab) => {
            const isActive = mobileTab === tab.id;
            return (
              <div key={tab.id} className="relative w-full">
                {isActive ? (
                  <motion.div
                    layoutId="mobile-primary-tab-indicator"
                    className="absolute inset-0 bg-white/[0.05]"
                    transition={PANEL_TRANSITION}
                  />
                ) : null}
                <motion.button
                  type="button"
                  aria-pressed={isActive}
                  className={cn(
                    "relative flex h-9 w-full items-center justify-center rounded-none border-0 bg-transparent px-2 text-center text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-white/68 outline-none transition-colors hover:text-primary focus-visible:text-primary",
                    isActive && "text-primary",
                  )}
                  onClick={() => {
                    triggerSelection();
                    setMobileTab((current) => {
                      const nextTab = current === tab.id ? null : tab.id;
                      if (nextTab === "style") {
                        setMobileStyleSection("frame");
                      }
                      if (nextTab === "info") {
                        setMobileInfoSection(activeDataCards[0]?.id ?? "");
                      }
                      return nextTab;
                    });
                  }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                  transition={TAP_TRANSITION}
                >
                  {tab.label}
                </motion.button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function mimeTypeFromFormat(
  format: ExportFormat,
): "image/png" | "image/jpeg" | "image/webp" {
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

export function EditorScreen({
  template,
  instance,
  importError,
  dispatch,
}: EditorScreenProps) {
  const atomDataCards = useAtomValue(editorDataCardsAtom);
  const controlValues = useAtomValue(editorControlsAtom);
  const exportValues = useAtomValue(editorExportOptionsAtom);
  const fieldOverrides = useAtomValue(fieldOverridesAtom);
  const resolvedFields = useAtomValue(editorResolvedFieldsAtom);
  const templateControlValues = useAtomValue(editorTemplateControlValuesAtom);
  const haptic = useWebHaptics();
  const lastSelectionHapticAtRef = useRef<number>(0);
  const activeDataCards = atomDataCards;
  const inferredCameraBrand = getCameraBrandName(
    instance?.metadata.camera.make,
  );
  const previewStageRef = useRef<PreviewStageHandle | null>(null);
  const [previewRenderState, setPreviewRenderState] =
    useState<PreviewRenderState>("idle");
  const [, startControlTransition] = useTransition();
  const [isMobileViewport, setMobileViewport] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.innerWidth < 781;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      setMobileViewport(window.innerWidth < 781);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleControlChange = (
    id: keyof StylePanelValues,
    value: StylePanelValues[keyof StylePanelValues],
  ) => {
    scheduleControlChange(startControlTransition, dispatch, id, value);
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

  const handleTemplateControlChange = (controlId: string, value: string) => {
    void dispatch({
      type: "editor/set-template-control",
      payload: { id: controlId, value },
    });
  };

  const triggerSelection = () => {
    const now = Date.now();
    if (now - lastSelectionHapticAtRef.current < SLIDER_HAPTIC_THROTTLE_MS) {
      return;
    }

    lastSelectionHapticAtRef.current = now;
    void haptic.trigger(SLIDER_HAPTIC_PATTERN);
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
        fileBaseName:
          instance.sourceFile.name.replace(/\.[^.]+$/, "") ?? "quill-watermark",
        mimeType: mimeTypeFromFormat(exportValues.format),
        quality: qualityFromFormat(exportValues.format),
      });
    } finally {
      decodedAsset.dispose();
    }
  };

  const [exportStatusMessage, setExportStatusMessage] = useState<string | null>(
    null,
  );

  const handleExport = async () => {
    try {
      const exportedImage = await buildExportedImage();
      downloadExport(exportedImage.blob, exportedImage.fileName);
      setExportStatusMessage(
        `Exported ${exportValues.format.toUpperCase()} at ${exportValues.multiplier}x.`,
      );
    } catch (error) {
      setExportStatusMessage(
        error instanceof Error ? error.message : "Unable to export preview.",
      );
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
      setExportStatusMessage(
        error instanceof Error ? error.message : "Unable to share preview.",
      );
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
    <section
      aria-label="Editor"
      className="editor-screen dark flex min-h-0 flex-1 flex-col"
      data-theme="dark"
    >
      {isMobileViewport ? (
        <MobileWorkspace
          activeDataCards={activeDataCards}
          controlValues={controlValues}
          dispatch={dispatch}
          exportStatusMessage={exportStatusMessage}
          exportValues={exportValues}
          fieldOverrides={fieldOverrides}
          inferredCameraBrand={inferredCameraBrand}
          resolvedFields={resolvedFields}
          templateControlValues={templateControlValues}
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
          handleTemplateControlChange={handleTemplateControlChange}
        />
      ) : (
        <DesktopWorkspace
          activeDataCards={activeDataCards}
          controlValues={controlValues}
          dispatch={dispatch}
          exportStatusMessage={exportStatusMessage}
          exportValues={exportValues}
          fieldOverrides={fieldOverrides}
          inferredCameraBrand={inferredCameraBrand}
          resolvedFields={resolvedFields}
          templateControlValues={templateControlValues}
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
          handleTemplateControlChange={handleTemplateControlChange}
          onSelectionFeedback={triggerSelection}
        />
      )}
    </section>
  );
}
