import { XIcon } from "lucide-react";
import { useRef } from "react";
import {
  Control,
  Controller,
  useFieldArray,
  useFormContext,
  UseFormRegister,
} from "react-hook-form";
import { Card } from "zudoku/ui/Card.js";
import { Checkbox } from "zudoku/ui/Checkbox.js";
import { Autocomplete } from "../../../components/Autocomplete.js";
import { Button } from "../../../ui/Button.js";
import { Input } from "../../../ui/Input.js";
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

export const Headers = ({
  control,
  register,
}: {
  register: UseFormRegister<PlaygroundForm>;
  control: Control<PlaygroundForm>;
}) => {
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
      <Card className="flex flex-col gap-2 overflow-hidden">
        <table className="w-full">
          <tbody>
            {fields.map((header, i) => (
              <tr
                key={header.id}
                className="group has-[:focus]:bg-muted/50 hover:bg-muted/50"
              >
                <td className="flex gap-2 items-center pl-3">
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
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Value"
                      className="w-full border-0 shadow-none text-xs font-mono"
                      {...register(`headers.${i}.value`)}
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
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        remove(i);
                      }}
                      type="button"
                    >
                      <XIcon size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
