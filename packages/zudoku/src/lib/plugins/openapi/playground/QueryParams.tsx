import {
  Control,
  Controller,
  useFieldArray,
  useFormContext,
} from "react-hook-form";
import { Card } from "zudoku/ui/Card.js";
import { Checkbox } from "zudoku/ui/Checkbox.js";
import { Autocomplete } from "../../../components/Autocomplete.js";
import { Input } from "../../../ui/Input.js";
import { InlineInput } from "./InlineInput.js";
import ParamsGrid, { ParamsGridItem } from "./ParamsGrid.js";
import { type PlaygroundForm, type QueryParam } from "./Playground.js";

export const QueryParams = ({
  control,
  queryParams,
}: {
  control: Control<PlaygroundForm>;
  queryParams: QueryParam[];
}) => {
  const { fields } = useFieldArray<PlaygroundForm, "queryParams">({
    control,
    name: "queryParams",
  });
  const form = useFormContext<PlaygroundForm>();

  const requiredFields = queryParams.map((param) => Boolean(param.isRequired));

  return (
    <Card className="rounded-lg">
      <div className="w-full ">
        <ParamsGrid>
          {fields.map((field, i) => {
            const currentParam = queryParams.find(
              (param) => param.name === form.watch(`queryParams.${i}.name`),
            );
            return (
              <ParamsGridItem key={field.id}>
                <div key={field.id} className="flex items-center gap-2">
                  <Controller
                    control={control}
                    name={`queryParams.${i}.active`}
                    render={({ field }) => (
                      <Checkbox
                        id={`queryParams.${i}.active`}
                        className="mr-2"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    render={({ field }) =>
                      !requiredFields[i] ? (
                        <Autocomplete
                          value={field.value}
                          options={queryParams.map((param) => param.name)}
                          onChange={(e) => {
                            field.onChange(e);
                          }}
                          className="border-0 font-mono text-xs bg-transparent hover:bg-transparent"
                        />
                      ) : (
                        <InlineInput asChild>
                          <label
                            className="flex items-center cursor-pointer gap-1"
                            htmlFor={`queryParams.${i}.active`}
                            title={
                              requiredFields[i] ? "Required field" : undefined
                            }
                          >
                            {field.value}
                            {requiredFields[i] && <sup>&nbsp;*</sup>}
                          </label>
                        </InlineInput>
                      )
                    }
                    name={`queryParams.${i}.name`}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <Controller
                    control={control}
                    render={({ field }) => {
                      const hasEnum =
                        currentParam?.enum && currentParam.enum.length > 0;

                      if (!hasEnum) {
                        return (
                          <Input
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              if (e.target.value.length > 0) {
                                form.setValue(`queryParams.${i}.active`, true);
                              }
                            }}
                            placeholder="Enter value"
                            className="w-full border-0 shadow-none focus-visible:ring-0 text-xs font-mono"
                          />
                        );
                      }

                      return (
                        <Autocomplete
                          value={field.value}
                          options={currentParam.enum ?? []}
                          onChange={(e) => {
                            field.onChange(e);
                            form.setValue(`queryParams.${i}.active`, true);
                          }}
                          className="font-mono text-xs border-0 ring-1 ring-ring"
                        />
                      );
                    }}
                    name={`queryParams.${i}.value`}
                  />
                </div>
              </ParamsGridItem>
            );
          })}
        </ParamsGrid>
      </div>
    </Card>
  );
};
