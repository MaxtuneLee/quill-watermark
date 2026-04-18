import { atom } from "jotai";
import type {
  ExportPanelValues,
  StyleControlId,
  StyleControlValue,
  StylePanelValues,
} from "../features/editor/panels/panel-state";
import {
  createInitialCardEnabled,
  createInitialControlValues,
  createInitialExportValues,
  isStyleControlId,
} from "../features/editor/panels/panel-state";
import type { NormalizedMetadata } from "../services/metadata/types";
import { extractMetadata } from "../services/metadata/extract-metadata";
import { resolvePresetLayout } from "../template-engine/presets/resolve-preset";
import { createDataCards } from "../template-engine/schema/create-data-cards";
import { resolveFields } from "../template-engine/schema/resolve-fields";
import { templates } from "../template-engine/templates";
import type {
  ResolvedFieldMap,
  TemplateLayoutNode,
  TemplateDataCard,
  TemplateFieldDefinition,
  TemplateFieldSources,
  WatermarkTemplate,
} from "../template-engine/types";

export type AppScreen = "library" | "editor-pending-image" | "editor";
export const IMAGE_IMPORT_ERROR_MESSAGE = "Could not import photo. Please try a different image.";

export interface EditorInstance {
  sourceFile: File;
  metadata: NormalizedMetadata;
}

type TemplateControlPrimitive = string | number | boolean;

interface TemplateScopedSession {
  templateId: string;
  userSourceValues: Record<string, string>;
  fieldOverrides: Record<string, string>;
  controls: StylePanelValues;
  templateControlValues: Record<string, TemplateControlPrimitive>;
  cardEnabled: Record<string, boolean>;
  exportOptions: ExportPanelValues;
}

interface LibrarySession {
  screen: "library";
}

interface EditorPendingImageSession extends TemplateScopedSession {
  screen: "editor-pending-image";
  importError: string | null;
}

interface EditorSession extends TemplateScopedSession {
  screen: "editor";
  instance: EditorInstance;
}

type AppSession = LibrarySession | EditorPendingImageSession | EditorSession;

export type EditorAction =
  | {
      type: "return-to-library";
    }
  | {
      type: "select-template";
      templateId: string;
    }
  | {
      type: "import-image";
      sourceFile: File;
    }
  | {
      type: "clear-image";
    }
  | {
      type: "set-import-error";
      message: string | null;
    }
  | {
      type: "set-field-override";
      fieldId: string;
      value: string;
    }
  | {
      type: "set-user-source-value";
      path: string;
      value: string;
    }
  | {
      type: "replace-metadata";
      metadata: NormalizedMetadata;
    }
  | {
      type: "editor/set-control";
      payload: {
        id: StyleControlId;
        value: StyleControlValue;
      };
    }
  | {
      type: "editor/set-template-control";
      payload: {
        id: string;
        value: TemplateControlPrimitive;
      };
    }
  | {
      type: "editor/set-card-enabled";
      payload: {
        id: string;
        enabled: boolean;
      };
    }
  | {
      type: "editor/set-export-option";
      payload: {
        id: "format" | "multiplier";
        value: string | number;
      };
    };

const emptyMetadata: NormalizedMetadata = {
  camera: {
    make: null,
    model: null,
  },
  exposure: {
    iso: null,
    aperture: null,
    shutterSeconds: null,
    focalLengthMm: null,
  },
  location: {
    latitude: null,
    longitude: null,
  },
  shotTime: null,
};

const templateMap = new Map<string, WatermarkTemplate>(
  templates.map((template) => [template.id, template]),
);

function buildPendingImageSession(
  templateId: string,
  importError: string | null,
  userSourceValues: Record<string, string>,
  fieldOverrides: Record<string, string>,
  controls: StylePanelValues,
  templateControlValues: Record<string, TemplateControlPrimitive>,
  cardEnabled: Record<string, boolean>,
  exportOptions: ExportPanelValues,
): EditorPendingImageSession {
  return {
    screen: "editor-pending-image",
    templateId,
    importError,
    userSourceValues,
    fieldOverrides,
    controls,
    templateControlValues,
    cardEnabled,
    exportOptions,
  };
}

