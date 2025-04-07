import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "zudoku/ui/Dialog.js";
import { useZudoku } from "../../components/context/ZudokuContext.js";
import { Badge } from "../../ui/Badge.js";
import { Button } from "../../ui/Button.js";
import { ApiKeyService } from "./index.js";

type CreateApiKey = { description?: string; expiresOn?: string };

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

export const ApiKeyDialog = ({
  service,
  onOpenChange,
}: {
  service: ApiKeyService;
  onOpenChange: (open: boolean) => void;
}) => {
  const context = useZudoku();
  const { data: keys } = useSuspenseQuery({
    queryFn: () => service.getKeys(context),
    queryKey: ["api-keys"],
    retry: false,
  });

  return (
    <Dialog open={true} onOpenChange={() => {}}>
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

        {keys.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Previous API Keys</h3>
            <div className="space-y-2">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">
                      {key.description || "Unnamed API Key"}
                    </span>
                    {key.expiresOn && (
                      <span className="text-xs text-muted-foreground">
                        Expires on {new Date(key.expiresOn).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <RevealApiKey apiKey={key.key} />
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
