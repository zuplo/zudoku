import { useCallback, useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  resolveServerUrl,
  type ServerVariableDefinition,
} from "./util/resolveServerUrl.js";

const NO_OVERRIDES: Record<string, string> = Object.freeze({});

interface SelectedServerState {
  selectedServer?: string;
  // Keyed by server URL template so different servers (and different schemas
  // that happen to share the same store) don't clobber each other's values.
  serverVariables: Record<string, Record<string, string>>;
  setSelectedServer: (newServer: string) => void;
  setServerVariable: (templateUrl: string, name: string, value: string) => void;
}

export const useSelectedServerStore = create<SelectedServerState>()(
  persist(
    (set) => ({
      selectedServer: undefined,
      serverVariables: {},
      setSelectedServer: (newServer: string) =>
        set({ selectedServer: newServer }),
      setServerVariable: (templateUrl, name, value) =>
        set((state) => ({
          serverVariables: {
            ...state.serverVariables,
            [templateUrl]: {
              ...state.serverVariables[templateUrl],
              [name]: value,
            },
          },
        })),
    }),
    { name: "zudoku-selected-server" },
  ),
);

/**
 * Resolves a server that has no selection UI of its own (e.g. an operation or
 * path-level server) against the same persisted variable overrides the
 * playground uses, so displayed URLs, code samples and requests agree.
 */
export const useResolvedServerUrl = (server?: ServerWithVariables) => {
  const overrides = useSelectedServerStore((state) =>
    server ? state.serverVariables[server.url] : undefined,
  );

  return useMemo(
    () =>
      server
        ? resolveServerUrl(server.url, server.variables ?? [], overrides)
        : undefined,
    [server, overrides],
  );
};

export type ServerWithVariables = {
  url: string;
  variables?: ServerVariableDefinition[] | null;
};

/**
 * Simple wrapper for `useSelectedServerStore` to fall back to first of the provided servers.
 * Also resolves any OpenAPI server variables (e.g. `{scheme}{host}{port}`) present in the
 * selected server's URL template against stored overrides (falling back to each variable's
 * `default`), exposing the result as `resolvedServer`.
 */
export const useSelectedServer = (servers: Array<ServerWithVariables>) => {
  const {
    selectedServer,
    setSelectedServer,
    serverVariables,
    setServerVariable,
  } = useSelectedServerStore();

  const finalSelectedServer = useMemo(
    () =>
      selectedServer && servers.some((s) => s.url === selectedServer)
        ? selectedServer
        : (servers.at(0)?.url ?? ""),
    [selectedServer, servers],
  );

  const variables = useMemo(
    () => servers.find((s) => s.url === finalSelectedServer)?.variables ?? [],
    [servers, finalSelectedServer],
  );

  const variableValues = serverVariables[finalSelectedServer] ?? NO_OVERRIDES;

  const resolvedServer = useMemo(
    () => resolveServerUrl(finalSelectedServer, variables, variableValues),
    [finalSelectedServer, variables, variableValues],
  );

  const setVariable = useCallback(
    (name: string, value: string) =>
      setServerVariable(finalSelectedServer, name, value),
    [setServerVariable, finalSelectedServer],
  );

  return {
    selectedServer: finalSelectedServer,
    setSelectedServer,
    resolvedServer,
    variables,
    variableValues,
    setVariable,
    // Keyed by server URL template, exposed so callers can compute an
    // up-to-date label (via `getServerLabel`) for every server in a list,
    // not just the currently selected one.
    serverVariableOverrides: serverVariables,
  };
};
