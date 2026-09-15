import { type PropsWithChildren, useEffect, useRef } from "react";
import { useViewportAnchor } from "../components/context/ViewportAnchorContext.js";

export type StepperProps = PropsWithChildren<{
  /**
   * Whether the steps appear in the table of contents. Defaults to `true`.
   *
   * Read at build time by `rehype-extract-toc-with-jsx`, which also assigns the
   * step anchors — it's declared here so MDX authors get the prop typed.
   */
  toc?: boolean;
}>;

// "stepper" class is defined in main.css
const Stepper = ({ children }: StepperProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { observe, unobserve } = useViewportAnchor();

  useEffect(() => {
    // Anchors sit on the title paragraph of a loose step, or on the `<li>` of a
    // tight one. Highlighting them keeps the toc in sync while scrolling.
    const anchors = ref.current?.querySelectorAll<HTMLElement>(
      ":scope > ol > li[id], :scope > ol > li > p[id]",
    );

    if (!anchors?.length) return;

    for (const anchor of anchors) observe(anchor);

    return () => {
      for (const anchor of anchors) unobserve(anchor);
    };
  }, [observe, unobserve]);

  return (
    <div className="stepper" ref={ref}>
      {children}
    </div>
  );
};

export { Stepper };
