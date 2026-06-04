import { UndoIcon } from "lucide-react";
import { AnimatePresence, LazyMotion, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useRef } from "react";
import { Link } from "react-router";
import { cn } from "../../util/cn.js";
import { NavigationItem } from "./NavigationItem.js";
import type { NavigationFrame } from "./useNavigationFrame.js";
import { navigationItemKey, navigationListItem } from "./utils.js";

const loadFeatures = () =>
  import("./motionFeatures.js").then((mod) => mod.default);

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

export const NavigationFrames = ({
  frame,
  onRequestClose,
  className,
}: {
  frame: NavigationFrame;
  onRequestClose?: () => void;
  className?: string;
}) => {
  const reduceMotion = useReducedMotion();

  // Track visited frames to determine slide direction (forward/backward)
  const visited = useRef<string[]>([frame.id]);
  const prevId = useRef(frame.id);
  const directionRef = useRef(1);

  if (prevId.current !== frame.id) {
    const existing = visited.current.indexOf(frame.id);
    directionRef.current = existing >= 0 ? -1 : 1;
    visited.current =
      existing >= 0
        ? visited.current.slice(0, existing + 1)
        : [...visited.current, frame.id];
    prevId.current = frame.id;
  }

  const direction = directionRef.current;

  return (
    <LazyMotion features={loadFeatures} strict>
      <div
        className={cn(
          "relative overflow-clip [overflow-clip-margin:0.5rem]",
          className,
        )}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <m.div
            key={frame.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "tween", duration: 0.25, ease: "easeInOut" }
            }
            className="flex flex-col"
          >
            {frame.back && (
              <Link
                viewTransition
                to={frame.back.to}
                onClick={onRequestClose}
                className={navigationListItem({
                  className: "",
                })}
              >
                <UndoIcon size={16} className="shrink-0" />
                <span className="truncate">
                  {frame.back.label ? `Back to ${frame.back.label}` : "Back"}
                </span>
              </Link>
            )}
            {frame.items.map((item) => (
              <NavigationItem
                key={navigationItemKey(item)}
                item={item}
                onRequestClose={onRequestClose}
              />
            ))}
          </m.div>
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
};
