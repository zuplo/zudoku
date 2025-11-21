import { useQuery } from "@tanstack/react-query";
import type { MermaidConfig } from "mermaid";
import type { ComponentProps } from "react";
import { use, useId } from "react";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert.js";
import { useTheme } from "../hooks/index.js";
import { Spinner } from "./Spinner.js";

export type MermaidProps = {
  chart: string;
  config?: MermaidConfig;
} & ComponentProps<"div">;

const mermaidPromise = import("mermaid").then((mod) => mod.default);

export const Mermaid = ({ chart, config, ...props }: MermaidProps) => {
  const mermaid = use(mermaidPromise);
  const id = useId();
  const theme = useTheme();

  const {
    data: svg,
    error,
    isPending,
  } = useQuery({
    queryKey: ["mermaid", chart, config, theme.resolvedTheme],
    queryFn: async () => {
      mermaid.initialize({
        theme: theme.resolvedTheme === "dark" ? "dark" : "base",
        ...config,
      });

      const { svg } = await mermaid.render(id, chart);
      return svg;
    },
    enabled: typeof window !== "undefined",
    retry: false,
  });

  if (error)
    return (
      <Alert className="flex flex-col gap-2" variant="destructive">
        <AlertTitle>Mermaid Error</AlertTitle>
        <AlertDescription className="overflow-auto wrap-break-word whitespace-pre-wrap font-mono text-xs">
          {error.message}
        </AlertDescription>
      </Alert>
    );

  if (isPending) return <Spinner />;

  // biome-ignore lint/security/noDangerouslySetInnerHtml: Mermaid generates valid SVG
  return <div {...props} dangerouslySetInnerHTML={{ __html: svg }} />;
};
