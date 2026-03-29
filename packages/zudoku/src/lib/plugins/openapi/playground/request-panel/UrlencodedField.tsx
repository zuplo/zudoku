import { Checkbox } from "zudoku/ui/Checkbox.js";
import {
  ParamsGridInput,
  ParamsGridItem,
  ParamsGridRemoveButton,
} from "../ParamsGrid.js";
import type { PlaygroundForm } from "../Playground.js";
import type { useKeyValueFieldManager } from "./useKeyValueFieldManager.js";

type UrlencodedFieldProps = {
  index: number;
  manager: ReturnType<
    typeof useKeyValueFieldManager<PlaygroundForm, "urlencodedFormFields">
  >;
};

export const UrlencodedField = ({ index, manager }: UrlencodedFieldProps) => {
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
        <ParamsGridInput
          {...manager.getValueInputProps(index)}
          placeholder="Value"
        />
        <ParamsGridRemoveButton {...manager.getRemoveButtonProps(index)} />
      </div>
    </ParamsGridItem>
  );
};
