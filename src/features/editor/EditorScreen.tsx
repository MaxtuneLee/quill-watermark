import type { EditorAction, EditorInstance } from "../../app/app-state";
import type { WatermarkTemplate } from "../../template-engine/types";
import { ImageImporter } from "./ImageImporter";
import { PreviewStage } from "./PreviewStage";

interface EditorScreenProps {
  template: WatermarkTemplate;
  instance: EditorInstance | null;
  importError: string | null;
  dispatch: (action: EditorAction) => Promise<void> | void;
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

export function EditorScreen({ template, instance, importError, dispatch }: EditorScreenProps) {
  return (
    <section aria-label="Editor">
      <header>
        <h1>{template.name}</h1>
      </header>
      {instance === null ? (
        <>
          <ImageImporter dispatch={dispatch} importError={importError} />
          <TemplateSummary template={template} />
        </>
      ) : (
        <>
          <PreviewStage />
          <aside aria-label="Editor panels">
            <h2>Panels</h2>
            <p>Data and style panels are intentionally stubbed in this task.</p>
          </aside>
        </>
      )}
    </section>
  );
}
