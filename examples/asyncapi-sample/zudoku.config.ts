import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  site: {
    name: "AsyncAPI Demo",
  },
  navigation: [{ label: "WebSocket API", type: "link", to: "/async" }],
  redirects: [{ from: "/", to: "/async" }],
  asyncApis: {
    type: "file",
    input: "./gateway.asyncapi.yaml",
    path: "/async",
    options: {
      expandApiInformation: true,
    },
  },
};

export default config;
