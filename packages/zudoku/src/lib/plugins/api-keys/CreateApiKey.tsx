import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "zudoku/ui/Select.js";
import { useZudoku } from "../../components/context/ZudokuContext.js";
import { Button } from "../../ui/Button.js";
import { Input } from "../../ui/Input.js";
import { ApiKeyService } from "./index.js";

type CreateApiKey = { description: string; expiresOn?: string };

export const CreateApiKey = ({ service }: { service: ApiKeyService }) => {
  const context = useZudoku();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const form = useForm<CreateApiKey>({
    defaultValues: {
      expiresOn: "30",
    },
  });
  const createKeyMutation = useMutation({
    mutationFn: ({ description, expiresOn }: CreateApiKey) => {
      if (!service.createKey) {
        throw new Error("createKey not implemented");
      }

      const expiresOnDate =
        expiresOn !== "never" ? addDaysToDate(Number(expiresOn)) : undefined;

      return service.createKey(
        { description: description, expiresOn: expiresOnDate },
        context,
      );
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
    <div className="max-w-screen-lg pt-[--padding-content-top] pb-[--padding-content-bottom]">
      <div className="flex justify-between mb-4 border-b pb-1">
        <h1 className="font-medium text-2xl">New API Key</h1>
      </div>
      <form
        onSubmit={form.handleSubmit((data) => createKeyMutation.mutate(data))}
      >
        <div className="flex gap-2 flex-col">
          Note
          <Input {...form.register("description")} />
          Expiration
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
                    {option} days
                  </SelectItem>
                ))}
                <SelectItem value="never">Never</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button>Generate Key</Button>
            <Button variant="outline" asChild>
              <Link to="/settings/api-keys/">Cancel</Link>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

const addDaysToDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};
