import { useInView } from "motion/react";
import { useEffect, useRef } from "react";

interface AnimatedIconProps {
  className?: string;
  delay?: number;
  duration?: number;
}

const useAnimatedPath = ({ duration = 1 }: { duration?: number }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<SVGSVGElement>(null);
  const isInView = useInView(containerRef, {
    once: false,
    margin: "10px 10px",
  });

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const length = path.getTotalLength().toString();

    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;

    // Animate based on visibility
    if (isInView) {
      path.style.strokeDashoffset = "0";
      path.style.transition = `stroke-dashoffset ${duration}s ease-in-out`;
    } else {
      path.style.strokeDashoffset = length;
      path.style.transition = "none";
    }
  }, [isInView, duration]);

  return { pathRef, containerRef };
};

export const AnimatedPackageIcon = ({
  className,
  duration,
}: AnimatedIconProps) => {
  const { pathRef, containerRef } = useAnimatedPath({ duration });

  return (
    <svg
      ref={containerRef}
      xmlns="http://www.w3.org/2000/svg"
      width="52"
      height="52"
      viewBox="0 0 52 52"
      className={className}
      fill="none"
    >
      <path
        ref={pathRef}
        d="M26 5 L45 15 L45 37 L26 47 L7 37 L7 15 L26 5 M7 15 L26 25 L45 15 M26 25 L26 47 M36 20 L36 31"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}
      />
    </svg>
  );
};

export const AnimatedLabelIcon = ({
  className,
  duration,
}: AnimatedIconProps) => {
  const { pathRef, containerRef } = useAnimatedPath({ duration });

  return (
    <svg
      ref={containerRef}
      width="52"
      height="52"
      viewBox="0 0 52 52"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
    >
      <path
        ref={pathRef}
        d="M8 18 C8 12 12 8 18 8 L34 8 C40 8 44 12 44 18 L44 28 L38 28 C32 28 28 32 28 38 L28 44 L18 44 C12 44 8 40 8 34 L8 18 M28 44 C28 44 44 28 44 28"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}
      />
    </svg>
  );
};
