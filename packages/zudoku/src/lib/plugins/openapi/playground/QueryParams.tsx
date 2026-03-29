import { Unlink2Icon } from "lucide-react";
import { type Control, useFormContext } from "react-hook-form";
import { Checkbox } from "zudoku/ui/Checkbox.js";
import { Collapsible, CollapsibleContent } from "zudoku/ui/Collapsible.js";
import { Autocomplete } from "../../../components/Autocomplete.js";
import { MultiSelect } from "../../../components/MultiSelect.js";
import { useTranslation } from "../../../i18n/I18nContext.js";
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
import { parseArrayParamValue } from "./serializeQueryParams.js";

export const QueryParams = ({
  control,
  schemaQueryParams,
}: {
  control: Control<PlaygroundForm>;
  schemaQueryParams: QueryParam[];
}) => {
  const { t } = useTranslation();
  const { watch } = useFormContext<PlaygroundForm>();
  const watchedQueryParams = watch("queryParams");

  const manager = useKeyValueFieldManager<PlaygroundForm, "queryParams">({
    control,
    name: "queryParams",
    defaultValue: { name: "", value: "", active: false },
    shouldSetActive: (item) => {
      const schemaParam = schemaQueryParams.find((p) => p.name === item.name);
      if (schemaParam) {
        const isRequired = schemaParam.isRequired ?? false;
        const hasValue = Boolean(item.value);
        return isRequired || hasValue;
      }
      return Boolean(item.name || item.value);
    },
  });

  const requiredFields = schemaQueryParams.map((param) =>
    Boolean(param.isRequired),
  );

  const hasSchemaParams = schemaQueryParams.length > 0;

  return (
    <Collapsible defaultOpen>
      <CollapsibleHeaderTrigger>
        <Unlink2Icon size={16} />
        <CollapsibleHeader>
          {t("openapi.playground.queryParameters")}
        </CollapsibleHeader>
      </CollapsibleHeaderTrigger>
      <CollapsibleContent className="CollapsibleContent">
        <ParamsGrid>
          {manager.fields.map((field, i) => {
            const currentParam = schemaQueryParams.find(
              (param) => param.name === watchedQueryParams.at(i)?.name,
            );
            const hasEnum = currentParam?.enum && currentParam.enum.length > 0;
            const isArrayEnum = currentParam?.type === "array" && hasEnum;
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
                        placeholder={t("openapi.playground.field.name")}
                        options={schemaQueryParams.map((param) => param.name)}
                        onChange={(v) => manager.setValue(i, "name", v)}
                        onSelect={(v) =>
                          manager.setValue(i, "name", v, { focus: "next" })
                        }
                      />
                    </ParamsGridInput>
                  ) : (
                    <ParamsGridInput
                      {...nameInputProps}
                      placeholder={t("openapi.playground.field.name")}
                    />
                  )
                ) : (
                  <ParamsGridInput asChild>
                    <label
                      className="flex items-center cursor-pointer gap-1"
                      htmlFor={`queryParams.${i}.active`}
                      title={
                        requiredFields[i]
                          ? t("openapi.playground.field.requiredField")
                          : undefined
                      }
                    >
                      {watchedQueryParams[i]?.name}
                      {requiredFields[i] && <span>&nbsp;*</span>}
                    </label>
                  </ParamsGridInput>
                )}
                <div className="flex justify-between items-center">
                  {isArrayEnum ? (
                    <ParamsGridInput asChild>
                      <MultiSelect
                        options={currentParam.enum ?? []}
                        value={parseArrayParamValue(
                          String(manager.getValue(i, "value")),
                        )}
                        onChange={(values) => {
                          manager.setValue(
                            i,
                            "value",
                            values.length > 0 ? JSON.stringify(values) : "",
                          );
                        }}
                      />
                    </ParamsGridInput>
                  ) : !hasEnum ? (
                    <ParamsGridInput
                      placeholder={t("openapi.playground.field.value")}
                      aria-label={t("openapi.playground.field.queryParamValue")}
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
