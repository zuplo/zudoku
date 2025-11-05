import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  site: {
    logo: {
      src: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
      alt: "Zudoku",
      width: 130,
    },
  },
  theme: {
    customCss: `.dark svg[id^="mermaid-"] { filter: invert(1); }`,
  },
  navigation: [
    {
      type: "category",
      label: "Documentation",
      items: [
        {
          type: "category",
          label: "Mermaid",
          items: ["setup", "mermaid"],
        },
      ],
    },
  ],
  docs: {
    files: "/pages/**/*.mdx",
  },
};

export default config;
