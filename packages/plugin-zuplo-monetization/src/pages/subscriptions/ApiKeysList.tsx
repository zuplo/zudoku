import { useZudoku } from "zudoku/hooks";
import { RefreshCwIcon } from "zudoku/icons";
import { useMutation, useQueryClient } from "zudoku/react-query";
import { Button } from "zudoku/ui/Button";

import { createMutationFn } from "../../ZuploMonetizationWrapper";
import { ApiKey } from "./ApiKey";
import { ApiKeyInfo } from "./ApiKeyInfo";

type ApiKeyData = {
  id: string;
  createdOn: string;
  updatedOn: string;
  key: string;
  expiresAt?: string;
};

export const ApiKeysList = ({
  apiKeys,
  deploymentName,
  consumerId,
}: {
  apiKeys: ApiKeyData[];
  deploymentName: string;
  consumerId: string;
}) => {
  const queryClient = useQueryClient();
  const context = useZudoku();

  const rollKeyMutation = useMutation({
    mutationFn: createMutationFn(
      `/v2/client/${deploymentName}/consumers/${consumerId}/roll-key`,
      context,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    ),
    onSuccess: () => {
      // Invalidate and refetch the consumer query to get updated API keys
      queryClient.invalidateQueries({
        queryKey: [
          `/${deploymentName}/consumers/${consumerId}`,
          `/v3/zudoku-metering/${deploymentName}/subscriptions`,
        ],
      });
    },
  });

  if (!apiKeys || apiKeys.length === 0) {
    return null;
  }

  // Sort keys: active first, then by creation date
  const sortedKeys = [...apiKeys].sort((a, b) => {
    const aExpired = new Date(a.expiresAt) < new Date();
    const bExpired = new Date(b.expiresAt) < new Date();

    if (aExpired !== bExpired) {
      return aExpired ? 1 : -1;
    }

    return new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime();
  });

  const activeKey = sortedKeys.find((k) => !k.expiresAt);
  const expiringKeys = sortedKeys.filter((k) => !k.expiresAt);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">API Keys</h3>
        <Button
          onClick={() => rollKeyMutation.mutate()}
          disabled={rollKeyMutation.isPending}
        >
          <RefreshCwIcon
            className={`size-4 ${rollKeyMutation.isPending ? "animate-spin" : ""}`}
          />
          {rollKeyMutation.isPending ? "Rolling..." : "Roll API Key"}
        </Button>
      </div>

      <ApiKeyInfo />

      <div className="space-y-4">
        {activeKey && (
          <ApiKey
            deploymentName={deploymentName}
            consumerId={consumerId}
            apiKeyId={activeKey.id}
            key={activeKey.id}
            apiKey={activeKey.key}
            createdAt={activeKey.createdOn}
            lastUsed={activeKey.updatedOn}
            expiresAt={activeKey.expiresAt}
            isActive={true}
            label="Current Key"
          />
        )}

        {expiringKeys.map((apiKey) => (
          <ApiKey
            deploymentName={deploymentName}
            consumerId={consumerId}
            apiKeyId={apiKey.id}
            key={apiKey.id}
            apiKey={apiKey.key}
            createdAt={apiKey.createdOn}
            lastUsed={apiKey.updatedOn}
            expiresAt={apiKey.expiresAt}
            isActive={false}
            label="Previous Key"
          />
        ))}
      </div>
    </div>
  );
};
