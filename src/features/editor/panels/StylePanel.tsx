import { Button, Input, Slider } from "../../../components/ui";
import type { ReactNode } from "react";
import type { WatermarkTemplate } from "../../../template-engine/types";
import type { StyleControlId, StyleControlValue, StylePanelValues } from "./panel-state";
import { brandPositionOptions, imageFillOptions, typographyThemeOptions } from "./panel-state";
import { cn } from "../../../lib/utils";
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerFormatSelect,
  ColorPickerHueSlider,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerTrigger,
} from "../../../components/ui/color-picker";

interface StylePanelProps {
  template: WatermarkTemplate;
  values: StylePanelValues;
  onControlChange: (id: StyleControlId, value: StyleControlValue) => void;
  onSliderHaptic?: () => void;
  layout?: "rail" | "mobile-strip";
  sections?: Array<"canvas" | "type" | "brand">;
}

function ChoiceGroup<TValue extends string | number>({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ label: string; value: TValue }>;
  value: TValue;
  onChange: (value: TValue) => void;
}) {
  return (
    <fieldset className="editor-choice-group">
      <div className="editor-pill-row flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={String(option.value)}
            variant="outline"
            size="sm"
            className="editor-pill-button border-white/10 bg-white/[0.02] text-foreground/72 hover:bg-white/[0.06] hover:text-foreground aria-pressed:border-primary/60 aria-pressed:bg-primary/14 aria-pressed:text-primary"
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
    <label className="editor-number-field grid gap-2 text-sm text-foreground">
      <span className="text-sm font-medium text-foreground/80">{label}</span>
      <Input
        aria-label={label}
        type="number"
        className="border-white/10 bg-white/[0.03] text-sm tabular-nums text-foreground hover:border-white/16 focus-visible:border-primary/45 focus-visible:ring-primary/20"
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

function SliderField({
  label,
  max,
  min,
  step,
  value,
  onChange,
  onHaptic,
}: {
  label: string;
  max: number;
  min: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  onHaptic?: () => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground/80">{label}</span>
        <output className="text-xs font-semibold text-foreground/62">{value.toFixed(1)}x</output>
      </div>
      <Slider
        aria-label={label}
        variant="panel"
        min={min}
        max={max}
        step={step}
        value={value}
        onHaptic={onHaptic}
        onValueChange={(nextValue) => {
          onChange(Array.isArray(nextValue) ? (nextValue[0] ?? value) : nextValue);
        }}
      />
    </div>
  );
}

function ColorField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const pickerValue = /^#([\da-f]{6}|[\da-f]{3})$/i.test(value) ? value : "#111111";

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-foreground/80">{label}</span>
      <div className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3">
        <ColorPicker value={pickerValue} onValueChange={onChange}>
          <ColorPickerTrigger
            aria-label={`${label} picker`}
            variant="outline"
            size="sm"
            className="h-8 w-8 shrink-0 self-center border-white/10 bg-white/[0.02] p-0 hover:bg-white/[0.06]"
          >
            <ColorPickerSwatch className="size-full rounded-none border-0 shadow-none" />
          </ColorPickerTrigger>
          <ColorPickerContent className="w-[320px] rounded-none border border-white/10 bg-[#111111] text-white shadow-xl">
            <ColorPickerArea className="border-white/10" />
            <div className="grid gap-3">
              <ColorPickerHueSlider />
              <ColorPickerInput withoutAlpha className="h-8" />
              <div className="flex items-center justify-between gap-3">
                <ColorPickerFormatSelect className="min-w-20" />
                <ColorPickerEyeDropper />
              </div>
            </div>
          </ColorPickerContent>
        </ColorPicker>
        <Input
          aria-label={label}
          type="text"
          className="self-center"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      </div>
    </div>
  );
}

