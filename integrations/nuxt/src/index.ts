import {
  addComponent,
  createResolver,
  defineNuxtModule,
  extendPages,
} from "@nuxt/kit";
import type { ZudokuApiReferenceConfiguration } from "@zudoku/core";

export type { ZudokuApiReferenceConfiguration } from "@zudoku/core";

export type ZudokuNuxtModuleOptions = {
  /** Route path for the documentation (default: '/api-docs') */
  pathRouting?: {
    basePath: string;
  };
  /** Whether to show in dev tools (default: true) */
  devtools?: boolean;
  /** Nuxt layout to use (false to disable) */
  layout?: string | false;
  /** Multiple configurations for different API references */
  configurations?: Array<
    Omit<ZudokuNuxtModuleOptions, "devtools" | "configurations">
  >;
} & ZudokuApiReferenceConfiguration;

const DEFAULT_CONFIGURATION: Partial<ZudokuApiReferenceConfiguration> = {
  _integration: "nuxt",
};

export default defineNuxtModule<ZudokuNuxtModuleOptions>({
  meta: {
    name: "@zudoku/nuxt",
    configKey: "zudoku",
  },
  defaults: {
    pageTitle: "API Documentation",
    pathRouting: {
      basePath: "/api-docs",
    },
    devtools: true,
    configurations: [],
    layout: false,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    // Add the component
    addComponent({
      name: "ZudokuApiReference",
      export: "default",
      filePath: resolver.resolve("./runtime/components/ZudokuApiReference.vue"),
    });

    // Add routes
    extendPages((pages) => {
      if (options.configurations?.length) {
        const { configurations, ...baseConfig } = options;
        configurations.forEach((config, index) => {
          const mergedConfig = { ...baseConfig, ...config };
          pages.push({
            name: `zudoku-${index}`,
            path: `${mergedConfig.pathRouting?.basePath ?? "/api-docs"}/:pathMatch(.*)*`,
            meta: {
              layout: options.layout,
              configuration: { ...DEFAULT_CONFIGURATION, ...mergedConfig },
            },
            file: resolver.resolve("./runtime/pages/ZudokuPage.vue"),
          });
        });
      } else {
        pages.push({
          name: "zudoku",
          path: `${options.pathRouting?.basePath ?? "/api-docs"}/:pathMatch(.*)*`,
          meta: {
            layout: options.layout,
            configuration: { ...DEFAULT_CONFIGURATION, ...options },
          },
          file: resolver.resolve("./runtime/pages/ZudokuPage.vue"),
        });
      }
    });

    // DevTools integration - devtools:customTabs is a valid hook when @nuxt/devtools is installed
    if (nuxt.options.dev && options.devtools) {
      type DevToolsTab = {
        name: string;
        title: string;
        icon: string;
        category: string;
        view: { type: string; src: string };
      };
      (
        nuxt.hook as (
          name: string,
          callback: (tabs: DevToolsTab[]) => void,
        ) => void
      )("devtools:customTabs", (tabs) => {
        tabs.push({
          name: "zudoku",
          title: "Zudoku",
          icon: "i-carbon-api",
          category: "server",
          view: {
            type: "iframe",
            src: options.pathRouting?.basePath ?? "/api-docs",
          },
        });
      });
    }
  },
});
