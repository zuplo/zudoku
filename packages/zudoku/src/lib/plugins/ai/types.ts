import type { SlotName } from "../../components/Slot.js";

export type ZudokuAiPluginOptions = {
  /**
   * The endpoint that implements the AI SDK UI Message Stream protocol. Your
   * backend should pipe a `streamText` result through `toUIMessageStreamResponse()`.
   *
   * @default "/api/chat"
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

export type ResolvedZudokuAiOptions = Required<
  Pick<ZudokuAiPluginOptions, "api" | "label" | "greeting" | "placeholder">
> &
  ZudokuAiPluginOptions & {
    title: string;
  };

export const resolveOptions = (
  options: ZudokuAiPluginOptions,
): ResolvedZudokuAiOptions => {
  const label = options.label ?? "Ask AI";
  return {
    ...options,
    api: options.api ?? "/api/chat",
    label,
    title: options.title ?? label,
    greeting:
      options.greeting ?? "Hi! Ask me anything about the documentation.",
    placeholder: options.placeholder ?? "Ask a question…",
    shortcut: options.shortcut ?? false,
  };
};
