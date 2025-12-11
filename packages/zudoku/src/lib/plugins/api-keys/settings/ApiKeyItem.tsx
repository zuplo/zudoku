import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
  CircleSlashIcon,
  PencilLineIcon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { Alert, AlertTitle } from "zudoku/ui/Alert.js";
import { Button } from "zudoku/ui/Button.js";
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
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "zudoku/ui/Frame.js";
import { Input } from "zudoku/ui/Input.js";
import { useZudoku } from "../../../components/context/ZudokuContext.js";
import type { ZudokuContext } from "../../../core/ZudokuContext.js";
import { cn } from "../../../util/cn.js";
import type { ApiConsumer } from "../index.js";
import { RevealApiKey } from "./RevealApiKey.js";

const ApiKeyItem = ({
  consumer,
  onUpdate,
  onRollKey,
  onDeleteKey,
}: {
  consumer: ApiConsumer;
  onUpdate?: (
    data: { label: string; id: string },
    context: ZudokuContext,
  ) => Promise<void>;
  onRollKey?: (consumerId: string, context: ZudokuContext) => Promise<void>;
  onDeleteKey?: (
    consumerId: string,
    keyId: string,
    context: ZudokuContext,
  ) => Promise<void>;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingLabel, setEditingLabel] = useState(consumer.label);
  const queryClient = useQueryClient();
  const context = useZudoku();

  const rollKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!onRollKey) {
        throw new Error("rollKey not implemented");
      }

      return await onRollKey?.(id, context);
    },
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["api-keys"] }),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: ({
      consumerId,
      keyId,
    }: {
      consumerId: string;
      keyId: string;
    }) => {
      if (!onDeleteKey) {
        throw new Error("deleteKey not implemented");
      }

      return onDeleteKey(consumerId, keyId, context);
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
    onError: (_err, _variables, context) => {
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
      if (!onUpdate) {
        throw new Error("updateConsumer not implemented");
      }

      return onUpdate({ id: consumerId, label }, context);
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
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["api-keys"], context.previousData);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditingLabel(consumer.label);
  };

  const handleSaveEdit = () => {
    if (editingLabel.trim()) {
      updateConsumerMutation.mutate({
        label: editingLabel.trim(),
        consumerId: consumer.id,
      });
    }
    setIsEditing(false);
  };

  return (
    <>
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
      <Frame
        className="grid grid-cols-subgrid col-span-full items-center mb-4 group"
        key={consumer.id}
      >
        <FrameHeader className="col-span-full flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  maxLength={32}
                  value={editingLabel}
                  onChange={(e) => setEditingLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveEdit();
                    } else if (e.key === "Escape") {
                      setIsEditing(false);
                    }
                  }}
                  autoFocus
                />
                <div className="flex items-center">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSaveEdit}
                    disabled={!editingLabel.trim()}
                  >
                    <CheckIcon size={16} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                  >
                    <XIcon size={16} />
                  </Button>
                </div>
              </div>
            ) : (
              <FrameTitle>{consumer.label}</FrameTitle>
            )}
            <FrameDescription>
              {consumer.createdOn && (
                <div>
                  Created on {new Date(consumer.createdOn).toLocaleDateString()}
                </div>
              )}
              {consumer.expiresOn && (
                <div>
                  Expires on {new Date(consumer.expiresOn).toLocaleDateString()}
                </div>
              )}
            </FrameDescription>
          </div>

          <div className="flex gap-1">
            {onUpdate && (
              <Button
                variant="ghost"
                onClick={handleStartEdit}
                className={cn(
                  "flex gap-2",
                  isEditing && "opacity-0! pointer-events-none",
                )}
                disabled={isEditing}
              >
                <PencilLineIcon size={16} />
                <span className="hidden md:block">Edit label</span>
              </Button>
            )}
            {onRollKey && (
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
                        rollKeyMutation.isPending ? "animate-spin" : undefined
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
                          rollKeyMutation.mutate(consumer.id);
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
        </FrameHeader>
        <FramePanel className="p-0 grid grid-cols-subgrid col-span-full divide-y divide-border">
          <AnimatePresence>
            {consumer.apiKeys.map((apiKey) => (
              <RevealApiKey
                key={apiKey.id}
                apiKey={apiKey}
                onDeleteKey={() => {
                  deleteKeyMutation.mutate({
                    consumerId: consumer.id,
                    keyId: apiKey.id,
                  });
                }}
                className={
                  deleteKeyMutation.variables?.keyId === apiKey.id &&
                  deleteKeyMutation.isPending
                    ? "opacity-10!"
                    : undefined
                }
              />
            ))}
          </AnimatePresence>
        </FramePanel>
      </Frame>
    </>
  );
};

export default ApiKeyItem;
