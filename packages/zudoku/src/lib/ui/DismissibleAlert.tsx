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

type DismissibleAlertContextValue = { dismiss: () => void };

const DismissibleAlertContext = createContext<DismissibleAlertContextValue>({
  dismiss: () => {},
});

const useDismissibleAlertContext = () => use(DismissibleAlertContext);

type DismissibleAlertProps = React.ComponentProps<typeof Alert> & {
  onDismiss?: () => void;
};

const DismissibleAlert = ({ onDismiss, ...props }: DismissibleAlertProps) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const latestOnDismiss = useLatest(onDismiss);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    latestOnDismiss.current?.();
  }, [latestOnDismiss]);

  if (isDismissed) return null;

  return (
    <DismissibleAlertContext value={{ dismiss }}>
      <Alert {...props} />
    </DismissibleAlertContext>
  );
};

type DismissibleAlertCloseProps = React.ComponentProps<typeof Button> & {
  asChild?: boolean;
};

const DismissibleAlertCloseButton = ({
  asChild,
  ...props
}: DismissibleAlertCloseProps) => {
  const { dismiss } = useDismissibleAlertContext();
  const Comp = asChild ? Slot : Button;

  return <Comp onClick={dismiss} {...props} />;
};

const DismissibleAlertAction = ({ children }: PropsWithChildren) => (
  <AlertAction>
    <DismissibleAlertCloseButton
      variant="ghost"
      size="icon-xxs"
      className="hover:text-current hover:bg-[color-mix(in_srgb,currentColor_10%,transparent)]!"
    >
      {children ?? <XIcon className="size-3.5" />}
    </DismissibleAlertCloseButton>
  </AlertAction>
);

export {
  DismissibleAlert,
  DismissibleAlertCloseButton as DismissibleAlertClose,
  DismissibleAlertAction,
};
