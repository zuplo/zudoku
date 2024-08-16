import type { ReactNode } from "react";
import { Callout } from "../ui/Callout.js";

export const DeveloperHint = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  // TODO: figure out a way to do that in consumer dev mode not "internal"
  //  so this doesn't get stripped out in the build
  if (!import.meta.env.DEV) return;

  return (
    <Callout type="caution" title="Developer hint" className={className}>
      <div className="flex flex-col gap-2">
        <div>{children}</div>
        <small className="italic">
          Note: This hint is only shown in development mode.
        </small>
      </div>
    </Callout>
  );
};
