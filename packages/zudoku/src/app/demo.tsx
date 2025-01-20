import logger from "loglevel";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { Bootstrap } from "zudoku/components";
import type { ZudokuConfig } from "../config/validators/validate.js";
import DemoAnnouncement from "../lib/demo/DemoAnnouncement.js";
import { openApiPlugin } from "../lib/plugins/openapi/index.js";
import "../lib/util/logInit.js";
import "./main.css";
import { getRoutesByConfig } from "./main.js";

const apiUrl = new URL(window.location.href).searchParams.get("api-url");

if (!apiUrl) {
  throw new Error(
    "No API URL in query parameters. Please provide an API URL using the `api-url` query parameter.",
  );
}

logger.info(`API URL: ${apiUrl}`);

const root =
  document.getElementById("zudoku") ?? document.getElementById("root");

if (!root) {
  throw new Error("No div found with id root");
}

// IMPORTANT: This component must not contain tailwind classes
// This directory is not processed by the tailwind plugin

const config = {
  page: {
    pageTitle: "",
    banner: {
      message: <DemoAnnouncement />,
    },
  },
  topNavigation: [
    {
      id: "/",
      label: "API Reference",
    },
  ],
  plugins: [
    // Using the plugin directly because there's no config file to load in the virtual plugins
    openApiPlugin({
      type: "url",
      input: apiUrl,
      navigationId: "/",
    }),
  ],
} satisfies ZudokuConfig;

const routes = getRoutesByConfig(config);
const router = createBrowserRouter(routes, {
  basename: window.location.pathname,
});
createRoot(root).render(<Bootstrap router={router} />);
