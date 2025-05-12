import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

type AnchorContextType = {
  activeAnchor?: string;
  setActiveAnchor: (anchor: string) => void;
  observe: (element: HTMLElement | null) => void;
  unobserve: (element: HTMLElement | null) => void;
};

const ViewportAnchorContext = createContext<AnchorContextType>({
  activeAnchor: "",
  setActiveAnchor: () => {},
  observe: () => {},
  unobserve: () => {},
});

export const useViewportAnchor = () => use(ViewportAnchorContext);

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

export const ViewportAnchorProvider = ({ children }: PropsWithChildren) => {
  const [activeAnchor, setActiveAnchor] = useState("");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const registeredElements = useRef(new Set<HTMLElement>());
  const pendingElements = useRef(new Set<HTMLElement>());

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
        rootMargin: "0px 0px -80% 0px",
        threshold: 0.75,
      },
    );

    // Process any elements that tried to register before observer was ready
    pendingElements.current.forEach((element) => {
      registeredElements.current.add(element);
      observerRef.current?.observe(element);
    });
    pendingElements.current.clear();

    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const elements = registeredElements.current;
    const handleScroll = () => {
      const hasReachedTop = window.scrollY === 0;
      const hasReachedBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight;

      if (hasReachedTop) {
        setActiveAnchor("");
      } else if (hasReachedBottom) {
        const lastItem = Array.from(elements).pop();
        const lastId = lastItem?.id ?? "";
        setActiveAnchor(lastId);
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
        if (!element) return;

        if (!observerRef.current) {
          pendingElements.current.add(element);
          return;
        }

        registeredElements.current.add(element);
        observerRef.current.observe(element);
      },
      unobserve: (element: HTMLElement | null) => {
        if (!element) return;

        pendingElements.current.delete(element);
        registeredElements.current.delete(element);
        observerRef.current?.unobserve(element);
      },
    };
  }, []);

  const value = useMemo(
    () => ({ activeAnchor, setActiveAnchor, ...observeFns }),
    [activeAnchor, setActiveAnchor, observeFns],
  );

  return (
    <ViewportAnchorContext value={value}>{children}</ViewportAnchorContext>
  );
};
