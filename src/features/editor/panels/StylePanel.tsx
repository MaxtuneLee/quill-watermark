import { Button, Input } from "../../../components/ui";
import { SlidersHorizontalIcon } from "../../../icons/ui-icons";
import type { ReactNode } from "react";
import type { WatermarkTemplate } from "../../../template-engine/types";
import type { StyleControlId, StyleControlValue, StylePanelValues } from "./panel-state";
import {
  brandPositionOptions,
  imageFillOptions,
  surfaceStyleOptions,
  typographyThemeOptions,
} from "./panel-state";

interface StylePanelProps {
  template: WatermarkTemplate;
  values: StylePanelValues;
  onControlChange: (id: StyleControlId, value: StyleControlValue) => void;
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

function NumberField({
  label,
  max,
  min,
  onChange,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="editor-number-field">
      <span>{label}</span>
      <Input
        aria-label={label}
        type="number"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          onChange(Number.isNaN(nextValue) ? min : nextValue);
        }}
      />
    </label>
  );
}

function RailSection({
  children,
  heading,
  summary,
}: {
  children: ReactNode;
  heading: string;
  summary: string;
}) {
  return (
    <section className="editor-panel">
      <div>
        <h3>{heading}</h3>
        <p>{summary}</p>
      </div>
      {children}
    </section>
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
          <p>Dial in framing, finish, and brand treatment for the active export.</p>
        </div>
      </header>

      <RailSection
        heading="Canvas"
        summary="Set the export ratio and how the photo sits inside the frame."
      >
        <ChoiceGroup
          legend="Aspect ratio"
          options={ratioOptions}
          value={values.outputRatio}
          onChange={(value) => {
            onControlChange("outputRatio", value);
          }}
        />

        <ChoiceGroup
          legend="Image fill"
          options={imageFillOptions}
          value={values.imageFit}
          onChange={(value) => {
            onControlChange("imageFit", value);
          }}
        />

        <NumberField
          label="Padding"
          min={0}
          max={160}
          value={values.canvasPadding}
          onChange={(value) => {
            onControlChange("canvasPadding", value);
          }}
        />
      </RailSection>

      <RailSection
        heading="Finish"
        summary="Only show surface styling that will carry through to preview and export."
      >
        <ChoiceGroup
          legend="Frame style"
          options={surfaceStyleOptions}
          value={values.surfaceStyle}
          onChange={(value) => {
            onControlChange("surfaceStyle", value);
          }}
        />

        <NumberField
          label="Corner radius"
          min={0}
          max={80}
          value={values.cornerRadius}
          onChange={(value) => {
            onControlChange("cornerRadius", value);
          }}
        />
      </RailSection>

      <RailSection heading="Type" summary="Choose the font treatment used by the template family.">
        <ChoiceGroup
          legend="Font style"
          options={typographyThemeOptions}
          value={values.typographyTheme}
          onChange={(value) => {
            onControlChange("typographyTheme", value);
          }}
        />
      </RailSection>

      <RailSection
        heading="Brand"
        summary="Adjust the brand anchor without changing which template is loaded."
      >
        <ChoiceGroup
          legend="Brand position"
          options={brandPositionOptions}
          value={values.brandPosition}
          onChange={(value) => {
            onControlChange("brandPosition", value);
          }}
        />
      </RailSection>
    </section>
  );
}
