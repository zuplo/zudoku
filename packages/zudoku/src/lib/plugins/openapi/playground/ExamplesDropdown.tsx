import { PlusCircleIcon } from "lucide-react";
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
import type { Content, Example } from "../SidecarExamples.js";

const ExamplesDropdown = ({
  examples,
  onSelect,
}: {
  examples: Content;
  onSelect: (example: Example, mediaType: string) => void;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="hover:bg-black/5">
          Use Example <PlusCircleIcon size={16} className="ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-72">
        {examples.map((mediaTypeObject) => (
          <div key={mediaTypeObject.mediaType}>
            <DropdownMenuLabel>{mediaTypeObject.mediaType}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {mediaTypeObject.examples?.map((example) => (
                <DropdownMenuItem
                  key={example.name}
                  onSelect={() => onSelect(example, mediaTypeObject.mediaType)}
                >
                  <span
                    className="line-clamp-1"
                    title={example.summary ?? example.name}
                  >
                    {example.summary ?? example.name}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExamplesDropdown;
