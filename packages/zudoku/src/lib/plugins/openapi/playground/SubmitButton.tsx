import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "zudoku/ui/Button.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "zudoku/ui/DropdownMenu.js";
import { RadioGroup, RadioGroupItem } from "zudoku/ui/RadioGroup.js";
import { ApiIdentity } from "../../../core/ZudokuContext.js";
import { NO_IDENTITY } from "./Playground.js";

const SubmitButton = ({
  identities,
  formRef,
  disabled,
}: {
  identities: ApiIdentity[];
  formRef?: React.RefObject<HTMLFormElement | null>;
  disabled?: boolean;
}) => {
  const { setValue } = useFormContext();
  const [dropdownValue, setDropdownValue] = useState<string | undefined>();
  if (identities.length === 0) {
    return <Button disabled={disabled}>Send</Button>;
  }
  return (
    <div className="flex">
      <Button
        className="rounded-r-none inset-shadow-sm"
        disabled={disabled}
        onClick={() => formRef?.current?.requestSubmit()}
      >
        Send
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={disabled}
            className="rounded-l-none border-l border-border/40 inset-shadow-sm w-6"
            size="icon"
          >
            <ChevronDownIcon className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <RadioGroup value={dropdownValue}>
          <DropdownMenuContent className="w-56" align="end" alignOffset={-150}>
            {[{ id: NO_IDENTITY, label: "None" }, ...identities].map(
              (identity) => (
                <DropdownMenuItem
                  key={identity.id}
                  onClick={() => {
                    setDropdownValue(identity.id);
                    setValue("identity", identity.id);
                    formRef?.current?.requestSubmit();
                  }}
                  onMouseEnter={() => setDropdownValue(identity.id)}
                  onMouseLeave={() => setDropdownValue(undefined)}
                >
                  <RadioGroupItem value={identity.id} className="mr-2" />

                  {identity.label}
                </DropdownMenuItem>
              ),
            )}
          </DropdownMenuContent>
        </RadioGroup>
      </DropdownMenu>
    </div>
  );
};

export default SubmitButton;
