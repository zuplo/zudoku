import type { ZudokuConfig } from "zudoku";
import { Button } from "zudoku/ui/Button.js";
import { components, docs } from "./sidebar";
import DiscordIcon from "./src/DiscordIcon";
import { DocusaurusDocsLicense } from "./src/DocusaurusDocsLicense";
import GithubIcon from "./src/GithubIcon";
import PreviewBanner from "./src/PreviewBanner";
import { ThemeEditor } from "./src/ThemeEditor";

const config: ZudokuConfig = {
  basePath: "/docs",
  page: {
    banner: {
      message: <PreviewBanner />,
      dismissible: true,
    },
  },
  theme: {
    light: {
      primary: "#3b82f6",
      primaryForeground: "#FFFFFF",
    },
    dark: {
      primary: "#3b82f6",
      primaryForeground: "#FFFFFF",
    },
  },
  mdx: {
    components: { DocusaurusDocsLicense },
  },
  metadata: {
    title: "%s | Zudoku",
    favicon: "https://cdn.zudoku.dev/logos/favicon.svg",
  },
  docs: {
    files: "/pages/**/*.{md,mdx}",
  },
  sitemap: {
    siteUrl: "https://zudoku.dev",
  },
  search: {
    type: "inkeep",
    apiKey: "2c941c4469ab259f1ba676d2b6ee595559230399ad90a074",
    integrationId: "cm4sn77nj00h4jvirrkbe01d1",
    organizationId: "org_dDOlt2uJlMWM8oIS",
    primaryBrandColor: "#ff00bd",
    organizationDisplayName: "Zudoku",
  },
  redirects: [
    { from: "/", to: "/introduction" },
    { from: "/getting-started", to: "/app-quickstart" },
    { from: "/components", to: "/components/callout" },
  ],
  topNavigation: [
    { id: "docs", label: "Documentation" },
    { id: "components", label: "Components" },
    { id: "theme-playground", label: "Themes" },
  ],
  sidebar: {
    docs,
    components,
  },
  customPages: [
    {
      path: "theme-playground",
      render: ThemeEditor,
    },
  ],
  apis: [
    {
      type: "file",
      input: "./schema/placeholder.json",
      navigationId: "api-placeholder",
    },
  ],
  UNSAFE_slotlets: {
    "head-navigation-end": () => (
      <div className="flex items-center border-r pr-2">
        <Button variant="ghost" size="icon" asChild>
          <a href="https://github.com/zuplo/zudoku">
            <GithubIcon className="w-4 h-4 dark:invert" />
          </a>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <a href="https://discord.gg/stPRhjbA55">
            <DiscordIcon className="w-5 h-5 dark:invert" />
          </a>
        </Button>
      </div>
    ),
  },
};

export default config;
