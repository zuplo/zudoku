import { useEffect, useRef, useState } from "react";

export const useOnScreen = <E extends Element = HTMLElement>({
  rootMargin = "0px",
  threshold,
  root,
}: {
  rootMargin?: string;
  threshold?: number;
  root?: Element | null;
} = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<E | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin, threshold, root },
    );

    const currentElement = ref.current;

    if (!currentElement) return;

    observer.observe(currentElement);

    return () => observer.unobserve(currentElement);
  }, [root, rootMargin, threshold]);

  return [ref, isVisible] as const;
};
