import { createPlugin, type SlotName, type ZudokuPlugin } from "zudoku";
import { AskAiRoot } from "./AskAiRoot.js";
import { AskAiTrigger } from "./AskAiTrigger.js";
import { resolveOptions, type ZudokuAiPluginOptions } from "./types.js";

export type { ZudokuAiPluginOptions } from "./types.js";
export { useAskAi } from "./store.js";

/**
 * Zudoku AI — adds an "Ask AI" button to the header that opens an AI chat panel
 * powered by [`@ai-sdk/react`](https://ai-sdk.dev). The panel streams answers
 * from a backend endpoint that speaks the AI SDK UI Message Stream protocol
 * (see {@link ZudokuAiPluginOptions.api}).
 */
export const zudokuAiPlugin = createPlugin(
  (options: ZudokuAiPluginOptions = {}): ZudokuPlugin => {
    const resolved = resolveOptions(options);
    const position: SlotName = options.position ?? "head-navigation-end";

    return {
      transformConfig: ({ merge }) =>
        merge({
          slots: {
            // The header button (hidden on small screens by its container).
            [position]: <AskAiTrigger label={resolved.label} />,
            // Mounted once: the chat panel, keyboard shortcut and mobile trigger.
            "layout-after-head": <AskAiRoot options={resolved} />,
          },
        }),
    };
  },
);

export default zudokuAiPlugin;
