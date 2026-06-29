import { cn } from "zudoku";
import { SparklesIcon } from "zudoku/icons";
import { Button } from "zudoku/ui/Button.js";
import { useAskAi } from "./store.js";

export const AskAiTrigger = ({
  label,
  className,
}: {
  label: string;
  className?: string;
}) => {
  const { isOpen, toggle } = useAskAi();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggle}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      title={label}
      className={cn("gap-1.5", className)}
    >
      <SparklesIcon className="text-primary" />
      {label}
    </Button>
  );
};
