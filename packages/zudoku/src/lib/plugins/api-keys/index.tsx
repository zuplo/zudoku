import { KeyRoundIcon } from "lucide-react";
import type { RouteObject } from "react-router";
import type { ApiKeysOptions } from "../../../config/validators/validate.js";
import type { UseAuthReturn } from "../../authentication/hook.js";
import type {
  ApiIdentityPlugin,
  ProfileMenuPlugin,
  ZudokuPlugin,
} from "../../core/plugins.js";
import type { ZudokuContext } from "../../core/ZudokuContext.js";
import invariant from "../../util/invariant.js";
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
  createKey?: ({
    apiKey,
    context,
    auth,
  }: {
    apiKey: { description: string; expiresOn?: string };
    context: ZudokuContext;
    auth: UseAuthReturn;
  }) => Promise<void>;
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

const parseJsonSafe = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return;
  }
};

const throwIfProblemJson = async (response: Response) => {
  const contentType = response.headers.get("content-type");
  if (!response.ok && contentType?.includes("application/problem+json")) {
    const data = await parseJsonSafe(response);
    if (data.type && data.title) {
      throw new Error(data.detail ?? data.title);
    }
  }
};

const createDefaultHandler = (
  deploymentName: string,
  options: ApiKeyPluginOptions,
): ApiKeyService => {
  return {
    deleteKey: async (consumerId, keyId, context) => {
      const request = new Request(
        DEFAULT_API_KEY_ENDPOINT +
          `/${deploymentName}/consumers/${consumerId}/keys/${keyId}`,
        {
          method: "DELETE",
        },
      );
      const response = await fetch(await context.signRequest(request));
      await throwIfProblemJson(response);
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
      await throwIfProblemJson(response);
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
              body: JSON.stringify({}),
            },
          ),
        ),
      );
      await throwIfProblemJson(response);
      invariant(response.ok, "Failed to roll API key");
    },
    getConsumers: async (context) => {
      const request = new Request(
        `${DEFAULT_API_KEY_ENDPOINT}/${deploymentName}/consumers`,
      );
      await context.signRequest(request);

      const keys = await fetch(request);
      await throwIfProblemJson(keys);
      invariant(keys.ok, "Failed to fetch API keys");

      const data = (await keys.json()) as {
        data: [
          {
            id: string;
            label?: string;
            subject?: string;
            createdOn?: string;
            updatedOn?: string;
            expiresOn?: string;
            apiKeys: {
              data: ApiKey[];
            };
          },
        ];
      };

      return data.data.map((consumer) => ({
        id: consumer.id,
        createdOn: consumer.createdOn,
        updatedOn: consumer.updatedOn,
        expiresOn: consumer.expiresOn,
        label: consumer.label || consumer.subject || "API Key",
        apiKeys: consumer.apiKeys.data,
        key: consumer.apiKeys.data.at(0),
      }));
    },
    ...options,
  };
};

export const createApiKeyService = <T extends ApiKeyService>(service: T): T =>
  service;

export const apiKeyPlugin = ({
  deploymentName,
  ...options
}: Omit<ApiKeysOptions, "enabled"> & {
  deploymentName?: string;
}): ZudokuPlugin & ApiIdentityPlugin & ProfileMenuPlugin => {
  const service = deploymentName
    ? createDefaultHandler(deploymentName, { deploymentName, ...options })
    : options;

  if (!service.getConsumers) {
    throw new Error("getConsumers is required when using the apiKeyPlugin");
  }

  const verifiedService: ApiKeyService = {
    ...service,
    getConsumers: service.getConsumers,
  };

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
        const consumers = await verifiedService.getConsumers(context);

        return consumers.map((consumer) => ({
          authorizeRequest: (request) => {
            request.headers.set(
              "Authorization",
              `Bearer ${consumer.apiKeys.at(0)?.key}`,
            );
            return request;
          },
          id: consumer.id,
          label: consumer.label,
        }));
      } catch {
        return [];
      }
    },

    getRoutes: (): RouteObject[] => {
      return [
        {
          path: "/settings/api-keys",
          element: <SettingsApiKeys service={verifiedService} />,
        },
      ];
    },

    getProtectedRoutes: () => {
      return ["/settings/api-keys"];
    },
  };
};
