import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";
import type * as React from "react";

function AspectRatio({
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}
export { AspectRatio };
