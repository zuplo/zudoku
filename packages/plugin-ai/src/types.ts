import type { SlotName } from "zudoku";

/**
 * Default chat endpoint: the production agent-z deployment, which speaks the
 * AI SDK UI Message Stream protocol. Override via
 * {@link ZudokuAiPluginOptions.api} to point at your own backend.
 */
export const DEFAULT_CHAT_API =
  "https://agent-z.zuplo-exp.workers.dev/agent-z/chat";

export type ZudokuAiPluginOptions = {
  /**
   * The endpoint that implements the AI SDK UI Message Stream protocol. Your
   * backend should pipe a `streamText` result through `toUIMessageStreamResponse()`.
   *
   * Defaults to the production agent-z deployment
   * (`https://agent-z.zuplo-exp.workers.dev/agent-z/chat`).
   *
   * @default DEFAULT_CHAT_API
   */
  api?: string;
  /**
   * Label rendered on the "Ask AI" button in the header.
   *
   * @default "Ask AI"
   */
  label?: string;
  /**
   * Title rendered at the top of the chat panel. Falls back to {@link label}.
   */
  title?: string;
  /**
   * A short greeting rendered above the conversation while it is empty.
   *
   * @default "Hi! Ask me anything about the documentation."
   */
  greeting?: string;
  /**
   * Suggested questions rendered as clickable prompts in the empty state.
   */
  suggestions?: string[];
  /**
   * Placeholder for the message input.
   *
   * @default "Ask a question…"
   */
  placeholder?: string;
  /**
   * Additional headers sent with every request (e.g. for authorization).
   */
  headers?: Record<string, string>;
  /**
   * Whether cookies are sent with the request.
   *
   * @default "same-origin"
   */
  credentials?: RequestCredentials;
  /**
   * The slot the "Ask AI" button is rendered into. When left at the default a
   * companion button is also rendered into the mobile top bar.
   *
   * @default "head-navigation-end"
   */
  position?: SlotName;
  /**
   * A single character that, combined with ⌘ (macOS) or Ctrl, toggles the
   * chat. Set to `false` to disable the shortcut.
   *
   * @default false
   */
  shortcut?: string | false;
};

export type ResolvedZudokuAiOptions = ZudokuAiPluginOptions & {
  api: string;
  label: string;
  title: string;
  greeting: string;
  placeholder: string;
};

export const resolveOptions = (
  options: ZudokuAiPluginOptions,
): ResolvedZudokuAiOptions => {
  const label = options.label ?? "Ask AI";
  return {
    ...options,
    api: options.api ?? DEFAULT_CHAT_API,
    label,
    title: options.title ?? label,
    greeting:
      options.greeting ?? "Hi! Ask me anything about the documentation.",
    placeholder: options.placeholder ?? "Ask a question…",
    shortcut: options.shortcut ?? false,
  };
};
