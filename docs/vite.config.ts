import path from "node:path";
import { normalizePath } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

// C:/project/foo

/** @type {import('vite').UserConfig} */
export default {
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: normalizePath(path.resolve(__dirname, "_headers")),
          dest: ".",
        },
      ],
    }),
  ],
};
