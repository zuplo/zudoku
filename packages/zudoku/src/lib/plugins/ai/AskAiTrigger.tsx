import { SparklesIcon } from "lucide-react";
import { Button } from "../../ui/Button.js";
import { cn } from "../../util/cn.js";
import { useAskAiStore } from "./store.js";

export const AskAiTrigger = ({
  label,
  className,
}: {
  label: string;
  className?: string;
}) => {
  const toggle = useAskAiStore((state) => state.toggle);
  const isOpen = useAskAiStore((state) => state.isOpen);

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
