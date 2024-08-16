import fs from "node:fs/promises";
import path from "node:path";

// Fixes the worker import paths
// See: https://github.com/vitejs/vite/issues/15618

const dir = process.argv[2];

const libPath = path.resolve(process.cwd(), dir);
const files = await fs.readdir(libPath);

for (const file of files) {
  const filePath = path.join(libPath, file);
  if (file.endsWith(".js")) {
    let content = await fs.readFile(filePath, "utf-8");

    content = content.replaceAll(`"/assets/`, `"./assets/`);

    await fs.writeFile(filePath, content);
  }
}
