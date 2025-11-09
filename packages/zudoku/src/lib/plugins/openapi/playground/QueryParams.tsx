import { Unlink2Icon } from "lucide-react";
import {
  type Control,
  Controller,
  useFieldArray,
  useFormContext,
} from "react-hook-form";
import { Checkbox } from "zudoku/ui/Checkbox.js";
import { Collapsible, CollapsibleContent } from "zudoku/ui/Collapsible.js";
import { Autocomplete } from "../../../components/Autocomplete.js";
import {
  CollapsibleHeader,
  CollapsibleHeaderTrigger,
} from "./CollapsibleHeader.js";
import ParamsGrid, {
  ParamsGridInput,
  ParamsGridItem,
  ParamsGridRemoveButton,
} from "./ParamsGrid.js";
import type { PlaygroundForm, QueryParam } from "./Playground.js";
import { useAutoAppendItem } from "./request-panel/useAutoAppendItem.js";

export const QueryParams = ({
  control,
  schemaQueryParams,
}: {
  control: Control<PlaygroundForm>;
  schemaQueryParams: QueryParam[];
}) => {
  const { fields, remove, append } = useFieldArray<
    PlaygroundForm,
    "queryParams"
  >({
    control,
    name: "queryParams",
  });
  const { setValue, watch } = useFormContext<PlaygroundForm>();
  const watchedQueryParams = watch("queryParams");

  const handleAutoAppend = useAutoAppendItem(watchedQueryParams, () =>
    append({ name: "", value: "", active: false }, { shouldFocus: false }),
  );

  const requiredFields = schemaQueryParams.map((param) =>
    Boolean(param.isRequired),
  );

  return (
    <Collapsible defaultOpen>
      <CollapsibleHeaderTrigger>
        <Unlink2Icon size={16} />
        <CollapsibleHeader>Query Parameters</CollapsibleHeader>
      </CollapsibleHeaderTrigger>
      <CollapsibleContent className="CollapsibleContent">
        <ParamsGrid>
          {fields.map((field, i) => {
            const currentParam = schemaQueryParams.find(
              (param) => param.name === watchedQueryParams.at(i)?.name,
            );
            return (
              <ParamsGridItem key={field.id}>
                <Controller
                  control={control}
                  name={`queryParams.${i}.active`}
                  render={({ field }) => (
                    <Checkbox
                      id={`queryParams.${i}.active`}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Controller
                  control={control}
                  render={({ field }) =>
                    !requiredFields[i] ? (
                      <ParamsGridInput asChild>
                        <Autocomplete
                          placeholder="Name"
                          value={field.value}
                          options={schemaQueryParams.map((param) => param.name)}
                          onChange={(e) => {
                            field.onChange(e);
                            setValue(`queryParams.${i}.active`, true);
                            handleAutoAppend(i);
                          }}
                        />
                      </ParamsGridInput>
                    ) : (
                      <ParamsGridInput asChild>
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
                      </ParamsGridInput>
                    )
                  }
                  name={`queryParams.${i}.name`}
                />
                <div className="flex justify-between items-center">
                  <Controller
                    control={control}
                    render={({ field }) => {
                      const hasEnum =
                        currentParam?.enum && currentParam.enum.length > 0;

                      if (!hasEnum) {
                        return (
                          <ParamsGridInput
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setValue(`queryParams.${i}.active`, true);
                              handleAutoAppend(i);
                            }}
                            placeholder="Value"
                            aria-label="Query parameter value"
                          />
                        );
                      }

                      return (
                        <ParamsGridInput asChild>
                          <Autocomplete
                            value={field.value}
                            options={currentParam.enum ?? []}
                            onChange={(e) => {
                              field.onChange(e);
                              setValue(`queryParams.${i}.active`, true);
                              handleAutoAppend(i);
                            }}
                          />
                        </ParamsGridInput>
                      );
                    }}
                    name={`queryParams.${i}.value`}
                  />
                  <ParamsGridRemoveButton onClick={() => remove(i)} />
                </div>
              </ParamsGridItem>
            );
          })}
        </ParamsGrid>
      </CollapsibleContent>
    </Collapsible>
  );
};
