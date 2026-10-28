import type { Plugin, UserConfig } from "zudoku/vite";

// Example plugin: writes a build-info.json next to the client build output.
const buildInfo = (): Plugin => ({
  name: "build-info",
  apply: "build",
  applyToEnvironment: (environment) => environment.name === "client",
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "build-info.json",
      source: JSON.stringify({ builtAt: new Date().toISOString() }, null, 2),
    });
  },
});

export default {
  plugins: [buildInfo()],
} satisfies UserConfig;
