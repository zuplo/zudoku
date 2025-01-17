import { Content, useSidecarExamples } from "./ExampleDisplay.js";
import * as SidecarBox from "./SidecarBox.js";

export const RequestBodySidecarBox = ({ content }: { content: Content }) => {
  const { SidecarBody, SidebarFooter, hasContent } = useSidecarExamples({
    content,
  });

  return (
    <SidecarBox.Root>
      <SidecarBox.Head className="text-xs flex justify-between items-center">
        <span className="font-mono">Request Body Example</span>
      </SidecarBox.Head>
      <SidecarBody />
      {hasContent && <SidebarFooter />}
    </SidecarBox.Root>
  );
};
