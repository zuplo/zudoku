import reactDocgenTypescript from "@joshwooding/vite-plugin-react-docgen-typescript";

export default {
  plugins: [
    reactDocgenTypescript({
      savePropValueAsString: true,
      include: ["../packages/zudoku/src/lib/ui/*.tsx"],
      tsconfigPath: "./tsconfig.json",
      setDisplayName: true,
      EXPERIMENTAL_useWatchProgram: false,
    }),
  ],
};
