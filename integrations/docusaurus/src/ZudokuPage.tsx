import type { ZudokuApiReferenceConfiguration } from "@zudoku/core";
import { useEffect, useRef } from "react";

type ZudokuPageProps = {
  configuration?: ZudokuApiReferenceConfiguration;
};

export default function ZudokuPage({ configuration }: ZudokuPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !configuration?.spec?.url) return;

    containerRef.current.setAttribute("data-api-url", configuration.spec.url);

    if (configuration.logo) {
      const logoUrl =
        typeof configuration.logo.src === "string"
          ? configuration.logo.src
          : configuration.logo.src.light;
      containerRef.current.setAttribute("data-logo-url", logoUrl);
    }
  }, [configuration]);

  return (
    <div ref={containerRef} style={{ minHeight: "100vh", width: "100%" }} />
  );
}
