import { defineConfig } from "vitest/config";

// Stub virtual modules (e.g. plugin-graphql's schema manifest) so importing
// plugin entry points works in tests; only the real Vite build provides them.
const stubVirtualModules = () => ({
  name: "stub-virtual-modules",
  resolveId: (id: string) =>
    id.startsWith("virtual:") ? `\0${id}` : undefined,
  load: (id: string) =>
    id.startsWith("\0virtual:")
      ? "export const manifests = {}; export const loaders = {}; export default {};"
      : undefined,
});

export default defineConfig({
  plugins: [stubVirtualModules()],
  test: {
    environment: "node",
  },
});
