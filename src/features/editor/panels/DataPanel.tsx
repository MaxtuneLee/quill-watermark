import { Input, Switch } from "../../../components/ui";
import { DatabaseIcon } from "../../../icons/ui-icons";
import type { ResolvedFieldMap, TemplateDataCard } from "../../../template-engine/types";

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
          <p>Review resolved metadata, keep placeholders visible, or enter manual overrides.</p>
        </div>
      </header>

      <div className="editor-data-card-list">
        {dataCards.map((card) => {
          const primaryBinding = card.bindings[0] ?? null;
          const boundField = primaryBinding ? resolvedFields[primaryBinding] : undefined;
          const overrideValue = primaryBinding ? (overrides[primaryBinding] ?? "") : "";

          return (
            <article className="editor-data-card" key={card.id}>
              <div className="editor-data-card-topline">
                <div>
                  <h3>{card.title}</h3>
                  <p>{card.previewValue ?? "No value resolved yet."}</p>
                </div>
                <span className={`editor-mode-badge editor-mode-${card.mode}`}>
                  {formatMode(card.mode)}
                </span>
              </div>

              <label className="editor-switch-row">
                <span>Show {card.title}</span>
                <Switch.Root
                  checked={cardEnabled[card.id] ?? false}
                  aria-label={`Show ${card.title}`}
                  className="editor-switch"
                  onCheckedChange={(checked) => {
                    onCardEnabledChange(card.id, checked);
                  }}
                >
                  <Switch.Thumb className="editor-switch-thumb" />
                </Switch.Root>
              </label>

              {card.mode === "placeholder" ? (
                <p className="editor-placeholder-note">
                  Placeholder visible until you add a manual value.
                </p>
              ) : null}

              {primaryBinding ? (
                <label className="editor-override-field">
                  <span>{card.title} override</span>
                  <Input
                    type="text"
                    aria-label={`${card.title} override`}
                    value={overrideValue}
                    disabled={!boundField?.editable}
                    placeholder={boundField?.editable ? "Enter custom copy" : "Auto only"}
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
