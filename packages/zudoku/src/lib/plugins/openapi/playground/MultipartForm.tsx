import { PaperclipIcon, XIcon } from "lucide-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Card } from "zudoku/ui/Card.js";
import { Label } from "zudoku/ui/Label.js";
import { Button } from "../../../ui/Button.js";
import { Input } from "../../../ui/Input.js";
import ParamsGrid, { ParamsGridItem } from "./ParamsGrid.js";
import type { PlaygroundForm } from "./Playground.js";

const MultipartForm = () => {
  const { control, watch } = useFormContext<PlaygroundForm>();
  const { fields, append, remove } = useFieldArray<PlaygroundForm, "formData">({
    control,
    name: "formData",
  });

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() =>
          append({ key: "", value: "", type: "text", contentType: "" })
        }
      >
        + Add field
      </Button>
      <Card className="flex flex-col gap-2">
        <ParamsGrid className="grid-cols-[2fr_2fr_min-content]">
          {fields.map((field, i) => {
            return (
              <ParamsGridItem key={field.id}>
                <Controller
                  name={`formData.${i}.key`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Key"
                      className="w-full border-0 shadow-none text-xs font-mono focus-visible:ring-0"
                    />
                  )}
                />
                <div className="flex items-center gap-2">
                  <Controller
                    name={`formData.${i}.value`}
                    control={control}
                    render={({ field }) => (
                      <>
                        <Input
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="Value"
                          className="w-full border-0 shadow-none text-xs font-mono focus-visible:ring-0"
                        />
                        <Label htmlFor={`formData.${i}.file`}>
                          <Input
                            id={`formData.${i}.file`}
                            type="file"
                            onChange={(e) =>
                              field.onChange(e.target.files?.[0] ?? null)
                            }
                            className="hidden"
                          />
                          <PaperclipIcon
                            size={16}
                            className="text-muted-foreground"
                          />
                        </Label>
                      </>
                    )}
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => remove(i)}
                  type="button"
                >
                  <XIcon size={16} />
                </Button>
              </ParamsGridItem>
            );
          })}
        </ParamsGrid>
      </Card>
    </div>
  );
};

export default MultipartForm;
