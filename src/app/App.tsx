import { useAtomValue, useSetAtom } from "jotai";
import { EditorScreen } from "../features/editor/EditorScreen";
import { TemplateLibraryScreen } from "../features/template-library/TemplateLibraryScreen";
import { templates } from "../template-engine/templates";
import {
  appScreenAtom,
  editorDispatchAtom,
  editorImportErrorAtom,
  editorInstanceAtom,
  selectedTemplateIdAtom,
} from "./app-state";

export function App() {
  const screen = useAtomValue(appScreenAtom);
  const selectedTemplateId = useAtomValue(selectedTemplateIdAtom);
  const editorInstance = useAtomValue(editorInstanceAtom);
  const importError = useAtomValue(editorImportErrorAtom);
  const dispatch = useSetAtom(editorDispatchAtom);
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null;

  const handleTemplateSelect = (templateId: string) => {
    void dispatch({
      type: "select-template",
      templateId,
    });
  };

  if (screen === "library" || selectedTemplate === null) {
    return (
      <main className="app-shell">
        <header className="app-header">
          <span className="app-brand">QUILL STUDIO</span>
        </header>
        <TemplateLibraryScreen templates={templates} onSelect={handleTemplateSelect} />
      </main>
    );
  }

  return (
    <main className="app-shell app-shell-editor">
      <EditorScreen
        template={selectedTemplate}
        instance={editorInstance}
        importError={importError}
        dispatch={dispatch}
      />
    </main>
  );
}
