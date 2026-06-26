import { create } from "zustand";

type AskAiState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setOpen: (isOpen: boolean) => void;
};

/**
 * Module-level UI state for the Ask AI panel. It only ever holds an open/close
 * boolean and is never mutated during server rendering (the panel always starts
 * closed), so sharing it at module scope is safe — see the SSR notes in the
 * codebase guide.
 */
export const useAskAiStore = create<AskAiState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (isOpen) => set({ isOpen }),
}));

/**
 * Programmatic access to the Ask AI chat panel. Use this from your own
 * components to open the assistant, e.g. from a call-to-action button.
 *
 * @example
 * ```tsx
 * const { open } = useAskAi();
 * return <button onClick={open}>Ask AI</button>;
 * ```
 */
export const useAskAi = () => {
  const isOpen = useAskAiStore((state) => state.isOpen);
  const open = useAskAiStore((state) => state.open);
  const close = useAskAiStore((state) => state.close);
  const toggle = useAskAiStore((state) => state.toggle);
  return { isOpen, open, close, toggle };
};
