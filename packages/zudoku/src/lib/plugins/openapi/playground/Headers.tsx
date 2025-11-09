import { CircleAlertIcon, LockIcon, TableOfContentsIcon } from "lucide-react";
import {
  type Control,
  Controller,
  useFieldArray,
  useFormContext,
} from "react-hook-form";
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
import { useAutoAppendItem } from "./request-panel/useAutoAppendItem.js";

const headerOptions = Object.freeze([
  "Accept",
  "Accept-Encoding",
  "Accept-Language",
  "Authorization",
  "Cache-Control",
  "Connection",
  "Content-Disposition",
  "Content-Encoding",
  "Content-Language",
  "Content-Length",
  "Content-Range",
  "Content-Security-Policy",
  "Content-Type",
  "Cookie",
  "Date",
  "ETag",
  "Expires",
  "Host",
  "If-Modified-Since",
  "Location",
  "Origin",
  "Pragma",
  "Referer",
  "Set-Cookie",
  "User-Agent",
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
  const { fields, append, remove } = useFieldArray<PlaygroundForm, "headers">({
    control,
    name: "headers",
  });
  const { setValue, watch, formState } = useFormContext<PlaygroundForm>();
  const watchedHeaders = watch("headers");

  const handleAutoAppend = useAutoAppendItem(watchedHeaders, () =>
    append({ name: "", value: "", active: false }, { shouldFocus: false }),
  );

  const missingHeaders = schemaHeaders
    .filter((h) => !watchedHeaders.some((f) => f.name === h.name))
    .map(({ name }) => name);

  const hiddenHeadersIndex = fields.flatMap((f, index) => {
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
              {fields.map((field, i) => {
                const currentSchemaHeader = schemaHeaders.find(
                  (h) => h.name === watchedHeaders.at(i)?.name,
                );
                return (
                  <ParamsGridItem
                    key={field.id}
                    className={cn(
                      hiddenHeadersIndex.includes(i) && "text-amber-600",
                      hiddenHeadersIndex.includes(i) &&
                        !formState.dirtyFields.headers?.[i]?.value &&
                        "hidden",
                    )}
                  >
                    <Controller
                      control={control}
                      name={`headers.${i}.active`}
                      render={({ field }) => (
                        <>
                          <Checkbox
                            id={`headers.${i}.active`}
                            className={cn(
                              hiddenHeadersIndex.includes(i) && "hidden",
                            )}
                            checked={field.value}
                            onCheckedChange={(c) => field.onChange(c === true)}
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <CircleAlertIcon
                                className={cn(
                                  "text-amber-600",
                                  !hiddenHeadersIndex.includes(i) && "hidden",
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
                        </>
                      )}
                    />
                    <Controller
                      control={control}
                      name={`headers.${i}.name`}
                      render={({ field }) => (
                        <ParamsGridInput asChild>
                          <Autocomplete
                            {...field}
                            placeholder="Name"
                            options={[...missingHeaders, ...headerOptions]}
                            onChange={(e) => {
                              field.onChange(e);
                              setValue(`headers.${i}.active`, true);
                              handleAutoAppend(i);
                            }}
                          />
                        </ParamsGridInput>
                      )}
                    />
                    <div className="flex items-center gap-2">
                      <Controller
                        control={control}
                        name={`headers.${i}.value`}
                        render={({ field }) => {
                          const hasEnum =
                            currentSchemaHeader?.enum &&
                            currentSchemaHeader.enum.length > 0;

                          if (!hasEnum) {
                            return (
                              <ParamsGridInput
                                placeholder="Value"
                                autoComplete="off"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setValue(`headers.${i}.active`, true);
                                  handleAutoAppend(i);
                                }}
                              />
                            );
                          }

                          return (
                            <ParamsGridInput asChild>
                              <Autocomplete
                                shouldFilter={false}
                                value={field.value}
                                options={currentSchemaHeader.enum ?? []}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setValue(`headers.${i}.active`, true);
                                  handleAutoAppend(i);
                                }}
                              />
                            </ParamsGridInput>
                          );
                        }}
                      />
                      <ParamsGridRemoveButton onClick={() => remove(i)} />
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
