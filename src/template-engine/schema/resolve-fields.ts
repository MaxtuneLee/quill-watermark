import { applyFormatters } from "./formatters";
import { validateFieldSchema } from "./validators";
import type {
  ResolveFieldsInput,
  ResolvedFieldMap,
  TemplateFieldDefinition,
  TemplateFieldSources,
} from "../types";

interface InterpolationResult {
  value: string | null;
  hasTokens: boolean;
}

function normalizeValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  return null;
}

function readPath(source: Record<string, unknown>, path: string | undefined): unknown {
  if (!path) {
    return undefined;
  }

  const segments = path.split(".");
  let current: unknown = source;

  for (const segment of segments) {
    if (typeof current !== "object" || current === null || !(segment in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function readSourceValue(sources: TemplateFieldSources, sourcePath: string): string | null {
  const [sourceName, ...pathSegments] = sourcePath.split(".");
  const source = sources[sourceName as keyof TemplateFieldSources];
  if (!source) {
    return null;
  }

  return normalizeValue(readPath(source, pathSegments.join(".")));
}

function interpolateTemplate(template: string, sources: TemplateFieldSources): InterpolationResult {
  const tokenPattern = /{{\s*([^}]+?)\s*}}/g;
  const matches = [...template.matchAll(tokenPattern)];

  if (matches.length === 0) {
    return {
      value: normalizeValue(template),
      hasTokens: false,
    };
  }

  let resolvedCount = 0;
  const rendered = template.replaceAll(tokenPattern, (_match, token) => {
    const value = readSourceValue(sources, token.trim());
    if (value === null) {
      return "";
    }

    resolvedCount += 1;
    return value;
  });

  return {
    value: resolvedCount > 0 ? normalizeValue(rendered.replaceAll(/\s{2,}/g, " ")) : null,
    hasTokens: true,
  };
}

function applyFallback(
  fallbackRules: readonly { whenMissing: readonly string[]; use: string }[] | undefined,
  sources: TemplateFieldSources,
): string | null {
  for (const rule of fallbackRules ?? []) {
    const matches = rule.whenMissing.every((path) => readSourceValue(sources, path) === null);
    if (!matches) {
      continue;
    }

    return interpolateTemplate(rule.use, sources).value;
  }

  return null;
}

function resolveAutoValue(
  definition: TemplateFieldDefinition,
  input: ResolveFieldsInput,
): string | null {
  const rawSourceValue = normalizeValue(
    readPath(input.sources[definition.source], definition.path),
  );
  if (rawSourceValue === null) {
    return null;
  }

  if (!definition.placeholder) {
    return rawSourceValue;
  }

  const interpolated = interpolateTemplate(definition.placeholder, input.sources);
  if (interpolated.hasTokens && interpolated.value !== null) {
    return interpolated.value;
  }

  return rawSourceValue;
}

export function resolveFields(input: ResolveFieldsInput): ResolvedFieldMap {
  const schema = validateFieldSchema(input.schema);

  return Object.fromEntries(
    Object.entries(schema.fields).map(([fieldId, definition]) => {
      const overrideValue = normalizeValue(input.overrides[fieldId]);
      if (overrideValue !== null) {
        return [
          fieldId,
          {
            kind: definition.kind,
            source: definition.source,
            editable: definition.editable,
            mode: "manual",
            value: applyFormatters(overrideValue, definition.format),
          },
        ];
      }

      const autoValue = resolveAutoValue(definition, input);
      if (autoValue !== null) {
        return [
          fieldId,
          {
            kind: definition.kind,
            source: definition.source,
            editable: definition.editable,
            mode: "auto",
            value: applyFormatters(autoValue, definition.format),
          },
        ];
      }

      const fallbackValue = applyFallback(definition.fallback, input.sources);
      if (fallbackValue !== null) {
        return [
          fieldId,
          {
            kind: definition.kind,
            source: definition.source,
            editable: definition.editable,
            mode: "placeholder",
            value: applyFormatters(fallbackValue, definition.format),
          },
        ];
      }

      if (definition.placeholder) {
        const interpolated = interpolateTemplate(definition.placeholder, input.sources);
        if (!interpolated.hasTokens && interpolated.value !== null) {
          return [
            fieldId,
            {
              kind: definition.kind,
              source: definition.source,
              editable: definition.editable,
              mode: "placeholder",
              value: applyFormatters(interpolated.value, definition.format),
            },
          ];
        }
      }

      return [
        fieldId,
        {
          kind: definition.kind,
          source: definition.source,
          editable: definition.editable,
          mode: "placeholder",
          value: null,
        },
      ];
    }),
  );
}
