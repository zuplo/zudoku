import { useEffect } from "react";

export interface MermaidInitializerProps {
  /**
   * Mermaid configuration
   * See https://mermaid.js.org/config/schema-docs/config.html
   */
  config?: Record<string, unknown>;

  /**
   * CSS selector for elements to render
   * @default ".mermaid"
   */
  selector?: string;

  /**
   * Whether to use the dark theme
   * @default false
   */
  darkMode?: boolean;
}

export const MermaidInitializer = ({
  config = {},
  selector = ".mermaid",
  darkMode = false,
}: MermaidInitializerProps) => {
  useEffect(() => {
    const initializeMermaid = async () => {
      try {
        // Dynamically import mermaid to avoid bundling it
        const mermaid = await import(/* @vite-ignore */ "mermaid").then(
          // biome-ignore lint/suspicious/noExplicitAny: Optional dependency with dynamic import
          (m: any) => m.default,
        );

        // Expose mermaid globally for debugging
        // biome-ignore lint/suspicious/noExplicitAny: Global window extension
        (window as any).mermaid = mermaid;

        const defaultConfig = {
          startOnLoad: true,
          theme: darkMode ? "dark" : "default",
          themeVariables: {
            background: "transparent",
            // biome-ignore lint/suspicious/noExplicitAny: Config type is user-provided Record<string, unknown>
            ...(config as any)?.themeVariables,
          },
          themeCSS:
            ".mermaid{background:transparent!important}.mermaid svg{background:transparent!important}",
          ...config,
        };

        mermaid.initialize(defaultConfig);

        const elements = document.querySelectorAll(selector);

        for (const element of Array.from(elements)) {
          if (element.getAttribute("data-processed")) {
            continue;
          }

          try {
            const code = element.textContent || "";

            if (!code.trim()) {
              continue;
            }

            const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

            const { svg } = await mermaid.render(id, code);

            element.innerHTML = svg.replace(
              /background-color\s*:\s*[^;"']+/gi,
              "background-color: transparent",
            );
            (element as HTMLElement).style.background = "transparent";
            element.setAttribute("data-processed", "true");
          } catch (error) {
            // biome-ignore lint/suspicious/noConsole: Error logging for user feedback
            console.error("[MermaidInitializer] Rendering error:", error);
            element.innerHTML = `<div style="color: red; padding: 1rem; border: 1px solid red; border-radius: 4px;">
              <strong>Mermaid rendering error:</strong><br/>
              <code>${error instanceof Error ? error.message : String(error)}</code>
            </div>`;
          }
        }
      } catch (error) {
        // biome-ignore lint/suspicious/noConsole: Error logging for user feedback
        console.error(
          "[MermaidInitializer] Failed to load mermaid. Install with: npm install mermaid",
          error,
        );
      }
    };

    initializeMermaid();

    const observer = new MutationObserver(() => {
      initializeMermaid();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [config, selector, darkMode]);

  return null;
};
