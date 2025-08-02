import { FileInput } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Collapsible, CollapsibleContent } from "zudoku/ui/Collapsible.js";
import { Textarea } from "zudoku/ui/Textarea.js";
import { cn } from "../../../util/cn.js";
import type { MediaTypeObject } from "../graphql/graphql.js";
import {
  CollapsibleHeader,
  CollapsibleHeaderTrigger,
} from "./CollapsibleHeader.js";
import ExamplesDropdown from "./ExamplesDropdown.js";
import type { PlaygroundForm } from "./Playground.js";

export const BodyPanel = ({ content }: { content?: MediaTypeObject[] }) => {
  const { register, setValue, watch } = useFormContext<PlaygroundForm>();
  const examples = (content ?? []).flatMap((e) => e.examples);
  const headers = watch("headers");
  return (
    <Collapsible defaultOpen>
      <CollapsibleHeaderTrigger>
        <FileInput size={16} />
        <CollapsibleHeader>Body</CollapsibleHeader>
        {content && examples.length > 0 ? (
          <ExamplesDropdown
            examples={content}
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
        ) : (
          <div />
        )}
      </CollapsibleHeaderTrigger>
      <CollapsibleContent className="flex flex-col gap-2 ">
        <Textarea
          {...register("body")}
          className={cn(
            "w-full p-2 h-64 font-mono md:text-xs border-none rounded-none focus-visible:ring-0",
          )}
          placeholder="Your body here..."
        />
      </CollapsibleContent>
    </Collapsible>
  );
};

export default BodyPanel;
