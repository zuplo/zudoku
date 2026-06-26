import { createElement, type ReactNode } from "react";
import type { SlotType } from "../../components/context/SlotProvider.js";
import type { SlotName } from "../../components/Slot.js";
import type { ZudokuPlugin } from "../../core/plugins.js";
import type { ExposedComponentProps } from "../../util/useExposedProps.js";
import { AskAiRoot } from "./AskAiRoot.js";
import { AskAiTrigger } from "./AskAiTrigger.js";
import { resolveOptions, type ZudokuAiPluginOptions } from "./types.js";

export type { ZudokuAiPluginOptions } from "./types.js";
export { useAskAi } from "./store.js";

// Renders an existing slot value (a React node or a component) followed by our
// own content, so enabling the plugin never clobbers a slot the user already
// configured at the same position.
const composeSlot =
  (existing: SlotType | undefined, ours: ReactNode) =>
  (props: ExposedComponentProps) => (
    <>
      {typeof existing === "function"
        ? createElement(existing, props)
        : existing}
      {ours}
    </>
  );

/**
 * Zudoku AI — adds an "Ask AI" button to the header that opens an AI chat panel
 * powered by [`@ai-sdk/react`](https://ai-sdk.dev). The panel streams answers
 * from a backend endpoint that speaks the AI SDK UI Message Stream protocol
 * (see {@link ZudokuAiPluginOptions.api}).
 */
export const zudokuAiPlugin = (
  options: ZudokuAiPluginOptions = {},
): ZudokuPlugin => {
  const resolved = resolveOptions(options);
  const position: SlotName = options.position ?? "head-navigation-end";

  return {
    transformConfig: ({ config, merge }) => {
      const slots: Record<string, SlotType> = {
        // The header button (hidden on small screens by its container).
        [position]: composeSlot(
          config.slots?.[position],
          <AskAiTrigger label={resolved.label} />,
        ),
        // Mounted once: the chat panel, keyboard shortcut and mobile trigger.
        "layout-after-head": composeSlot(
          config.slots?.["layout-after-head"],
          <AskAiRoot options={resolved} />,
        ),
      };

      return merge({ slots });
    },
  };
};

export default zudokuAiPlugin;
