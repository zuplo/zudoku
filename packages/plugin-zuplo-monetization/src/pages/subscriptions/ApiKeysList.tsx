import { Button, Heading } from "zudoku/components";
import { useZudoku } from "zudoku/hooks";
import {
  CheckCheckIcon,
  CircleSlashIcon,
  InfoIcon,
  RefreshCwIcon,
} from "zudoku/icons";
import { useMutation } from "zudoku/react-query";
import { ActionButton } from "zudoku/ui/ActionButton";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "zudoku/ui/Alert";
import {
  DismissableAlert,
  DismissableAlertAction,
} from "zudoku/ui/DismissableAlert";
import { Item, ItemContent, ItemMedia, ItemTitle } from "zudoku/ui/Item";
import { queryClient } from "../../ZuploMonetizationWrapper";
import { ApiKey, formatDate } from "./ApiKey";
import { ApiKeyInfo } from "./ApiKeyInfo";
import ConfirmRollKeyAlert from "./ConfirmRollKeyAlert";

type ApiKeyData = {
  id: string;
  createdOn: string;
  updatedOn: string;
  key: string;
  expiresOn?: string;
};

const KeysUnavailableAlert = ({ children }: { children: React.ReactNode }) => (
  <div className="relative rounded-lg overflow-hidden">
    <div>{children}</div>
    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
      <Item className="max-w-md bg-muted">
        <ItemMedia>
          <InfoIcon className="size-4" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>
            Your keys will be available once the payment has been successfully
            processed.
          </ItemTitle>
        </ItemContent>
      </Item>
    </div>
  </div>
);

export const ApiKeysList = ({
  keysAvailable,
  apiKeys,
  deploymentName,
  consumerId,
}: {
  keysAvailable: boolean;
  apiKeys: ApiKeyData[];
  deploymentName: string;
  consumerId: string;
}) => {
  const context = useZudoku();

  const rollKeyMutation = useMutation({
    mutationKey: [
      `/v2/client/${deploymentName}/consumers/${consumerId}/roll-key`,
    ],
    meta: {
      request: { method: "POST", body: "{}" },
      context,
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });

  const deleteKeyMutation = useMutation<void, Error, { keyId: string }>({
    mutationKey: [
      `/v2/client/${deploymentName}/consumers/${consumerId}/keys/{keyId}`,
    ],
    meta: {
      context,
      request: { method: "DELETE" },
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });

  if (!apiKeys || apiKeys.length === 0) {
    return null;
  }

  const sortedKeys = [...apiKeys].sort((a, b) => {
    const aExpired = a.expiresOn && new Date(a.expiresOn) < new Date();
    const bExpired = b.expiresOn && new Date(b.expiresOn) < new Date();

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
      <div className="flex items-center justify-between">
        <Heading level={3}>API Keys</Heading>

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

      <ApiKeyInfo />

      {deleteKeyMutation.isSuccess && deleteKeyMutation.variables && (
        <DismissableAlert
          variant="info"
          onDismiss={() => deleteKeyMutation.reset()}
        >
          <CheckCheckIcon className="size-4" />
          <AlertTitle>API key was deleted</AlertTitle>
          <AlertDescription>
            {(() => {
              const deletedKey = apiKeys.find(
                (k) => k.id === deleteKeyMutation.variables?.keyId,
              );
              return deletedKey
                ? `API key created ${formatDate(deletedKey.createdOn)} has been removed.`
                : "The API key has been deleted.";
            })()}
          </AlertDescription>
          <DismissableAlertAction />
        </DismissableAlert>
      )}

      {rollKeyMutation.isSuccess && (
        <DismissableAlert
          variant="info"
          onDismiss={() => rollKeyMutation.reset()}
        >
          <CheckCheckIcon className="size-4" />
          <AlertTitle>API key was rolled</AlertTitle>
          <AlertDescription>
            A new API key has been created and the old one has been set to
            expire in 7 days.
          </AlertDescription>
          <DismissableAlertAction />
        </DismissableAlert>
      )}

      {deleteKeyMutation.isError && (
        <Alert variant="destructive">
          <CircleSlashIcon className="size-4" />
          <AlertTitle>Could not delete API key</AlertTitle>
          <AlertDescription>{deleteKeyMutation.error.message}</AlertDescription>
          <AlertAction>
            <Button
              variant="outline"
              onClick={() => {
                const keyId = deleteKeyMutation.variables?.keyId;
                if (!keyId) return;

                deleteKeyMutation.mutateAsync({ keyId });
              }}
            >
              Retry
            </Button>
          </AlertAction>
        </Alert>
      )}

      <div className="space-y-4">
        {activeKey &&
          (keysAvailable ? (
            <KeysUnavailableAlert>
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
            </KeysUnavailableAlert>
          ) : (
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
          ))}

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
