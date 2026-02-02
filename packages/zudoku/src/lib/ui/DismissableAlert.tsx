import { Slot } from "@radix-ui/react-slot";
import { XIcon } from "lucide-react";
import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useState,
} from "react";
import { useLatest } from "../util/useLatest.js";
import { Alert, AlertAction } from "./Alert.js";
import { Button } from "./Button.js";

type DismissableAlertContextValue = { dismiss: () => void };

const DismissableAlertContext = createContext<DismissableAlertContextValue>({
  dismiss: () => {},
});

const useDismissableAlertContext = () => {
  const context = use(DismissableAlertContext);
  if (!context) {
    throw new Error(
      "DismissableAlert components must be used within DismissableAlertContext",
    );
  }

  return context;
};

type DismissableAlertProps = React.ComponentProps<typeof Alert> & {
  onDismiss?: () => void;
};

const DismissableAlert = ({ onDismiss, ...props }: DismissableAlertProps) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const latestOnDismiss = useLatest(onDismiss);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    latestOnDismiss.current?.();
  }, [latestOnDismiss]);

  if (isDismissed) return null;

  return (
    <DismissableAlertContext value={{ dismiss }}>
      <Alert {...props} />
    </DismissableAlertContext>
  );
};

type DismissableAlertCloseProps = React.ComponentProps<typeof Button> & {
  asChild?: boolean;
};

const DismissableAlertCloseButton = ({
  asChild,
  ...props
}: DismissableAlertCloseProps) => {
  const { dismiss } = useDismissableAlertContext();
  const Comp = asChild ? Slot : Button;

  return <Comp onClick={dismiss} {...props} />;
};

const DismissableAlertAction = ({ children }: PropsWithChildren) => (
  <AlertAction>
    <DismissableAlertCloseButton
      variant="ghost"
      size="icon-xxs"
      className="hover:text-current hover:bg-[color-mix(in_srgb,currentColor_10%,transparent)]!"
    >
      {children ?? <XIcon className="size-3.5" />}
    </DismissableAlertCloseButton>
  </AlertAction>
);

export {
  DismissableAlert,
  DismissableAlertCloseButton as DismissableAlertClose,
  DismissableAlertAction,
};
