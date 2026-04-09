import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { EditorAction } from "../../app/app-state";
import { Button } from "../../components/ui";

interface ImageImporterProps {
  dispatch: (action: EditorAction) => Promise<void> | void;
  importError: string | null;
}

export function ImageImporter({ dispatch, importError }: ImageImporterProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsImporting(true);

    try {
      await dispatch({
        type: "import-image",
        sourceFile: file,
      });
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  return (
    <section aria-label="Image importer">
      <p>Import one photo to begin editing this template.</p>
      {importError ? <p role="alert">{importError}</p> : null}
      <Button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isImporting}
        aria-label="Add photo"
      >
        {isImporting ? "Importing..." : "Add Photo"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label="Photo file input"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </section>
  );
}
