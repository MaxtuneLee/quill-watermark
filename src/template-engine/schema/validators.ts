import * as v from "valibot";
import type { TemplateFieldGroup, TemplateFieldSchema } from "../types";

const formatRuleSchema = v.variant("type", [
  v.object({
    type: v.literal("trim"),
  }),
  v.object({
    type: v.literal("uppercase"),
  }),
  v.object({
    type: v.literal("lowercase"),
  }),
  v.object({
    type: v.literal("prefix"),
    value: v.string(),
  }),
  v.object({
    type: v.literal("suffix"),
    value: v.string(),
  }),
]);

const fallbackRuleSchema = v.object({
  whenMissing: v.pipe(v.array(v.string()), v.minLength(1)),
  use: v.string(),
});

const fieldDefinitionSchema = v.object({
  kind: v.picklist(["text", "image"]),
  source: v.picklist(["exif", "gps", "user", "derived", "afilmory", "brand"]),
  path: v.optional(v.string()),
  editable: v.boolean(),
  placeholder: v.optional(v.string()),
  format: v.optional(v.array(formatRuleSchema)),
  fallback: v.optional(v.array(fallbackRuleSchema)),
});

const fieldSchema = v.object({
  fields: v.record(v.string(), fieldDefinitionSchema),
});

const fieldGroupSchema = v.object({
  id: v.string(),
  title: v.string(),
  bindings: v.pipe(v.array(v.string()), v.minLength(1)),
  requiredByTemplate: v.optional(v.boolean()),
});

export function validateFieldSchema(schema: TemplateFieldSchema): TemplateFieldSchema {
  return v.parse(fieldSchema, schema);
}

export function validateFieldGroups(
  groups: readonly TemplateFieldGroup[],
): readonly TemplateFieldGroup[] {
  return v.parse(v.array(fieldGroupSchema), groups);
}
