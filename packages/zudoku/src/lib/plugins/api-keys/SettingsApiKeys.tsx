import { DialogTrigger } from "@radix-ui/react-dialog";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  CheckIcon,
  CopyIcon,
  KeyRoundIcon,
  RotateCwIcon,
  TrashIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, Outlet } from "react-router";
import { Alert, AlertDescription } from "zudoku/ui/Alert.js";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "zudoku/ui/AlertDialog.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "zudoku/ui/Dialog.js";
import { useZudoku } from "../../components/context/ZudokuContext.js";
import { Slotlet } from "../../components/SlotletProvider.js";
import { Badge } from "../../ui/Badge.js";
import { Button } from "../../ui/Button.js";
import { cn } from "../../util/cn.js";
import { CreateApiKey } from "./CreateApiKey.js";
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

  const [open, setOpen] = useState(false);

  return (
    <div className="w-full h-full pt-[--padding-content-top] pb-[--padding-content-bottom]">
      <Slotlet name="api-keys-list-page" />
      <Outlet />

      <div className="flex justify-between mb-2 pb-3 items-end gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-medium text-2xl">API Keys</h1>
          <p className="text-sm text-muted-foreground max-w-prose">
            Manage your API keys and create new ones. Do not share your API key
            with others or expose it in the browser or other client-side code.
          </p>
        </div>
        {service.createKey && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Create API Key</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
                <DialogDescription>
                  Create a new API key to use in your application.
                </DialogDescription>
              </DialogHeader>
              <CreateApiKey service={service} onOpenChange={setOpen} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Slotlet name="api-keys-list-page-before-keys" />

      {data.length === 0 ? (
        <div className="flex flex-col justify-center gap-4 items-center p-8 border rounded bg-muted/30 text-muted-foreground">
          <div className="rounded-full bg-muted p-4">
            <KeyRoundIcon size={32} />
          </div>
          <p className="text-center text-sm">
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
            "grid rounded-md border divide-y divide-border overflow-hidden",
            "grid-cols-[1fr_max-content_min-content] gap-x-2",
            "md:grid-cols-[4fr_max-content_max-content_max-content_minmax(min-content,1fr)] sm:gap-x-10",
          )}
        >
          <div className="p-3 py-2 grid grid-cols-subgrid col-span-full bg-muted text-sm">
            <div>Description</div>
            <div>Key</div>
            <div className="hidden md:block">Created</div>
            <div className="hidden md:block">Expires</div>
            <div></div>
          </div>
          {data.map((key) => (
            <li
              className="px-3 py-1.5 grid grid-cols-subgrid col-span-full items-center"
              key={key.id}
            >
              <div className="max-w-md text-sm overflow-hidden text-ellipsis line-clamp-2 min-w-0 break-all">
                {key.description ? (
                  key.description
                ) : (
                  <span className="text-muted-foreground text-">
                    Unnamed API Key
                  </span>
                )}
              </div>
              <RevealApiKey apiKey={key.key} />
              <div className="text-muted-foreground text-sm text-nowrap hidden md:block">
                {key.createdOn && new Date(key.createdOn).toLocaleString()}
              </div>
              <div className="text-muted-foreground text-sm text-nowrap hidden md:block">
                {key.expiresOn ? (
                  <>Expires on {new Date(key.expiresOn).toLocaleString()}</>
                ) : (
                  "Never"
                )}
              </div>
              <div className="flex justify-end">
                {service.rollKey && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" title="Roll this key" variant="ghost">
                        <RotateCwIcon size={16} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Roll API Key</AlertDialogTitle>
                      </AlertDialogHeader>
                      {rollKeyMutation.isError && (
                        <Alert variant="destructive">
                          <AlertDescription>
                            {rollKeyMutation.error.message}
                          </AlertDescription>
                        </Alert>
                      )}
                      <AlertDialogDescription>
                        Are you sure you want to roll this API key? This will
                        invalidate the current key and create a new one.
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel asChild>
                          <Button variant="outline">Cancel</Button>
                        </AlertDialogCancel>
                        <Button
                          variant="destructive"
                          onClick={() => rollKeyMutation.mutate(key.id)}
                        >
                          Invalidate & Roll
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                {service.deleteKey && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost-destructive" size="icon">
                        <TrashIcon size={16} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                      </AlertDialogHeader>
                      {deleteKeyMutation.isError && (
                        <Alert variant="destructive">
                          <AlertDescription>
                            {deleteKeyMutation.error.message}
                          </AlertDescription>
                        </Alert>
                      )}
                      <AlertDialogDescription>
                        Are you sure you want to delete this API key? This will
                        permanently delete the key and it will no longer work.
                      </AlertDialogDescription>

                      <AlertDialogFooter>
                        <AlertDialogCancel asChild>
                          <Button variant="outline">Cancel</Button>
                        </AlertDialogCancel>
                        <Button
                          variant="destructive"
                          onClick={() => deleteKeyMutation.mutate(key.id)}
                        >
                          Delete
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex gap-0.5 items-center text-sm">
      <Badge variant="secondary" className="font-mono">
        {apiKey.slice(0, 4)}
        <span className="hidden sm:inline">
          {"•".repeat(Math.max(Math.min(20, apiKey.length - 8), 4))}
        </span>
        <span className="inline sm:hidden">
          {"•".repeat(Math.max(Math.min(5, apiKey.length - 8), 4))}
        </span>
        {apiKey.slice(-4)}
      </Badge>

      <Button
        variant="ghost"
        onClick={() => {
          void navigator.clipboard.writeText(apiKey).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          });
        }}
        size="icon-xs"
      >
        {copied ? (
          <CheckIcon className="text-green-600" size={15} />
        ) : (
          <CopyIcon size={15} />
        )}
      </Button>
    </div>
  );
};
