import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { XIcon } from "lucide-react";
import { Button } from "../../../ui/Button.js";
import { Input } from "../../../ui/Input.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "zudoku/ui/Select.js";
import ParamsGrid, { ParamsGridItem } from "./ParamsGrid.js";
import type { PlaygroundForm } from "./Playground.js";

const MultipartForm = () => {
  const { control, watch } = useFormContext<PlaygroundForm>();
  const { fields, append, remove } = useFieldArray<PlaygroundForm, "formData">({
    control,
    name: "formData",
  });

  return (
    <div className="flex flex-col gap-2">
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
      <ParamsGrid className="grid-cols-[2fr_2fr_auto_2fr_min-content]">
        {fields.map((field, i) => {
          const watched = watch(`formData.${i}`);
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
                  render={({ field }) =>
                    watched?.type === "file" ? (
                      <Input
                        type="file"
                        onChange={(e) => field.onChange(e.target.files?.[0] ?? null)}
                        className="w-full border-0 shadow-none text-xs font-mono focus-visible:ring-0"
                      />
                    ) : (
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="Value"
                        className="w-full border-0 shadow-none text-xs font-mono focus-visible:ring-0"
                      />
                    )
                  }
                />
              </div>
              <Controller
                name={`formData.${i}.type`}
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v)}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="h-8 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">text</SelectItem>
                      <SelectItem value="file">file</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <Controller
                name={`formData.${i}.contentType`}
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Content-Type"
                    className="w-full border-0 shadow-none text-xs font-mono focus-visible:ring-0"
                  />
                )}
              />
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
    </div>
  );
};

export default MultipartForm;
