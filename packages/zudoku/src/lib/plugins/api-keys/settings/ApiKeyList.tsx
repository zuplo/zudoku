import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useZudoku } from "../../../components/context/ZudokuContext.js";
import { cn } from "../../../util/cn.js";
import { ZudokuError } from "../../../util/invariant.js";
import { CreateApiKeyDialog } from "../CreateApiKeyDialog.js";
import type { ApiKeyService } from "../index.js";
import ApiKeyItem from "./ApiKeyItem.js";

export const ApiKeyList = ({ service }: { service: ApiKeyService }) => {
  const context = useZudoku();

  const { data } = useSuspenseQuery({
    queryFn: async () => {
      try {
        return await service.getConsumers(context);
      } catch (error) {
        if (error instanceof ZudokuError) {
          throw error;
        }
        throw new ZudokuError("Cannot get API keys", {
          cause: error,
          title: "Error getting API keys",
          developerHint:
            "Check the response of the API request for more information.",
        });
      }
    },
    queryKey: ["api-keys"],
    retry: false,
  });

  const [isCreateApiKeyOpen, setIsCreateApiKeyOpen] = useState(false);

  return (
    <div className="mt-8">
      {data.length === 0 ? (
        <div className="flex col-span-full flex-col justify-center gap-4 items-center p-8 border rounded-sm bg-muted/30 text-muted-foreground">
          <p className="text-center">
            You have no API keys yet.
            <br />
            {service.createKey && "Get started and create your first key."}
          </p>
          {service.createKey && (
            <CreateApiKeyDialog
              service={service}
              isOpen={isCreateApiKeyOpen}
              onOpenChange={setIsCreateApiKeyOpen}
            />
          )}
        </div>
      ) : (
        <ul className={cn("grid grid-cols-[1fr_min-content] col-span-6")}>
          {data.map((consumer) => (
            <ApiKeyItem
              key={consumer.id}
              consumer={consumer}
              onUpdate={service.updateConsumer}
              onRollKey={service.rollKey}
              onDeleteKey={service.deleteKey}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
