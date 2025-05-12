import { FileKey2Icon } from "lucide-react";
import { type RouteObject } from "react-router";
import { ZudokuContext } from "../../core/ZudokuContext.js";
import {
  type ApiIdentityPlugin,
  type ZudokuPlugin,
  ProfileMenuPlugin,
} from "../../core/plugins.js";
import { RouterError } from "../../errors/RouterError.js";
import invariant from "../../util/invariant.js";
import { CreateApiKey } from "./CreateApiKey.js";
import { ProtectedRoute } from "./ProtectedRoute.js";
import { SettingsApiKeys } from "./SettingsApiKeys.js";

const DEFAULT_API_KEY_ENDPOINT =
  "https://zudoku-rewiringamerica-main-ef9c9c0.d2.zuplo.dev";

export type ApiKeyService = {
  getKeys: (context: ZudokuContext) => Promise<ApiKey[]>;
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
}

const createDefaultHandler = (endpoint: string): ApiKeyService => {
  return {
    deleteKey: async (id, context) => {
      const request = new Request(endpoint + `/v1/developer/api-keys/${id}`, {
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
    createKey: async (apiKey, context) => {
      const request = new Request(endpoint + `/v1/developer/api-keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiKey),
      });

      await context.signRequest(request);

      const response = await fetch(request);
      invariant(response.ok, "Failed to create API key");
    },
    getKeys: async (context) => {
      const request = new Request(endpoint + `/v1/developer/api-keys`);

      await context.signRequest(request);

      const keys = await fetch(request);
      invariant(keys.ok, "Failed to fetch API keys");

      return await keys.json();
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

  return {
    getProfileMenuItems: () => [
      {
        label: "API Keys",
        path: "/settings/api-keys",
        category: "middle",
        icon: FileKey2Icon,
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
    getRoutes: (): RouteObject[] => {
      // TODO: Make lazy
      return [
        {
          element: <ProtectedRoute />,
          errorElement: <RouterError />,
          children: [
            {
              path: "/settings/api-keys",
              element: <SettingsApiKeys service={service} />,
            },
            {
              path: "/settings/api-keys/new",
              element: <CreateApiKey service={service} />,
            },
          ],
        },
      ];
    },
  };
};
