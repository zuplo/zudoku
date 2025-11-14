import { PaperclipIcon, TrashIcon } from "lucide-react";
import { useRef } from "react";
import { Button } from "zudoku/components";
import { Checkbox } from "zudoku/ui/Checkbox.js";
import { humanFileSize } from "../../../../util/humanFileSize.js";
import {
  ParamsGridInput,
  ParamsGridItem,
  ParamsGridRemoveButton,
} from "../ParamsGrid.js";
import type { PlaygroundForm } from "../Playground.js";
import type { useKeyValueFieldManager } from "./useKeyValueFieldManager.js";

type MultipartFieldProps = {
  index: number;
  manager: ReturnType<
    typeof useKeyValueFieldManager<PlaygroundForm, "multipartFormFields">
  >;
};

export const MultipartField = ({ index, manager }: MultipartFieldProps) => {
  const fieldFileInputRef = useRef<HTMLInputElement>(null);
  const fieldValue = manager.getValue(index, "value");

  return (
    <ParamsGridItem>
      <Checkbox
        {...manager.getCheckboxProps(index)}
        disabled={!manager.getValue(index, "name")}
      />
      <ParamsGridInput
        {...manager.getNameInputProps(index)}
        placeholder="Key"
      />
      <div className="flex items-center gap-1 flex-1">
        {fieldValue instanceof File ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-1 border-b cursor-default">
              <PaperclipIcon size={12} className="text-muted-foreground" />
              <span
                className="text-xs truncate"
                title={`${fieldValue.name} (${humanFileSize(fieldValue.size)})`}
              >
                {fieldValue.name}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="opacity-50 hover:opacity-100 hover:brightness-95 transition-opacity"
              onClick={() => manager.setValue(index, "value", "")}
            >
              <TrashIcon size={13} />
            </Button>
          </div>
        ) : (
          <>
            <ParamsGridInput
              {...manager.getValueInputProps(index)}
              placeholder="Value"
            />
            <input
              ref={fieldFileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                manager.setValue(index, "value", file);
                manager.setValue(index, "active", true);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => fieldFileInputRef.current?.click()}
              title="Attach file"
              className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100 group-hover:brightness-95 transition-opacity"
            >
              <PaperclipIcon size={14} />
            </Button>
          </>
        )}
        <ParamsGridRemoveButton {...manager.getRemoveButtonProps(index)} />
      </div>
    </ParamsGridItem>
  );
};
