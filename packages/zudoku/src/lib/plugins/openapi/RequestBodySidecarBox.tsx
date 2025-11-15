import type { MediaTypeObject } from "./graphql/graphql.js";
import * as SidecarBox from "./SidecarBox.js";
import { SidecarExamples } from "./SidecarExamples.js";

export const RequestBodySidecarBox = ({
  content,
  onExampleChange,
  isOnScreen,
  shouldLazyHighlight,
}: {
  content: MediaTypeObject[];
  onExampleChange?: (example: unknown) => void;
  isOnScreen: boolean;
  shouldLazyHighlight?: boolean;
}) => {
  if (content.length === 0) return null;

  return (
    <SidecarBox.Root>
      <SidecarBox.Head className="text-xs flex justify-between items-center">
        <span className="font-mono">Request Body Example</span>
      </SidecarBox.Head>
      <SidecarExamples
        content={content}
        onExampleChange={onExampleChange}
        isOnScreen={isOnScreen}
        shouldLazyHighlight={shouldLazyHighlight}
      />
    </SidecarBox.Root>
  );
};
