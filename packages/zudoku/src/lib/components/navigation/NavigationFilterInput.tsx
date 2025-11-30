import { SearchIcon, XIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "zudoku/ui/InputGroup.js";
import { useNavigationFilter } from "./NavigationFilterContext.js";

export const NavigationFilterInput = ({
  placeholder,
}: {
  placeholder?: string;
}) => {
  const { query, setQuery } = useNavigationFilter();

  return (
    <InputGroup className="my-2">
      <InputGroupAddon>
        <SearchIcon className="size-3.5" />
      </InputGroupAddon>
      <InputGroupInput
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query && (
        <InputGroupButton onClick={() => setQuery("")}>
          <XIcon className="size-3" />
        </InputGroupButton>
      )}
    </InputGroup>
  );
};
