import { Input, Switch } from "../../../components/ui";
import { DatabaseIcon } from "../../../icons/ui-icons";
import type {
  ResolvedField,
  ResolvedFieldMap,
  TemplateDataCard,
} from "../../../template-engine/types";

interface DataPanelProps {
  dataCards: readonly TemplateDataCard[];
  resolvedFields: ResolvedFieldMap;
  cardEnabled: Record<string, boolean>;
  overrides: Record<string, string>;
  onCardEnabledChange: (cardId: string, enabled: boolean) => void;
  onOverrideChange: (fieldId: string, value: string) => void;
}

function formatMode(mode: TemplateDataCard["mode"]): string {
  switch (mode) {
    case "manual":
      return "Manual";
    case "placeholder":
      return "Placeholder";
    default:
      return "Auto";
  }
}

function resolvePlaceholderMessage(field: ResolvedField | undefined): string {
  switch (field?.source) {
    case "exif":
    case "gps":
    case "derived":
      return "Missing from photo metadata.";
    case "user":
      return "Waiting for a manual value.";
    default:
      return "Placeholder copy is currently in use.";
  }
}

function resolveStatusLines(card: TemplateDataCard, field: ResolvedField | undefined): string[] {
  const lines: string[] = [];

  if (card.mode === "manual") {
    lines.push("Manual value active.");
  }

  if (card.mode === "auto") {
    lines.push("Resolved automatically.");
  }

  if (card.mode === "placeholder") {
    lines.push(resolvePlaceholderMessage(field));
  }

  if (card.requiredByTemplate) {
    lines.push("Required by template.");
  }

  if (field && !field.editable) {
    lines.push("Auto only.");
  }

  return lines;
}

export function DataPanel({
  dataCards,
  resolvedFields,
  cardEnabled,
  overrides,
  onCardEnabledChange,
  onOverrideChange,
}: DataPanelProps) {
  return (
    <section aria-label="Data panel" className="editor-panel editor-panel-surface" role="region">
      <header className="editor-panel-header">
        <div className="editor-panel-icon-wrap">
          <DatabaseIcon className="editor-panel-icon" />
        </div>
        <div>
          <h2>Data</h2>
          <p>Review every field card, keep state labels honest, and override only when needed.</p>
        </div>
      </header>

      <div className="editor-data-card-list">
        {dataCards.map((card) => {
          const primaryBinding = card.bindings[0] ?? null;
          const field = primaryBinding ? resolvedFields[primaryBinding] : undefined;
          const overrideValue = primaryBinding ? (overrides[primaryBinding] ?? "") : "";
          const statusLines = resolveStatusLines(card, field);

          return (
            <article className="editor-data-card" key={card.id}>
              <div className="editor-data-card-topline">
                <div>
                  <div className="editor-panel-icon-wrap">
                    <DatabaseIcon className="editor-panel-icon" />
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.previewValue ?? "No value resolved yet."}</p>
                </div>
                <span className={`editor-mode-badge editor-mode-${card.mode}`}>
                  {formatMode(card.mode)}
                </span>
              </div>

              <label className="editor-switch-row">
                <span>Display field</span>
                <Switch.Root
                  checked={cardEnabled[card.id] ?? false}
                  aria-label={`Display ${card.title}`}
                  className="editor-switch"
                  onCheckedChange={(checked) => {
                    onCardEnabledChange(card.id, checked);
                  }}
                >
                  <Switch.Thumb className="editor-switch-thumb" />
                </Switch.Root>
              </label>

              {statusLines.map((line) => (
                <p className="editor-placeholder-note" key={line}>
                  {line}
                </p>
              ))}

              {primaryBinding ? (
                <label className="editor-override-field">
                  <span>Manual value</span>
                  <Input
                    type="text"
                    aria-label={`Manual value for ${card.title}`}
                    value={overrideValue}
                    disabled={!field?.editable}
                    placeholder={field?.editable ? "Enter manual value" : "Auto only"}
                    onChange={(event) => {
                      onOverrideChange(primaryBinding, event.target.value);
                    }}
                  />
                </label>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
