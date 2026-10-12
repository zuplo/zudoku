// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ParameterItem } from "./ParameterList.js";
import { ParameterListItem } from "./ParameterListItem.js";

const parameter = (schema: unknown): ParameterItem => ({
  name: "status",
  in: "query",
  description: null,
  required: null,
  schema,
  style: null,
  explode: null,
  allowReserved: null,
  examples: [],
});

describe("ParameterListItem", () => {
  it("labels a nullable union as its non-null variant", () => {
    render(
      <ParameterListItem
        parameter={parameter({
          anyOf: [{ type: "string", enum: ["DOCKED"] }, { type: "null" }],
        })}
        group="query"
        id="list-shipments"
      />,
    );

    expect(screen.getByText("string | null")).toBeInTheDocument();
    expect(screen.getByText("DOCKED")).toBeInTheDocument();
  });

  it("makes a nullable object collapsible", () => {
    render(
      <ParameterListItem
        parameter={parameter({
          anyOf: [
            { type: "object", properties: { from: { type: "string" } } },
            { type: "null" },
          ],
        })}
        group="query"
        id="list-shipments"
      />,
    );

    expect(screen.getByText("object | null")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Toggle parameter" }),
    ).toBeInTheDocument();
  });
});
