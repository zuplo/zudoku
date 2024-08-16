import { visualizer } from "rollup-plugin-visualizer";
import dynImport from "vite-plugin-dynamic-import";

/** @type {import('vite').UserConfig} */
export default {
  build: {
    rollupOptions: {
      plugins: [
        dynImport({
          filter(id) {
            // `node_modules` is exclude by default, so we need to include it explicitly
            // https://github.com/vite-plugin/vite-plugin-dynamic-import/blob/v1.3.0/src/index.ts#L133-L135
            if (id.includes("rollup-plugin-visualizer")) {
              return true;
            }
          },
        }),
        visualizer(),
      ],
    },
  },
};
