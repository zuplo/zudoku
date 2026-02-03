"use client";

import { getCdnUrl, type ZudokuApiReferenceConfiguration } from "@zudoku/core";
import { useEffect, useId, useRef, useState } from "react";

export type { ZudokuApiReferenceConfiguration } from "@zudoku/core";

type ScriptLoadState = "idle" | "loading" | "loaded" | "error";

// Track loaded scripts globally to prevent duplicate loading
const loadedScripts = new Set<string>();
const loadedStyles = new Set<string>();

/**
 * Loads a script from a URL, preventing duplicate loads
 * Returns a promise that resolves when the script is loaded
 */
const loadScript = (url: string): Promise<void> => {
  if (loadedScripts.has(url)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      loadedScripts.add(url);
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = url;
    script.onload = () => {
      loadedScripts.add(url);
      resolve();
    };
    script.onerror = () => {
      reject(new Error(`Failed to load script: ${url}`));
    };
    document.body.appendChild(script);
  });
};

/**
 * Loads a stylesheet from a URL, preventing duplicate loads
 */
const loadStylesheet = (url: string): void => {
  if (loadedStyles.has(url)) {
    return;
  }

  const existingStyle = document.querySelector(`link[href="${url}"]`);
  if (existingStyle) {
    loadedStyles.add(url);
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
  loadedStyles.add(url);
};

/**
 * Props for the ZudokuApiReference component
 */
export type ZudokuApiReferenceProps = {
  /** Configuration for the API reference */
  configuration: ZudokuApiReferenceConfiguration;
  /** Optional class name for the container */
  className?: string;
  /** Optional inline styles for the container */
  style?: React.CSSProperties;
};

/**
 * React component for embedding Zudoku API documentation
 *
 * @example
 * ```tsx
 * import { ZudokuApiReference } from "@zudoku/react";
 *
 * function App() {
 *   return (
 *     <ZudokuApiReference
 *       configuration={{
 *         spec: { url: "https://api.example.com/openapi.json" },
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export const ZudokuApiReference = ({
  configuration,
  className,
  style,
}: ZudokuApiReferenceProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadState, setLoadState] = useState<ScriptLoadState>("idle");
  const [error, setError] = useState<Error | null>(null);

  // Generate a unique ID for this instance to avoid conflicts with multiple instances
  const instanceId = useId();

  // Extract configuration values for dependency tracking
  const specUrl = configuration.spec?.url;
  const specContent = configuration.spec?.content;
  const logoSrc = configuration.logo?.src;
  const cdnBase = configuration.cdn;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cdnUrls = cdnBase
      ? { script: `${cdnBase}/main.js`, style: `${cdnBase}/style.css` }
      : getCdnUrl();

    // Set data attributes on the container
    if (specUrl) {
      container.setAttribute("data-api-url", specUrl);
    } else if (specContent) {
      // For inline content, we need to embed it differently
      // The standalone script reads from a JSON script tag
      const configId = `zudoku-config-${instanceId.replace(/:/g, "-")}`;
      let configScript = document.getElementById(
        configId,
      ) as HTMLScriptElement | null;

      if (!configScript) {
        configScript = document.createElement("script");
        configScript.id = configId;
        configScript.type = "application/json";
        container.appendChild(configScript);
      }

      const configObject: Record<string, unknown> = {
        _integration: "react",
        spec:
          typeof specContent === "string"
            ? JSON.parse(specContent)
            : specContent,
      };

      if (logoSrc) {
        configObject.logo = { src: logoSrc };
      }

      configScript.textContent = JSON.stringify(configObject);
      container.setAttribute("data-api-url", "inline");
    }

    // Set logo URL if provided and using URL-based spec
    if (logoSrc && specUrl) {
      const logoUrl = typeof logoSrc === "string" ? logoSrc : logoSrc.light;
      container.setAttribute("data-logo-url", logoUrl);
    }

    // Set integration marker
    container.setAttribute("data-integration", "react");

    // Load stylesheet (synchronous, non-blocking)
    loadStylesheet(cdnUrls.style);

    // Load script
    setLoadState("loading");
    loadScript(cdnUrls.script)
      .then(() => {
        setLoadState("loaded");
      })
      .catch((err) => {
        setLoadState("error");
        setError(err instanceof Error ? err : new Error(String(err)));
      });

    // Cleanup function
    return () => {
      // Clear container content - this will unmount any React app rendered by the script
      container.innerHTML = "";
      container.removeAttribute("data-api-url");
      container.removeAttribute("data-logo-url");
      container.removeAttribute("data-integration");
    };
  }, [specUrl, specContent, logoSrc, cdnBase, instanceId]);

  // Default styles for the container
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    ...style,
  };

  // Show error state if script failed to load
  if (loadState === "error" && error) {
    return (
      <div
        role="alert"
        style={{
          padding: "1rem",
          color: "#dc2626",
          backgroundColor: "#fef2f2",
          borderRadius: "0.5rem",
        }}
      >
        <strong>Error loading API documentation:</strong> {error.message}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
      // Accessibility attributes
      role="region"
      aria-label="API Documentation"
      aria-busy={loadState === "loading"}
    />
  );
};

// Default export for convenience
export default ZudokuApiReference;
