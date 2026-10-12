// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SchemaView } from "./SchemaView.js";

describe("SchemaView", () => {
  it("renders schemas without a type and keeps the card header", () => {
    render(
      <SchemaView
        schema={{ contentMediaType: "audio/mpeg" }}
        cardHeader={<div>Response tabs</div>}
      />,
    );

    expect(screen.getByText("Response tabs")).toBeInTheDocument();
    expect(screen.getByText("binary")).toBeInTheDocument();
    expect(screen.getByText("audio/mpeg")).toBeInTheDocument();
  });

  it("renders untyped schemas that only carry keywords", () => {
    render(
      <SchemaView
        schema={{ default: "WARP" }}
        cardHeader={<div>Response tabs</div>}
      />,
    );

    expect(screen.getByText("Response tabs")).toBeInTheDocument();
    expect(screen.getByText("WARP")).toBeInTheDocument();
  });

  it("renders a nullable union at the root as its non-null variant", () => {
    render(
      <SchemaView schema={{ anyOf: [{ type: "string" }, { type: "null" }] }} />,
    );

    expect(screen.getByText("string | null")).toBeInTheDocument();
    expect(screen.queryByText("anyOf")).not.toBeInTheDocument();
  });
});
