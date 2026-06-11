/**
 * @vitest-environment happy-dom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrowserWindow } from "./BrowserWindow.js";

describe("BrowserWindow", () => {
  it("renders children and the default url", () => {
    render(
      <BrowserWindow>
        <div>Page content</div>
      </BrowserWindow>,
    );

    expect(screen.getByText("Page content")).toBeDefined();
    expect(screen.getByText("localhost:3000")).toBeDefined();
  });

  it("renders a custom url", () => {
    render(
      <BrowserWindow url="https://api.example.com">
        <div>Content</div>
      </BrowserWindow>,
    );

    expect(screen.getByText("https://api.example.com")).toBeDefined();
  });

  it("shows the current scale as a percentage", () => {
    render(
      <BrowserWindow scale={0.75}>
        <div>Content</div>
      </BrowserWindow>,
    );

    expect(screen.getByText("75%")).toBeDefined();
  });

  it("steps through zoom levels with the zoom buttons", () => {
    render(
      <BrowserWindow>
        <div>Content</div>
      </BrowserWindow>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByText("110%")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(screen.getByText("90%")).toBeDefined();
  });

  it("resets to the initial scale when clicking the percentage", () => {
    render(
      <BrowserWindow scale={0.75}>
        <div>Content</div>
      </BrowserWindow>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByText("80%")).toBeDefined();

    fireEvent.click(screen.getByTitle("Reset zoom"));
    expect(screen.getByText("75%")).toBeDefined();
  });

  it("disables the zoom buttons at the zoom limits", () => {
    render(
      <BrowserWindow scale={0.25}>
        <div>Content</div>
      </BrowserWindow>,
    );

    const zoomOut = screen.getByRole("button", { name: "Zoom out" });
    expect(zoomOut.hasAttribute("disabled")).toBe(true);
    expect(
      screen.getByRole("button", { name: "Zoom in" }).hasAttribute("disabled"),
    ).toBe(false);
  });
});
