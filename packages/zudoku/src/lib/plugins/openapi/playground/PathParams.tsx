import { EraserIcon } from "lucide-react";
import { Control, Controller, useFieldArray } from "react-hook-form";
import { Button } from "../../../ui/Button.js";
import { Input } from "../../../ui/Input.js";
import { cn } from "../../../util/cn.js";
import { ColorizedParam } from "../ColorizedParam.js";
import type { PlaygroundForm } from "./Playground.js";

export const PathParams = ({
  control,
}: {
  control: Control<PlaygroundForm>;
}) => {
  const { fields } = useFieldArray<PlaygroundForm>({
    control,
    name: "pathParams",
  });

  return (
    <table className="w-full table-auto [&_td]:border [&_td]:py-1 [&_td]:px-2">
      <tbody>
        {fields.map((part, i) => (
          <tr key={part.id} className="hover:bg-accent/40">
            <td>
              <Controller
                control={control}
                name={`pathParams.${i}.value`}
                render={({ field }) => (
                  <div>
                    <ColorizedParam
                      slug={part.name}
                      name={part.name}
                      backgroundOpacity="25%"
                      borderOpacity={field.value ? "100%" : "0"}
                      className={cn(
                        "font-mono text-xs m-2",
                        !field.value && "opacity-60",
                      )}
                    />
                    *
                  </div>
                )}
              />
            </td>
            <td>
              <div className="flex justify-between items-center">
                <Controller
                  control={control}
                  name={`pathParams.${i}.value`}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Enter value"
                      className="border-0 shadow-none ring-0 font-mono text-xs"
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`pathParams.${i}.value`}
                  render={({ field }) => (
                    <Button
                      size="icon"
                      type="button"
                      variant="ghost"
                      aria-label="Clear value"
                      className={cn(
                        "ms-2",
                        field.value.length === 0
                          ? "opacity-0 pointer-events-none"
                          : "opacity-100",
                      )}
                      title="Clear value"
                      onClick={() => field.onChange("")}
                    >
                      <EraserIcon size={16} />
                    </Button>
                  )}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
