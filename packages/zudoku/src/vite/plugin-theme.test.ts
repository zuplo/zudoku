import type { Plugin } from "vite";
import { describe, expect, it, vi } from "vitest";
import type { ConfigWithMeta } from "../config/loader.js";
import { resolvedVirtualModuleId, viteThemePlugin } from "./plugin-theme.js";

vi.mock("../config/loader.js", () => ({ getCurrentConfig: vi.fn() }));
vi.mock("./shadcn-registry.js", () => ({ fetchShadcnRegistryItem: vi.fn() }));

const callPluginLoad = async (plugin: Plugin, id: string) => {
  // biome-ignore lint/style/noNonNullAssertion: is guaranteed to be defined
  const hook = plugin.load!;
  const loadFn = typeof hook === "function" ? hook : hook.handler;
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
  return loadFn.call({} as any, id);
};

const callPluginTransform = async (plugin: Plugin, src: string, id: string) => {
  // biome-ignore lint/style/noNonNullAssertion: is guaranteed to be defined
  const hook = plugin.transform!;
  const transformFn = typeof hook === "function" ? hook : hook.handler;
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
  return transformFn.call({} as any, src, id);
};

describe("plugin-theme", () => {
  it("should enforce: pre to run before tailwind", () => {
    const plugin = viteThemePlugin();
    expect(plugin.enforce).toBe("pre");
  });

  describe("fonts", () => {
    it("should handle predefined Google fonts", async () => {
      const { getCurrentConfig } = await import("../config/loader.js");

      vi.mocked(getCurrentConfig).mockReturnValue({
        theme: {
          fonts: {
            sans: "Inter",
            serif: "Merriweather",
            mono: "JetBrains Mono",
          },
        },
      } as ConfigWithMeta);

      const plugin = viteThemePlugin();
      const result = await callPluginLoad(plugin, resolvedVirtualModuleId);

      expect(result).toContain(
        "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap')",
      );
      expect(result).toContain(
        "@import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;500;600;700&display=swap')",
      );
      expect(result).toContain(
        "@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap')",
      );
      expect(result).toContain("--font-sans: Inter");
      expect(result).toContain("--font-serif: Merriweather");
      expect(result).toContain("--font-mono: JetBrains Mono");
    });

    it("should handle custom font objects", async () => {
      const { getCurrentConfig } = await import("../config/loader.js");

      vi.mocked(getCurrentConfig).mockReturnValue({
        theme: {
          fonts: {
            sans: {
              url: "http://example.com/custom.woff2",
              fontFamily: "Custom Font, sans-serif",
            },
          },
        },
      } as ConfigWithMeta);

      const plugin = viteThemePlugin();
      const result = await callPluginLoad(plugin, resolvedVirtualModuleId);

      expect(result).toContain(
        "@import url('http://example.com/custom.woff2')",
      );
      expect(result).toContain("--font-sans: Custom Font, sans-serif");
    });

    it("should use default fonts when no fonts are configured", async () => {
      const { getCurrentConfig } = await import("../config/loader.js");

      vi.mocked(getCurrentConfig).mockReturnValue({
        theme: {},
      } as ConfigWithMeta);

      const plugin = viteThemePlugin();
      const result = await callPluginLoad(plugin, resolvedVirtualModuleId);

      expect(result).toContain(
        "@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap')",
      );
      expect(result).toContain(
        "@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&display=swap')",
      );
      expect(result).toContain("--font-sans: Geist, sans-serif");
      expect(result).toContain('--font-mono: "Geist Mono", monospace');
    });

    it("should handle mixed font configurations with defaults for missing fonts", async () => {
      const { getCurrentConfig } = await import("../config/loader.js");

      vi.mocked(getCurrentConfig).mockReturnValue({
        theme: {
          fonts: {
            sans: "Inter",
            serif: {
              url: "https://example.com/custom.woff2",
              fontFamily: "CustomSerif",
            },
          },
        },
      } as ConfigWithMeta);

      const plugin = viteThemePlugin();
      const result = await callPluginLoad(plugin, resolvedVirtualModuleId);

      expect(result).toContain(
        "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap')",
      );
      expect(result).toContain(
        "@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&display=swap')",
      );
      expect(result).toContain("--font-sans: Inter");
      expect(result).toContain("--font-serif: CustomSerif");
      expect(result).toContain('--font-mono: "Geist Mono", monospace');
    });

    it("should provide mono default when only sans is configured", async () => {
      const { getCurrentConfig } = await import("../config/loader.js");

      vi.mocked(getCurrentConfig).mockReturnValue({
        theme: {
          fonts: {
            sans: {
              fontFamily: "Solis, sans-serif",
              url: "/fonts/fonts.css",
            },
          },
        },
      } as ConfigWithMeta);

      const plugin = viteThemePlugin();
      const result = await callPluginLoad(plugin, resolvedVirtualModuleId);

      expect(result).toContain("@import url('/fonts/fonts.css')");
      expect(result).toContain(
        "@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&display=swap')",
      );
      expect(result).toContain("--font-sans: Solis, sans-serif");
      expect(result).toContain('--font-mono: "Geist Mono", monospace');
    });
  });

  describe("custom CSS", () => {
    it("should handle custom CSS as string", async () => {
      const { getCurrentConfig } = await import("../config/loader.js");

      vi.mocked(getCurrentConfig).mockReturnValue({
        __meta: {
          rootDir: "/test",
          dependencies: [],
        },
        theme: {
          customCss: ".custom { color: red; }",
        },
      } as unknown as ConfigWithMeta);

      const plugin = viteThemePlugin();
      const result = await callPluginTransform(
        plugin,
        "/* @vite-plugin-inject main */",
        "/test/src/app/main.css",
      );

      expect(result).toContain(".custom { color: red; }");
    });

    it("should handle custom CSS as object", async () => {
      const { getCurrentConfig } = await import("../config/loader.js");

      vi.mocked(getCurrentConfig).mockReturnValue({
        __meta: {
          rootDir: "/test",
          dependencies: [],
        },
        theme: {
          customCss: {
            ".custom": {
              color: "red",
              "font-size": "16px",
            },
          },
        },
      } as unknown as ConfigWithMeta);

      const plugin = viteThemePlugin();
      const result = await callPluginTransform(
        plugin,
        "/* @vite-plugin-inject main */",
        "/test/src/app/main.css",
      );

      expect(result).toContain(".custom {");
      expect(result).toContain("color: red;");
      expect(result).toContain("font-size: 16px;");
    });
  });

  describe("light/dark themes", () => {
    it("should generate light theme CSS variables", async () => {
      const { getCurrentConfig } = await import("../config/loader.js");

      vi.mocked(getCurrentConfig).mockReturnValue({
        theme: {
          light: {
            background: "0 0% 100%",
            foreground: "222.2 84% 4.9%",
            primary: "221.2 83.2% 53.3%",
          },
        },
      } as ConfigWithMeta);

      const plugin = viteThemePlugin();
      const result = await callPluginLoad(plugin, resolvedVirtualModuleId);

      expect(result).toContain(":root {");
      expect(result).toContain("--background: hsl(0 0% 100%);");
      expect(result).toContain("--foreground: hsl(222.2 84% 4.9%);");
      expect(result).toContain("--primary: hsl(221.2 83.2% 53.3%);");
    });

    it("should generate dark theme CSS variables", async () => {
      const { getCurrentConfig } = await import("../config/loader.js");

      vi.mocked(getCurrentConfig).mockReturnValue({
        theme: {
          dark: {
            background: "222.2 84% 4.9%",
            foreground: "210 40% 98%",
            primary: "217.2 91.2% 59.8%",
          },
        },
      } as ConfigWithMeta);

      const plugin = viteThemePlugin();
      const result = await callPluginLoad(plugin, resolvedVirtualModuleId);

      expect(result).toContain(".dark {");
      expect(result).toContain("--background: hsl(222.2 84% 4.9%);");
      expect(result).toContain("--foreground: hsl(210 40% 98%);");
      expect(result).toContain("--primary: hsl(217.2 91.2% 59.8%);");
    });

    it("should handle hex colors without conversion", async () => {
      const { getCurrentConfig } = await import("../config/loader.js");

      vi.mocked(getCurrentConfig).mockReturnValue({
        theme: {
          light: {
            background: "#ffffff",
            primary: "rgb(59, 130, 246)",
          },
        },
      } as ConfigWithMeta);

      const plugin = viteThemePlugin();
      const result = await callPluginLoad(plugin, resolvedVirtualModuleId);

      expect(result).toContain("--background: #ffffff;");
      expect(result).toContain("--primary: rgb(59, 130, 246);");
    });
  });

  describe("transform function", () => {
    it("should transform main.css with theme variables", async () => {
      const { getCurrentConfig } = await import("../config/loader.js");

      vi.mocked(getCurrentConfig).mockReturnValue({
        __meta: {
          rootDir: "/test",
          dependencies: [],
        },
      } as unknown as ConfigWithMeta);

      const plugin = viteThemePlugin();
      const result = await callPluginTransform(
        plugin,
        "/* @vite-plugin-inject main */",
        "/test/src/app/main.css",
      );

      expect(result).toContain("@theme inline {");
      expect(result).toContain("--color-background: var(--background);");
      expect(result).toContain("--color-primary: var(--primary);");
      expect(result).toContain("--font-sans: var(--font-sans);");
      expect(result).toContain("--radius-lg: var(--radius);");
    });

    it("should not transform non-main.css files", async () => {
      const plugin = viteThemePlugin();
      const result = await callPluginTransform(
        plugin,
        "/* @vite-plugin-inject main */",
        "/test/src/other.css",
      );

      expect(result).toBeUndefined();
    });
  });

  describe("registry integration", () => {
    it("should handle registry errors gracefully", async () => {
      const { getCurrentConfig } = await import("../config/loader.js");
      const { fetchShadcnRegistryItem } = await import("./shadcn-registry.js");

      vi.mocked(getCurrentConfig).mockReturnValue({
        theme: {
          registryUrl: "https://example.com/theme.json",
        },
      } as ConfigWithMeta);

      vi.mocked(fetchShadcnRegistryItem).mockRejectedValue(
        new Error("Network error"),
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const plugin = viteThemePlugin();
      const result = await callPluginLoad(plugin, resolvedVirtualModuleId);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to load shadcn registry theme:",
        expect.any(Error),
      );
      expect(result).toContain("Geist"); // Should fall back to defaults

      consoleSpy.mockRestore();
    });

    it("should handle successful registry calls", async () => {
      const { getCurrentConfig } = await import("../config/loader.js");
      const { fetchShadcnRegistryItem } = await import("./shadcn-registry.js");

      vi.mocked(getCurrentConfig).mockReturnValue({
        theme: {
          registryUrl: "https://example.com/theme.json",
          light: { accent: "#c0ffee" },
          dark: { accent: "#c1ffee" },
          customCss: {
            ".base": { "--root": "1" },
          },
        },
      } as unknown as ConfigWithMeta);

      vi.mocked(fetchShadcnRegistryItem).mockResolvedValue({
        $schema: "https://ui.shadcn.com/schema/registry-item.json",
        name: "test-theme",
        type: "registry:theme",
        cssVars: {
          theme: {
            "font-sans": "Inter",
          },
          light: {
            background: "0 0% 100%",
            primary: "220 13% 91%",
            accent: "#000000", // Value will be overridden by config
          },
          dark: {
            background: "222.2 84% 4.9%",
            primary: "217.2 91.2% 59.8%",
            accent: "#000001", // Value will be overridden by config
          },
        },
        css: { ".custom": { color: "red" } },
      });

      const plugin = viteThemePlugin();
      const result = await callPluginLoad(plugin, resolvedVirtualModuleId);

      expect(result).toContain("--background: 0 0% 100%;");
      expect(result).toContain("--primary: 220 13% 91%;");
      expect(result).toContain(".dark {");
      expect(result).toContain("--background: 222.2 84% 4.9%;");
      expect(result).toContain("--primary: 217.2 91.2% 59.8%;");
      expect(result).toContain(".custom {");
      expect(result).toContain("color: red;");
      expect(result).toContain(
        "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');",
      );

      // Verify overrides work - should contain config values, not registry values
      expect(result).toContain("--accent: #c0ffee;"); // Light override
      expect(result).toContain("--accent: #c1ffee;"); // Dark override
      expect(result).not.toContain("--accent: 210 40% 98%;"); // Registry light value
      expect(result).not.toContain("--accent: 215 28% 17%;"); // Registry dark value

      // Test custom CSS in transform hook
      vi.mocked(getCurrentConfig).mockReturnValue({
        __meta: {
          rootDir: "/test",
          dependencies: [],
        },
        theme: {
          customCss: {
            ".base": { "--root": "1" },
          },
        },
      } as unknown as ConfigWithMeta);

      const transformResult = await callPluginTransform(
        plugin,
        "/* @vite-plugin-inject main */",
        "/test/src/app/main.css",
      );

      expect(transformResult).toContain(".base {");
      expect(transformResult).toContain("--root: 1;");
    });
  });
});
