import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "zudoku/ui/Dialog.js";
import { Button } from "../../ui/Button.js";
import { CreateApiKey } from "./CreateApiKey.js";
import type { ApiKeyService } from "./index.js";

interface CreateApiKeyDialogProps {
  service: ApiKeyService;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: ReactNode;
  buttonVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}

export const CreateApiKeyDialog = ({
  service,
  isOpen,
  onOpenChange,
  trigger,
  buttonVariant = "outline",
}: CreateApiKeyDialogProps) => {
  const defaultTrigger = (
    <Button variant={buttonVariant}>Create API Key</Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
        </DialogHeader>
        <CreateApiKey service={service} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
};
