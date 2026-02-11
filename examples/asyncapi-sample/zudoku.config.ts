import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  site: {
    title: "AsyncAPI Demo",
  },
  navigation: [{ label: "Event API", type: "link", to: "/async" }],
  redirects: [{ from: "/", to: "/async" }],
  asyncApis: {
    type: "file",
    input: "./multi-protocol.asyncapi.yaml",
    path: "/async",
    options: {
      expandApiInformation: true,
    },
  },
};

export default config;
