import { Button, useZudoku } from "zudoku/components";
import { ExternalLinkIcon } from "zudoku/icons";
import { useQuery } from "zudoku/react-query";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "zudoku/ui/Dialog";
import { useDeploymentName } from "../../hooks/useDeploymentName";

const ManagePaymentDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const deploymentName = useDeploymentName();
  const zudoku = useZudoku();

  const stripeLinkQuery = useQuery<{ url: string }>({
    queryKey: [`/v3/zudoku-metering/${deploymentName}/stripe/portal`],
    meta: {
      context: zudoku,
      request: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/subscriptions`,
        }),
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage your payment in Stripe</DialogTitle>
          <DialogDescription>
            You can manage your payment in Stripe by clicking the button below.
            You'll be redirected to Stripe to manage your payment.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
          <Button type="button">
            Mange On Stripe <ExternalLinkIcon className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManagePaymentDialog;
