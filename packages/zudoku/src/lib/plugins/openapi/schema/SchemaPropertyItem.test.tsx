import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SchemaObject } from "../../../oas/parser/index.js";
import { SchemaPropertyItem } from "./SchemaPropertyItem.js";

describe("SchemaPropertyItem", () => {
  // Use schemas without description to avoid Markdown component
  // which requires ZudokuProvider context
  const baseSchema: SchemaObject = {
    type: "string",
  };

  it("renders property name without strikethrough for optional fields", () => {
    render(
      <SchemaPropertyItem
        name="myField"
        schema={baseSchema}
        group="optional"
      />,
    );

    const code = screen.getByText("myField");
    expect(code.tagName).toBe("CODE");
    expect(code.className).not.toContain("line-through");
  });

  it("renders property name without strikethrough for required fields", () => {
    render(
      <SchemaPropertyItem
        name="myField"
        schema={baseSchema}
        group="required"
      />,
    );

    const code = screen.getByText("myField");
    expect(code.className).not.toContain("line-through");
  });

  it("renders property name with strikethrough for deprecated fields", () => {
    const deprecatedSchema: SchemaObject = {
      ...baseSchema,
      deprecated: true,
    };

    render(
      <SchemaPropertyItem
        name="myField"
        schema={deprecatedSchema}
        group="deprecated"
      />,
    );

    const code = screen.getByText("myField");
    expect(code.className).toContain("line-through");
  });

  it("renders with reduced opacity for deprecated fields", () => {
    const deprecatedSchema: SchemaObject = {
      ...baseSchema,
      deprecated: true,
    };

    const { container } = render(
      <SchemaPropertyItem
        name="myField"
        schema={deprecatedSchema}
        group="deprecated"
      />,
    );

    const item = container.querySelector("[data-slot='item']");
    expect(item?.className).toContain("opacity-50");
    expect(item?.className).toContain("hover:opacity-100");
  });

  it("does not render reduced opacity for non-deprecated fields", () => {
    const { container } = render(
      <SchemaPropertyItem
        name="myField"
        schema={baseSchema}
        group="optional"
      />,
    );

    const item = container.querySelector("[data-slot='item']");
    expect(item?.className).not.toContain("opacity-50");
  });

  it("shows 'required' label only for required group", () => {
    render(
      <SchemaPropertyItem
        name="myField"
        schema={baseSchema}
        group="required"
      />,
    );

    expect(screen.getByText("required")).toBeInTheDocument();
  });

  it("does not show 'required' label for optional group", () => {
    render(
      <SchemaPropertyItem
        name="myField"
        schema={baseSchema}
        group="optional"
      />,
    );

    expect(screen.queryByText("required")).not.toBeInTheDocument();
  });

  it("does not show 'required' label for deprecated group", () => {
    const deprecatedSchema: SchemaObject = {
      ...baseSchema,
      deprecated: true,
    };

    render(
      <SchemaPropertyItem
        name="myField"
        schema={deprecatedSchema}
        group="deprecated"
      />,
    );

    expect(screen.queryByText("required")).not.toBeInTheDocument();
  });
});
