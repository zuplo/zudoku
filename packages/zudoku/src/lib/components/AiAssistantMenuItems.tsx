import type { ReactNode } from "react";
import { DropdownMenuItem } from "zudoku/ui/DropdownMenu.js";
import type {
  AiAssistantCustom,
  AiAssistantsConfig,
} from "../../config/validators/ZudokuConfig.js";
import { ChatGPTLogo } from "../plugins/markdown/assets/ChatGPTLogo.js";
import { ClaudeLogo } from "../plugins/markdown/assets/ClaudeLogo.js";
import { useTranslation } from "./context/useTranslation.js";

type AiAssistantContext = {
  pageUrl: string;
  type: "docs" | "openapi";
  prompt: string;
};

type Preset = {
  labelKey: string;
  icon?: ReactNode;
  buildUrl: (context: AiAssistantContext) => string;
};

const PRESETS: Record<string, Preset> = {
  claude: {
    labelKey: "ai.useInClaude",
    icon: <ClaudeLogo className="size-4" aria-hidden="true" />,
    buildUrl: ({ prompt }) =>
      `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
  chatgpt: {
    labelKey: "ai.useInChatGPT",
    icon: <ChatGPTLogo className="size-4" aria-hidden="true" />,
    buildUrl: ({ prompt }) =>
      `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
  },
};

type ResolvedAssistant = {
  label: ReactNode;
  icon?: ReactNode;
  getUrl: (context: AiAssistantContext) => string;
};

const resolveAssistant = (
  entry: string | AiAssistantCustom,
  t: (key: string, values?: Record<string, string | number>) => string,
): ResolvedAssistant | undefined => {
  if (typeof entry === "string") {
    const preset = PRESETS[entry];
    if (!preset) return undefined;
    return {
      label: t(preset.labelKey),
      icon: preset.icon,
      getUrl: preset.buildUrl,
    };
  }

  return {
    label: entry.label,
    icon: entry.icon,
    getUrl: (context) => {
      if (typeof entry.url === "function") {
        return entry.url(context);
      }
      return entry.url.replaceAll("{pageUrl}", context.pageUrl);
    },
  };
};

const DEFAULT_ASSISTANTS: AiAssistantsConfig = ["claude", "chatgpt"];

export const AiAssistantMenuItems = ({
  aiAssistants,
  getPageUrl,
  type,
}: {
  aiAssistants: AiAssistantsConfig;
  getPageUrl: () => string;
  type: "docs" | "openapi";
}) => {
  const { t } = useTranslation();
  const config = aiAssistants ?? DEFAULT_ASSISTANTS;

  if (config === false) {
    return null;
  }

  return config.map((entry, index) => {
    const assistant = resolveAssistant(entry, t);
    if (!assistant) return null;

    return (
      <DropdownMenuItem
        key={typeof entry === "string" ? entry : index}
        className="gap-2"
        onClick={() => {
          const pageUrl = getPageUrl();
          const prompt = t(
            type === "openapi" ? "ai.prompt.api" : "ai.prompt.docs",
            { pageUrl },
          );
          const url = assistant.getUrl({ pageUrl, type, prompt });
          window.open(url, "_blank", "noopener,noreferrer");
        }}
      >
        {assistant.icon}
        {assistant.label}
      </DropdownMenuItem>
    );
  });
};
