import { vi } from "vite-plus/test";
import type { EditorAction, EditorInstance } from "../../app/app-state";
import { templates } from "../../template-engine/templates";
import type { WatermarkTemplate } from "../../template-engine/types";

interface EditorScreenFixtureProps {
  template: WatermarkTemplate;
  instance: EditorInstance | null;
  importError: string | null;
  dispatch: (action: EditorAction) => Promise<void> | void;
}

interface LoadedEditorScreenFixtureProps extends EditorScreenFixtureProps {
  instance: EditorInstance;
}

interface PendingEditorScreenFixtureProps extends EditorScreenFixtureProps {
  instance: null;
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

export function makeLoadedEditorProps(
  overrides: Partial<LoadedEditorScreenFixtureProps> = {},
): LoadedEditorScreenFixtureProps {
  return {
    template: templates[0],
    instance: loadedInstance,
    importError: null,
    dispatch: vi.fn<(action: EditorAction) => void>(),
    ...overrides,
  };
}

export function makePendingEditorProps(
  overrides: Partial<PendingEditorScreenFixtureProps> = {},
): PendingEditorScreenFixtureProps {
  return {
    template: templates[0],
    instance: null,
    importError: null,
    dispatch: vi.fn<(action: EditorAction) => void>(),
    ...overrides,
  };
}
