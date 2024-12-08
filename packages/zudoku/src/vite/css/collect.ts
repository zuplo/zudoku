import { type DevEnvironment, isCSSRequest } from "vite";

export async function collectStyle(
  server: DevEnvironment,
  entries: string[],
  cssModuleMap: Map<string, string>,
) {
  const urls = await collectStyleUrls(server, entries);

  return urls.map((url) => cssModuleMap.get(url) ?? "").join("\n");
}

async function collectStyleUrls(
  server: DevEnvironment,
  entries: string[],
): Promise<string[]> {
  const visited = new Set<string>();

  async function traverse(url: string) {
    const [, id] = await server.moduleGraph.resolveUrl(url);
    if (visited.has(id)) {
      return;
    }
    visited.add(id);
    const mod = server.moduleGraph.getModuleById(id);
    if (!mod) {
      return;
    }
    await Promise.all(
      [...mod.importedModules].map((childMod) => traverse(childMod.url)),
    );
  }

  // ensure vite's import analysis is ready _only_ for top entries to not go too aggresive
  await Promise.all(entries.map((e) => server.transformRequest(e)));

  // traverse
  await Promise.all(entries.map((url) => traverse(url)));

  // filter
  return [...visited].filter((url) => isCSSRequest(url));
}
