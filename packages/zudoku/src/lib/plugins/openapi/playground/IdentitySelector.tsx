import { Label } from "zudoku/ui/Label.js";
import { RadioGroup, RadioGroupItem } from "zudoku/ui/RadioGroup.js";
import type { ApiIdentity } from "../../../core/ZudokuContext.js";
import { NO_IDENTITY } from "./Playground.js";

const IdentitySelector = ({
  identities,
  setValue,
  value,
}: {
  identities?: ApiIdentity[];
  setValue: (value: string) => void;
  value?: string;
}) => (
  <div className="w-full overflow-hidden">
    <RadioGroup
      onValueChange={(value) => setValue(value)}
      value={value}
      defaultValue={NO_IDENTITY}
      className="gap-0"
      disabled={identities?.length === 0}
    >
      {[{ id: NO_IDENTITY, label: "None" }, ...(identities ?? [])].map(
        (identity) => (
          <Label
            key={identity.id}
            className="h-10 items-center border-b font-normal flex gap-4 p-4 cursor-pointer hover:bg-accent/75"
          >
            <RadioGroupItem value={identity.id} id={identity.id} />
            <span>{identity.label}</span>
          </Label>
        ),
      )}
    </RadioGroup>
  </div>
);

export default IdentitySelector;
