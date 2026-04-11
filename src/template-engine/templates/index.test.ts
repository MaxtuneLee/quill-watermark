import { expect, test } from "vite-plus/test";
import { templates } from "./index";

test("ships only the supported info bar and center brand built-in templates", () => {
  expect(templates.map((template) => template.id)).toEqual([
    "classic-info-strip",
    "minimal-info-strip",
    "centered-device-mark",
    "centered-brand-meta",
  ]);
  expect(new Set(templates.map((template) => template.family))).toEqual(
    new Set(["Info Bar", "Center Brand"]),
  );
});

test("declares schema-backed field groups for every built-in template", () => {
  for (const template of templates) {
    expect(Object.keys(template.schema.fields).length).toBeGreaterThan(0);
    expect(template.fieldGroups.length).toBeGreaterThan(0);
    expect(
      template.fieldGroups.every((group) =>
        group.bindings.every((binding) => binding in template.schema.fields),
      ),
    ).toBe(true);
  }
});