function buildEditorSession(
  templateId: string,
  instance: EditorInstance,
  userSourceValues: Record<string, string>,
  fieldOverrides: Record<string, string>,
  controls: StylePanelValues,
  templateControlValues: Record<string, TemplateControlPrimitive>,
  cardEnabled: Record<string, boolean>,
  exportOptions: ExportPanelValues,
): EditorSession {
  return {
    screen: "editor",
    templateId,
    instance,
    userSourceValues,
    fieldOverrides,
    controls,
    templateControlValues,
    cardEnabled,
    exportOptions,
  };
}

function createInitialTemplateControlValues(
  template: WatermarkTemplate,
): Record<string, TemplateControlPrimitive> {
  return Object.fromEntries(template.controls.map((control) => [control.id, control.defaultValue]));
}

function createDefaultTemplateScopedState(template: WatermarkTemplate) {
  return {
    controls: createInitialControlValues(template),
    templateControlValues: createInitialTemplateControlValues(template),
    cardEnabled: createInitialCardEnabled(template),
    exportOptions: createInitialExportValues(),
  };
}

function updateTemplateScopedSession(
  session: EditorPendingImageSession | EditorSession,
  overrides: Partial<TemplateScopedSession> = {},
): EditorPendingImageSession | EditorSession {
  const nextScopedState = {
    templateId: overrides.templateId ?? session.templateId,
    userSourceValues: overrides.userSourceValues ?? session.userSourceValues,
    fieldOverrides: overrides.fieldOverrides ?? session.fieldOverrides,
    controls: overrides.controls ?? session.controls,
    templateControlValues: overrides.templateControlValues ?? session.templateControlValues,
    cardEnabled: overrides.cardEnabled ?? session.cardEnabled,
    exportOptions: overrides.exportOptions ?? session.exportOptions,
  };

  if (session.screen === "editor") {
    return buildEditorSession(
      nextScopedState.templateId,
      session.instance,
      nextScopedState.userSourceValues,
      nextScopedState.fieldOverrides,
      nextScopedState.controls,
      nextScopedState.templateControlValues,
      nextScopedState.cardEnabled,
      nextScopedState.exportOptions,
    );
  }

  return buildPendingImageSession(
    nextScopedState.templateId,
    session.importError,
    nextScopedState.userSourceValues,
    nextScopedState.fieldOverrides,
    nextScopedState.controls,
    nextScopedState.templateControlValues,
    nextScopedState.cardEnabled,
    nextScopedState.exportOptions,
  );
}

function formatExposureValue(prefix: string, value: number | null, suffix = ""): string | null {
  if (value === null) {
    return null;
  }

  return `${prefix}${value}${suffix}`;
}

function joinParts(parts: Array<string | null>, separator: string): string | null {
  const values = parts.filter((part): part is string => part !== null && part.length > 0);
  return values.length > 0 ? values.join(separator) : null;
}

function formatShutterSpeed(shutterSeconds: number | null): string | null {
  if (shutterSeconds === null) {
    return null;
  }

  if (shutterSeconds >= 1) {
    return `${shutterSeconds}s`;
  }

  const denominator = Math.round(1 / shutterSeconds);
  return denominator > 0 ? `1/${denominator}s` : null;
}

