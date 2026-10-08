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
  // Zudoku renders the search button and owns the ⌘K / Ctrl+K shortcut (see
  // `Search.tsx`), so Inkeep's built-in one is disabled by default. Inkeep
  // binds its shortcut on `document` and calls `stopPropagation()`, which
  // swallows the event before it reaches Zudoku's listener on `window`.
  shortcutKey: null,
};

const searchSettings: InkeepSearchSettings = {
  placeholder: "Search...",
};

const aiChatSettings: InkeepAIChatSettings = {
  aiAssistantName: "Assistant",
};

export { aiChatSettings, baseSettings, modalSettings, searchSettings };
