// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "../../../i18n/I18nContext.js";
import { defaultMessages } from "../../../i18n/messages.js";
import type { SchemaObject } from "../../../oas/parser/index.js";
import { SchemaPropertyItem } from "./SchemaPropertyItem.js";

const wrapper = ({ children }: PropsWithChildren) => (
  <I18nProvider messages={defaultMessages}>{children}</I18nProvider>
);

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
      { wrapper },
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
      { wrapper },
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
      { wrapper },
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
      { wrapper },
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
      { wrapper },
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
      { wrapper },
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
      { wrapper },
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
      { wrapper },
    );

    expect(screen.queryByText("required")).not.toBeInTheDocument();
  });
});
