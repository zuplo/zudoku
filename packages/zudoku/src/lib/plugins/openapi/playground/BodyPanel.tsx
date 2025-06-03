import { useFormContext } from "react-hook-form";
import { Textarea } from "zudoku/ui/Textarea.js";
import { cn } from "../../../util/cn.js";
import { type Content } from "../SidecarExamples.js";
import ExamplesDropdown from "./ExamplesDropdown.js";
import { type PlaygroundForm } from "./Playground.js";

export const BodyPanel = ({ examples }: { examples?: Content }) => {
  const { register, setValue, watch } = useFormContext<PlaygroundForm>();

  const headers = watch("headers");

  return (
    <div className="flex flex-col gap-2 ">
      <div className="flex justify-between gap-2">
        <span className="font-semibold">Body</span>
        <div className="flex flex-col gap-2">
          {examples && examples.length > 0 && (
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
      <Textarea
        {...register("body")}
        className={cn(
          "border w-full rounded-lg bg-muted/40 p-2 h-64 font-mono text-[13px]",
        )}
      />
    </div>
  );
};

export default BodyPanel;
