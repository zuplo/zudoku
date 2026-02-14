import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Server } from "./graphql/graphql.js";

export type TemplateSegment =
  | { type: "text"; value: string }
  | { type: "variable"; name: string };

interface SelectedServerState {
  selectedServer?: string;
  selectedServerVariables: Record<string, Record<string, string>>;
  setSelectedServer: (newServer: string) => void;
  setSelectedServerVariable: (
    serverUrl: string,
    variableName: string,
    value: string,
  ) => void;
}

const useSelectedServerStore = create<SelectedServerState>()(
  persist(
    (set) => ({
      selectedServer: undefined,
      selectedServerVariables: {},
      setSelectedServer: (newServer: string) =>
        set({ selectedServer: newServer }),
      setSelectedServerVariable: (serverUrl, variableName, value) =>
        set((state) => ({
          selectedServerVariables: {
            ...state.selectedServerVariables,
            [serverUrl]: {
              ...state.selectedServerVariables[serverUrl],
              [variableName]: value,
            },
          },
        })),
    }),
    { name: "zudoku-selected-server" },
  ),
);

/**
 * Splits a server URL template into segments of text and variables.
 * Example: "https://{env}.example.com" → [text, variable, text]
 */
const splitServerTemplate = (template: string): TemplateSegment[] =>
  template
    .split(/\{([^}]+)\}/)
    .map<TemplateSegment>((part, index) =>
      index % 2 === 0
        ? { type: "text", value: part }
        : { type: "variable", name: part },
    );

// Resolves the server URL with the selected variables.
const resolveServer = (
  server: Server,
  selectedVariables?: Record<string, string>,
): { variables: Record<string, string>; url: string } => {
  const variables = Object.fromEntries(
    (server.variables ?? []).map((variable) => {
      const value = selectedVariables?.[variable.name];
      const validValue =
        value &&
        (!variable.enumValues?.length || variable.enumValues.includes(value))
          ? value
          : variable.defaultValue;

      return [variable.name, validValue];
    }),
  );

  const url = server.url.replace(
    /\{([^}]+)\}/g,
    (_, name: string) => variables[name] ?? `{${name}}`,
  );

  return { variables, url };
};

export const useSelectedServer = (servers: Server[]) => {
  const selectedServer = useSelectedServerStore((s) => s.selectedServer);
  const selectedServerVariables = useSelectedServerStore(
    (s) => s.selectedServerVariables,
  );
  const setSelectedServer = useSelectedServerStore((s) => s.setSelectedServer);
  const setSelectedServerVariable = useSelectedServerStore(
    (s) => s.setSelectedServerVariable,
  );

  const resolved = useMemo(() => {
    const template =
      selectedServer && servers.some((s) => s.url === selectedServer)
        ? selectedServer
        : (servers[0]?.url ?? "");

    const server = servers.find((s) => s.url === template);
    if (!server) return { template, variables: {}, url: "", segments: [] };

    const { variables, url } = resolveServer(
      server,
      selectedServerVariables[template],
    );
    const segments = splitServerTemplate(template);

    return { template, variables, url, segments };
  }, [selectedServer, servers, selectedServerVariables]);

  return {
    selectedServer: resolved.url,
    selectedServerTemplate: resolved.template,
    selectedServerVariables: resolved.variables,
    templateSegments: resolved.segments,
    setSelectedServer,
    setSelectedServerVariable: (name: string, value: string) => {
      setSelectedServerVariable(resolved.template, name, value);
    },
  };
};
