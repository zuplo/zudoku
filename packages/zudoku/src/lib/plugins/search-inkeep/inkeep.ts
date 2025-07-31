import type {
  InkeepAIChatSettings,
  InkeepBaseSettings,
  InkeepModalSettings,
  InkeepSearchSettings,
} from "@inkeep/cxkit-types";

const baseSettings: InkeepBaseSettings = {
  primaryBrandColor: "#26D6FF",
};

const modalSettings: InkeepModalSettings = {
  shortcutKey: "k",
};

const searchSettings: InkeepSearchSettings = {
  placeholder: "Search...",
};

const aiChatSettings: InkeepAIChatSettings = {
  aiAssistantName: "Assistant",
};

export { aiChatSettings, baseSettings, modalSettings, searchSettings };
