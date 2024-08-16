import {
  Children,
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export const StaggeredRenderContext = createContext({ stagger: false });

const StaggeredRender = ({ children }: { children: ReactNode[] }) => {
  const { stagger } = useContext(StaggeredRenderContext);
  const [renderAll, setRenderAll] = useState(!stagger);

  useEffect(() => {
    if (renderAll) {
      return;
    }

    const idle = requestIdleCallback(() => {
      setRenderAll(true);
    });

    return () => cancelIdleCallback(idle);
  }, [renderAll]);

  return !renderAll ? Children.toArray(children).slice(0, 3) : children;
};

export default StaggeredRender;
