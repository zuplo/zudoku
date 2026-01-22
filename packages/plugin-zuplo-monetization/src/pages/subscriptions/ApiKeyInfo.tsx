import { InfoIcon } from "zudoku/icons";

export const ApiKeyInfo = () => {
  return (
    <div className="rounded-lg bg-muted/50 p-4">
      <div className="flex gap-3">
        <InfoIcon className="size-5 shrink-0 text-muted-foreground mt-0.5" />
        <div className="space-y-2">
          <h4 className="font-medium text-sm">How API key management works</h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>
              • Each subscription includes one active API key automatically
            </li>
            <li>
              • Rolling your key creates a new current key and sets the old one
              to expire in 7 days
            </li>
            <li>
              • Expiring keys can be deleted early if you no longer need them
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
