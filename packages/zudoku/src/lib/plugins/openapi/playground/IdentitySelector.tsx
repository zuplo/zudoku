import { Card } from "zudoku/ui/Card.js";
import { Label } from "zudoku/ui/Label.js";
import { RadioGroup, RadioGroupItem } from "zudoku/ui/RadioGroup.js";
import { type ApiIdentity } from "../../../core/ZudokuContext.js";
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
  <Card className="w-full overflow-hidden">
    <RadioGroup
      onValueChange={(value) => setValue(value)}
      value={value}
      defaultValue={NO_IDENTITY}
      className="gap-0"
      disabled={identities?.length === 0}
    >
      <Label className="h-12 border-b items-center flex gap-2 p-4 cursor-pointer hover:bg-accent">
        <RadioGroupItem value={NO_IDENTITY} id="none" />
        <span>None</span>
      </Label>
      {identities?.map((identity) => (
        <Label
          key={identity.id}
          className="h-12 border-b items-center flex gap-2 p-4 cursor-pointer hover:bg-accent"
        >
          <RadioGroupItem value={identity.id} id={identity.id} />
          <span>{identity.label}</span>
        </Label>
      ))}
    </RadioGroup>
  </Card>
);

export default IdentitySelector;
