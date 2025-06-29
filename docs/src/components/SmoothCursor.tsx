import { motion, useSpring } from "motion/react";
import { JSX, useRef } from "react";
import Cursor from "./Cursor";

interface Position {
  x: number;
  y: number;
}

export interface SmoothCursorProps {
  cursor?: JSX.Element;
  rest?: boolean;
  className?: string;
  springConfig?: {
    damping: number;
    stiffness: number;
    mass: number;
    restDelta: number;
  };
  initialPosition?: {
    x: number;
    y: number;
  };
}

export function SmoothCursor({
  rest = false,
  className,
  springConfig = {
    damping: 45,
    stiffness: 400,
    mass: 1,
    restDelta: 0.001,
  },
  initialPosition,
}: SmoothCursorProps) {
  const ref = useRef<HTMLDivElement>(null);

  const rotation = useSpring(0, {
    ...springConfig,
    damping: 60,
    stiffness: 300,
  });
  const scale = useSpring(1, {
    ...springConfig,
    stiffness: 500,
    damping: 35,
  });

  return (
    <motion.div
      style={{
        position: "absolute",
        // translateX: "-50%",
        // translateY: "-50%",
        rotate: rotation,
        scale: scale,
        zIndex: 100,
        pointerEvents: "none",
        willChange: "transform",
        transformStyle: "preserve-3d", // Enable 3D transformations
        perspective: "1000px", // Add perspective for 3D effect
        transformOrigin: "20% 20%", // Transform from top-left to make pointy side smaller
      }}
      initial={{
        scale: 1,
        // position: "absolute",
        // bottom: -6,
        // right: -6,
        rotate: 0,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
      }}
      animate={
        rest
          ? {
              scale: 0.85,
              rotateX: -15,
              rotateY: 5,
              rotateZ: -2,
              transition: {
                duration: 0.1,
                ease: "easeOut",
              },
            }
          : {
              scale: 1,
              rotateX: 0,
              rotateY: 0,
              rotateZ: 0,
              transition: {
                duration: 0.15,
                ease: "easeOut",
              },
            }
      }
      className={className}
    >
      <Cursor ref={ref} className={className} />
    </motion.div>
  );
}
