import { type ReactNode, useEffect, useState } from "react";

export const ClientOnly = (props: {
  children: ReactNode;
  fallback?: ReactNode;
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? props.children : props.fallback;
};
