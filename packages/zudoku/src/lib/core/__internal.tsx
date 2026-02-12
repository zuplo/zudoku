/**
 * ⚠️
 * These are re-exports consumed from the main entry point in `src/app/main.tsx`
 * This is to ensure that they share the exact same context in React.
 * ⚠️
 **/

import { Helmet } from "@zudoku/react-helmet-async";
import {
  Bootstrap as BootstrapImport,
  BootstrapStatic as BootstrapStaticImport,
} from "../components/Bootstrap.js";
import { BuildCheck as BuildCheckImport } from "../components/BuildCheck.js";
import { Layout as LayoutImport } from "../components/Layout.js";
import { Meta as MetaImport } from "../components/Meta.js";
import { StatusPage as StatusPageImport } from "../components/StatusPage.js";
import { RouterError as RouterErrorImport } from "../errors/RouterError.js";
import { ServerError as ServerErrorImport } from "../errors/ServerError.js";
import { RouteGuard as RouteGuardImport } from "./RouteGuard.js";
import { runPluginTransformConfig as runPluginTransformConfigImport } from "./transform-config.js";

export const Layout = LayoutImport;
export const RouterError = RouterErrorImport;
export const ServerError = ServerErrorImport;
export const Bootstrap = BootstrapImport;
export const BootstrapStatic = BootstrapStaticImport;
export const RouteGuard = RouteGuardImport;
export const Head = Helmet;
export const StatusPage = StatusPageImport;
export const BuildCheck = BuildCheckImport;
export const Meta = MetaImport;
export const runPluginTransformConfig = runPluginTransformConfigImport;
