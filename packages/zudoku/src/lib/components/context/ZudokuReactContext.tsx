import { type Context, createContext } from "react";
import type { ZudokuContext } from "../../core/ZudokuContext.js";

/**
 * During SSR, Vite's module runner can load the same module multiple times
 * (once for the main app, once for external plugins), creating duplicate
 * React contexts that don't share state.
 */
declare global {
  var __ZUDOKU_CONTEXT: Context<ZudokuContext | undefined>;
}

globalThis.__ZUDOKU_CONTEXT ??= createContext<ZudokuContext | undefined>(
  undefined,
);

export const ZudokuReactContext = globalThis.__ZUDOKU_CONTEXT;
