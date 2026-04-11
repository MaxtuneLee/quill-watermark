import { UploadIcon } from "@/components/ui/upload";
import { Button } from "../../../components/ui";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { DownloadIcon } from "../../../icons/ui-icons";
import type { ExportFormat, ExportMultiplier, ExportPanelValues } from "./panel-state";
import { exportFormatOptions, exportMultiplierOptions } from "./panel-state";
import { CogIcon } from "@/components/ui/cog";

interface ExportPanelProps {
  disabled: boolean;
  values: ExportPanelValues;
  statusMessage: string | null;
  onFormatChange: (value: ExportFormat) => void;
  onMultiplierChange: (value: ExportMultiplier) => void;
  onExport: () => Promise<void>;
  onShare: () => Promise<void>;
}

export function ExportPanel({
  disabled,
  values,
  statusMessage,
  onFormatChange,
  onMultiplierChange,
  onExport,
  onShare,
}: ExportPanelProps) {
  return (
    <section
      aria-label="Export panel"
      className="editor-panel editor-panel-surface border-b border-white/8 pb-6"
      role="region"
    >
      <div className="editor-export-toolbar inline-flex w-full items-center overflow-hidden border border-white/10 bg-white/[0.03]">
        <Button
          size="sm"
          className="editor-primary-action h-9 flex-1 justify-start gap-2 rounded-none border-0 bg-primary/88 px-3 text-primary-foreground hover:bg-primary"
          disabled={disabled}
          onClick={() => void onExport()}
        >
          <DownloadIcon data-icon="inline-start" />
          {statusMessage ?? `Export ${values.format.toUpperCase()} · ${values.multiplier}x`}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="editor-icon-trigger h-9 shrink-0 rounded-none border-y-0 border-r-0 border-l border-white/10 bg-transparent hover:bg-white/[0.08]"
          aria-label="Share image"
          disabled={disabled}
          onClick={() => void onShare()}
        >
          <UploadIcon />
        </Button>

        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="editor-icon-trigger h-9 shrink-0 rounded-none border-y-0 border-r-0 border-l border-white/10 bg-transparent hover:bg-white/[0.08]"
                aria-label="Output settings"
              />
            }
          >
            <CogIcon />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="editor-popover-panel w-72 gap-0 border border-white/10 bg-[#161515] p-0 text-[oklch(0.96_0.01_95)] shadow-2xl"
          >
            <section className="editor-choice-group grid gap-2.5 px-4 py-3.5">
              <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-white/60 uppercase">
                Format
              </p>
              <div className="editor-pill-row flex flex-wrap gap-2">
                {exportFormatOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    size="sm"
                    className="editor-pill-button border-white/10 bg-white/[0.03] text-white/72 hover:bg-white/[0.08] hover:text-white aria-pressed:border-primary/55 aria-pressed:bg-primary/12 aria-pressed:text-primary"
                    aria-pressed={values.format === option.value}
                    onClick={() => {
                      onFormatChange(option.value);
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </section>

            <section className="editor-choice-group grid gap-2.5 border-t border-white/8 px-4 py-3.5">
              <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-white/60 uppercase">
                Multiplier
              </p>
              <div className="editor-pill-row flex flex-wrap gap-2">
                {exportMultiplierOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    size="sm"
                    className="editor-pill-button border-white/10 bg-white/[0.03] text-white/72 hover:bg-white/[0.08] hover:text-white aria-pressed:border-primary/55 aria-pressed:bg-primary/12 aria-pressed:text-primary"
                    aria-pressed={values.multiplier === option.value}
                    onClick={() => {
                      onMultiplierChange(option.value);
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </section>
          </PopoverContent>
        </Popover>
      </div>
    </section>
  );
}
