import * as SidecarBox from "./SidecarBox.js";
import { type Content, SidecarExamples } from "./SidecarExamples.js";

export const RequestBodySidecarBox = ({
  content,
  onExampleChange,
}: {
  content: Content;
  onExampleChange?: (example: unknown) => void;
}) => {
  if (content.length === 0) return null;

  return (
    <SidecarBox.Root>
      <SidecarBox.Head className="text-xs flex justify-between items-center">
        <span className="font-mono">Request Body Example</span>
      </SidecarBox.Head>
      <SidecarExamples content={content} onExampleChange={onExampleChange} />
    </SidecarBox.Root>
  );
};
