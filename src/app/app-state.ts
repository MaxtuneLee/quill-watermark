import { atom } from "jotai";
import type { NormalizedMetadata } from "../services/metadata/types";
import { extractMetadata } from "../services/metadata/extract-metadata";
import { createDataCards } from "../template-engine/schema/create-data-cards";
import { resolveFields } from "../template-engine/schema/resolve-fields";
import { templates } from "../template-engine/templates";
import type {
  ResolvedFieldMap,
  TemplateDataCard,
  TemplateFieldSources,
  WatermarkTemplate,
} from "../template-engine/types";

export type AppScreen = "library" | "editor-pending-image" | "editor";
export const IMAGE_IMPORT_ERROR_MESSAGE = "Could not import photo. Please try a different image.";

export interface EditorInstance {
  sourceFile: File;
  metadata: NormalizedMetadata;
}

interface TemplateScopedSession {
  templateId: string;
  userSourceValues: Record<string, string>;
  fieldOverrides: Record<string, string>;
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
): EditorPendingImageSession {
  return {
    screen: "editor-pending-image",
    templateId,
    importError,
    userSourceValues,
    fieldOverrides,
  };
}

function buildEditorSession(
  templateId: string,
  instance: EditorInstance,
  userSourceValues: Record<string, string>,
  fieldOverrides: Record<string, string>,
): EditorSession {
  return {
    screen: "editor",
    templateId,
    instance,
    userSourceValues,
    fieldOverrides,
  };
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

function buildFieldSources(
  metadata: NormalizedMetadata,
  userSourceValues: Record<string, string>,
): TemplateFieldSources {
  return {
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

export const resolvedFieldsAtom = atom<ResolvedFieldMap>((get) => {
  const template = get(activeTemplateAtom);
  if (!template) {
    return {};
  }

  const metadata = get(editorInstanceAtom)?.metadata ?? emptyMetadata;
  const userSourceValues = get(userSourceValuesAtom);
  const fieldOverrides = get(fieldOverridesAtom);

  return resolveFields({
    schema: template.schema,
    sources: buildFieldSources(metadata, userSourceValues),
    overrides: fieldOverrides,
  });
});

export const dataCardsAtom = atom<TemplateDataCard[]>((get) => {
  const template = get(activeTemplateAtom);
  if (!template) {
    return [];
  }

  return createDataCards({
    groups: template.fieldGroups,
    resolvedFields: get(resolvedFieldsAtom),
  });
});

export const editorResolvedFieldsAtom = resolvedFieldsAtom;
export const editorDataCardsAtom = dataCardsAtom;

export const editorDispatchAtom = atom(null, async (get, set, action: EditorAction) => {
  switch (action.type) {
    case "select-template":
      set(appSessionAtom, buildPendingImageSession(action.templateId, null, {}, {}));
      return;
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

      const trimmedValue = action.value.trim();
      if (trimmedValue.length === 0) {
        delete nextFieldOverrides[action.fieldId];
      } else {
        nextFieldOverrides[action.fieldId] = trimmedValue;
      }

      if (currentSession.screen === "editor") {
        set(
          appSessionAtom,
          buildEditorSession(
            currentSession.templateId,
            currentSession.instance,
            currentSession.userSourceValues,
            nextFieldOverrides,
          ),
        );
      } else {
        set(
          appSessionAtom,
          buildPendingImageSession(
            currentSession.templateId,
            currentSession.importError,
            currentSession.userSourceValues,
            nextFieldOverrides,
          ),
        );
      }
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
        nextUserSourceValues[action.path] = trimmedValue;
      }

      if (currentSession.screen === "editor") {
        set(
          appSessionAtom,
          buildEditorSession(
            currentSession.templateId,
            currentSession.instance,
            nextUserSourceValues,
            currentSession.fieldOverrides,
          ),
        );
      } else {
        set(
          appSessionAtom,
          buildPendingImageSession(
            currentSession.templateId,
            currentSession.importError,
            nextUserSourceValues,
            currentSession.fieldOverrides,
          ),
        );
      }
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
        ),
      );
      return;
    }
  }
});
