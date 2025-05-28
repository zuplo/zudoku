import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  LoaderPinwheelIcon,
  RotateCwIcon,
  TrashIcon,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
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
import { cn } from "../../util/cn.js";
import { type ApiKey, type ApiKeyService } from "./index.js";

export const SettingsApiKeys = ({ service }: { service: ApiKeyService }) => {
  const context = useZudoku();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery({
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
    <div className="max-w-screen-lg h-full pt-(--padding-content-top) pb-(--padding-content-bottom)">
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
      <div className="grid grid-cols-8">
        {data.length === 0 ? (
          <div className="flex flex-col justify-center gap-4 items-center p-8 border rounded-sm bg-muted/30 text-muted-foreground">
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
              "grid grid-cols-1 divide-y divide-border col-span-6",
              "lg:grid-cols-[1fr_min-content]",
            )}
          >
            {data.map((consumers) => (
              <Card
                className="grid grid-cols-subgrid col-span-full items-center mb-4"
                key={consumers.id}
              >
                <CardHeader className="border-b col-span-full grid-cols-subgrid grid">
                  <div className="flex flex-col text-sm justify-center">
                    <div className="font-medium text-lg">
                      {consumers.name ?? consumers.id}
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
                    {service.rollKey && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="icon"
                            title="Roll this key"
                            variant="ghost"
                            disabled={rollKeyMutation.isPending}
                          >
                            <RotateCwIcon size={16} />
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
                <div className="divide-y col-span-full grid-cols-subgrid grid">
                  <AnimatePresence>
                    {rollKeyMutation.isPending && (
                      <motion.div
                        className={cn(
                          "flex col-span-full items-center gap-2 px-6 py-1 text-xs bg-muted/30 font-medium",
                        )}
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <LoaderPinwheelIcon
                          size={16}
                          className="animate-spin opacity-80"
                        />
                        Rolling key...
                      </motion.div>
                    )}
                    {consumers.apiKeys.map((apiKey) => (
                      <RevealApiKey
                        key={apiKey.id}
                        apiKey={apiKey}
                        onDeleteKey={() => {
                          deleteKeyMutation.mutate({
                            consumerId: consumers.id,
                            keyId: apiKey.id,
                          });
                        }}
                      />
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
}: {
  apiKey: ApiKey;
  onDeleteKey: () => void;
}) => {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

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
    <motion.div
      className="grid col-span-full grid-cols-subgrid p-6"
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col gap-1">
        <div className="flex gap-2 items-center text-sm border rounded-md w-fit px-1">
          <div className="font-mono truncate h-9 items-center flex px-2 text-xs gap-2">
            <div
              className={cn(
                "rounded-full w-2 h-2 bg-emerald-400 mr-2",
                (expiresSoon || isExpired) && "bg-neutral-200",
              )}
            ></div>
            <span>
              <span className={revealed ? "" : "opacity-20"}>
                {revealed
                  ? key.slice(0, -5)
                  : "**** ".repeat(key.slice(0, -5).length / 5) +
                    "*".repeat(key.slice(0, -5).length % 5)}
              </span>
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
            onClick={() => {
              void navigator.clipboard.writeText(key).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
            size="icon"
          >
            {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
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
        {isExpired && onDeleteKey && (
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
    </motion.div>
  );
};
