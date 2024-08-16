import { TriangleAlertIcon, XIcon } from "lucide-react";
import {
  Control,
  useFieldArray,
  UseFormRegister,
  useWatch,
} from "react-hook-form";
import { Button } from "../../../ui/Button.js";
import { cn } from "../../../util/cn.js";
import { InlineInput } from "./InlineInput.js";
import { NO_IDENTITY, type PlaygroundForm } from "./Playground.js";

export const Headers = ({
  control,
  register,
}: {
  register: UseFormRegister<PlaygroundForm>;
  control: Control<PlaygroundForm>;
}) => {
  const { fields, append, remove } = useFieldArray<PlaygroundForm>({
    control,
    name: "headers",
  });
  const selectedIdentity = useWatch({ name: "identity", control });
  const liveHeaders = useWatch({ name: "headers", control });

  const disableAuth = selectedIdentity !== NO_IDENTITY;

  return (
    <div className="grid grid-cols-[1fr_1fr_auto]">
      {fields.map((header, i) => {
        const isDisabledByAuth =
          disableAuth && liveHeaders.at(i)?.name === "Authorization";

        return (
          <div
            key={header.id}
            className={cn(
              "grid-cols-subgrid col-span-full grid items-center gap-x-2 has-[:focus]:bg-muted hover:bg-muted rounded overflow-hidden group",
              isDisabledByAuth && "line-through",
            )}
            title={
              isDisabledByAuth
                ? "This header is disabled because authentication was selected"
                : undefined
            }
          >
            <div className="flex gap-2 items-center">
              <InlineInput
                {...register(`headers.${i}.name`)}
                placeholder="Name"
                className="peer"
                autoComplete="off"
              />
              {isDisabledByAuth && (
                <TriangleAlertIcon size={16} className="text-amber-500" />
              )}
            </div>
            <InlineInput
              placeholder={"Value"}
              className="peer"
              {...register(`headers.${i}.value`)}
              autoComplete="off"
            />
            <button
              className="hover:bg-black/5 p-1 rounded mr-2 text-muted-foreground invisible group-hover:visible peer-focus:visible"
              onClick={() => {
                remove(i);
              }}
              type="button"
            >
              <XIcon size={16} />
            </button>
            <div className="col-span-full border-b"></div>
          </div>
        );
      })}
      <Button
        className="col-span-full mt-4"
        onClick={() => append({ name: "", value: "" })}
        type="button"
      >
        Add header
      </Button>
    </div>
  );
};
