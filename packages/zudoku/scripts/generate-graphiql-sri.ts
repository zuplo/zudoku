// Regenerates graphiql-sri.json with SHA-384 hashes for each pinned CDN URL.
// Usage: pnpm -F zudoku generate:sri
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  ESM_CDN,
  getCdnUrls,
} from "../src/lib/graphiql/loadGraphiQLFromCdn.js";

const urls = getCdnUrls(ESM_CDN);

const entries = await Promise.all(
  Object.entries(urls).map(async ([key, url]) => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `Failed to fetch ${url}: ${res.status} ${res.statusText}`,
      );
    }
    const hash = createHash("sha384")
      .update(Buffer.from(await res.arrayBuffer()))
      .digest("base64");

    return [key, `sha384-${hash}`] as const;
  }),
);

const out = fileURLToPath(
  new URL("../src/lib/graphiql/graphiql-sri.json", import.meta.url),
);
await writeFile(
  out,
  `${JSON.stringify(Object.fromEntries(entries), null, 2)}\n`,
);

// biome-ignore lint/suspicious/noConsole: build script output
console.log(`Wrote ${entries.length} hashes to ${out}`);
