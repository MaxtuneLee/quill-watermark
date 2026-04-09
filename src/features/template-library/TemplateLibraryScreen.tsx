import { useState } from "react";
import { Button, Tabs } from "../../components/ui";
import type { TemplateAspect, WatermarkTemplate } from "../../template-engine/types";
import "./template-library.css";

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
}

export function TemplateLibraryScreen({ templates, onSelect }: TemplateLibraryScreenProps) {
  const [aspectFilter, setAspectFilter] = useState<"all" | TemplateAspect>("all");

  const filteredTemplates =
    aspectFilter === "all"
      ? templates
      : templates.filter((template) => template.aspectSupport.includes(aspectFilter));

  const familiesInOrder = Array.from(new Set(filteredTemplates.map((template) => template.family)));

  return (
    <section aria-label="Template Library" className="template-library-screen">
      <header className="template-library-header">
        <h1>Template Library</h1>
        <p>Choose a built-in layout to prefill structure, controls, and defaults.</p>
      </header>

      <Tabs.Root
        value={aspectFilter}
        className="template-library-tabs-root"
        onValueChange={(value) => {
          setAspectFilter((value ?? "all") as "all" | TemplateAspect);
        }}
      >
        <Tabs.List
          aria-label="Filter templates by aspect ratio"
          className="template-library-tabs-list"
        >
          {aspectFilters.map((filter) => (
            <Tabs.Tab className="template-library-tabs-tab" key={filter.value} value={filter.value}>
              {filter.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>

      {familiesInOrder.map((family) => (
        <section
          className="template-family-section"
          key={family}
          aria-label={`${family} templates`}
        >
          <h2>{family}</h2>
          <div className="template-card-grid">
            {filteredTemplates
              .filter((template) => template.family === family)
              .map((template) => (
                <article className="template-card" key={template.id}>
                  <img
                    className="template-card-cover"
                    src={template.coverImage}
                    alt={`${template.name} cover`}
                  />
                  <div className="template-card-body">
                    <p className="template-card-title">{template.name}</p>
                    <p>{template.description}</p>
                    <div className="template-tag-row" aria-label={`${template.name} tags`}>
                      <span className="template-tag">{template.family}</span>
                      {template.aspectSupport.map((aspect) => (
                        <span
                          className="template-tag template-tag-aspect"
                          key={`${template.id}-${aspect}`}
                        >
                          {aspect}
                        </span>
                      ))}
                    </div>
                    <Button
                      className="template-use-button"
                      aria-label={`Use template ${template.name}`}
                      onClick={() => onSelect(template.id)}
                    >
                      Use Template
                    </Button>
                  </div>
                </article>
              ))}
          </div>
        </section>
      ))}
    </section>
  );
}
