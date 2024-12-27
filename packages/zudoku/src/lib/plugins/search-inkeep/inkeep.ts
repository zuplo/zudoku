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

const modalSettings = {};

const searchSettings = {};

const aiChatSettings = {};

export { aiChatSettings, baseSettings, modalSettings, searchSettings };
