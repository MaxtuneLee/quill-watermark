import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import {
  redirect,
  useNavigate,
  useParams,
  useSearchParams,
  type RouteObject,
} from "react-router-dom";
import { EditorScreen } from "../features/editor/EditorScreen";
import { templates } from "../template-engine/templates";
import {
  IMAGE_IMPORT_ERROR_MESSAGE,
  editorDispatchAtom,
  editorImportErrorAtom,
  editorInstanceAtom,
  selectedTemplateIdAtom,
} from "./app-state";

const FALLBACK_REMOTE_FILE_NAME = "imported-image";

function extensionFromMimeType(contentType: string | null): string {
  switch (contentType?.toLowerCase()) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/avif":
      return "avif";
    default:
      return "jpg";
  }
}

function resolveRemoteFileName(imageUrl: string, contentType: string | null): string {
  try {
    const { pathname } = new URL(imageUrl);
    const rawName = pathname.split("/").filter(Boolean).at(-1) ?? "";
    if (rawName.length > 0 && /\.[a-z0-9]+$/i.test(rawName)) {
      return rawName;
    }

    if (rawName.length > 0) {
      return `${rawName}.${extensionFromMimeType(contentType)}`;
    }
  } catch {
    // Ignore parse failures and fall back to a generic file name.
  }

  return `${FALLBACK_REMOTE_FILE_NAME}.${extensionFromMimeType(contentType)}`;
}

async function fetchRemoteImageAsFile(imageUrl: string): Promise<File> {
  const response = await fetch(imageUrl, { mode: "cors" });
  if (!response.ok) {
    throw new Error(`Image request failed with status ${response.status}.`);
  }

  const blob = await response.blob();
  const contentType = blob.type || response.headers.get("Content-Type");

  if (!contentType?.startsWith("image/")) {
    throw new Error("Remote asset is not an image.");
  }

  return new File([blob], resolveRemoteFileName(imageUrl, contentType), {
    type: contentType,
  });
}

function EditorRoute() {
  const selectedTemplateId = useAtomValue(selectedTemplateIdAtom);
  const editorInstance = useAtomValue(editorInstanceAtom);
  const importError = useAtomValue(editorImportErrorAtom);
  const dispatch = useSetAtom(editorDispatchAtom);
  const [searchParams] = useSearchParams();
  const fallbackTemplate = templates[0] ?? null;
  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ?? fallbackTemplate;
  const lastAttemptedImageUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedTemplateId === null && fallbackTemplate !== null) {
      void dispatch({
        type: "select-template",
        templateId: fallbackTemplate.id,
      });
    }
  }, [dispatch, fallbackTemplate, selectedTemplateId]);

  useEffect(() => {
    const imageUrl = searchParams.get("imageUrl")?.trim() ?? "";
    if (imageUrl.length === 0) {
      lastAttemptedImageUrlRef.current = null;
      return;
    }

    if (selectedTemplateId === null || lastAttemptedImageUrlRef.current === imageUrl) {
      return;
    }

    lastAttemptedImageUrlRef.current = imageUrl;

    void (async () => {
      try {
        const sourceFile = await fetchRemoteImageAsFile(imageUrl);
        await dispatch({
          type: "import-image",
          sourceFile,
        });
      } catch {
        await dispatch({
          type: "set-import-error",
          message: IMAGE_IMPORT_ERROR_MESSAGE,
        });
      }
    })();
  }, [dispatch, searchParams, selectedTemplateId]);

  if (selectedTemplate === null || selectedTemplateId === null) {
    return null;
  }

  return (
    <main
      className="app-shell-editor dark flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,rgba(255,214,63,0.08),transparent_24%),linear-gradient(180deg,#1f1b12,#0d0b07)] text-[oklch(0.95_0.012_95)] min-[1181px]:h-screen min-[1181px]:min-h-0"
      data-layout="full-bleed"
    >
      <header className="hidden items-center gap-3 border-b border-white/8 px-5 py-3 min-[781px]:flex">
        <img src="/quill-logo.png" alt="Quill Studio" className="h-7 w-7 object-contain" />
        <span className="text-sm font-semibold tracking-[0.18em] text-[oklch(0.95_0.012_95_/_0.78)] uppercase">
          QUILL STUDIO
        </span>
        <span className="text-xs text-white/42">/</span>
        <span className="text-sm text-white/62">{selectedTemplate.name}</span>
      </header>
      <EditorScreen
        template={selectedTemplate}
        instance={editorInstance}
        importError={importError}
        dispatch={dispatch}
      />
    </main>
  );
}

function LegacyEditorRoute() {
  const { templateId = "" } = useParams();
  const dispatch = useSetAtom(editorDispatchAtom);
  const navigate = useNavigate();

  useEffect(() => {
    const selectedTemplate =
      templates.find((template) => template.id === templateId) ?? templates[0];
    if (!selectedTemplate) {
      void navigate("/", { replace: true });
      return;
    }

    void dispatch({
      type: "select-template",
      templateId: selectedTemplate.id,
    });
    void navigate("/", { replace: true });
  }, [dispatch, navigate, templateId]);

  return null;
}

function NotFoundRoute() {
  return null;
}

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <EditorRoute />,
  },
  {
    path: "/editor/:templateId",
    element: <LegacyEditorRoute />,
  },
  {
    path: "*",
    loader: async () => redirect("/"),
    element: <NotFoundRoute />,
  },
];
