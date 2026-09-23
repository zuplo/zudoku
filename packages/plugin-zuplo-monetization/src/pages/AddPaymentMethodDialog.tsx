import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { type FormEvent, useState } from "react";
import { Alert, AlertDescription } from "zudoku/ui/Alert";
import { Button } from "zudoku/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "zudoku/ui/Dialog";

// loadStripe injects the Stripe.js script and is idempotent per key — cache a
// single instance per publishable key so reopening the dialog doesn't reload it.
const stripePromises = new Map<string, Promise<Stripe | null>>();
const getStripe = (publishableKey: string) => {
  let promise = stripePromises.get(publishableKey);
  if (!promise) {
    promise = loadStripe(publishableKey);
    stripePromises.set(publishableKey, promise);
  }
  return promise;
};

const SetupForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    // redirect: "if_required" keeps the flow inline for cards that don't need
    // 3DS; when a redirect is required Stripe sends the user to return_url.
    const result = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? "Failed to save payment method.");
      setSubmitting(false);
      return;
    }

    if (result.setupIntent?.status === "succeeded") {
      onSuccess();
      return;
    }

    setError(
      `Payment method could not be confirmed (status: ${
        result.setupIntent?.status ?? "unknown"
      }).`,
    );
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <DialogFooter>
        <Button type="submit" disabled={!stripe || submitting}>
          {submitting ? "Saving…" : "Save card"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const AddPaymentMethodDialog = ({
  open,
  onOpenChange,
  publishableKey,
  clientSecret,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publishableKey: string;
  clientSecret: string;
  onSuccess: () => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add payment method</DialogTitle>
        <DialogDescription>
          Your card details are entered and stored securely by Stripe.
        </DialogDescription>
      </DialogHeader>
      <Elements stripe={getStripe(publishableKey)} options={{ clientSecret }}>
        <SetupForm onSuccess={onSuccess} />
      </Elements>
    </DialogContent>
  </Dialog>
);

export default AddPaymentMethodDialog;
