import { Button } from "../../../components/ui";
import { DownloadIcon, ShareIcon } from "../../../icons/ui-icons";
import type { ExportFormat, ExportMultiplier, ExportPanelValues } from "./panel-state";
import { exportFormatOptions, exportMultiplierOptions } from "./panel-state";

interface ExportPanelProps {
  values: ExportPanelValues;
  statusMessage: string | null;
  onFormatChange: (value: ExportFormat) => void;
  onMultiplierChange: (value: ExportMultiplier) => void;
  onExport: () => Promise<void>;
  onShare: () => Promise<void>;
}

export function ExportPanel({
  values,
  statusMessage,
  onFormatChange,
  onMultiplierChange,
  onExport,
  onShare,
}: ExportPanelProps) {
  return (
    <section aria-label="Export panel" className="editor-panel editor-panel-surface" role="region">
      <header className="editor-panel-header">
        <div>
          <h2>Export</h2>
          <p>Choose a format, scale the output, then export or share with download fallback.</p>
        </div>
      </header>

      <fieldset className="editor-choice-group">
        <legend>Format</legend>
        <div className="editor-pill-row">
          {exportFormatOptions.map((option) => (
            <Button
              key={option.value}
              className="editor-pill-button"
              aria-pressed={values.format === option.value}
              onClick={() => {
                onFormatChange(option.value);
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </fieldset>

      <fieldset className="editor-choice-group">
        <legend>Multiplier</legend>
        <div className="editor-pill-row">
          {exportMultiplierOptions.map((option) => (
            <Button
              key={option.value}
              className="editor-pill-button"
              aria-pressed={values.multiplier === option.value}
              onClick={() => {
                onMultiplierChange(option.value);
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </fieldset>

      <div className="editor-export-actions">
        <Button className="editor-primary-action" onClick={() => void onExport()}>
          <DownloadIcon className="editor-action-icon" />
          Export Image
        </Button>
        <Button className="editor-secondary-action" onClick={() => void onShare()}>
          <ShareIcon className="editor-action-icon" />
          Share or Download
        </Button>
      </div>

      <p className="editor-export-status" aria-live="polite">
        {statusMessage ?? "Preview canvas will export with the selected format and multiplier."}
      </p>
    </section>
  );
}
