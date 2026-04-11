import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { EditorAction } from "../../app/app-state";
import { Button } from "../../components/ui";

interface ImageImporterProps {
  dispatch: (action: EditorAction) => Promise<void> | void;
  importError: string | null;
  buttonLabel?: string;
  buttonAriaLabel?: string;
  className?: string;
  description?: string;
  title?: string;
}

export function ImageImporter({
  dispatch,
  importError,
  buttonLabel = "Add Photo",
  buttonAriaLabel = "Add photo",
  className,
  description = "Import one photo to begin editing this template.",
  title,
}: ImageImporterProps) {
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
    <section
      aria-label="Image importer"
      className={`grid w-full max-w-sm justify-items-center gap-4 text-center ${className ?? ""}`}
    >
      {title ? (
        <h3 className="font-heading text-[clamp(1.45rem,2vw,2.1rem)] font-semibold tracking-[-0.04em] text-white">
          {title}
        </h3>
      ) : null}
      {description ? (
        <p className="max-w-[24ch] text-sm leading-6 text-white/68">{description}</p>
      ) : null}
      {importError ? (
        <p role="alert" className="text-sm text-red-200">
          {importError}
        </p>
      ) : null}
      <Button
        type="button"
        size="lg"
        className="min-w-52 border-primary/45 bg-primary/90 text-primary-foreground hover:bg-primary"
        onClick={() => inputRef.current?.click()}
        disabled={isImporting}
        aria-label={buttonAriaLabel}
      >
        {isImporting ? "Importing..." : buttonLabel}
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
