/**
 * @vitest-environment happy-dom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it } from "vitest";
import type { AiAssistantsConfig } from "../../../config/validators/ZudokuConfig.js";
import { ZudokuProvider } from "../../components/context/ZudokuProvider.js";
import { ZudokuContext } from "../../core/ZudokuContext.js";
import { I18nProvider } from "../../i18n/I18nContext.js";
import { defaultMessages } from "../../i18n/messages.js";
import { DownloadSchemaButton } from "./DownloadSchemaButton.js";

const createWrapper = (aiAssistants?: AiAssistantsConfig) => {
  const queryClient = new QueryClient();
  const context = new ZudokuContext({ aiAssistants }, queryClient, {});
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
      <ZudokuProvider context={context}>
        <I18nProvider messages={defaultMessages} locale="en">
          {children}
        </I18nProvider>
      </ZudokuProvider>
    </QueryClientProvider>
  );
};

const openDropdown = () => {
  const trigger = screen.getByRole("button", { expanded: false });
  fireEvent.pointerDown(trigger, { button: 0, pointerType: "mouse" });
};

describe("DownloadSchemaButton", () => {
  it("shows all default AI menu items when aiAssistants is not set", () => {
    render(<DownloadSchemaButton downloadUrl="/openapi.json" />, {
      wrapper: createWrapper(),
    });
    openDropdown();

    expect(screen.getByText("Open in new tab")).toBeInTheDocument();
    expect(screen.getByText("Copy to clipboard")).toBeInTheDocument();
    expect(screen.getByText("Use in Claude")).toBeInTheDocument();
    expect(screen.getByText("Use in ChatGPT")).toBeInTheDocument();
  });

  it("hides all AI items when aiAssistants is false", () => {
    render(<DownloadSchemaButton downloadUrl="/openapi.json" />, {
      wrapper: createWrapper(false),
    });
    openDropdown();

    expect(screen.getByText("Open in new tab")).toBeInTheDocument();
    expect(screen.getByText("Copy to clipboard")).toBeInTheDocument();
    expect(screen.queryByText("Use in Claude")).not.toBeInTheDocument();
    expect(screen.queryByText("Use in ChatGPT")).not.toBeInTheDocument();
  });

  it("shows only Claude when configured with just claude preset", () => {
    render(<DownloadSchemaButton downloadUrl="/openapi.json" />, {
      wrapper: createWrapper(["claude"]),
    });
    openDropdown();

    expect(screen.getByText("Use in Claude")).toBeInTheDocument();
    expect(screen.queryByText("Use in ChatGPT")).not.toBeInTheDocument();
  });

  it("shows only ChatGPT when configured with just chatgpt preset", () => {
    render(<DownloadSchemaButton downloadUrl="/openapi.json" />, {
      wrapper: createWrapper(["chatgpt"]),
    });
    openDropdown();

    expect(screen.queryByText("Use in Claude")).not.toBeInTheDocument();
    expect(screen.getByText("Use in ChatGPT")).toBeInTheDocument();
  });

  it("shows custom AI assistant entries", () => {
    render(<DownloadSchemaButton downloadUrl="/openapi.json" />, {
      wrapper: createWrapper([
        { label: "Open in MyAI", url: "https://myai.com/?q={pageUrl}" },
      ]),
    });
    openDropdown();

    expect(screen.queryByText("Use in Claude")).not.toBeInTheDocument();
    expect(screen.queryByText("Use in ChatGPT")).not.toBeInTheDocument();
    expect(screen.getByText("Open in MyAI")).toBeInTheDocument();
  });
});
