import { useMDXComponents as useMDXComponentsImport } from "@mdx-js/react";
import { Helmet } from "@zudoku/react-helmet-async";
import { useTheme as useThemeImport } from "next-themes";
import { Link as LinkImport } from "react-router";
import { useAuth as useAuthImport } from "../authentication/hook.js";
import { Button as ButtonImport } from "../ui/Button.js";
import { Callout as CalloutImport } from "../ui/Callout.js";
import { ClientOnly as ClientOnlyImport } from "./ClientOnly.js";
import {
  CACHE_KEYS as CACHE_KEYS_IMPORT,
  useCache as useCacheImport,
} from "./cache.js";
import { useZudoku as useZudokuImport } from "./context/ZudokuContext.js";
import { Markdown as MarkdownImport } from "./Markdown.js";
import { Spinner as SpinnerImport } from "./Spinner.js";
import { Typography as TypographyImport } from "./Typography.js";
import { Zudoku as ZudokuImport } from "./Zudoku.js";

export const Head = /*@__PURE__*/ Helmet;
export const Callout = /*@__PURE__*/ CalloutImport;
export const Markdown = /*@__PURE__*/ MarkdownImport;
export const Spinner = /*@__PURE__*/ SpinnerImport;
export const ClientOnly = /*@__PURE__*/ ClientOnlyImport;
export const Button = /*@__PURE__*/ ButtonImport;
export const Link = /*@__PURE__*/ LinkImport;
export const Zudoku = /*@__PURE__*/ ZudokuImport;
export const Typography = /*@__PURE__*/ TypographyImport;

/** @deprecated Import from `zudoku/hooks` instead */
export const useMDXComponents = /*@__PURE__*/ useMDXComponentsImport;
/** @deprecated Import from `zudoku/hooks` instead */
export const useZudoku = /*@__PURE__*/ useZudokuImport;
/** @deprecated Import from `zudoku/hooks` instead */
export const useAuth = /*@__PURE__*/ useAuthImport;
/** @deprecated Import from `zudoku/hooks` instead */
export const useCache = /*@__PURE__*/ useCacheImport;
/** @deprecated Import from `zudoku/hooks` instead */
export const CACHE_KEYS = /*@__PURE__*/ CACHE_KEYS_IMPORT;
/** @deprecated Import from `zudoku/hooks` instead */
export const useTheme = /*@__PURE__*/ useThemeImport;
