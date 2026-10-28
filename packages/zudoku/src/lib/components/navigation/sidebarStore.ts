import { create } from "zustand";

type SidebarState = { isCollapsed: boolean; toggle: () => void };

export const useSidebar = create<SidebarState>((set) => ({
  isCollapsed: false,
  toggle: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
}));
