import { mkdir, readdir, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import type { Rolldown } from "vite";
import type { ConfigWithMeta } from "../../config/loader.js";
import {
  findUnmatchedProtectedPatterns,
  getProtectedSourceMatcher,
  PROTECTED_CHUNK_DIR,
} from "./registry.js";

// Build-time helpers that enforce the protected-chunk invariant: gated content never lands in the publicly-served output.

// Unmatched patterns usually mean a typo or a route served by an inline element / dynamic path (not chunk-isolated).
export const warnUnmatchedProtectedPatterns = (config: ConfigWithMeta) => {
  const { patterns } = getProtectedSourceMatcher(config);
  const unmatched = findUnmatchedProtectedPatterns(patterns);
  if (unmatched.length === 0) return;
  // biome-ignore lint/suspicious/noConsole: build-time advisory
  console.warn(
    `[zudoku] protectedRoutes patterns with no matching content: ${unmatched
      .map((p) => `"${p}"`)
      .join(", ")}.\n` +
      `  Either the pattern is a typo, or the route uses an inline element / dynamic path that isn't code-split. ` +
      `RouteGuard still blocks rendering, but the JS is not gated at the bundle level.`,
  );
};

type BundleOutput = readonly (Rolldown.OutputChunk | Rolldown.OutputAsset)[];

// Fails the build if a public entry chunk statically reaches a protected
// chunk. Dynamic imports are expected (route-split lazy) and are skipped.
export const findProtectedLeaks = (output: BundleOutput): string[] => {
  const isProtected = (fileName: string) =>
    fileName.startsWith(`${PROTECTED_CHUNK_DIR}/`);
  const chunks = output.filter((o) => o.type === "chunk");
  const byFileName = new Map(chunks.map((c) => [c.fileName, c]));

  const leaks: string[] = [];
  for (const entry of chunks.filter(
    (c) => c.isEntry && !isProtected(c.fileName),
  )) {
    const visited = new Set<string>();
    const stack = [{ fileName: entry.fileName, path: [entry.fileName] }];
    while (stack.length > 0) {
      // biome-ignore lint/style/noNonNullAssertion: Length check ensures this is not null
      const { fileName, path } = stack.pop()!;
      if (visited.has(fileName)) continue;
      visited.add(fileName);
      for (const imp of byFileName.get(fileName)?.imports ?? []) {
        const next = [...path, imp];
        if (isProtected(imp)) {
          leaks.push(next.join(" -> "));
          continue;
        }
        stack.push({ fileName: imp, path: next });
      }
    }
  }
  return leaks;
};

export const assertNoProtectedLeaks = (output: BundleOutput) => {
  // A protected chunk that's also an entry would be loaded by the runtime
  // independently of the static-import graph and bypass the gate.
  const protectedEntries = output
    .filter((o): o is Rolldown.OutputChunk => o.type === "chunk")
    .filter(
      (c) => c.isEntry && c.fileName.startsWith(`${PROTECTED_CHUNK_DIR}/`),
    )
    .map((c) => c.fileName);
  if (protectedEntries.length > 0) {
    throw new Error(
      `Protected chunk(s) marked as entries:\n  ${protectedEntries.join("\n  ")}\n` +
        `Entry chunks are loaded outside the gated import path. ` +
        `Move the entry to a public chunk that dynamically imports the protected one.`,
    );
  }

  const leaks = findProtectedLeaks(output);
  if (leaks.length === 0) return;
  throw new Error(
    `Protected chunk(s) statically reachable from public entry:\n  ${leaks.join("\n  ")}\n` +
      `This eagerly pulls gated content into the public bundle. ` +
      `Check that nothing in non-protected entry code statically imports the protected module.`,
  );
};

// Moves the protected chunk directory from the client output into the server bundle so static file serving can't reach it.
export const moveProtectedChunks = async (
  clientOutDir: string,
  serverOutDir: string,
) => {
  const srcDir = path.join(clientOutDir, PROTECTED_CHUNK_DIR);
  const files = await readdir(srcDir).catch((err) => {
    if (err.code === "ENOENT") return null;
    throw err;
  });
  if (!files) return;
  const destDir = path.join(serverOutDir, PROTECTED_CHUNK_DIR);
  await mkdir(destDir, { recursive: true });
  await Promise.all(
    files.map((file) =>
      rename(path.join(srcDir, file), path.join(destDir, file)),
    ),
  );
  // Verify nothing was left behind. A partial rename would otherwise
  // ship gated chunks publicly without erroring.
  const leftover = await readdir(srcDir).catch(() => []);
  if (leftover.length > 0) {
    throw new Error(
      `moveProtectedChunks left ${leftover.length} file(s) in ${srcDir}: ${leftover.join(", ")}.\n` +
        `These would be served publicly. Aborting build.`,
    );
  }
  await rm(srcDir, { recursive: true, force: true });
};

// Ensure protected chunks aren't publicly served under Cloudflare.
// If `run_worker_first` is missing in wrangler config, protected assets are exposed.
// Uses plain string matching; false positives may occur if `run_worker_first` is present but commented out.
export const assertCloudflareWranglerGatesProtected = async (
  dir: string,
  config: ConfigWithMeta,
) => {
  const { enabled } = getProtectedSourceMatcher(config);
  if (!enabled) return;

  const candidates = ["wrangler.toml", "wrangler.jsonc", "wrangler.json"];
  for (const name of candidates) {
    const file = await readFile(path.join(dir, name), "utf-8").catch(
      () => undefined,
    );
    if (file === undefined) continue;
    if (file.includes("run_worker_first") && file.includes("/_protected/")) {
      return;
    }
    throw new Error(
      `[zudoku] ${name} must configure \`run_worker_first\` to include \`/_protected/*\` ` +
        `so the auth gate runs before the assets binding serves protected chunks. ` +
        `Without it, /_protected/* is publicly readable. ` +
        `See https://developers.cloudflare.com/workers/static-assets/binding/#run_worker_first.`,
    );
  }

  throw new Error(
    `[zudoku] No wrangler config found in ${dir} (looked for ${candidates.join(", ")}). ` +
      `Cloudflare adapter requires wrangler config with \`run_worker_first\` covering \`/_protected/*\`.`,
  );
};
