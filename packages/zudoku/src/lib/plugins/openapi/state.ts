import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  resolveServerUrl,
  type ServerVariableDefinition,
} from "./util/resolveServerUrl.js";

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
    {
      name: "zudoku-selected-server",
      version: 1,
      // Older persisted state (version < 1) predates `serverVariables`.
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<SelectedServerState>;
        return version < 1
          ? { ...state, serverVariables: state.serverVariables ?? {} }
          : state;
      },
    },
  ),
);

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

  const variableValues = serverVariables[finalSelectedServer] ?? {};

  const resolvedServer = useMemo(
    () => resolveServerUrl(finalSelectedServer, variables, variableValues),
    [finalSelectedServer, variables, variableValues],
  );

  const setVariable = (name: string, value: string) =>
    setServerVariable(finalSelectedServer, name, value);

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
