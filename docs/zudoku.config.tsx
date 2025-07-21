import { lazy } from "react";
import type { ZudokuConfig } from "zudoku";
import { Button } from "zudoku/ui/Button.js";
import { components, docs } from "./sidebar";
import DiscordIcon from "./src/DiscordIcon";
import { DocusaurusDocsLicense } from "./src/DocusaurusDocsLicense";
import GithubIcon from "./src/GithubIcon";
const ThemePlayground = lazy(() => import("./src/ThemeEditor.js"));
const LandingPage = lazy(() => import("./src/LandingPage"));

const config: ZudokuConfig = {
  canonicalUrlOrigin: "https://zudoku.dev",
  site: {
    showPoweredBy: true,
    logo: {
      src: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
      alt: "Zudoku",
      width: 130,
    },
  },
  theme: {
    customCss: `

@theme {
  --animate-wiggle: wiggle 1s ease-in-out infinite;
  @keyframes wiggle {
    0%,
    100% {
      transform: rotate(-3deg);
    }
    50% {
      transform: rotate(3deg);
    }
  }
}`,
    light: {
      // primary: "#3b82f6",
      primary: "#000000",
      primaryForeground: "#FFFFFF",
    },
    dark: {
      // primary: "#3b82f6",
      primary: "#FFFFFF",
      primaryForeground: "#000000",
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
    defaultOptions: {
      showLastModified: true,
      suggestEdit: {
        text: "Edit this page",
        url: "https://github.com/zuplo/zudoku/edit/main/docs/{filePath}",
      },
    },
  },
  sitemap: {
    siteUrl: "https://zudoku.dev",
  },
  search: {
    type: "pagefind",
  },
  redirects: [
    { from: "/docs", to: "/docs/quickstart" },
    { from: "/getting-started", to: "/docs/quickstart" },
    { from: "/app-quickstart", to: "/docs/quickstart" },
    { from: "/components", to: "/components/callout" },
    { from: "/configuration/page", to: "/configuration/site" },
  ],
  navigation: [
    {
      type: "custom-page",
      path: "/",
      display: "hide",
      element: <LandingPage />,
      layout: "none",
    },
    {
      type: "category",
      label: "Documentation",
      items: docs,
    },
    {
      type: "category",
      label: "Components",
      items: components,
    },
    {
      type: "custom-page",
      path: "/theme-playground",
      label: "Themes",
      element: <ThemePlayground />,
    },
  ],
  plugins: [
    {
      getHead: () => {
        return (
          <script>
            {`!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('phc_l8rjm0vHBMwNdGeBRDrK8UIYjyVxZyBAtnYo2hS18OY', { api_host: 'https://us.i.posthog.com', person_profiles: 'identified_only', })`}
          </script>
        );
      },
    },
  ],
  apis: [
    {
      type: "file",
      input: "./schema/placeholder.json",
      path: "api-placeholder",
    },
  ],
  slots: {
    "head-navigation-end": () => (
      <div className="flex items-center border-r pe-2">
        <Button variant="ghost" size="icon" asChild>
          <a
            href="https://github.com/zuplo/zudoku"
            aria-label="Visit Zudoku on GitHub"
            rel="noopener noreferrer"
          >
            <GithubIcon className="w-4 h-4 dark:invert" aria-hidden="true" />
          </a>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <a
            href="https://discord.gg/stPRhjbA55"
            aria-label="Join Zudoku Discord community"
            rel="noopener noreferrer"
          >
            <DiscordIcon className="w-5 h-5 dark:invert" aria-hidden="true" />
          </a>
        </Button>
      </div>
    ),
  },
} satisfies ZudokuConfig;

export default config;