function formatLocationLine(metadata: NormalizedMetadata): string | null {
  const { latitude, longitude } = metadata.location;
  if (latitude === null || longitude === null) {
    return null;
  }

  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

function formatShotTimeLine(shotTime: string | null): string | null {
  if (shotTime === null) {
    return null;
  }

  const parsed = new Date(shotTime);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(parsed);
}

function formatCameraModel(metadata: NormalizedMetadata): string | null {
  return joinParts([metadata.camera.make, metadata.camera.model], " ");
}

function formatCameraSummary(metadata: NormalizedMetadata): string | null {
  return joinParts(
    [
      formatCameraModel(metadata),
      formatExposureValue("", metadata.exposure.focalLengthMm, "mm"),
      formatExposureValue("f/", metadata.exposure.aperture),
      formatShutterSpeed(metadata.exposure.shutterSeconds),
      formatExposureValue("ISO ", metadata.exposure.iso),
    ],
    " • ",
  );
}

function formatShootingParameters(metadata: NormalizedMetadata): string | null {
  return joinParts(
    [
      formatExposureValue("", metadata.exposure.focalLengthMm, "mm"),
      formatExposureValue("f/", metadata.exposure.aperture),
      formatShutterSpeed(metadata.exposure.shutterSeconds),
      formatExposureValue("ISO ", metadata.exposure.iso),
    ],
    " • ",
  );
}

function assignSourceValue(
  target: Record<string, unknown>,
  definition: TemplateFieldDefinition,
  value: string,
): void {
  if (!definition.path) {
    return;
  }

  const segments = definition.path.split(".");
  let current = target;

  for (const segment of segments.slice(0, -1)) {
    const next = current[segment];
    if (typeof next === "object" && next !== null) {
      current = next as Record<string, unknown>;
      continue;
    }

    const branch: Record<string, unknown> = {};
    current[segment] = branch;
    current = branch;
  }

  const lastSegment = segments.at(-1);
  if (lastSegment) {
    current[lastSegment] = value;
  }
}

function readTemplateControlTokenValue(
  token: string,
  sources: TemplateFieldSources,
): string | null {
  const trimmedToken = token.trim();
  if (trimmedToken.length === 0) {
    return null;
  }

  const sourcePathMatch = trimmedToken.match(/^(exif|gps|user|derived|afilmory|brand)\./);
  if (sourcePathMatch) {
    const [sourceName, ...pathSegments] = trimmedToken.split(".");
    const source = sources[sourceName as keyof TemplateFieldSources];
    if (!source) {
      return null;
    }

    let current: unknown = source;
    for (const segment of pathSegments) {
      if (typeof current !== "object" || current === null || !(segment in current)) {
        return null;
      }

      current = (current as Record<string, unknown>)[segment];
    }

    if (current === null || current === undefined) {
      return null;
    }

    return typeof current === "string" ? current : String(current);
  }

  const sourceCandidates = [
    sources.derived,
    sources.brand,
    sources.user,
    sources.exif,
    sources.gps,
    sources.afilmory,
  ];

  for (const source of sourceCandidates) {
    if (!(trimmedToken in source)) {
      continue;
    }

    const value = source[trimmedToken];
    if (value === null || value === undefined) {
      if (trimmedToken === "cameraModel") {
        return "Camera unavailable";
      }
      return null;
    }

    return typeof value === "string" ? value : String(value);
  }

  if (trimmedToken === "cameraModel") {
    return "Camera unavailable";
  }

  return null;
}

function interpolateTemplateControlValue(value: string, sources: TemplateFieldSources): string {
  return value.replaceAll(/(?<!\{)\{\s*([^{}]+?)\s*\}(?!\})/g, (match, token) => {
    const resolved = readTemplateControlTokenValue(token, sources);
    return resolved ?? match;
  });
}

function buildFieldSources(
  metadata: NormalizedMetadata,
  userSourceValues: Record<string, string>,
  template: WatermarkTemplate,
  templateControlValues: Record<string, TemplateControlPrimitive>,
): TemplateFieldSources {
  const sources: TemplateFieldSources = {
    exif: {
      camera: {
        make: metadata.camera.make,
        model: metadata.camera.model,
      },
      exposure: {
        iso: metadata.exposure.iso,
        aperture: metadata.exposure.aperture,
        shutterSeconds: metadata.exposure.shutterSeconds,
        focalLengthMm: metadata.exposure.focalLengthMm,
      },
      shotTime: metadata.shotTime,
    },
    gps: {
      latitude: metadata.location.latitude,
      longitude: metadata.location.longitude,
    },
    user: userSourceValues,
    derived: {
      cameraModel: formatCameraModel(metadata),
      shootingParameters: formatShootingParameters(metadata),
      cameraSummary: formatCameraSummary(metadata),
      locationLine: formatLocationLine(metadata),
      shotTimeLine: formatShotTimeLine(metadata.shotTime),
    },
    afilmory: {},
    brand: {
      line: "Shot on Quill",
      socialHandle: "@quillstudio",
      signature: "crafted by quill",
      studioName: "QUILL STUDIO",
      journalName: "Quill Journal",
    },
  };

  for (const control of template.controls) {
    if (control.type !== "text") {
      continue;
    }

    const definition = template.schema.fields[control.id];
    const nextValue = templateControlValues[control.id];
    if (!definition || typeof nextValue !== "string" || nextValue.trim().length === 0) {
      continue;
    }

    assignSourceValue(
      sources[definition.source],
      definition,
      interpolateTemplateControlValue(nextValue, sources),
    );
  }

  return sources;
}

function findPhotoFit(layout: WatermarkTemplate["layout"]): StylePanelValues["imageFit"] | null {
  if (layout.type === "image") {
    return layout.binding === "photo" ? (layout.fit ?? "cover") : null;
  }

  if (layout.type === "text" || layout.type === "rect") {
    return null;
  }

  for (const child of layout.children) {
    const match = findPhotoFit(child);
    if (match !== null) {
      return match;
    }
  }

  return null;
}

function collectLayoutBindings(
  layout: TemplateLayoutNode,
  bindings = new Set<string>(),
): Set<string> {
  if (layout.type === "text" || layout.type === "image") {
    bindings.add(layout.binding);
    return bindings;
  }

  if (layout.type === "rect") {
    return bindings;
  }

  for (const child of layout.children) {
    collectLayoutBindings(child, bindings);
  }

  return bindings;
}

function resolvePaddingValues(padding: WatermarkTemplate["canvas"]["padding"]): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  if (typeof padding === "number") {
    return {
      top: padding,
      right: padding,
      bottom: padding,
      left: padding,
    };
  }

  if ("x" in padding) {
    return {
      top: padding.y,
      right: padding.x,
      bottom: padding.y,
      left: padding.x,
    };
  }

  return padding;
}

