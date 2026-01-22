import { useZudoku } from "zudoku/hooks";
import { RefreshCwIcon } from "zudoku/icons";
import { useMutation } from "zudoku/react-query";
import { ActionButton } from "zudoku/ui/ActionButton";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert";
import { createMutationFn, queryClient } from "../../ZuploMonetizationWrapper";
import { ApiKey } from "./ApiKey";
import { ApiKeyInfo } from "./ApiKeyInfo";
import ConfirmRollKeyAlert from "./ConfirmRollKeyAlert";

type ApiKeyData = {
  id: string;
  createdOn: string;
  updatedOn: string;
  key: string;
  expiresOn?: string;
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
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: createMutationFn(
      ({ keyId }: { keyId: string }) =>
        `/v2/client/${deploymentName}/consumers/${consumerId}/keys/${keyId}`,
      context,
      {
        method: "DELETE",
        body: JSON.stringify({}),
      },
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });

  if (!apiKeys || apiKeys.length === 0) {
    return null;
  }

  // Sort keys: active first, then by creation date
  const sortedKeys = [...apiKeys].sort((a, b) => {
    const aExpired = new Date(a.expiresOn) < new Date();
    const bExpired = new Date(b.expiresOn) < new Date();

    if (aExpired !== bExpired) {
      return aExpired ? 1 : -1;
    }

    return new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime();
  });

  const activeKey = sortedKeys.find((k) => !k.expiresOn);
  const expiringKeys = sortedKeys.filter(
    (k) => typeof k.expiresOn === "string",
  );

  return (
    <div className="space-y-4">
      <ApiKeyInfo />
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">API Keys</h3>
        <ConfirmRollKeyAlert onRollKey={() => rollKeyMutation.mutateAsync()}>
          <ActionButton isPending={rollKeyMutation.isPending} variant="outline">
            <div className="flex items-center gap-2">
              <RefreshCwIcon
                className={`size-4 ${rollKeyMutation.isPending ? "animate-spin" : ""}`}
              />
              Roll API Key
            </div>
          </ActionButton>
        </ConfirmRollKeyAlert>
      </div>
      {deleteKeyMutation.error && (
        <Alert variant="destructive">
          <AlertTitle>Could not delete API key</AlertTitle>
          <AlertDescription>{deleteKeyMutation.error.message}</AlertDescription>
        </Alert>
      )}
      {rollKeyMutation.error && (
        <Alert variant="destructive">
          <AlertTitle>Could not roll API key</AlertTitle>
          <AlertDescription>{rollKeyMutation.error.message}</AlertDescription>
        </Alert>
      )}
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
            expiresOn={activeKey.expiresOn}
            isActive={true}
            label="Current Key"
            onDelete={() =>
              deleteKeyMutation.mutateAsync({ keyId: activeKey.id })
            }
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
            expiresOn={apiKey.expiresOn}
            isActive={false}
            label="Previous Key"
            onDelete={() => deleteKeyMutation.mutateAsync({ keyId: apiKey.id })}
          />
        ))}
      </div>
    </div>
  );
};
