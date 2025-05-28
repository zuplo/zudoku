import { useMDXComponents as useMDXComponentsImport } from "@mdx-js/react";
import { Helmet } from "@zudoku/react-helmet-async";
/** @deprecated Import from `zudoku/hooks` instead */
import { useTheme as useThemeImport } from "next-themes";
import { Link as LinkImport } from "react-router";
/** @deprecated Import from `zudoku/hooks` instead */
import { useAuth as useAuthImport } from "../authentication/hook.js";
import { RouteGuard as RouteGuardImport } from "../core/RouteGuard.js";
import { RouterError as RouterErrorImport } from "../errors/RouterError.js";
import { ServerError as ServerErrorImport } from "../errors/ServerError.js";
import { Button as ButtonImport } from "../ui/Button.js";
import { Callout as CalloutImport } from "../ui/Callout.js";
import {
  Bootstrap as BootstrapImport,
  BootstrapStatic as BootstrapStaticImport,
} from "./Bootstrap.js";
import { BuildCheck as BuildCheckImport } from "./BuildCheck.js";
/** @deprecated Import from `zudoku/hooks` instead */
import {
  CACHE_KEYS as CACHE_KEYS_IMPORT,
  useCache as useCacheImport,
} from "./cache.js";
import { ClientOnly as ClientOnlyImport } from "./ClientOnly.js";
/** @deprecated Import from `zudoku/hooks` instead */
import { useZudoku as useZudokuImport } from "./context/ZudokuContext.js";
import { Layout as LayoutImport } from "./Layout.js";
import { Markdown as MarkdownImport } from "./Markdown.js";
import { Spinner as SpinnerImport } from "./Spinner.js";
import { StatusPage as StatusPageImport } from "./StatusPage.js";
import { Zudoku as ZudokuImport } from "./Zudoku.js";

/** @deprecated Import from `zudoku/hooks` instead */
export const useMDXComponents = /*@__PURE__*/ useMDXComponentsImport;
export const Layout = /*@__PURE__*/ LayoutImport;
export const RouterError = /*@__PURE__*/ RouterErrorImport;
export const ServerError = /*@__PURE__*/ ServerErrorImport;
export const Bootstrap = /*@__PURE__*/ BootstrapImport;
export const BootstrapStatic = /*@__PURE__*/ BootstrapStaticImport;
export const RouteGuard = /*@__PURE__*/ RouteGuardImport;

export const Head = /*@__PURE__*/ Helmet;

/** @deprecated Import from `zudoku/hooks` instead */
export const useZudoku = /*@__PURE__*/ useZudokuImport;
/** @deprecated Import from `zudoku/hooks` instead */
export const useAuth = /*@__PURE__*/ useAuthImport;
/** @deprecated Import from `zudoku/hooks` instead */
export const useCache = /*@__PURE__*/ useCacheImport;
/** @deprecated Import from `zudoku/hooks` instead */
export const CACHE_KEYS = /*@__PURE__*/ CACHE_KEYS_IMPORT;
export const Zudoku = /*@__PURE__*/ ZudokuImport;

export const StatusPage = /*@__PURE__*/ StatusPageImport;
export const Callout = /*@__PURE__*/ CalloutImport;
export const Markdown = /*@__PURE__*/ MarkdownImport;
export const Spinner = /*@__PURE__*/ SpinnerImport;
export const ClientOnly = /*@__PURE__*/ ClientOnlyImport;
export const Button = /*@__PURE__*/ ButtonImport;
export const Link = /*@__PURE__*/ LinkImport;
/** @deprecated Import from `zudoku/hooks` instead */
export const useTheme = /*@__PURE__*/ useThemeImport;
export const BuildCheck = /*@__PURE__*/ BuildCheckImport;
