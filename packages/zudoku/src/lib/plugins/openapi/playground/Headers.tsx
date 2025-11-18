import { CircleAlertIcon, LockIcon, TableOfContentsIcon } from "lucide-react";
import { type Control, useFormContext } from "react-hook-form";
import { Checkbox } from "zudoku/ui/Checkbox.js";
import { Collapsible, CollapsibleContent } from "zudoku/ui/Collapsible.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "zudoku/ui/Tooltip.js";
import { Autocomplete } from "../../../components/Autocomplete.js";
import { cn } from "../../../util/cn.js";
import {
  CollapsibleHeader,
  CollapsibleHeaderTrigger,
} from "./CollapsibleHeader.js";
import ParamsGrid, {
  ParamsGridInput,
  ParamsGridItem,
  ParamsGridRemoveButton,
} from "./ParamsGrid.js";
import type { Header, PlaygroundForm } from "./Playground.js";
import { useKeyValueFieldManager } from "./request-panel/useKeyValueFieldManager.js";

// biome-ignore format: Easier to read
const headerOptions = Object.freeze([
  "Accept", "Accept-Encoding", "Accept-Language", "Authorization", "Cache-Control", "Connection",
  "Content-Disposition", "Content-Encoding", "Content-Language", "Content-Length", "Content-Range",
  "Content-Security-Policy", "Content-Type", "Cookie", "Date", "ETag", "Expires", "Host",
  "If-Modified-Since", "Location", "Origin", "Pragma", "Referer", "Set-Cookie", "User-Agent",
  "X-Requested-With",
]);

export const Headers = ({
  control,
  schemaHeaders,
  lockedHeaders,
}: {
  control: Control<PlaygroundForm>;
  schemaHeaders: Header[];
  lockedHeaders?: string[];
}) => {
  const { watch, formState } = useFormContext<PlaygroundForm>();
  const watchedHeaders = watch("headers");

  const manager = useKeyValueFieldManager<PlaygroundForm, "headers">({
    control,
    name: "headers",
    defaultValue: { name: "", value: "", active: false },
  });

  const missingHeaders = schemaHeaders
    .filter((h) => !watchedHeaders.some((f) => f.name === h.name))
    .map(({ name }) => name);

  const hiddenHeadersIndex = manager.fields.flatMap((f, index) => {
    const keep = !lockedHeaders
      ?.map((h) => h.toLowerCase())
      .includes(f.name.toLowerCase());

    return keep ? [] : [index];
  });

  const lockedHeaderFields =
    lockedHeaders?.map((h) => ({
      name: h,
      id: `locked-${h}`,
      value: "••••••••••",
      active: true,
      locked: true,
    })) ?? [];

  return (
    <Collapsible defaultOpen>
      <CollapsibleHeaderTrigger>
        <TableOfContentsIcon size={14} />
        <CollapsibleHeader>Headers</CollapsibleHeader>
      </CollapsibleHeaderTrigger>
      <CollapsibleContent className="CollapsibleContent">
        <div className="flex flex-col gap-2">
          <div className="overflow-hidden">
            <ParamsGrid>
              {lockedHeaderFields.map((field) => (
                <Tooltip key={field.id}>
                  <TooltipTrigger asChild>
                    <ParamsGridItem
                      key={field.id}
                      className="opacity-50 cursor-not-allowed font-mono text-xs min-h-10"
                    >
                      <LockIcon size={16} />
                      <ParamsGridInput value={field.name} disabled />
                      <div>{field.value}</div>
                    </ParamsGridItem>
                  </TooltipTrigger>
                  <TooltipContent alignOffset={10} side="bottom" align="start">
                    <p>This header is set by the selected authentication.</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {manager.fields.map((field, i) => {
                const currentSchemaHeader = schemaHeaders.find(
                  (h) => h.name === watchedHeaders.at(i)?.name,
                );
                const hasEnum =
                  currentSchemaHeader?.enum &&
                  currentSchemaHeader.enum.length > 0;
                const isHidden = hiddenHeadersIndex.includes(i);
                const nameInputProps = manager.getNameInputProps(i);
                const valueInputProps = manager.getValueInputProps(i);

                return (
                  <ParamsGridItem
                    key={field.id}
                    className={cn(
                      isHidden && "text-amber-600",
                      isHidden &&
                        !formState.dirtyFields.headers?.[i]?.value &&
                        "hidden",
                    )}
                  >
                    <Checkbox
                      className={cn(isHidden && "hidden")}
                      {...manager.getCheckboxProps(i)}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CircleAlertIcon
                          className={cn(
                            "text-amber-600",
                            !isHidden && "hidden",
                          )}
                          size={16}
                        />
                      </TooltipTrigger>
                      <TooltipContent
                        alignOffset={10}
                        side="bottom"
                        align="start"
                      >
                        <p>
                          This header will be overwritten by the selected
                          authentication.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <ParamsGridInput asChild>
                      <Autocomplete
                        {...nameInputProps}
                        value={String(manager.getValue(i, "name"))}
                        placeholder="Name"
                        options={[...missingHeaders, ...headerOptions]}
                        onChange={(v) => manager.setValue(i, "name", v)}
                        onSelect={(v) =>
                          manager.setValue(i, "name", v, { focus: "next" })
                        }
                      />
                    </ParamsGridInput>
                    <div className="flex items-center gap-2">
                      {!hasEnum ? (
                        <ParamsGridInput
                          placeholder="Value"
                          autoComplete="off"
                          {...valueInputProps}
                        />
                      ) : (
                        <ParamsGridInput asChild>
                          <Autocomplete
                            {...valueInputProps}
                            value={String(manager.getValue(i, "value"))}
                            shouldFilter={false}
                            options={currentSchemaHeader.enum ?? []}
                            onChange={(v) => manager.setValue(i, "value", v)}
                            onSelect={(v) =>
                              manager.setValue(i, "value", v, { focus: "next" })
                            }
                          />
                        </ParamsGridInput>
                      )}
                      <ParamsGridRemoveButton
                        {...manager.getRemoveButtonProps(i)}
                      />
                    </div>
                  </ParamsGridItem>
                );
              })}
            </ParamsGrid>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
