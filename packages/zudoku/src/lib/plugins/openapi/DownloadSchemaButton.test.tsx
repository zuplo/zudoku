/**
 * @vitest-environment happy-dom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DownloadSchemaButton } from "./DownloadSchemaButton.js";

const openDropdown = () => {
  const trigger = screen.getByRole("button", { expanded: false });
  fireEvent.pointerDown(trigger, { button: 0, pointerType: "mouse" });
};

describe("DownloadSchemaButton", () => {
  it("shows all menu items by default", () => {
    render(<DownloadSchemaButton downloadUrl="/openapi.json" />);
    openDropdown();

    expect(screen.getByText("Open in new tab")).toBeInTheDocument();
    expect(screen.getByText("Copy to clipboard")).toBeInTheDocument();
    expect(screen.getByText("Use in Claude")).toBeInTheDocument();
    expect(screen.getByText("Use in ChatGPT")).toBeInTheDocument();
  });

  it("hides Claude option when useInClaude is false", () => {
    render(
      <DownloadSchemaButton
        downloadUrl="/openapi.json"
        schemaDownload={{ useInClaude: false }}
      />,
    );
    openDropdown();

    expect(screen.getByText("Open in new tab")).toBeInTheDocument();
    expect(screen.getByText("Copy to clipboard")).toBeInTheDocument();
    expect(screen.queryByText("Use in Claude")).not.toBeInTheDocument();
    expect(screen.getByText("Use in ChatGPT")).toBeInTheDocument();
  });

  it("hides ChatGPT option when useInChatGPT is false", () => {
    render(
      <DownloadSchemaButton
        downloadUrl="/openapi.json"
        schemaDownload={{ useInChatGPT: false }}
      />,
    );
    openDropdown();

    expect(screen.getByText("Open in new tab")).toBeInTheDocument();
    expect(screen.getByText("Copy to clipboard")).toBeInTheDocument();
    expect(screen.getByText("Use in Claude")).toBeInTheDocument();
    expect(screen.queryByText("Use in ChatGPT")).not.toBeInTheDocument();
  });

  it("hides both AI options when both are false", () => {
    render(
      <DownloadSchemaButton
        downloadUrl="/openapi.json"
        schemaDownload={{ useInClaude: false, useInChatGPT: false }}
      />,
    );
    openDropdown();

    expect(screen.getByText("Open in new tab")).toBeInTheDocument();
    expect(screen.getByText("Copy to clipboard")).toBeInTheDocument();
    expect(screen.queryByText("Use in Claude")).not.toBeInTheDocument();
    expect(screen.queryByText("Use in ChatGPT")).not.toBeInTheDocument();
  });

  it("shows AI options when explicitly set to true", () => {
    render(
      <DownloadSchemaButton
        downloadUrl="/openapi.json"
        schemaDownload={{ useInClaude: true, useInChatGPT: true }}
      />,
    );
    openDropdown();

    expect(screen.getByText("Use in Claude")).toBeInTheDocument();
    expect(screen.getByText("Use in ChatGPT")).toBeInTheDocument();
  });
});
