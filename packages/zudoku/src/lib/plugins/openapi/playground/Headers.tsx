import { XIcon } from "lucide-react";
import { Control, useFieldArray, UseFormRegister } from "react-hook-form";
import { Button } from "../../../ui/Button.js";
import { Input } from "../../../ui/Input.js";
import { type PlaygroundForm } from "./Playground.js";

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

  return (
    <div className="flex flex-col gap-2">
      <table className="w-full [&_td]:border [&_td]:p-1.5 [&_td]:px-2">
        <tbody>
          {fields.map((header, i) => (
            <tr
              key={header.id}
              className="group has-[:focus]:bg-muted/50 hover:bg-muted/50"
            >
              <td className="flex gap-2 items-center">
                <Input
                  {...register(`headers.${i}.name`)}
                  placeholder="Name"
                  className="border-0 shadow-none text-xs font-mono"
                  autoComplete="off"
                />
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={"Value"}
                    className="border-0 shadow-none text-xs font-mono"
                    {...register(`headers.${i}.value`)}
                    autoComplete="off"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground opacity-0 group-hover:opacity-100"
                    onClick={() => {
                      remove(i);
                    }}
                    type="button"
                  >
                    <XIcon size={16} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-end">
        <Button
          className=""
          onClick={() => append({ name: "", value: "" })}
          type="button"
        >
          Add header
        </Button>
      </div>
    </div>
  );
};
