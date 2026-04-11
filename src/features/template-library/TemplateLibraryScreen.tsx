import { useState } from "react";
import { cn } from "../../lib/utils";
import { Button, Tabs, TabsList, TabsTrigger } from "../../components/ui";
import type { TemplateAspect, WatermarkTemplate } from "../../template-engine/types";

const aspectFilters: ReadonlyArray<{ label: string; value: "all" | TemplateAspect }> = [
  { label: "All", value: "all" },
  { label: "1:1", value: "1:1" },
  { label: "4:5", value: "4:5" },
  { label: "3:2", value: "3:2" },
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
];

interface TemplateLibraryScreenProps {
  templates: readonly WatermarkTemplate[];
  onSelect: (templateId: string) => void;
  selectedTemplateId?: string | null;
  layout?: "full" | "sidebar";
}

export function TemplateLibraryScreen({
  templates,
  onSelect,
  selectedTemplateId = null,
  layout = "full",
}: TemplateLibraryScreenProps) {
  const [aspectFilter, setAspectFilter] = useState<"all" | TemplateAspect>("all");
  const isSidebar = layout === "sidebar";

  const filteredTemplates = isSidebar
    ? templates
    : aspectFilter === "all"
      ? templates
      : templates.filter((template) => template.aspectSupport.includes(aspectFilter));

  const familiesInOrder = Array.from(new Set(filteredTemplates.map((template) => template.family)));
  const resultLabel =
    aspectFilter === "all" ? `${filteredTemplates.length} templates` : `${aspectFilter} crops`;

  return (
    <section
      aria-label="Template Library"
      className={cn("grid gap-6", isSidebar ? "gap-3.5" : "gap-[clamp(1.5rem,2vw,2.5rem)]")}
      data-layout={layout}
    >
      {!isSidebar ? (
        <>
          <header className="grid gap-4 pb-5">
            <div className="grid max-w-[56rem] gap-2">
              <h1 className="sr-only">Template Library</h1>
              <h2 className="m-0 font-serif text-[clamp(1.75rem,2.2vw,2.35rem)] leading-[1.05] tracking-[-0.035em]">
                Choose a composition to start the desk.
              </h2>
            </div>
            <p className="m-0 max-w-[42rem] text-base leading-[1.6] text-[color-mix(in_srgb,var(--color-text),white_38%)]">
              Open a layout with its framing, metadata structure, and export defaults already
              prepared.
            </p>
            <div className="flex flex-wrap gap-3" aria-label="Template library summary">
              <span className="inline-flex min-h-8 items-center bg-[color-mix(in_srgb,var(--color-surface),white_15%)] px-3.5 py-1.5 text-[0.8rem] font-semibold text-[color-mix(in_srgb,var(--color-text),white_22%)]">
                {templates.length} presets
              </span>
              <span className="inline-flex min-h-8 items-center bg-[color-mix(in_srgb,var(--color-surface),white_15%)] px-3.5 py-1.5 text-[0.8rem] font-semibold text-[color-mix(in_srgb,var(--color-text),white_22%)]">
                {familiesInOrder.length} families
              </span>
              <span className="inline-flex min-h-8 items-center bg-[color-mix(in_srgb,var(--color-surface),white_15%)] px-3.5 py-1.5 text-[0.8rem] font-semibold text-[color-mix(in_srgb,var(--color-text),white_22%)]">
                {resultLabel}
              </span>
            </div>
          </header>

          <section className="grid grid-cols-[minmax(0,1fr)] gap-4" aria-label="Template filters">
            <Tabs
              value={aspectFilter}
              className="flex"
              onValueChange={(value) => {
                setAspectFilter((value ?? "all") as "all" | TemplateAspect);
              }}
            >
              <TabsList
                aria-label="Filter templates by aspect ratio"
                className="w-full flex-wrap justify-start gap-1 bg-transparent p-0"
                variant="line"
              >
                {aspectFilters.map((filter) => (
                  <TabsTrigger
                    className="min-w-[4.25rem] text-[0.84rem] font-semibold"
                    key={filter.value}
                    value={filter.value}
                  >
                    {filter.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </section>
        </>
      ) : (
        <h1 className="sr-only">Template Library</h1>
      )}

      {familiesInOrder.map((family) => (
        <section
          className={cn("grid gap-4", isSidebar && "gap-2")}
          key={family}
          aria-label={`${family} templates`}
        >
          <header
            className={cn(
              "flex items-end justify-between gap-4 pt-1",
              isSidebar && "items-center pt-0",
              "max-[640px]:flex-col max-[640px]:items-start",
            )}
          >
            <div>
              <h2
                className={cn(
                  "m-0 font-serif text-[clamp(1.35rem,1.7vw,1.9rem)] tracking-[-0.03em]",
                  isSidebar && "text-[1.02rem]",
                )}
              >
                {family}
              </h2>
            </div>
            <p className="m-0 text-[0.82rem] font-semibold text-[color-mix(in_srgb,var(--color-text),white_45%)]">
              {filteredTemplates.filter((template) => template.family === family).length} layouts
            </p>
          </header>
          <div
            className={cn(
              "grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(18rem,1fr))]",
              isSidebar && "grid-cols-1 gap-2",
            )}
          >
            {filteredTemplates
              .filter((template) => template.family === family)
              .map((template) => (
                <article
                  className={cn(
                    "overflow-hidden bg-[color-mix(in_srgb,var(--color-surface),white_18%)] transition-[transform,background-color,border-color] duration-150 ease-out hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--color-surface),white_24%)]",
                    isSidebar &&
                      "block border-l-2 border-l-transparent opacity-55 transition-[transform,background-color,border-color,opacity] hover:opacity-100",
                    selectedTemplateId === template.id &&
                      "bg-[color-mix(in_srgb,var(--color-surface),white_26%)] opacity-100",
                    isSidebar &&
                      selectedTemplateId === template.id &&
                      "border-l-[color-mix(in_srgb,var(--color-text),white_28%)]",
                  )}
                  key={template.id}
                  data-selected={selectedTemplateId === template.id}
                >
                  {isSidebar ? (
                    <button
                      type="button"
                      className="block w-full cursor-pointer border-0 bg-transparent p-0"
                      aria-label={`Apply template ${template.name}`}
                      onClick={() => onSelect(template.id)}
                    >
                      <div className="p-0">
                        <img
                          className="block h-auto w-full border-0 bg-[color-mix(in_srgb,var(--color-surface),white_10%)]"
                          src={template.coverImage}
                          alt={`${template.name} cover`}
                        />
                      </div>
                    </button>
                  ) : (
                    <>
                      <div className="px-3 pt-3">
                        <img
                          className="h-48 w-full border-0 bg-[color-mix(in_srgb,var(--color-surface),white_10%)] object-cover max-[640px]:h-40"
                          src={template.coverImage}
                          alt={`${template.name} cover`}
                        />
                      </div>
                      <div className="grid gap-4 p-4">
                        <div className="grid gap-2">
                          <div className="flex items-start justify-between gap-3">
                            <p className="m-0 font-serif text-[1.12rem] font-bold tracking-[-0.02em]">
                              {template.name}
                            </p>
                            <span className="shrink-0 text-[0.73rem] font-bold tracking-[0.12em] text-[color-mix(in_srgb,var(--color-text),white_48%)] uppercase">
                              {template.family}
                            </span>
                          </div>
                          <p className="m-0 text-[0.92rem] leading-[1.55] text-[color-mix(in_srgb,var(--color-text),white_36%)]">
                            {template.description}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2" aria-label={`${template.name} tags`}>
                          {template.aspectSupport.map((aspect) => (
                            <span
                              className="bg-[color-mix(in_srgb,var(--color-surface),white_26%)] px-2.5 py-1 text-[0.75rem] font-bold tracking-[0.03em]"
                              key={`${template.id}-${aspect}`}
                            >
                              {aspect}
                            </span>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-0.5 justify-self-start"
                          aria-label={`Use template ${template.name}`}
                          onClick={() => onSelect(template.id)}
                        >
                          Use Template
                        </Button>
                      </div>
                    </>
                  )}
                </article>
              ))}
          </div>
        </section>
      ))}
    </section>
  );
}
