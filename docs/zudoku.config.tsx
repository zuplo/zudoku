import { lazy } from "react";
import type { ZudokuConfig } from "zudoku";
import { Button } from "zudoku/ui/Button.js";
import { components, docs } from "./sidebar";
import DiscordIcon from "./src/DiscordIcon";
import { DocusaurusDocsLicense } from "./src/DocusaurusDocsLicense";
import GithubIcon from "./src/GithubIcon";
import PreviewBanner from "./src/PreviewBanner";

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
      render: lazy(() => import("./src/ThemeEditor.js")),
      prose: false,
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
