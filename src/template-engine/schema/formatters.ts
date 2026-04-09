import type { TemplateFormatRule } from "../types";

function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function applyFormatter(value: string, formatter: TemplateFormatRule): string {
  switch (formatter.type) {
    case "trim":
      return value.trim();
    case "uppercase":
      return value.toUpperCase();
    case "lowercase":
      return value.toLowerCase();
    case "prefix":
      return `${formatter.value}${value}`;
    case "suffix":
      return `${value}${formatter.value}`;
  }
}

export function applyFormatters(
  value: string | null,
  formatters: readonly TemplateFormatRule[] | undefined,
): string | null {
  if (value === null) {
    return null;
  }

  const formatted = (formatters ?? []).reduce(applyFormatter, value);
  return trimToNull(formatted);
}
