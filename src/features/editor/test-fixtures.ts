import { vi } from "vite-plus/test";
import type { EditorAction, EditorInstance } from "../../app/app-state";
import { templates } from "../../template-engine/templates";
import type {
  ResolvedFieldMap,
  TemplateDataCard,
  WatermarkTemplate,
} from "../../template-engine/types";

interface EditorScreenFixtureProps {
  template: WatermarkTemplate;
  instance: EditorInstance | null;
  importError: string | null;
  dispatch: (action: EditorAction) => Promise<void> | void;
  dataCards: TemplateDataCard[];
  resolvedFields: ResolvedFieldMap;
}

const loadedInstance: EditorInstance = {
  sourceFile: new File(["binary"], "harbor.jpg", { type: "image/jpeg" }),
  metadata: {
    camera: { make: "Leica", model: "Q2" },
    exposure: {
      iso: 400,
      aperture: 1.7,
      shutterSeconds: 1 / 125,
      focalLengthMm: 28,
    },
    location: {
      latitude: null,
      longitude: null,
    },
    shotTime: "2026-04-09T02:15:00.000Z",
  },
};

const resolvedFields: ResolvedFieldMap = {
  cameraModel: {
    kind: "text",
    source: "exif",
    editable: false,
    mode: "auto",
    value: "Q2",
  },
  shootingParameters: {
    kind: "text",
    source: "derived",
    editable: false,
    mode: "auto",
    value: "28mm • f/1.7 • 1/125s • ISO 400",
  },
  locationLine: {
    kind: "text",
    source: "derived",
    editable: false,
    mode: "placeholder",
    value: "Location unavailable",
  },
  authorLine: {
    kind: "text",
    source: "user",
    editable: true,
    mode: "auto",
    value: "By Max Tune",
  },
  brandLine: {
    kind: "text",
    source: "brand",
    editable: true,
    mode: "auto",
    value: "Shot on Quill",
  },
};

const dataCards: TemplateDataCard[] = [
  {
    id: "camera-model",
    title: "Camera Model",
    bindings: ["cameraModel"],
    enabled: true,
    mode: "auto",
    previewValue: "Q2",
    editable: false,
    requiredByTemplate: true,
  },
  {
    id: "shooting-parameters",
    title: "Shooting Parameters",
    bindings: ["shootingParameters"],
    enabled: true,
    mode: "auto",
    previewValue: "28mm • f/1.7 • 1/125s • ISO 400",
    editable: false,
    requiredByTemplate: true,
  },
  {
    id: "location",
    title: "Location",
    bindings: ["locationLine"],
    enabled: true,
    mode: "placeholder",
    previewValue: "Location unavailable",
    editable: false,
    requiredByTemplate: true,
  },
  {
    id: "author",
    title: "Author",
    bindings: ["authorLine"],
    enabled: true,
    mode: "auto",
    previewValue: "By Max Tune",
    editable: true,
    requiredByTemplate: true,
  },
];

export function makeLoadedEditorProps(
  overrides: Partial<EditorScreenFixtureProps> = {},
): EditorScreenFixtureProps {
  return {
    template: templates[0],
    instance: loadedInstance,
    importError: null,
    dispatch: vi.fn<(action: EditorAction) => void>(),
    dataCards,
    resolvedFields,
    ...overrides,
  };
}

export function makePendingEditorProps(
  overrides: Partial<EditorScreenFixtureProps> = {},
): EditorScreenFixtureProps {
  return {
    template: templates[0],
    instance: null,
    importError: null,
    dispatch: vi.fn<(action: EditorAction) => void>(),
    dataCards,
    resolvedFields,
    ...overrides,
  };
}
