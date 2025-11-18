import { Unlink2Icon } from "lucide-react";
import { type Control, useFormContext } from "react-hook-form";
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
import { useKeyValueFieldManager } from "./request-panel/useKeyValueFieldManager.js";

export const QueryParams = ({
  control,
  schemaQueryParams,
}: {
  control: Control<PlaygroundForm>;
  schemaQueryParams: QueryParam[];
}) => {
  const { watch } = useFormContext<PlaygroundForm>();
  const watchedQueryParams = watch("queryParams");

  const manager = useKeyValueFieldManager<PlaygroundForm, "queryParams">({
    control,
    name: "queryParams",
    defaultValue: { name: "", value: "", active: false },
  });

  const requiredFields = schemaQueryParams.map((param) =>
    Boolean(param.isRequired),
  );

  const hasSchemaParams = schemaQueryParams.length > 0;

  return (
    <Collapsible defaultOpen>
      <CollapsibleHeaderTrigger>
        <Unlink2Icon size={16} />
        <CollapsibleHeader>Query Parameters</CollapsibleHeader>
      </CollapsibleHeaderTrigger>
      <CollapsibleContent className="CollapsibleContent">
        <ParamsGrid>
          {manager.fields.map((field, i) => {
            const currentParam = schemaQueryParams.find(
              (param) => param.name === watchedQueryParams.at(i)?.name,
            );
            const hasEnum = currentParam?.enum && currentParam.enum.length > 0;
            const nameInputProps = manager.getNameInputProps(i);
            const valueInputProps = manager.getValueInputProps(i);

            return (
              <ParamsGridItem key={field.id}>
                <Checkbox {...manager.getCheckboxProps(i)} />
                {!requiredFields[i] ? (
                  hasSchemaParams ? (
                    <ParamsGridInput asChild>
                      <Autocomplete
                        {...nameInputProps}
                        value={String(manager.getValue(i, "name"))}
                        placeholder="Name"
                        options={schemaQueryParams.map((param) => param.name)}
                        onChange={(v) => manager.setValue(i, "name", v)}
                        onSelect={(v) =>
                          manager.setValue(i, "name", v, { focus: "next" })
                        }
                      />
                    </ParamsGridInput>
                  ) : (
                    <ParamsGridInput {...nameInputProps} placeholder="Name" />
                  )
                ) : (
                  <ParamsGridInput asChild>
                    <label
                      className="flex items-center cursor-pointer gap-1"
                      htmlFor={`queryParams.${i}.active`}
                      title={requiredFields[i] ? "Required field" : undefined}
                    >
                      {watchedQueryParams[i]?.name}
                      {requiredFields[i] && <sup>&nbsp;*</sup>}
                    </label>
                  </ParamsGridInput>
                )}
                <div className="flex justify-between items-center">
                  {!hasEnum ? (
                    <ParamsGridInput
                      placeholder="Value"
                      aria-label="Query parameter value"
                      {...valueInputProps}
                    />
                  ) : (
                    <ParamsGridInput asChild>
                      <Autocomplete
                        {...valueInputProps}
                        value={String(manager.getValue(i, "value"))}
                        shouldFilter={false}
                        options={currentParam.enum ?? []}
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
      </CollapsibleContent>
    </Collapsible>
  );
};
