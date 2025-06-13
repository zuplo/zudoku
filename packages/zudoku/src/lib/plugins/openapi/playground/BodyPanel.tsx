import { PersonStandingIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Collapsible, CollapsibleContent } from "zudoku/ui/Collapsible.js";
import { Textarea } from "zudoku/ui/Textarea.js";
import { cn } from "../../../util/cn.js";
import { type Content } from "../SidecarExamples.js";
import {
  CollapsibleHeader,
  CollapsibleHeaderTrigger,
} from "./CollapisbleHeader.js";
import ExamplesDropdown from "./ExamplesDropdown.js";
import { type PlaygroundForm } from "./Playground.js";

export const BodyPanel = ({ examples }: { examples?: Content }) => {
  const { register, setValue, watch } = useFormContext<PlaygroundForm>();

  const headers = watch("headers");

  return (
    <Collapsible defaultOpen>
      <CollapsibleHeaderTrigger>
        <PersonStandingIcon size={22} />
        <CollapsibleHeader>Body</CollapsibleHeader>
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
      </CollapsibleHeaderTrigger>
      <CollapsibleContent className="flex flex-col gap-2 ">
        <Textarea
          {...register("body")}
          className={cn(
            "w-full bg-muted/40 p-2 h-64 font-mono text-[13px] border-none rounded-none ",
          )}
        />
      </CollapsibleContent>
    </Collapsible>
  );
};

export default BodyPanel;
