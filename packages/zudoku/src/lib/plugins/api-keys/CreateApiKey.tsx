import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { ActionButton } from "zudoku/ui/ActionButton.js";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert.js";
import { DialogClose, DialogFooter } from "zudoku/ui/Dialog.js";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "zudoku/ui/Select.js";
import { useZudoku } from "../../components/context/ZudokuContext.js";
import { useAuth } from "../../hooks/index.js";
import { useTranslation } from "../../i18n/I18nContext.js";
import { Button } from "../../ui/Button.js";
import { Input } from "../../ui/Input.js";
import type { ApiKeyService } from "./index.js";

type CreateApiKey = { description?: string; expiresOn?: string };

export const CreateApiKey = ({
  service,
  onOpenChange,
}: {
  service: ApiKeyService;
  onOpenChange: (open: boolean) => void;
}) => {
  const { t } = useTranslation();
  const context = useZudoku();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const form = useForm<CreateApiKey>({
    defaultValues: {
      expiresOn: "30",
    },
  });
  const auth = useAuth();

  const createKeyMutation = useMutation({
    mutationFn: ({ description, expiresOn }: CreateApiKey) => {
      if (!service.createKey) {
        throw new Error("createKey not implemented");
      }

      const expiresOnDate =
        expiresOn !== "never" ? addDaysToDate(Number(expiresOn)) : undefined;

      return service.createKey({
        apiKey: {
          description: description || t("apiKeys.defaultName"),
          expiresOn: expiresOnDate,
        },
        context,
        auth,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      await navigate("/settings/api-keys/");
    },
  });

  if (!service.createKey) {
    return null;
  }

  return (
    <form
      onSubmit={form.handleSubmit((data) =>
        createKeyMutation.mutate(
          { ...data },
          {
            onSuccess: () => onOpenChange(false),
          },
        ),
      )}
    >
      {createKeyMutation.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>{t("common.error")}</AlertTitle>
          <AlertDescription>{createKeyMutation.error.message}</AlertDescription>
        </Alert>
      )}
      <div className="flex gap-2 flex-col text-sm font-medium">
        {t("apiKeys.name")}
        <Input {...form.register("description")} />
        {t("apiKeys.expiration")}
        <Select
          onValueChange={(value) => form.setValue("expiresOn", value)}
          defaultValue={form.getValues("expiresOn")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {[7, 30, 60, 90].map((option) => (
                <SelectItem value={String(option)} key={option}>
                  {t("apiKeys.days", { count: option })}
                </SelectItem>
              ))}
              <SelectItem value="never">{t("apiKeys.never")}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("common.cancel")}</Button>
          </DialogClose>
          <ActionButton type="submit" isPending={createKeyMutation.isPending}>
            {t("apiKeys.generateKey")}
          </ActionButton>
        </DialogFooter>
      </div>
    </form>
  );
};

const addDaysToDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};
