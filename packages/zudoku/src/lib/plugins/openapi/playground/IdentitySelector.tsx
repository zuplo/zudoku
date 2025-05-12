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
}) => {
  return (
    <Card className="w-full overflow-hidden">
      <RadioGroup
        onValueChange={(value) => setValue(value)}
        value={value}
        defaultValue={NO_IDENTITY}
        className="gap-0"
        disabled={identities?.length === 0}
      >
        <Label
          className="h-12 border-b items-center flex p-4 cursor-pointer hover:bg-accent"
          htmlFor="none"
        >
          <RadioGroupItem value={NO_IDENTITY} id="none">
            None
          </RadioGroupItem>
          <Label htmlFor="none" className="ml-2">
            None
          </Label>
        </Label>
        {identities?.map((identity) => (
          <Label
            key={identity.id}
            className="h-12 border-b items-center flex p-4 cursor-pointer hover:bg-accent"
          >
            <RadioGroupItem value={identity.id} id={identity.id}>
              {identity.label}
            </RadioGroupItem>
            <Label htmlFor={identity.id} className="ml-2">
              {identity.label}
            </Label>
          </Label>
        ))}
      </RadioGroup>
    </Card>
  );
};

export default IdentitySelector;
