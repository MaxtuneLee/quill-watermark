import { expect, test } from "vite-plus/test";
import { templates } from "./index";

test("ships at least eight built-in templates across six families", () => {
  expect(templates.length).toBeGreaterThanOrEqual(8);
  expect(new Set(templates.map((template) => template.family)).size).toBeGreaterThanOrEqual(6);
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
