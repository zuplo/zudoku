import { EraserIcon } from "lucide-react";
import {
  Control,
  Controller,
  useFieldArray,
  useFormContext,
} from "react-hook-form";
import { Button } from "../../../ui/Button.js";
import { Input } from "../../../ui/Input.js";
import { cn } from "../../../util/cn.js";
import { InlineInput } from "./InlineInput.js";
import {
  NO_IDENTITY,
  type PlaygroundForm,
  type QueryParam,
} from "./Playground.js";

export const QueryParams = ({
  control,
  queryParams,
}: {
  control: Control<PlaygroundForm>;
  queryParams: QueryParam[];
}) => {
  const { fields } = useFieldArray<PlaygroundForm>({
    control,
    name: "queryParams",
  });
  const form = useFormContext<PlaygroundForm>();

  const requiredFields = queryParams.map((param) => Boolean(param.isRequired));

  const selectedIdentity = form.watch("identity");
  const hasSelectedIdentity = selectedIdentity !== NO_IDENTITY;

  return (
    <div className="">
      <table className="w-full [&_td]:border [&_td]:p-1.5 [&_td]:px-2">
        <tbody>
          {fields
            .filter(
              // TODO remove this hack for Accu or make it more generic
              (field) => !(hasSelectedIdentity && field.name === "apikey"),
            )
            .map((field, i) => (
              <tr key={field.id} className="hover:bg-accent/40">
                <td className="text-center">
                  <Controller
                    control={control}
                    name={`queryParams.${i}.active`}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        id={`queryParams.${i}.active`}
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </td>
                <td>
                  <Controller
                    control={control}
                    render={({ field }) => (
                      <InlineInput asChild>
                        <label
                          className="flex items-center cursor-pointer"
                          htmlFor={`queryParams.${i}.active`}
                          title={
                            requiredFields[i] ? "Required field" : undefined
                          }
                        >
                          {field.value}
                          {requiredFields[i] && <sup>&nbsp;*</sup>}
                        </label>
                      </InlineInput>
                    )}
                    name={`queryParams.${i}.name`}
                  />
                </td>
                <td>
                  <div className="flex justify-between items-center">
                    <Controller
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            if (e.target.value.length > 0) {
                              form.setValue(`queryParams.${i}.active`, true);
                            }
                          }}
                          placeholder="Enter value"
                          className="w-full border-0 shadow-none text-xs font-mono"
                        />
                      )}
                      name={`queryParams.${i}.value`}
                    />
                    <Controller
                      control={control}
                      render={({ field }) => (
                        <Button
                          size="icon"
                          type="button"
                          variant="ghost"
                          aria-label="Clear value"
                          className={cn(
                            "ms-2",
                            field.value.length === 0
                              ? "opacity-0 pointer-events-none"
                              : "opacity-100",
                          )}
                          title="Clear value"
                          onClick={() => field.onChange("")}
                        >
                          <EraserIcon size={16} />
                        </Button>
                      )}
                      name={`queryParams.${i}.value`}
                    />
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};
