import { visualizer } from "rollup-plugin-visualizer";

/** @type {import('vite').UserConfig} */
export default {
  build: {
    rollupOptions: {
      plugins: [visualizer()],
    },
  },
};
