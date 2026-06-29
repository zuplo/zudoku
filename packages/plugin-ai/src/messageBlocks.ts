import {
  getToolOrDynamicToolName,
  isToolOrDynamicToolUIPart,
  type UIMessage,
} from "ai";

// The args a `present-source` / `present-link` tool call carries.
type ToolLinkInput = {
  url?: string;
  title?: string;
  label?: string;
  description?: string;
};

export type AssistantBlock =
  | { kind: "text"; key: string; text: string }
  | { kind: "source"; key: string; url: string; title?: string }
  | {
      kind: "link";
      key: string;
      url: string;
      label: string;
      description?: string;
    };

/**
 * Tool/model output is untrusted, so only same-origin relative paths and
 * http(s) URLs are allowed to become links — a `javascript:` or `data:` URL
 * must never reach an `<a href>`.
 */
export const isSafeLinkUrl = (url: string): boolean => {
  // Relative path; reject protocol-relative ("//host") and "/\" variants that
  // browsers may treat as protocol-relative.
  if (url.startsWith("/")) return !/^\/[/\\]/.test(url);
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Turns an assistant message into an ordered list of renderable blocks:
 * adjacent text parts are coalesced into one Markdown block, and the agent's
 * link tool calls (`present-source`, `present-link`) become link blocks.
 */
export const getAssistantBlocks = (message: UIMessage): AssistantBlock[] => {
  const blocks: AssistantBlock[] = [];

  message.parts.forEach((part, index) => {
    const key = `${message.id}-${index}`;

    if (part.type === "text") {
      const last = blocks.at(-1);
      if (last?.kind === "text") {
        last.text += part.text;
      } else {
        blocks.push({ kind: "text", key, text: part.text });
      }
      return;
    }

    if (!isToolOrDynamicToolUIPart(part)) return;

    const input = part.input as ToolLinkInput | undefined;
    if (typeof input?.url !== "string" || !isSafeLinkUrl(input.url)) return;

    const name = getToolOrDynamicToolName(part);
    if (name === "present-source") {
      blocks.push({ kind: "source", key, url: input.url, title: input.title });
    } else if (name === "present-link") {
      blocks.push({
        kind: "link",
        key,
        url: input.url,
        label: input.label ?? input.url,
        description: input.description,
      });
    }
  });

  return blocks;
};

/**
 * A relative path (or a same-origin absolute URL) can be navigated client-side,
 * keeping the chat panel open; anything else opens in a new tab.
 */
export const toInternalPath = (url: string): string | null => {
  if (url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    if (
      typeof window !== "undefined" &&
      parsed.origin === window.location.origin
    ) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    // Not an absolute URL — fall through.
  }
  return null;
};

export const prettifyUrl = (url: string): string => {
  try {
    const path = url.startsWith("/") ? url : new URL(url).pathname;
    return path.replace(/\/+$/, "").split("/").filter(Boolean).at(-1) ?? url;
  } catch {
    return url;
  }
};
