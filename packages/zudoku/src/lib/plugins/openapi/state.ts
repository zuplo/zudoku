import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SelectedServerState {
  selectedServer?: string;
  setSelectedServer: (newServer: string) => void;
}

export const useSelectedServerStore = create<SelectedServerState>()(
  persist(
    (set) => ({
      selectedServer: undefined,
      setSelectedServer: (newServer: string) =>
        set({ selectedServer: newServer }),
    }),
    { name: "zudoku-selected-server" },
  ),
);

/**
 * Simple wrapper for `useSelectedServerStore` to fall back to first of the provided servers
 */
export const useSelectedServer = (servers: Array<{ url: string }>) => {
  const { selectedServer, setSelectedServer } = useSelectedServerStore();

  const finalSelectedServer = useMemo(
    () =>
      selectedServer && servers.some((s) => s.url === selectedServer)
        ? selectedServer
        : (servers.at(0)?.url ?? ""),
    [selectedServer, servers],
  );

  return { selectedServer: finalSelectedServer, setSelectedServer };
};
