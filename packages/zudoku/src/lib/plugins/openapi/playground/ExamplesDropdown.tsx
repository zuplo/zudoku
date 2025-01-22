import { Button } from "zudoku/ui/Button.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "zudoku/ui/DropdownMenu.js";
import { Content, Example } from "../SidecarExamples.js";

const ExamplesDropdown = ({
  examples,
  onSelect,
}: {
  examples: Content;
  onSelect: (example: Example) => void;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Use Example</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {examples.map((example) => {
          return (
            <div key={example.mediaType}>
              <DropdownMenuLabel>{example.mediaType}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {example.examples?.map((example) => {
                  return (
                    <DropdownMenuItem
                      key={example.name}
                      onSelect={() => onSelect(example)}
                    >
                      {example.name}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExamplesDropdown;
