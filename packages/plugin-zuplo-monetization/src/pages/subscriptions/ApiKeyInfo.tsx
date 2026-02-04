import { InfoIcon } from "zudoku/icons";
import { AlertDescription, AlertTitle } from "zudoku/ui/Alert";
import {
  DismissableAlert,
  DismissableAlertAction,
} from "zudoku/ui/DismissableAlert";

export const ApiKeyInfo = () => (
  <DismissableAlert className="space-y-2" fit="loose">
    <InfoIcon />
    <AlertTitle>How API key management works</AlertTitle>
    <AlertDescription>
      <ul className="list-disc list-inside space-y-1">
        <li>Each subscription includes one active API key automatically</li>
        <li>
          Rolling your key creates a new current key and sets the old one to
          expire in 7 days
        </li>
        <li>Expiring keys can be deleted early if you no longer need them</li>
      </ul>
    </AlertDescription>
    <DismissableAlertAction />
  </DismissableAlert>
);
