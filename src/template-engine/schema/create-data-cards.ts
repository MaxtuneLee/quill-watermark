import { validateFieldGroups } from "./validators";
import type {
  CreateDataCardsInput,
  ResolvedField,
  ResolvedFieldMode,
  TemplateDataCard,
} from "../types";

function pickCardMode(fields: readonly ResolvedField[]): ResolvedFieldMode {
  if (fields.some((field) => field.mode === "manual")) {
    return "manual";
  }

  if (fields.some((field) => field.mode === "placeholder")) {
    return "placeholder";
  }

  return "auto";
}

export function createDataCards(input: CreateDataCardsInput): TemplateDataCard[] {
  const groups = validateFieldGroups(input.groups);

  return groups.map((group) => {
    const requiredByTemplate = group.requiredByTemplate ?? true;
    const boundFields = group.bindings
      .map((binding) => input.resolvedFields[binding])
      .filter((field): field is ResolvedField => field !== undefined);

    const previewParts = boundFields
      .map((field) => field.value)
      .filter((value): value is string => typeof value === "string" && value.length > 0);

    return {
      id: group.id,
      title: group.title,
      bindings: group.bindings,
      enabled: previewParts.length > 0 || requiredByTemplate,
      mode: pickCardMode(boundFields),
      previewValue: previewParts.length > 0 ? previewParts.join(" · ") : null,
      editable: boundFields.some((field) => field.editable),
      requiredByTemplate,
    };
  });
}
