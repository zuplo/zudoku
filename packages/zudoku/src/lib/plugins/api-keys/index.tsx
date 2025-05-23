import { FileKey2Icon } from "lucide-react";
import { type RouteObject } from "react-router";
import { type ZudokuContext } from "../../core/ZudokuContext.js";
import {
  type ApiIdentityPlugin,
  type ZudokuPlugin,
  type ProfileMenuPlugin,
} from "../../core/plugins.js";
import { RouterError } from "../../errors/RouterError.js";
import invariant from "../../util/invariant.js";
import { ProtectedRoute } from "./ProtectedRoute.js";
import { SettingsApiKeys } from "./SettingsApiKeys.js";

const DEFAULT_API_KEY_ENDPOINT = "https://api.zuploedge.com/v2/client";
// const DEFAULT_API_KEY_ENDPOINT =
//   "https://zudoku-duck-main-5e0fa1a.d2.zuplo.dev/v2/client";

export type ApiKeyService = {
  getConsumers: (context: ZudokuContext) => Promise<ApiConsumer[]>;
  rollKey?: (consumerId: string, context: ZudokuContext) => Promise<void>;
  deleteKey?: (
    consumerId: string,
    keyId: string,
    context: ZudokuContext,
  ) => Promise<void>;
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

const DEPLOYMENT_NAME = "apricot-rattlesnake-main-3f502c6";
// const DEPLOYMENT_NAME = "zudoku-apikeys-poc-main-c9ec5aa";

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

export interface ApiConsumer {
  id: string;
  name: string;
  apiKeys: ApiKey[];
  description?: string;
  createdOn?: string;
  updatedOn?: string;
  expiresOn?: string;
  key?: ApiKey;
}

const createDefaultHandler = (endpoint: string): ApiKeyService => {
  return {
    deleteKey: async (consumerId, keyId, context) => {
      const request = new Request(
        endpoint + `/${DEPLOYMENT_NAME}/consumers/${consumerId}/keys/${keyId}`,
        {
          method: "DELETE",
        },
      );
      await context.signRequest(request);

      const response = await fetch(request);
      invariant(response.ok, "Failed to delete API key");
    },
    rollKey: async (consumerId, context) => {
      const response = await fetch(
        await context.signRequest(
          new Request(
            endpoint + `/${DEPLOYMENT_NAME}/consumers/${consumerId}/roll-key`,
            {
              method: "POST",
            },
          ),
        ),
      );
      invariant(response.ok, "Failed to delete API key");
    },
    getConsumers: async (context) => {
      const request = new Request(endpoint + `/${DEPLOYMENT_NAME}/consumers`);
      await context.signRequest(request);

      const keys = await fetch(request);
      invariant(keys.ok, "Failed to fetch API keys");

      const data = (await keys.json()) as {
        data: [
          {
            id: string;
            name: string;
            apiKeys: {
              data: ApiKey[];
            };
          },
        ];
      };

      return data.data.map((consumer) => ({
        id: consumer.id,
        name: consumer.name,
        apiKeys: consumer.apiKeys.data,
        key: consumer.apiKeys.data.at(0),
      }));
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
    "getConsumers" in options ? options : createDefaultHandler(endpoint);

  return {
    getProfileMenuItems: () => [
      {
        label: "API Keys",
        path: "/settings/api-keys",
        category: "middle",
        icon: FileKey2Icon,
      },
    ],
    getSidebar: async (path, context) => {
      return [
        {
          type: "link",
          label: "API Keys",
          icon: FileKey2Icon,
          href: "/settings/api-keys",
        },
      ];
    },
    getIdentities: async (context) => {
      try {
        const consumers = await service.getConsumers(context);

        return consumers.map((consumer) => ({
          authorizeRequest: (request) => {
            request.headers.set(
              "Authorization",
              `Bearer ${consumer.apiKeys.at(0)?.key}`,
            );
            return request;
          },
          id: consumer.id,
          label: consumer.description ?? consumer.id,
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
            // {
            //   path: "/settings/api-keys/new",
            //   element: <CreateApiKey service={service} />,
            // },
          ],
        },
      ];
    },
  };
};
