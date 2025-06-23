import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  CheckIcon,
  CircleSlashIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  PencilLineIcon,
  RefreshCwIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import React, { useState } from "react";
import { Link } from "react-router";
import { Alert, AlertTitle } from "zudoku/ui/Alert.js";
import { Card, CardHeader } from "zudoku/ui/Card.js";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "zudoku/ui/Dialog.js";
import { useZudoku } from "../../components/context/ZudokuContext.js";
import { Slot } from "../../components/Slot.js";
import { Button } from "../../ui/Button.js";
import { Input } from "../../ui/Input.js";
import { cn } from "../../util/cn.js";
import { useCopyToClipboard } from "../../util/useCopyToClipboard.js";
import { type ApiConsumer, type ApiKey, type ApiKeyService } from "./index.js";

export const SettingsApiKeys = ({ service }: { service: ApiKeyService }) => {
  const context = useZudoku();
  const queryClient = useQueryClient();
  const [editingConsumerId, setEditingConsumerId] = useState<string | null>(
    null,
  );
  const [editingLabel, setEditingLabel] = useState<string>("");
  const { data, isFetching } = useSuspenseQuery({
    queryFn: () => service.getConsumers(context),
    queryKey: ["api-keys"],
    retry: false,
  });

  const deleteKeyMutation = useMutation({
    mutationFn: ({
      consumerId,
      keyId,
    }: {
      consumerId: string;
      keyId: string;
    }) => {
      if (!service.deleteKey) {
        throw new Error("deleteKey not implemented");
      }

      return service.deleteKey(consumerId, keyId, context);
    },
    onMutate: async ({ consumerId, keyId }) => {
      await queryClient.cancelQueries({ queryKey: ["api-keys"] });
      const previousData = queryClient.getQueryData<ApiConsumer[]>([
        "api-keys",
      ]);
      queryClient.setQueryData<ApiConsumer[]>(["api-keys"], (old) => {
        if (!old) {
          return old;
        }

        return old.map((consumer) => {
          if (consumer.id === consumerId) {
            return {
              ...consumer,
              apiKeys: consumer.apiKeys.filter((key) => key.id !== keyId),
            };
          }
          return consumer;
        });
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["api-keys"], context.previousData);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  const updateConsumerMutation = useMutation({
    mutationFn: ({
      consumerId,
      label,
    }: {
      consumerId: string;
      label: string;
    }) => {
      if (!service.updateConsumer) {
        throw new Error("updateConsumer not implemented");
      }

      return service.updateConsumer({ id: consumerId, label }, context);
    },
    onMutate: async ({ consumerId, label }) => {
      await queryClient.cancelQueries({ queryKey: ["api-keys"] });

      const previousData = queryClient.getQueryData(["api-keys"]);
      queryClient.setQueryData<ApiConsumer[]>(["api-keys"], (old) => {
        if (!old) {
          return old;
        }

        return old.map((consumer) => {
          if (consumer.id === consumerId) {
            return {
              ...consumer,
              label,
            };
          }
          return consumer;
        });
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["api-keys"], context.previousData);
      }
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

  const handleStartEdit = (consumerId: string, currentLabel: string) => {
    setEditingConsumerId(consumerId);
    setEditingLabel(currentLabel);
  };

  const handleSaveEdit = (consumerId: string) => {
    if (editingLabel.trim()) {
      updateConsumerMutation.mutate({
        consumerId,
        label: editingLabel.trim(),
      });
    }
    setEditingConsumerId(null);
    setEditingLabel("");
  };

  const handleCancelEdit = () => {
    setEditingConsumerId(null);
    setEditingLabel("");
  };

  return (
    <div className="max-w-screen-md h-full pt-(--padding-content-top) pb-(--padding-content-bottom)">
      <Slot.Target name="api-keys-list-page" />

      <div className="flex justify-between pb-3">
        <h1 className="font-medium text-2xl">API Keys</h1>
        {service.createKey && (
          <Button asChild>
            <Link to="/settings/api-keys/new">Create API Key</Link>
          </Button>
        )}
      </div>
      <p>Create, manage, and monitor your API keys</p>

      <Slot.Target name="api-keys-list-page-before-keys" />
      <div className="h-8"></div>
      {rollKeyMutation.isError && (
        <Alert variant="destructive" className="mb-4">
          <CircleSlashIcon size={16} />
          <AlertTitle>{rollKeyMutation.error.message}</AlertTitle>
        </Alert>
      )}
      {updateConsumerMutation.isError && (
        <Alert variant="destructive" className="mb-4">
          <CircleSlashIcon size={16} />
          <AlertTitle>{updateConsumerMutation.error.message}</AlertTitle>
        </Alert>
      )}
      {deleteKeyMutation.isError && (
        <Alert variant="destructive" className="mb-4">
          <CircleSlashIcon size={16} />
          <AlertTitle>{deleteKeyMutation.error.message}</AlertTitle>
        </Alert>
      )}
      <div className="">
        {data.length === 0 ? (
          <div className="flex col-span-full flex-col justify-center gap-4 items-center p-8 border rounded-sm bg-muted/30 text-muted-foreground">
            <p className="text-center">
              You have no API keys yet.
              <br />
              {service.createKey && "Get started and create your first key."}
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
              "grid grid-cols-[1fr_min-content] divide-y divide-border col-span-6",
            )}
          >
            {data.map((consumers) => (
              <Card
                className="grid grid-cols-subgrid col-span-full items-center mb-4 group"
                key={consumers.id}
              >
                <CardHeader className="border-b col-span-full grid-cols-subgrid grid">
                  <div className="h-10 flex flex-col text-sm justify-center">
                    <div className="font-medium text-lg flex items-center gap-2">
                      {editingConsumerId === consumers.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            maxLength={32}
                            value={editingLabel}
                            onChange={(e) => setEditingLabel(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveEdit(consumers.id);
                              } else if (e.key === "Escape") {
                                handleCancelEdit();
                              }
                            }}
                            className="text-lg font-medium"
                            autoFocus
                          />
                          <div className="flex items-center">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleSaveEdit(consumers.id)}
                              disabled={!editingLabel.trim()}
                            >
                              <CheckIcon size={16} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={handleCancelEdit}
                            >
                              <XIcon size={16} />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>{consumers.label}</>
                      )}
                      <div className="text-muted-foreground text-xs">
                        {consumers.createdOn}
                      </div>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {consumers.createdOn && (
                        <div>
                          Created on{" "}
                          {new Date(consumers.createdOn).toLocaleDateString()}
                        </div>
                      )}
                      {consumers.expiresOn && (
                        <div>
                          Expires on{" "}
                          {new Date(consumers.expiresOn).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    {service.updateConsumer && (
                      <Button
                        variant="ghost"
                        onClick={() =>
                          handleStartEdit(consumers.id, consumers.label)
                        }
                        className={cn(
                          "flex gap-2",
                          editingConsumerId === consumers.id &&
                            "opacity-0! pointer-events-none",
                        )}
                        disabled={editingConsumerId === consumers.id}
                      >
                        <PencilLineIcon size={16} />
                        <span className="hidden md:block">Edit label</span>
                      </Button>
                    )}
                    {service.rollKey && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            title="Roll this key"
                            variant="ghost"
                            disabled={rollKeyMutation.isPending}
                            className="flex items-center gap-2"
                          >
                            <RefreshCwIcon
                              size={16}
                              className={
                                rollKeyMutation.isPending
                                  ? "animate-spin"
                                  : undefined
                              }
                            />
                            <span className="hidden md:block">Roll key</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Roll API Key</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to roll this API key?
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                              <Button
                                onClick={() => {
                                  rollKeyMutation.mutate(consumers.id);
                                }}
                              >
                                Roll Key
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <div className="col-span-full grid-cols-subgrid grid">
                  <AnimatePresence>
                    {consumers.apiKeys.map((apiKey) => (
                      <React.Fragment key={apiKey.id}>
                        <RevealApiKey
                          apiKey={apiKey}
                          onDeleteKey={() => {
                            deleteKeyMutation.mutate({
                              consumerId: consumers.id,
                              keyId: apiKey.id,
                            });
                          }}
                          className={
                            deleteKeyMutation.variables?.keyId === apiKey.id &&
                            (deleteKeyMutation.isPending || isFetching)
                              ? "opacity-10!"
                              : undefined
                          }
                        />
                        <div className="col-span-full h-px bg-border"></div>
                      </React.Fragment>
                    ))}
                  </AnimatePresence>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const getTimeAgo = (date: string) => {
  const now = new Date();
  const created = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (diffInSeconds < 60) return rtf.format(-diffInSeconds, "second");
  if (diffInSeconds < 3600)
    return rtf.format(-Math.floor(diffInSeconds / 60), "minute");
  if (diffInSeconds < 86400)
    return rtf.format(-Math.floor(diffInSeconds / 3600), "hour");
  if (diffInSeconds < 2592000)
    return rtf.format(-Math.floor(diffInSeconds / 86400), "day");
  if (diffInSeconds < 31536000)
    return rtf.format(-Math.floor(diffInSeconds / 2592000), "month");
  return rtf.format(-Math.floor(diffInSeconds / 31536000), "year");
};

const RevealApiKey = ({
  apiKey,
  onDeleteKey,
  className,
}: {
  apiKey: ApiKey;
  onDeleteKey: () => void;
  className?: string;
}) => {
  const [revealed, setRevealed] = useState(false);
  const [isCopied, copyToClipboard] = useCopyToClipboard();

  const { key, createdOn, expiresOn } = apiKey;
  const isExpired = expiresOn && new Date(expiresOn) < new Date();
  const daysUntilExpiry = expiresOn
    ? Math.ceil(
        (new Date(expiresOn).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : Infinity;
  const expiresSoon = daysUntilExpiry <= 7 && !isExpired;

  return (
    <div className={cn("grid col-span-full grid-cols-subgrid p-6", className)}>
      <div className="flex flex-col gap-1">
        <div className="flex gap-2 items-center text-sm border rounded-md w-full max-w-fit px-1">
          <div className="font-mono w-full h-9 items-center flex px-2 text-xs gap-2">
            <div
              className={cn(
                "rounded-full w-2 h-2 bg-emerald-400 mr-2",
                (expiresSoon || isExpired) && "bg-neutral-200",
              )}
            ></div>
            <span className="w-full truncate">
              <div
                className={cn(
                  "w-40 inline-block md:w-full truncate",
                  revealed ? "" : "opacity-20",
                )}
              >
                {revealed
                  ? key.slice(0, -5)
                  : "**** ".repeat(key.slice(0, -5).length / 5) +
                    "*".repeat(key.slice(0, -5).length % 5)}
              </div>
              <span>{key.slice(-5)}</span>
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={() => setRevealed((prev) => !prev)}
            size="icon"
          >
            {revealed ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
          </Button>
          <Button
            variant="ghost"
            onClick={() => copyToClipboard(key)}
            size="icon"
          >
            {isCopied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
          </Button>
        </div>
        <div className="flex gap-1 mt-0.5 text-nowrap">
          {createdOn && (
            <span className="text-xs text-muted-foreground">
              Created {getTimeAgo(createdOn)}.
            </span>
          )}{" "}
          {expiresOn && expiresSoon && (
            <span className="text-xs text-primary">
              Expires in {daysUntilExpiry}{" "}
              {daysUntilExpiry === 1 ? "day" : "days"}.
            </span>
          )}
          {expiresOn && isExpired && (
            <span className="text-xs text-primary">
              Expired{" "}
              {daysUntilExpiry === 0
                ? "today."
                : `${daysUntilExpiry * -1} days ago.`}
            </span>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        {expiresOn && onDeleteKey && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <TrashIcon size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete API Key</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this API key?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    onClick={() => {
                      onDeleteKey();
                    }}
                  >
                    Delete
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};
