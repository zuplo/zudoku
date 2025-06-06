import { Controller, useFormContext } from "react-hook-form";
import { Textarea } from "zudoku/ui/Textarea.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "zudoku/ui/Select.js";
import { cn } from "../../../util/cn.js";
import { type Content } from "../SidecarExamples.js";
import ExamplesDropdown from "./ExamplesDropdown.js";
import MultipartForm from "./MultipartForm.js";
import { type PlaygroundForm } from "./Playground.js";

export const BodyPanel = ({ examples }: { examples?: Content }) => {
  const { register, setValue, watch, control } = useFormContext<PlaygroundForm>();

  const headers = watch("headers");
  const bodyType = watch("bodyType");


  return (
    <div className="flex flex-col gap-2 ">
      <div className="flex justify-between gap-2 items-start">
        <span className="font-semibold">Body</span>
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="bodyType"
            render={({ field }) => (
              <Select
                onValueChange={(v) => field.onChange(v)}
                value={field.value}
                defaultValue={field.value}
              >
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">text</SelectItem>
                  <SelectItem value="multipart/form-data">multipart/form</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {bodyType === "text" && examples && examples.length > 0 && (
            <ExamplesDropdown
              examples={examples}
              onSelect={(example, mediaType) => {
                setValue("body", JSON.stringify(example.value, null, 2));
                setValue("headers", [
                  ...headers.filter((h) => h.name !== "Content-Type"),
                  {
                    name: "Content-Type",
                    value: mediaType,
                    active: true,
                  },
                ]);
              }}
            />
          )}
        </div>
      </div>
      {bodyType === "text" ? (
        <Textarea
          {...register("body")}
          className={cn(
            "border w-full rounded-lg bg-muted/40 p-2 h-64 font-mono text-[13px]",
          )}
        />
      ) : (
        <MultipartForm />
      )}
    </div>
  );
};

export default BodyPanel;
