import { PlusCircleIcon, Unlink2Icon } from "lucide-react";
import { useEffect } from "react";
import {
  type Control,
  Controller,
  useFieldArray,
  useFormContext,
} from "react-hook-form";
import { Button } from "zudoku/ui/Button.js";
import { Checkbox } from "zudoku/ui/Checkbox.js";
import { Collapsible, CollapsibleContent } from "zudoku/ui/Collapsible.js";
import { Autocomplete } from "../../../components/Autocomplete.js";
import { Input } from "../../../ui/Input.js";
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
  const { setValue, getValues, watch } = useFormContext<PlaygroundForm>();
  const watchedQueryParams = watch("queryParams");
  useEffect(() => {
    if (watchedQueryParams.length === 0) {
      append({ name: "", value: "", active: false }, { shouldFocus: true });
    }
  }, [watchedQueryParams, append]);

  const requiredFields = schemaQueryParams.map((param) =>
    Boolean(param.isRequired),
  );

  return (
    <Collapsible defaultOpen>
      <CollapsibleHeaderTrigger>
        <Unlink2Icon size={16} />
        <CollapsibleHeader>Query Parameters</CollapsibleHeader>
        <Button
          onClick={() => {
            setValue("queryParams", [
              ...getValues("queryParams"),
              { name: "", value: "", active: false },
            ]);
          }}
          type="button"
          size="sm"
          variant="ghost"
          className="hover:bg-accent hover:brightness-95 flex gap-2"
        >
          Add parameter <PlusCircleIcon size={14} />
        </Button>
      </CollapsibleHeaderTrigger>
      <CollapsibleContent className="CollapsibleContent">
        <div className="overflow-hidden w-full">
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
                            options={schemaQueryParams.map(
                              (param) => param.name,
                            )}
                            onChange={(e) => {
                              field.onChange(e);
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
                            <Input
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                if (e.target.value.length > 0) {
                                  setValue(`queryParams.${i}.active`, true);
                                }
                              }}
                              placeholder="Value"
                              aria-label="Query parameter value"
                              className="w-full border-0 p-0 m-0 shadow-none focus-visible:ring-0 text-xs font-mono"
                            />
                          );
                        }

                        return (
                          <Autocomplete
                            value={field.value}
                            options={currentParam.enum ?? []}
                            onChange={(e) => {
                              field.onChange(e);
                              setValue(`queryParams.${i}.active`, true);
                            }}
                            className="border-0 shadow-none focus-visible:ring-0 bg-transparent hover:bg-transparent text-xs font-mono"
                          />
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
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
