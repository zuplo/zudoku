import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { Bootstrap } from "zudoku/__internal";
import type { ZudokuConfig } from "../config/validators/validate.js";
import { openApiPlugin } from "../lib/plugins/openapi/index.js";
import "../lib/util/logInit.js";
import "./main.css";
import { getRoutesByConfig } from "./main.js";

const root = document.querySelector("div[data-api-url]");
if (!root) {
  throw new Error("No div found with attribute data-api-url");
}

const apiUrl = root.getAttribute("data-api-url");

if (!apiUrl) {
  throw new Error("No api url found");
}

const title = document.getElementsByTagName("title")[0]?.innerText;
const logoUrl = root.getAttribute("data-logo-url");

// IMPORTANT: This component must not contain tailwind classes
// This directory is not processed by the tailwind plugin

const config = {
  site: {
    logo: logoUrl
      ? {
          src: {
            light: logoUrl,
            dark: logoUrl,
          },
        }
      : undefined,
    title,
  },
  navigation: [
    {
      type: "link",
      label: "API Reference",
      to: "/",
    },
  ],
  plugins: [
    // Using the plugin directly because there's no config file to load in the virtual plugins
    openApiPlugin({
      type: "url",
      input: apiUrl,
      path: "/",
    }),
  ],
} satisfies ZudokuConfig;

const routes = getRoutesByConfig(config);
const router = createBrowserRouter(routes, {
  basename: window.location.pathname,
});
createRoot(root).render(<Bootstrap router={router} />);
