import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Feature } from "../types/PlanType.js";
import { FeatureItem } from "./FeatureItem.js";

describe("FeatureItem", () => {
  it("renders feature name", () => {
    const feature: Feature = { key: "support", name: "Email Support" };
    render(<FeatureItem feature={feature} />);
    expect(screen.getByText("Email Support")).toBeInTheDocument();
  });

  it("renders feature name and value when value is present", () => {
    const feature: Feature = {
      key: "rate-limit",
      name: "Rate Limit",
      value: "100 req/s",
    };
    render(<FeatureItem feature={feature} />);
    expect(screen.getByText("Rate Limit:")).toBeInTheDocument();
    expect(screen.getByText("100 req/s")).toBeInTheDocument();
  });

  it("renders check icon", () => {
    const feature: Feature = { key: "support", name: "Email Support" };
    const { container } = render(<FeatureItem feature={feature} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