const appSessionAtom = atom<AppSession>({
  screen: "library",
});

export const appScreenAtom = atom<AppScreen>((get) => get(appSessionAtom).screen);

export const selectedTemplateIdAtom = atom<string | null>((get) => {
  const session = get(appSessionAtom);
  if (session.screen === "library") {
    return null;
  }
  return session.templateId;
});

export const editorInstanceAtom = atom<EditorInstance | null>((get) => {
  const session = get(appSessionAtom);
  if (session.screen !== "editor") {
    return null;
  }
  return session.instance;
});

export const editorImportErrorAtom = atom<string | null>((get) => {
  const session = get(appSessionAtom);
  if (session.screen !== "editor-pending-image") {
    return null;
  }
  return session.importError;
});

export const activeTemplateAtom = atom<WatermarkTemplate | null>((get) => {
  const templateId = get(selectedTemplateIdAtom);
  return templateId ? (templateMap.get(templateId) ?? null) : null;
});

export const userSourceValuesAtom = atom<Record<string, string>>((get) => {
  const session = get(appSessionAtom);
  if (session.screen === "library") {
    return {};
  }

  return session.userSourceValues;
});

export const fieldOverridesAtom = atom<Record<string, string>>((get) => {
  const session = get(appSessionAtom);
  if (session.screen === "library") {
    return {};
  }

  return session.fieldOverrides;
});

export const editorTemplateControlValuesAtom = atom<Record<string, TemplateControlPrimitive>>(
  (get) => {
    const session = get(appSessionAtom);
    const template = get(activeTemplateAtom);

    if (session.screen === "library" || template === null) {
      return createInitialTemplateControlValues(templates[0]);
    }

    return session.templateControlValues;
  },
);

export const editorControlsAtom = atom<StylePanelValues>((get) => {
  const session = get(appSessionAtom);
  const template = get(activeTemplateAtom);

  if (session.screen === "library" || template === null) {
    return createInitialControlValues(templates[0]);
  }

  return session.controls;
});

export const editorCardEnabledAtom = atom<Record<string, boolean>>((get) => {
  const session = get(appSessionAtom);
  const template = get(activeTemplateAtom);

  if (session.screen === "library" || template === null) {
    return createInitialCardEnabled(templates[0]);
  }

  return session.cardEnabled;
});

export const editorExportOptionsAtom = atom<ExportPanelValues>((get) => {
  const session = get(appSessionAtom);

  if (session.screen === "library") {
    return createInitialExportValues();
  }

  return session.exportOptions;
});

export const resolvedFieldsAtom = atom<ResolvedFieldMap>((get) => {
  const template = get(activeTemplateAtom);
  if (!template) {
    return {};
  }

  const metadata = get(editorInstanceAtom)?.metadata ?? emptyMetadata;
  const userSourceValues = get(userSourceValuesAtom);
  const fieldOverrides = get(fieldOverridesAtom);
  const templateControlValues = get(editorTemplateControlValuesAtom);

  return resolveFields({
    schema: template.schema,
    sources: buildFieldSources(metadata, userSourceValues, template, templateControlValues),
    overrides: fieldOverrides,
  });
});

