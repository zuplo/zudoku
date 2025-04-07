import { KeyRoundIcon } from "lucide-react";
import { type RouteObject } from "react-router";
import { ZudokuContext } from "../../core/ZudokuContext.js";
import {
  type ApiIdentityPlugin,
  type ZudokuPlugin,
  ProfileMenuPlugin,
} from "../../core/plugins.js";
import invariant from "../../util/invariant.js";
import { ApiKeyDialog } from "./ApiKeyDialog.js";
import { SettingsApiKeys } from "./SettingsApiKeys.js";
const DEFAULT_API_KEY_ENDPOINT =
  "https://zudoku-rewiringamerica-main-ef9c9c0.d2.zuplo.dev";

export type ApiKeyService = {
  getKeys: (context: ZudokuContext) => Promise<ApiKey[]>;
  checkIn?: (context: ZudokuContext) => Promise<void>;
  rollKey?: (id: string, context: ZudokuContext) => Promise<void>;
  deleteKey?: (id: string, context: ZudokuContext) => Promise<void>;
  updateKeyDescription?: (
    apiKey: { id: string; description: string },
    context: ZudokuContext,
  ) => Promise<void>;
  getUsage?: (apiKeys: string[], context: ZudokuContext) => Promise<void>;
  createKey?: (
    apiKey: { description: string; expiresOn?: string },
    context: ZudokuContext,
  ) => Promise<void>;
};

export type GetApiKeysOptions = ApiKeyService | { endpoint: string } | object;

export type ApiKeyPluginOptions = object & GetApiKeysOptions;

export interface ApiKey {
  id: string;
  description?: string;
  createdOn?: string;
  updatedOn?: string;
  expiresOn?: string;
  key: string;
  previousKeys?: Pick<
    ApiKey,
    "key" | "createdOn" | "updatedOn" | "expiresOn"
  >[];
}

const createDefaultHandler = (endpoint: string): ApiKeyService => {
  return {
    checkIn: async (context) => {
      const response = await fetch(
        await context.signRequest(
          new Request(endpoint + `/v1/developer/check-in`, {
            method: "POST",
            headers: {
              "x-zudoku-url": window.location.origin,
            },
          }),
        ),
      );
      console.log(response);

      invariant(response.ok, "Failed to check in");
    },
    deleteKey: async (id, context) => {
      const request = new Request(endpoint + `/v1/developer/api-keys/${id}`, {
        headers: {
          "x-zudoku-url": window.location.origin,
        },
        method: "DELETE",
      });

      await context.signRequest(request);

      const response = await fetch(request);
      invariant(response.ok, "Failed to delete API key");
    },
    rollKey: async (id, context) => {
      const response = await fetch(
        await context.signRequest(
          new Request(endpoint + `/v1/developer/api-keys/${id}/key`, {
            method: "DELETE",
          }),
        ),
      );
      invariant(response.ok, "Failed to delete API key");
    },
    getKeys: async (context) => {
      const request = new Request(endpoint + `/v1/developer/api-keys`, {
        headers: {
          "x-zudoku-url": window.location.origin,
        },
      });

      await context.signRequest(request);

      const keys = await fetch(request);
      invariant(keys.ok, "Failed to fetch API keys");

      return (await keys.json()).data
        .flatMap(
          (consumer: {
            id: string;
            name: string;
            apiKeys: ApiKey[];
            description: string;
          }) => {
            return consumer.apiKeys.at(0)
              ? {
                  ...consumer.apiKeys.at(0),
                  description: consumer.description,
                  id: consumer.name,
                  previousKeys: consumer.apiKeys.slice(1),
                }
              : [];
          },
        )
        .toSorted(
          (a: ApiKey, b: ApiKey) =>
            new Date(b.createdOn ?? "").getTime() -
            new Date(a.createdOn ?? "").getTime(),
        );
    },
  };
};

export const createApiKeyService = <T extends ApiKeyService>(service: T): T =>
  service;

export const apiKeyPlugin = (
  options: ApiKeyPluginOptions,
): ZudokuPlugin & ApiIdentityPlugin & ProfileMenuPlugin => {
  const endpoint =
    "endpoint" in options ? options.endpoint : DEFAULT_API_KEY_ENDPOINT;

  const service =
    "getKeys" in options ? options : createDefaultHandler(endpoint);

  let context: ZudokuContext | undefined;

  return {
    initialize: async (c) => {
      context = c;
    },
    events: {
      auth: ({ prev, next }) => {
        if (!prev.isAuthenticated && next.isAuthenticated) {
          void service.checkIn?.(context!);
        }
      },
    },
    getProfileMenuItems: () => [
      {
        label: "API Keys",
        path: "/settings/api-keys",
        category: "middle",
        icon: KeyRoundIcon,
      },
    ],
    getIdentities: async (context) => {
      try {
        const keys = await service.getKeys(context);

        return keys.map((key) => ({
          authorizeRequest: (request) => {
            request.headers.set("Authorization", `Bearer ${key.key}`);
            return request;
          },
          id: key.id,
          label: key.description ?? key.id,
        }));
      } catch {
        return [];
      }
    },
    getProtectedRoutes: () => {
      return ["/settings/api-keys"];
    },
    getRoutes: (): RouteObject[] => {
      return [
        {
          path: "/settings/api-keys",
          element: <SettingsApiKeys service={service} />,
          children: [
            {
              path: ":id",
              element: (
                <ApiKeyDialog service={service} onOpenChange={() => {}} />
              ),
            },
          ],
        },
      ];
    },
  };
};
