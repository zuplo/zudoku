import { type ReactNode, useEffect, useState } from "react";

export const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
};

export const ClientOnly = (props: {
  children: ReactNode;
  fallback?: ReactNode;
}) => {
  return useIsClient() ? props.children : (props.fallback ?? null);
};