export const dataCardsAtom = atom<TemplateDataCard[]>((get) => {
  const template = get(activeTemplateAtom);
  if (!template) {
    return [];
  }

  const cards = createDataCards({
    groups: template.fieldGroups,
    resolvedFields: get(resolvedFieldsAtom),
  });

  const cardEnabled = get(editorCardEnabledAtom);
  const layoutBindings = collectLayoutBindings(template.layout);

  return cards
    .filter((card) => card.bindings.some((binding) => layoutBindings.has(binding)))
    .map((card) => ({
      ...card,
      enabled: card.requiredByTemplate ? true : (cardEnabled[card.id] ?? card.enabled),
    }));
});

export const editorResolvedFieldsAtom = resolvedFieldsAtom;
export const editorDataCardsAtom = dataCardsAtom;
export const editorPreviewResolvedFieldsAtom = atom<ResolvedFieldMap>((get) => {
  const resolvedFields = get(resolvedFieldsAtom);
  const dataCards = get(dataCardsAtom);

  const disabledBindings = new Set(
    dataCards.filter((card) => !card.enabled).flatMap((card) => card.bindings),
  );

  return Object.fromEntries(
    Object.entries(resolvedFields).map(([fieldId, field]) => [
      fieldId,
      disabledBindings.has(fieldId)
        ? {
            ...field,
            value: null,
          }
        : field,
    ]),
  );
});

