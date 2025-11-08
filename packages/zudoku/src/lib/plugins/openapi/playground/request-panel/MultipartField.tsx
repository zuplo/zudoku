import { PaperclipIcon, TrashIcon } from "lucide-react";
import { useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Button } from "zudoku/components";
import { Checkbox } from "zudoku/ui/Checkbox.js";
import { humanFileSize } from "../../../../util/humanFileSize.js";
import {
  ParamsGridInput,
  ParamsGridItem,
  ParamsGridRemoveButton,
} from "../ParamsGrid.js";
import type { PlaygroundForm } from "../Playground.js";

type MultipartFieldProps = {
  index: number;
  field: NonNullable<PlaygroundForm["multipartFormFields"]>[number];
  onRemove: () => void;
  onAutoAppend: () => void;
  isLastField: boolean;
};

export const MultipartField = ({
  index,
  onRemove,
  onAutoAppend,
  isLastField,
}: MultipartFieldProps) => {
  const { control, setValue, watch } = useFormContext<PlaygroundForm>();
  const fieldFileInputRef = useRef<HTMLInputElement>(null);
  const fieldValue = watch(`multipartFormFields.${index}.value`);

  return (
    <ParamsGridItem>
      <Controller
        control={control}
        name={`multipartFormFields.${index}.active`}
        render={({ field }) => (
          <Checkbox
            checked={field.value}
            onCheckedChange={(checked) => {
              field.onChange(checked === true);
            }}
          />
        )}
      />
      <Controller
        control={control}
        name={`multipartFormFields.${index}.key`}
        render={({ field }) => (
          <ParamsGridInput
            {...field}
            placeholder="Key"
            onChange={(e) => {
              field.onChange(e);
              setValue(`multipartFormFields.${index}.active`, true);
              if (isLastField) onAutoAppend();
            }}
          />
        )}
      />
      <div className="flex items-center gap-1 flex-1">
        {fieldValue instanceof File ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <PaperclipIcon size={12} className="text-muted-foreground" />
            <span className="text-xs truncate" title={fieldValue.name}>
              {fieldValue.name}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              ({humanFileSize(fieldValue.size)})
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xxs"
              onClick={() => setValue(`multipartFormFields.${index}.value`, "")}
            >
              <TrashIcon size={12} />
            </Button>
          </div>
        ) : (
          <>
            <Controller
              control={control}
              name={`multipartFormFields.${index}.value`}
              render={({ field }) => (
                <ParamsGridInput
                  {...field}
                  value={typeof field.value === "string" ? field.value : ""}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    setValue(`multipartFormFields.${index}.active`, true);
                    if (isLastField) onAutoAppend();
                  }}
                  placeholder="Value"
                />
              )}
            />
            <input
              ref={fieldFileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                setValue(`multipartFormFields.${index}.value`, file);
                setValue(`multipartFormFields.${index}.active`, true);
                if (isLastField) onAutoAppend();
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => fieldFileInputRef.current?.click()}
              title="Attach file"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <PaperclipIcon size={14} />
            </Button>
          </>
        )}
        <ParamsGridRemoveButton
          onClick={onRemove}
          className={isLastField ? "opacity-0! pointer-events-none" : ""}
        />
      </div>
    </ParamsGridItem>
  );
};
