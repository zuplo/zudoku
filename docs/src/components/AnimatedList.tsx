import { AnimatePresence, motion } from "motion/react";
import React, {
  type ComponentPropsWithoutRef,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cn } from "zudoku/ui/util.js";
import { Box } from "./Box";

const MotionBox = motion.create(Box);

export function AnimatedListItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const animations = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, originY: 0 },
    exit: { scale: 0, opacity: 0 },
    transition: { type: "spring", stiffness: 350, damping: 40 } as const,
  };

  return (
    <MotionBox {...animations} layout className={cn(className)}>
      {children}
    </MotionBox>
  );
}

export interface AnimatedListProps extends ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode;
  delay?: number;
}

export const AnimatedList = React.memo(
  ({ children, className, delay = 1000, ...props }: AnimatedListProps) => {
    const [index, setIndex] = useState(0);
    const childrenArray = useMemo(
      () => React.Children.toArray(children),
      [children],
    );

    useEffect(() => {
      if (index < childrenArray.length - 1) {
        const timeout = setTimeout(() => {
          setIndex((prevIndex) => (prevIndex + 1) % childrenArray.length);
        }, delay);

        return () => clearTimeout(timeout);
      }
    }, [index, delay, childrenArray.length]);

    const itemsToShow = useMemo(() => {
      const result = childrenArray.slice(0, index + 1).reverse();
      return result;
    }, [index, childrenArray]);

    return (
      <div className={cn(className)} {...props}>
        <AnimatePresence>{itemsToShow.map((item) => item)}</AnimatePresence>
      </div>
    );
  },
);

AnimatedList.displayName = "AnimatedList";
