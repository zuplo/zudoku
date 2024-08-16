import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type AnchorContextType = {
  activeAnchor?: string;
  setActiveAnchor: (anchor: string) => void;
  observe: (element: HTMLElement | null) => void;
  unobserve: (element: HTMLElement | null) => void;
};

const ViewportAnchorContext = createContext<AnchorContextType | undefined>(
  undefined,
);

export const useViewportAnchor = () => {
  const context = useContext(ViewportAnchorContext);

  if (!context) {
    throw new Error(
      "useViewportAnchor must be used within a CurrentAnchorProvider",
    );
  }

  return context;
};

export const useRegisterAnchorElement = () => {
  const elementRef = useRef<HTMLElement | null>(null);

  const { observe, unobserve } = useViewportAnchor();

  useEffect(() => {
    const element = elementRef.current;

    if (!element) return;

    observe(element);

    return () => unobserve(element);
  }, [observe, unobserve]);

  const setRef = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    elementRef.current = el;
  }, []);

  return { ref: setRef };
};

export const ViewportAnchorProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [activeAnchor, setActiveAnchor] = useState("");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const registeredElements = useRef(new Set<HTMLElement>());

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target.id) {
            setActiveAnchor(entry.target.id);
          }
        }
      },
      {
        // 115px is the height of the sticky header
        // see --header-height in `main.css`
        rootMargin: "115px 0px -80% 0px",
        threshold: 0.75,
      },
    );

    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const elements = registeredElements.current;
    const handleScroll = () => {
      const hasReachedTop = window.scrollY === 0;
      const hasReachedBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight;

      if (hasReachedTop) {
        // reset the active anchor when we reach the top
        setActiveAnchor("");
      } else if (hasReachedBottom) {
        requestIdleCallback(() => {
          // set the last anchor when we reach the bottom
          const lastItem = Array.from(elements).pop();
          setActiveAnchor(lastItem?.id ?? "");
        });
      }
    };

    document.addEventListener("scroll", handleScroll);

    return () => {
      elements.clear();
      document.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const observeFns = useMemo(() => {
    return {
      observe: (element: HTMLElement | null) => {
        if (!element || !observerRef.current) return;
        registeredElements.current.add(element);
        observerRef.current.observe(element);
      },
      unobserve: (element: HTMLElement | null) => {
        if (!element || !observerRef.current) return;
        registeredElements.current.delete(element);
        observerRef.current.unobserve(element);
      },
    };
  }, []);

  const value = useMemo(
    () => ({ activeAnchor, setActiveAnchor, ...observeFns }),
    [activeAnchor, setActiveAnchor, observeFns],
  );

  return (
    <ViewportAnchorContext.Provider value={value}>
      {children}
    </ViewportAnchorContext.Provider>
  );
};
