import type { ZudokuPlugin } from "../../core/plugins.js";

export interface LlmsTxtPluginOptions {
  title?: string;
  description?: string;
  includeOptionalSection?: boolean;
  customSections?: {
    title: string;
    items: Array<{
      title: string;
      url: string;
      description?: string;
    }>;
    optional?: boolean;
  }[];
}

export const llmsTxtPlugin = (
  options: LlmsTxtPluginOptions = {},
): ZudokuPlugin => ({
  getRoutes: () => [
    {
      path: "/llms.txt",
      handle: { layout: "none" },
      lazy: async () => {
        const { LlmsTxtPage, generateLlmsTxtContent } = await import(
          "./LlmsTxtPage.js"
        );
        const { markdownFiles } = await import("virtual:zudoku-llms-txt-data");
        const content = generateLlmsTxtContent("basic", options, markdownFiles);
        return {
          element: <LlmsTxtPage content={content} />,
        };
      },
    },
    {
      path: "/llms-full.txt",
      handle: { layout: "none" },
      lazy: async () => {
        const { LlmsTxtPage, generateLlmsTxtContent } = await import(
          "./LlmsTxtPage.js"
        );
        const { markdownFiles } = await import("virtual:zudoku-llms-txt-data");
        const content = generateLlmsTxtContent("full", options, markdownFiles);
        return {
          element: <LlmsTxtPage content={content} />,
        };
      },
    },
  ],
});
