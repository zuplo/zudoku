import { useEffect, useRef, useState } from "react";

export const useOnScreen = ({
  rootMargin = "0px",
  threshold,
}: {
  rootMargin?: string;
  threshold?: number;
} = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin, threshold },
    );

    const currentElement = ref.current;

    if (!currentElement) return;

    observer.observe(currentElement);

    return () => observer.unobserve(currentElement);
  }, [rootMargin, threshold]);

  return [ref, isVisible] as const;
};
