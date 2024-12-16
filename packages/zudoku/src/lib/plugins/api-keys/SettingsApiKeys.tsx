import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  CheckIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  RotateCwIcon,
  TrashIcon,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useZudoku } from "../../components/context/ZudokuContext.js";
import { Slotlet } from "../../components/SlotletProvider.js";
import { Button } from "../../ui/Button.js";
import { cn } from "../../util/cn.js";
import { ApiKeyService } from "./index.js";

export const SettingsApiKeys = ({ service }: { service: ApiKeyService }) => {
  const context = useZudoku();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery({
    queryFn: () => service.getKeys(context),
    queryKey: ["api-keys"],
    retry: false,
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (id: string) => {
      if (!service.deleteKey) {
        throw new Error("deleteKey not implemented");
      }

      return service.deleteKey(id, context);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  const rollKeyMutation = useMutation({
    mutationFn: (id: string) => {
      if (!service.rollKey) {
        throw new Error("rollKey not implemented");
      }

      return service.rollKey(id, context);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api-keys"] }),
  });

  return (
    <div className="max-w-screen-lg h-full pt-[--padding-content-top] pb-[--padding-content-bottom]">
      <Slotlet name="api-keys-list-page" />

      <div className="flex justify-between mb-4 border-b pb-3">
        <h1 className="font-medium text-2xl">API Keys</h1>
        {service.createKey && (
          <Button asChild>
            <Link to="/settings/api-keys/new">Create API Key</Link>
          </Button>
        )}
      </div>

      <Slotlet name="api-keys-list-page-before-keys" />

      {data.length === 0 ? (
        <div className="flex flex-col justify-center gap-4 items-center p-8 border rounded bg-muted/30 text-muted-foreground">
          <p className="text-center">
            No API keys created yet.
            <br />
            Get started and create your first key.
          </p>
          {service.createKey && (
            <Button asChild variant="outline">
              <Link to="/settings/api-keys/new">Create API Key</Link>
            </Button>
          )}
        </div>
      ) : (
        <ul
          className={cn(
            "grid grid-cols-1 rounded border divide-y divide-border",
            "lg:grid-cols-[minmax(250px,min-content)_1fr_min-content]",
          )}
        >
          {data.map((key) => (
            <li
              className="p-5 grid grid-cols-subgrid col-span-full gap-2 items-center"
              key={key.id}
            >
              <div className="flex flex-col gap-1 text-sm">
                {key.description ?? key.id}
                <div className="text-muted-foreground text-xs">
                  {key.createdOn && (
                    <div>
                      Created on {new Date(key.createdOn).toLocaleDateString()}
                    </div>
                  )}
                  {key.expiresOn && (
                    <div>
                      Expires on {new Date(key.expiresOn).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              <div className="items-center flex lg:justify-center">
                <RevealApiKey apiKey={key.key} />
              </div>
              <div className="flex gap-2">
                {service.rollKey && (
                  <Button
                    size="icon"
                    title="Roll this key"
                    variant="ghost"
                    onClick={() => {
                      if (!confirm("Do you want to roll this key?")) {
                        return;
                      }

                      rollKeyMutation.mutate(key.id);
                    }}
                  >
                    <RotateCwIcon size={16} />
                  </Button>
                )}
                {service.deleteKey && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (!confirm("Do you want to delete this key?")) {
                        return;
                      }

                      deleteKeyMutation.mutate(key.id);
                    }}
                    disabled={deleteKeyMutation.isPending}
                  >
                    <TrashIcon size={16} />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const RevealApiKey = ({ apiKey }: { apiKey: string }) => {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex gap-2 items-center text-sm">
      <div className="border rounded bg-gray-100 dark:bg-gray-950 p-1 font-mono truncate h-9 items-center flex px-2">
        {revealed ? apiKey : "•".repeat(apiKey.length)}
      </div>
      <Button
        variant="outline"
        onClick={() => setRevealed((prev) => !prev)}
        size="icon"
      >
        {revealed ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          void navigator.clipboard.writeText(apiKey).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          });
        }}
        size="icon"
      >
        {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
      </Button>
    </div>
  );
};
