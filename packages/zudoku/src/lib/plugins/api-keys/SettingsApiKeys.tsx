import { useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "zudoku/components";
import { useAuth } from "zudoku/hooks";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "zudoku/ui/Item.js";
import { useVerifiedEmail } from "../../authentication/hook.js";
import { Slot } from "../../components/Slot.js";
import { ErrorMessage } from "../../errors/ErrorMessage.js";
import { CreateApiKeyDialog } from "./CreateApiKeyDialog.js";
import type { ApiKeyService } from "./index.js";
import { ApiKeyList } from "./settings/ApiKeyList.js";

export const SettingsApiKeys = ({ service }: { service: ApiKeyService }) => {
  const [isCreateApiKeyOpen, setIsCreateApiKeyOpen] = useState(false);
  const auth = useAuth();
  const { supportsEmailVerification, requestEmailVerification, refresh } =
    useVerifiedEmail();

  return (
    <div className="max-w-3xl h-full pt-(--padding-content-top) pb-(--padding-content-bottom)">
      <Slot.Target name="api-keys-list-page" />

      <div className="flex justify-between pb-3">
        <h1 className="font-medium text-2xl">API Keys</h1>

        {service.createKey && (
          <CreateApiKeyDialog
            service={service}
            isOpen={isCreateApiKeyOpen}
            onOpenChange={setIsCreateApiKeyOpen}
          />
        )}
      </div>
      <p>Create, manage, and monitor your API keys</p>

      <Slot.Target name="api-keys-list-page-before-keys" />
      {auth.profile?.emailVerified === false ? (
        <Item variant="outline" className="mt-4">
          <ItemContent>
            <ItemTitle>Verified email required</ItemTitle>
            <ItemDescription>
              You need to verify your email to access API keys.
              <Button onClick={refresh}>Refresh</Button>
            </ItemDescription>
          </ItemContent>

          {supportsEmailVerification && (
            <ItemActions>
              <Button onClick={() => requestEmailVerification()}>
                Request verification
              </Button>
            </ItemActions>
          )}
        </Item>
      ) : (
        <ErrorBoundary
          fallbackRender={({ error }) => <ErrorMessage error={error} />}
        >
          <ApiKeyList service={service} />
        </ErrorBoundary>
      )}
    </div>
  );
};