export const editorDispatchAtom = atom(null, async (get, set, action: EditorAction) => {
  switch (action.type) {
    case "return-to-library": {
      set(appSessionAtom, {
        screen: "library",
      });
      return;
    }
    case "select-template": {
      const template = templateMap.get(action.templateId);
      if (!template) {
        return;
      }

      const defaults = createDefaultTemplateScopedState(template);
      const currentSession = get(appSessionAtom);

      if (currentSession.screen === "editor") {
        set(
          appSessionAtom,
          buildEditorSession(
            action.templateId,
            currentSession.instance,
            {},
            {},
            defaults.controls,
            defaults.templateControlValues,
            defaults.cardEnabled,
            defaults.exportOptions,
          ),
        );
        return;
      }

      set(
        appSessionAtom,
        buildPendingImageSession(
          action.templateId,
          null,
          {},
          {},
          defaults.controls,
          defaults.templateControlValues,
          defaults.cardEnabled,
          defaults.exportOptions,
        ),
      );
      return;
    }
    case "import-image": {
      const currentSession = get(appSessionAtom);
      if (currentSession.screen === "library") {
        return;
      }

      const templateId = currentSession.templateId;

      try {
        const metadata = await extractMetadata(action.sourceFile);
        set(
          appSessionAtom,
          buildEditorSession(
            templateId,
            {
              sourceFile: action.sourceFile,
              metadata,
            },
            currentSession.userSourceValues,
            currentSession.fieldOverrides,
            currentSession.controls,
            currentSession.templateControlValues,
            currentSession.cardEnabled,
            currentSession.exportOptions,
          ),
        );
      } catch {
        set(
          appSessionAtom,
          buildPendingImageSession(
            templateId,
            IMAGE_IMPORT_ERROR_MESSAGE,
            currentSession.userSourceValues,
            currentSession.fieldOverrides,
            currentSession.controls,
            currentSession.templateControlValues,
            currentSession.cardEnabled,
            currentSession.exportOptions,
          ),
        );
      }

      return;
    }
    case "clear-image": {
      const currentSession = get(appSessionAtom);
      if (currentSession.screen === "library") {
        return;
      }

      set(
        appSessionAtom,
        buildPendingImageSession(
          currentSession.templateId,
          null,
          currentSession.userSourceValues,
          currentSession.fieldOverrides,
          currentSession.controls,
          currentSession.templateControlValues,
          currentSession.cardEnabled,
          currentSession.exportOptions,
        ),
      );
      return;
    }
    case "set-import-error": {
      const currentSession = get(appSessionAtom);
      if (currentSession.screen === "library") {
        return;
      }

      set(
        appSessionAtom,
        buildPendingImageSession(
          currentSession.templateId,
          action.message,
          currentSession.userSourceValues,
          currentSession.fieldOverrides,
          currentSession.controls,
          currentSession.templateControlValues,
          currentSession.cardEnabled,
          currentSession.exportOptions,
        ),
      );
      return;
    }
    case "set-field-override": {
      const currentSession = get(appSessionAtom);
      if (currentSession.screen === "library") {
        return;
      }

      const nextFieldOverrides = {
        ...currentSession.fieldOverrides,
      };
      nextFieldOverrides[action.fieldId] = action.value;

      set(
        appSessionAtom,
        updateTemplateScopedSession(currentSession, { fieldOverrides: nextFieldOverrides }),
      );
      return;
    }
    case "set-user-source-value": {
      const currentSession = get(appSessionAtom);
      if (currentSession.screen === "library") {
        return;
      }

      const nextUserSourceValues = {
        ...currentSession.userSourceValues,
      };

      const trimmedValue = action.value.trim();
      if (trimmedValue.length === 0) {
        delete nextUserSourceValues[action.path];
      } else {
        nextUserSourceValues[action.path] = action.value;
      }

      set(
        appSessionAtom,
        updateTemplateScopedSession(currentSession, { userSourceValues: nextUserSourceValues }),
      );
      return;
    }
    case "replace-metadata": {
      const currentSession = get(appSessionAtom);
      if (currentSession.screen !== "editor") {
        return;
      }

      set(
        appSessionAtom,
        buildEditorSession(
          currentSession.templateId,
          {
            ...currentSession.instance,
            metadata: action.metadata,
          },
          currentSession.userSourceValues,
          currentSession.fieldOverrides,
          currentSession.controls,
          currentSession.templateControlValues,
          currentSession.cardEnabled,
          currentSession.exportOptions,
        ),
      );
      return;
    }
    case "editor/set-control": {
      const currentSession = get(appSessionAtom);
      if (currentSession.screen === "library") {
        return;
      }

      if (!isStyleControlId(action.payload.id)) {
        return;
      }

      const template = templateMap.get(currentSession.templateId);
      if (!template) {
        return;
      }

      const nextControls = {
        ...currentSession.controls,
        [action.payload.id]: action.payload.value,
      } as StylePanelValues;

      if (action.payload.id === "outputRatio") {
        const { preset, layout } = resolvePresetLayout(template, String(action.payload.value));
        const presetPhotoFit = findPhotoFit(layout);
        if (presetPhotoFit !== null) {
          nextControls.imageFit = presetPhotoFit;
        }
        const nextPadding = resolvePaddingValues(preset.canvas.padding);
        nextControls.canvasPaddingTop = nextPadding.top;
        nextControls.canvasPaddingRight = nextPadding.right;
        nextControls.canvasPaddingBottom = nextPadding.bottom;
        nextControls.canvasPaddingLeft = nextPadding.left;
      }

      set(
        appSessionAtom,
        updateTemplateScopedSession(currentSession, {
          controls: nextControls,
        }),
      );
      return;
    }
    case "editor/set-template-control": {
      const currentSession = get(appSessionAtom);
      if (currentSession.screen === "library") {
        return;
      }

      const template = templateMap.get(currentSession.templateId);
      if (!template || !template.controls.some((control) => control.id === action.payload.id)) {
        return;
      }

      set(
        appSessionAtom,
        updateTemplateScopedSession(currentSession, {
          templateControlValues: {
            ...currentSession.templateControlValues,
            [action.payload.id]: action.payload.value,
          },
        }),
      );
      return;
    }
    case "editor/set-card-enabled": {
      const currentSession = get(appSessionAtom);
      if (currentSession.screen === "library") {
        return;
      }

      const template = templateMap.get(currentSession.templateId);
      if (!template) {
        return;
      }

      const cardGroup = template.fieldGroups.find((group) => group.id === action.payload.id);
      if ((cardGroup?.requiredByTemplate ?? true) && action.payload.enabled === false) {
        return;
      }

      set(
        appSessionAtom,
        updateTemplateScopedSession(currentSession, {
          cardEnabled: {
            ...currentSession.cardEnabled,
            [action.payload.id]: action.payload.enabled,
          },
        }),
      );
      return;
    }
    case "editor/set-export-option": {
      const currentSession = get(appSessionAtom);
      if (currentSession.screen === "library") {
        return;
      }

      set(
        appSessionAtom,
        updateTemplateScopedSession(currentSession, {
          exportOptions: {
            ...currentSession.exportOptions,
            [action.payload.id]: action.payload.value,
          } as ExportPanelValues,
        }),
      );
      return;
    }
  }
});
