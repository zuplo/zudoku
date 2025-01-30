import { XIcon } from "lucide-react";
import { useRef } from "react";
import {
  Control,
  Controller,
  useFieldArray,
  useFormContext,
} from "react-hook-form";
import { Card } from "zudoku/ui/Card.js";
import { Checkbox } from "zudoku/ui/Checkbox.js";
import { Autocomplete } from "../../../components/Autocomplete.js";
import { Button } from "../../../ui/Button.js";
import { Input } from "../../../ui/Input.js";
import ParamsGrid from "./ParamsGrid.js";
import { type PlaygroundForm } from "./Playground.js";

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

export const Headers = ({ control }: { control: Control<PlaygroundForm> }) => {
  const { fields, append, remove } = useFieldArray<PlaygroundForm>({
    control,
    name: "headers",
  });
  const { setValue } = useFormContext<PlaygroundForm>();
  const valueRefs = useRef<Array<HTMLInputElement | null>>([]);
  const nameRefs = useRef<Array<HTMLInputElement | null>>([]);

  const addNewHeader = () => {
    append({
      name: "",
      value: "",
      active: false,
    } as PlaygroundForm["headers"][number]);
  };

  const handleHeaderEnter = (index: number) => {
    valueRefs.current[index]?.focus();
  };

  const handleValueEnter = (index: number) => {
    addNewHeader();
    requestAnimationFrame(() => nameRefs.current[index + 1]?.focus());
  };

  return (
    <div className="flex flex-col gap-2">
      <Card className="overflow-hidden">
        <ParamsGrid>
          {fields.map((header, i) => (
            <div
              key={header.name}
              className="group grid col-span-full grid-cols-subgrid"
            >
              <div className="flex items-center gap-2 ">
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
                      options={headerOptions}
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
                  render={({ field }) => (
                    <Input
                      placeholder="Value"
                      className="w-full border-0 shadow-none text-xs font-mono focus-visible:ring-0"
                      {...field}
                      ref={(el) => {
                        valueRefs.current[i] = el;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          handleValueEnter(i);
                        }
                      }}
                      autoComplete="off"
                    />
                  )}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground opacity-0 group-hover:opacity-100 rounded-full w-8 h-7"
                  onClick={() => {
                    remove(i);
                  }}
                  type="button"
                >
                  <XIcon size={16} />
                </Button>
              </div>
            </div>
          ))}
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
