import { type ComponentProps, useEffect, useRef, useState } from "react";

// Wide tables scroll inside the content column instead of overflowing it.
// The wrapper takes over the prose table margins so the scrollbar sits right
// below the last row.
export const ScrollableTable = (props: ComponentProps<"table">) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() =>
      setIsOverflowing(wrapper.scrollWidth > wrapper.clientWidth),
    );
    observer.observe(wrapper);
    if (wrapper.firstElementChild) observer.observe(wrapper.firstElementChild);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="my-[1.75em] overflow-x-auto [&>table]:my-0"
      // Not every browser makes scroll containers focusable, so keyboard users
      // couldn't reach cut-off columns. Only overflowing tables get a tab stop.
      tabIndex={isOverflowing ? 0 : undefined}
    >
      <table {...props} />
    </div>
  );
};