function RailSection({
  children,
  heading,
  layout = "rail",
  summary,
}: {
  children: ReactNode;
  heading: string;
  layout?: "rail" | "mobile-strip";
  summary?: string;
}) {
  return (
    <section
      className={cn(
        "editor-panel editor-panel-block grid gap-4 border-t border-white/8 pt-5 first:border-t-0 first:pt-0",
        layout === "mobile-strip" &&
          "w-max min-w-[13rem] border border-white/10 bg-white/[0.03] p-3.5 first:border first:pt-3.5",
      )}
    >
      <div className="grid gap-1.5">
        <h3 className="font-heading text-[1.25rem] font-semibold tracking-[-0.03em] text-foreground">
          {heading}
        </h3>
        {summary ? (
          <p className="max-w-[24ch] text-sm leading-6 text-foreground/58">{summary}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function StylePanel({
  template,
  values,
  onControlChange,
  onSliderHaptic,
  layout = "rail",
  sections = ["canvas", "type", "brand"],
}: StylePanelProps) {
  const ratioOptions = [
    { label: "Original", value: "original" as const },
    ...template.aspectSupport.map((aspect) => ({
      label: aspect,
      value: aspect,
    })),
  ];

  return (
    <section
      aria-label="Style panel"
      className={cn(
        "editor-panel editor-panel-surface grid gap-5",
        layout === "mobile-strip" && "overflow-hidden",
      )}
      role="region"
    >
      <div
        className={cn(
          "editor-panel-content grid gap-5",
          layout === "mobile-strip" &&
            "flex items-start gap-3 overflow-x-auto pb-3 [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/25",
        )}
      >
        {sections.includes("canvas") ? (
          <RailSection heading="Canvas" layout={layout}>
            <ChoiceGroup
              options={ratioOptions}
              value={values.outputRatio}
              onChange={(value) => {
                onControlChange("outputRatio", value);
              }}
            />

            <ChoiceGroup
              options={imageFillOptions}
              value={values.imageFit}
              onChange={(value) => {
                onControlChange("imageFit", value);
              }}
            />

            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Padding Top"
                min={0}
                max={160}
                value={values.canvasPaddingTop}
                onChange={(value) => {
                  onControlChange("canvasPaddingTop", value);
                }}
              />
              <NumberField
                label="Padding Right"
                min={0}
                max={160}
                value={values.canvasPaddingRight}
                onChange={(value) => {
                  onControlChange("canvasPaddingRight", value);
                }}
              />
              <NumberField
                label="Padding Bottom"
                min={0}
                max={160}
                value={values.canvasPaddingBottom}
                onChange={(value) => {
                  onControlChange("canvasPaddingBottom", value);
                }}
              />
              <NumberField
                label="Padding Left"
                min={0}
                max={160}
                value={values.canvasPaddingLeft}
                onChange={(value) => {
                  onControlChange("canvasPaddingLeft", value);
                }}
              />
            </div>

            <div className="grid gap-4">
              <ColorField
                label="Canvas Background"
                value={values.canvasBackground}
                onChange={(value) => {
                  onControlChange("canvasBackground", value);
                }}
              />
              <ColorField
                label="Text Color"
                value={values.textColor}
                onChange={(value) => {
                  onControlChange("textColor", value);
                }}
              />
              <ColorField
                label="Logo Color"
                value={values.logoColor}
                onChange={(value) => {
                  onControlChange("logoColor", value);
                }}
              />
            </div>
          </RailSection>
        ) : null}

        {sections.includes("type") ? (
          <RailSection heading="Type" layout={layout}>
            <ChoiceGroup
              options={typographyThemeOptions}
              value={values.typographyTheme}
              onChange={(value) => {
                onControlChange("typographyTheme", value);
              }}
            />
          </RailSection>
        ) : null}

        {sections.includes("brand") ? (
          <RailSection heading="Brand" layout={layout}>
            <SliderField
              label="Logo Size"
              min={0.5}
              max={3}
              step={0.1}
              value={values.logoScale}
              onHaptic={onSliderHaptic}
              onChange={(value) => {
                onControlChange("logoScale", value);
              }}
            />
            <ChoiceGroup
              options={brandPositionOptions}
              value={values.brandPosition}
              onChange={(value) => {
                onControlChange("brandPosition", value);
              }}
            />
          </RailSection>
        ) : null}
      </div>
    </section>
  );
}
