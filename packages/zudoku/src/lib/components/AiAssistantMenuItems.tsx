import type { ReactNode } from "react";
import { DropdownMenuItem } from "zudoku/ui/DropdownMenu.js";
import type {
  AiAssistantCustom,
  AiAssistantsConfig,
} from "../../config/validators/ZudokuConfig.js";
import { ChatGPTLogo } from "../plugins/markdown/assets/ChatGPTLogo.js";
import { ClaudeLogo } from "../plugins/markdown/assets/ClaudeLogo.js";

type AiAssistantContext = {
  pageUrl: string;
  type: "docs" | "openapi";
};

type ResolvedAssistant = {
  label: string;
  icon?: ReactNode;
  getUrl: (context: AiAssistantContext) => string;
};

const PRESETS: Record<string, ResolvedAssistant> = {
  claude: {
    label: "Use in Claude",
    icon: <ClaudeLogo className="size-4" aria-hidden="true" />,
    getUrl: ({ pageUrl, type }) => {
      const contextText =
        type === "openapi" ? "this API" : "this documentation page";
      const prompt = encodeURIComponent(
        `Help me understand ${contextText}: ${pageUrl}`,
      );
      return `https://claude.ai/new?q=${prompt}`;
    },
  },
  chatgpt: {
    label: "Use in ChatGPT",
    icon: <ChatGPTLogo className="size-4" aria-hidden="true" />,
    getUrl: ({ pageUrl, type }) => {
      const contextText =
        type === "openapi" ? "this API" : "this documentation page";
      const prompt = encodeURIComponent(
        `Help me understand ${contextText}: ${pageUrl}`,
      );
      return `https://chatgpt.com/?q=${prompt}`;
    },
  },
};

const resolveAssistant = (
  entry: string | AiAssistantCustom,
): ResolvedAssistant | undefined => {
  if (typeof entry === "string") {
    return PRESETS[entry];
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
  const config = aiAssistants ?? DEFAULT_ASSISTANTS;

  if (config === false) {
    return null;
  }

  return config.map((entry, index) => {
    const assistant = resolveAssistant(entry);
    if (!assistant) return null;

    return (
      <DropdownMenuItem
        key={typeof entry === "string" ? entry : index}
        className="gap-2"
        onClick={() => {
          const url = assistant.getUrl({ pageUrl: getPageUrl(), type });
          window.open(url, "_blank", "noopener,noreferrer");
        }}
      >
        {assistant.icon}
        {assistant.label}
      </DropdownMenuItem>
    );
  });
};
