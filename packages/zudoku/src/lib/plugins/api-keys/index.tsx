import { KeyRoundIcon } from "lucide-react";
import { type RouteObject } from "react-router";
import { type ZudokuContext } from "../../core/ZudokuContext.js";
import {
  type ApiIdentityPlugin,
  type ProfileMenuPlugin,
  type ZudokuPlugin,
} from "../../core/plugins.js";
import { RouterError } from "../../errors/RouterError.js";
import invariant from "../../util/invariant.js";
import { ProtectedRoute } from "./ProtectedRoute.js";
import { SettingsApiKeys } from "./SettingsApiKeys.js";

const DEFAULT_API_KEY_ENDPOINT = "https://api.zuploedge.com/v2/client";

export type ApiKeyService = {
  getConsumers: (context: ZudokuContext) => Promise<ApiConsumer[]>;
  rollKey?: (consumerId: string, context: ZudokuContext) => Promise<void>;
  deleteKey?: (
    consumerId: string,
    keyId: string,
    context: ZudokuContext,
  ) => Promise<void>;
  updateConsumer?: (
    consumer: { id: string; label?: string },
    context: ZudokuContext,
  ) => Promise<void>;
  getUsage?: (apiKeys: string[], context: ZudokuContext) => Promise<void>;
  createKey?: (
    apiKey: { description: string; expiresOn?: string },
    context: ZudokuContext,
  ) => Promise<void>;
};

export type ApiKeyPluginOptions =
  | ApiKeyService
  | ({ deploymentName: string } & Partial<ApiKeyService>);

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
  label: string;
  apiKeys: ApiKey[];
  description?: string;
  createdOn?: string;
  updatedOn?: string;
  expiresOn?: string;
  key?: ApiKey;
}

const createDefaultHandler = (deploymentName: string): ApiKeyService => {
  return {
    deleteKey: async (consumerId, keyId, context) => {
      const request = new Request(
        DEFAULT_API_KEY_ENDPOINT +
          `/${deploymentName}/consumers/${consumerId}/keys/${keyId}`,
        {
          method: "DELETE",
        },
      );
      await context.signRequest(request);

      const response = await fetch(request);
      invariant(response.ok, "Failed to delete API key");
    },
    updateConsumer: async (consumer, context) => {
      const response = await fetch(
        await context.signRequest(
          new Request(
            DEFAULT_API_KEY_ENDPOINT +
              `/${deploymentName}/consumers/${consumer.id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                label: consumer.label,
              }),
            },
          ),
        ),
      );
      invariant(response.ok, "Failed to update API key description");
    },
    rollKey: async (consumerId, context) => {
      const response = await fetch(
        await context.signRequest(
          new Request(
            DEFAULT_API_KEY_ENDPOINT +
              `/${deploymentName}/consumers/${consumerId}/roll-key`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                expiresOn: new Date(),
              }),
            },
          ),
        ),
      );
      invariant(response.ok, "Failed to delete API key");
    },
    getConsumers: async (context) => {
      const request = new Request(
        DEFAULT_API_KEY_ENDPOINT + `/${deploymentName}/consumers`,
      );
      await context.signRequest(request);

      const keys = await fetch(request);
      invariant(keys.ok, "Failed to fetch API keys");

      const data = (await keys.json()) as {
        data: [
          {
            id: string;
            label: string;
            apiKeys: {
              data: ApiKey[];
            };
          },
        ];
      };

      return data.data.map((consumer) => ({
        id: consumer.id,
        label: consumer.label || "API Key",
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
  const service: ApiKeyService =
    "deploymentName" in options
      ? createDefaultHandler(options.deploymentName)
      : options;

  return {
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
