import { InfoIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import {
  Control,
  Controller,
  useFieldArray,
  useFormContext,
} from "react-hook-form";
import { Card } from "zudoku/ui/Card.js";
import { Checkbox } from "zudoku/ui/Checkbox.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "zudoku/ui/Tooltip.js";
import { Autocomplete } from "../../../components/Autocomplete.js";
import { Button } from "../../../ui/Button.js";
import { Input } from "../../../ui/Input.js";
import ParamsGrid, { ParamsGridItem } from "./ParamsGrid.js";
import { Header, type PlaygroundForm } from "./Playground.js";

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
  headers: schemaHeaders,
  authorizationHeaders,
}: {
  control: Control<PlaygroundForm>;
  headers: Header[];
  authorizationHeaders: Header[];
}) => {
  const { fields, append, remove } = useFieldArray<PlaygroundForm, "headers">({
    control,
    name: "headers",
  });
  const { setValue, watch } = useFormContext<PlaygroundForm>();
  const valueRefs = useRef<Array<HTMLInputElement | null>>([]);
  const nameRefs = useRef<Array<HTMLInputElement | null>>([]);
  const watchedHeaders = watch("headers");

  const addNewHeader = useCallback(() => {
    append({ name: "", value: "", active: false });
  }, [append]);

  useEffect(() => {
    if (watchedHeaders.length === 0) {
      addNewHeader();
    }
  }, [watchedHeaders, addNewHeader]);

  const handleHeaderEnter = (index: number) => {
    valueRefs.current[index]?.focus();
  };

  const handleValueEnter = (index: number) => {
    addNewHeader();
    requestAnimationFrame(() => nameRefs.current[index + 1]?.focus());
  };

  const missingHeaders = schemaHeaders
    .filter((h) => !watchedHeaders.some((f) => f.name === h.name))
    .map(({ name }) => name);

  console.log(authorizationHeaders, fields);

  return (
    <div className="flex flex-col gap-2">
      <Card className="overflow-hidden">
        <ParamsGrid>
          {fields
            .filter(
              (field) =>
                !authorizationHeaders.some((h) => h.name === field.name),
            )
            .map((field, i) => {
              console.log(field.name);
              if (field.name === "Authorization") {
                debugger;
                return null;
              }
              const currentHeader = schemaHeaders.find(
                (h) => h.name === watch(`headers.${i}.name`),
              );
              return (
                <ParamsGridItem key={field.id}>
                  <div className="flex items-center gap-2">
                    <Controller
                      control={control}
                      name={`headers.${i}.active`}
                      render={({ field }) => (
                        <Checkbox
                          variant="outline"
                          id={`headers.${i}.active`}
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                          }}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name={`headers.${i}.name`}
                      render={({ field }) => (
                        <Autocomplete
                          {...field}
                          placeholder="Name"
                          className="border-0 shadow-none bg-transparent text-xs font-mono"
                          options={[...missingHeaders, ...headerOptions]}
                          onEnterPress={() => handleHeaderEnter(i)}
                          onChange={(e) => {
                            field.onChange(e);
                            setValue(`headers.${i}.active`, true);
                          }}
                          ref={(el) => {
                            nameRefs.current[i] = el;
                          }}
                        />
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Controller
                      control={control}
                      name={`headers.${i}.value`}
                      render={({ field }) => {
                        const hasEnum =
                          currentHeader?.enum && currentHeader.enum.length > 0;

                        if (!hasEnum) {
                          return (
                            <Input
                              placeholder="Value"
                              className="w-full border-0 shadow-none text-xs font-mono focus-visible:ring-0"
                              {...field}
                              ref={(el) => {
                                valueRefs.current[i] = el;
                              }}
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  e.currentTarget.value.trim()
                                ) {
                                  handleValueEnter(i);
                                }
                              }}
                              autoComplete="off"
                            />
                          );
                        }

                        return (
                          <Autocomplete
                            shouldFilter={false}
                            value={field.value}
                            options={currentHeader.enum ?? []}
                            onChange={(e) => {
                              field.onChange(e);
                              setValue(`headers.${i}.active`, true);
                            }}
                            className="font-mono text-xs border-0"
                          />
                        );
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground opacity-0 group-hover:opacity-100 rounded-full w-8 h-7"
                      onClick={() => remove(i)}
                      type="button"
                    >
                      <XIcon size={16} />
                    </Button>
                  </div>
                </ParamsGridItem>
              );
            })}
          <TooltipProvider>
            {authorizationHeaders.map((field) => {
              return (
                <Tooltip key={field.name}>
                  <TooltipTrigger asChild>
                    <ParamsGridItem className="italic items-center">
                      <div className="flex items-center gap-2 cursor-not-allowed h-9">
                        <InfoIcon size={16} className="text-muted-foreground" />
                        <div className="px-3 font-mono text-xs">
                          {field.name}
                        </div>
                      </div>
                      <div className="px-3 font-mono text-xs">*********</div>
                    </ParamsGridItem>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{field.name}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </ParamsGrid>
      </Card>
      <div className="text-end">
        <Button
          className=""
          onClick={addNewHeader}
          type="button"
          variant="secondary"
        >
          Add header
        </Button>
      </div>
    </div>
  );
};
