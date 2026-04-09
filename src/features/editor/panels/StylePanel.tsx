import { Button } from "../../../components/ui";
import { SlidersHorizontalIcon } from "../../../icons/ui-icons";
import type { WatermarkTemplate } from "../../../template-engine/types";
import type { StylePanelValues } from "./panel-state";
import {
  brandPositionOptions,
  metadataOrderOptions,
  surfaceStyleOptions,
  typographyThemeOptions,
} from "./panel-state";

interface StylePanelProps {
  template: WatermarkTemplate;
  values: StylePanelValues;
  onControlChange: (
    id: keyof StylePanelValues,
    value: StylePanelValues[keyof StylePanelValues],
  ) => void;
}

function ChoiceGroup<TValue extends string | number>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: ReadonlyArray<{ label: string; value: TValue }>;
  value: TValue;
  onChange: (value: TValue) => void;
}) {
  return (
    <fieldset className="editor-choice-group">
      <legend>{legend}</legend>
      <div className="editor-pill-row">
        {options.map((option) => (
          <Button
            key={String(option.value)}
            className="editor-pill-button"
            aria-pressed={value === option.value}
            onClick={() => {
              onChange(option.value);
            }}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </fieldset>
  );
}

export function StylePanel({ template, values, onControlChange }: StylePanelProps) {
  const ratioOptions = [
    { label: "Original", value: "original" as const },
    ...template.aspectSupport.map((aspect) => ({ label: aspect, value: aspect })),
  ];

  return (
    <section aria-label="Style panel" className="editor-panel editor-panel-surface" role="region">
      <header className="editor-panel-header">
        <div className="editor-panel-icon-wrap">
          <SlidersHorizontalIcon className="editor-panel-icon" />
        </div>
        <div>
          <h2>Style</h2>
          <p>Adjust only the active instance. Template selection stays read-only here.</p>
        </div>
      </header>

      <ChoiceGroup
        legend="Output ratio"
        options={ratioOptions}
        value={values.outputRatio}
        onChange={(value) => {
          onControlChange("outputRatio", value);
        }}
      />

      <ChoiceGroup
        legend="Image fit"
        options={[
          { label: "Cover", value: "cover" as const },
          { label: "Contain", value: "contain" as const },
        ]}
        value={values.imageFit}
        onChange={(value) => {
          onControlChange("imageFit", value);
        }}
      />

      <div className="editor-field-grid">
        <label className="editor-number-field">
          <span>Canvas padding</span>
          <input
            type="number"
            min={0}
            max={160}
            step={1}
            value={values.canvasPadding}
            onChange={(event) => {
              onControlChange("canvasPadding", Number(event.target.value));
            }}
          />
        </label>
        <label className="editor-number-field">
          <span>Corner radius</span>
          <input
            type="number"
            min={0}
            max={80}
            step={1}
            value={values.cornerRadius}
            onChange={(event) => {
              onControlChange("cornerRadius", Number(event.target.value));
            }}
          />
        </label>
      </div>

      <ChoiceGroup
        legend="Border & shadow"
        options={surfaceStyleOptions}
        value={values.surfaceStyle}
        onChange={(value) => {
          onControlChange("surfaceStyle", value);
        }}
      />

      <ChoiceGroup
        legend="Typography theme"
        options={typographyThemeOptions}
        value={values.typographyTheme}
        onChange={(value) => {
          onControlChange("typographyTheme", value);
        }}
      />

      <ChoiceGroup
        legend="Brand position"
        options={brandPositionOptions}
        value={values.brandPosition}
        onChange={(value) => {
          onControlChange("brandPosition", value);
        }}
      />

      <ChoiceGroup
        legend="Metadata order"
        options={metadataOrderOptions}
        value={values.metadataOrder}
        onChange={(value) => {
          onControlChange("metadataOrder", value);
        }}
      />
    </section>
  );
}
