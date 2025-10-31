/**
 * Type declarations for optional Mermaid dependencies
 *
 * These modules are opt-in and installed by users when needed.
 * This file provides type safety without requiring the modules at compile time.
 */

declare module "mermaid" {
  export interface MermaidConfig {
    startOnLoad?: boolean;
    theme?: "default" | "dark" | "forest" | "neutral" | string;
    flowchart?: {
      curve?: string;
      padding?: number;
      [key: string]: unknown;
    };
    sequence?: {
      actorMargin?: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }

  export interface RenderResult {
    svg: string;
    bindFunctions?: (element: Element) => void;
  }

  export interface Mermaid {
    initialize(config: MermaidConfig): void;
    render(
      id: string,
      text: string,
      cb?: (svgCode: string) => void,
    ): Promise<RenderResult>;
    [key: string]: unknown;
  }

  const mermaid: Mermaid;
  export default mermaid;
}

declare module "rehype-mermaid" {
  export interface RehypeMermaidOptions {
    strategy?: "pre-mermaid" | "inline-svg" | "img-svg" | "img-png";
    mermaidConfig?: Record<string, unknown>;
    css?: string;
    [key: string]: unknown;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Plugin type is complex
  const rehypeMermaid: any;
  export default rehypeMermaid;
}
