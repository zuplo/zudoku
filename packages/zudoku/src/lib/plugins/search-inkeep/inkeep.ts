import {
  InkeepAIChatSettings,
  InkeepModalSettings,
  InkeepSearchSettings,
} from "@inkeep/widgets";

const baseSettings = {
  theme: {
    components: {
      AIChatPageWrapper: {
        defaultProps: {
          size: "shrink-vertically",
          variant: "no-shadow",
        },
      },
      SearchBarTrigger: {
        defaultProps: {
          size: "expand",
          variant: "subtle", // Choose from 'emphasized' or 'subtle'
        },
      },
    },
  },
} as const;

const modalSettings: InkeepModalSettings = {};

const searchSettings: InkeepSearchSettings = {};

const aiChatSettings: InkeepAIChatSettings = {};

export { aiChatSettings, baseSettings, modalSettings, searchSettings };
