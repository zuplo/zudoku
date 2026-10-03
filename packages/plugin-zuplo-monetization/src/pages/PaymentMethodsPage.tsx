import { lazy, Suspense, useState } from "react";
import { Head, Heading } from "zudoku/components";
import { useZudoku } from "zudoku/hooks";
import { CreditCardIcon, PlusIcon, TrashIcon } from "zudoku/icons";
import { useMutation, useQuery } from "zudoku/react-query";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert";
import { Badge } from "zudoku/ui/Badge";
import { Button } from "zudoku/ui/Button";
import { Card, CardContent } from "zudoku/ui/Card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "zudoku/ui/Dialog";
import { useDeploymentName } from "../hooks/useDeploymentName.js";

const AddPaymentMethodDialog = lazy(
  () => import("./AddPaymentMethodDialog.js"),
);

type StripeConfig = { publishableKey: string };

type PaymentMethodCard = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
};

type PaymentMethod = {
  id: string;
  type: string;
  card?: PaymentMethodCard;
  isDefault: boolean;
};

type PaymentMethodList = { items: PaymentMethod[]; defaultId?: string };

type SetupIntent = { setupIntentId: string; clientSecret: string };

const formatBrand = (brand: string) =>
  brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : "Card";

const formatExpiry = (month: number, year: number) =>
  `${String(month).padStart(2, "0")}/${String(year).slice(-2)}`;

const PaymentMethodsPage = () => {
  const zudoku = useZudoku();
  const deploymentName = useDeploymentName();
  const base = `/v3/zudoku-metering/${deploymentName}/stripe`;

  const [addOpen, setAddOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<PaymentMethod | null>(
    null,
  );

  const configQuery = useQuery<StripeConfig>({
    queryKey: [`${base}/config`],
    meta: { context: zudoku },
  });

  const methodsQuery = useQuery<PaymentMethodList>({
    queryKey: [`${base}/payment-methods`],
    meta: { context: zudoku },
  });

  const setupIntent = useMutation<SetupIntent>({
    mutationKey: [`${base}/payment-methods/setup-intent`],
    meta: { context: zudoku, request: { method: "POST" } },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setAddOpen(true);
    },
  });

  const setDefault = useMutation<unknown, Error, { id: string }>({
    mutationKey: [`${base}/payment-methods/{id}/default`],
    meta: { context: zudoku, request: { method: "POST" } },
    onSuccess: () => methodsQuery.refetch(),
  });

  const removeMethod = useMutation<unknown, Error, { id: string }>({
    mutationKey: [`${base}/payment-methods/{id}`],
    meta: { context: zudoku, request: { method: "DELETE" } },
    onSuccess: async () => {
      setPendingRemoval(null);
      await methodsQuery.refetch();
    },
  });

  const methods = methodsQuery.data?.items ?? [];
  const onlyOneMethod = methods.length <= 1;
  const publishableKey = configQuery.data?.publishableKey;

  return (
    <div className="w-full pt-(--padding-content-top) pb-(--padding-content-bottom)">
      <Head>
        <title>Payment Methods</title>
      </Head>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Heading level={2}>Payment Methods</Heading>
            <p className="text-muted-foreground">
              Manage the cards used to pay for your subscriptions.
            </p>
          </div>
          {publishableKey && (
            <Button
              onClick={() => setupIntent.mutate()}
              disabled={setupIntent.isPending}
            >
              <PlusIcon className="size-4" />
              {setupIntent.isPending ? "Preparing…" : "Add payment method"}
            </Button>
          )}
        </div>

        {methodsQuery.isError && (
          <Alert variant="destructive">
            <AlertTitle>Couldn't load payment methods</AlertTitle>
            <AlertDescription className="first-letter:uppercase">
              {methodsQuery.error.message}
            </AlertDescription>
          </Alert>
        )}

        {setupIntent.isError && (
          <Alert variant="destructive">
            <AlertDescription className="first-letter:uppercase">
              {setupIntent.error.message}
            </AlertDescription>
          </Alert>
        )}

        {removeMethod.isError && (
          <Alert variant="destructive">
            <AlertDescription className="first-letter:uppercase">
              {removeMethod.error.message}
            </AlertDescription>
          </Alert>
        )}

        {methodsQuery.isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : methods.length === 0 ? (
          !methodsQuery.isError && (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                No payment methods yet. Add one to get started.
              </CardContent>
            </Card>
          )
        ) : (
          <div className="space-y-3">
            {methods.map((pm) => {
              const removeDisabled = pm.isDefault || onlyOneMethod;
              return (
                <Card key={pm.id}>
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3">
                      <CreditCardIcon className="size-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          {pm.card
                            ? `${formatBrand(pm.card.brand)} •••• ${pm.card.last4}`
                            : pm.type}
                          {pm.isDefault && (
                            <Badge variant="outline">Default</Badge>
                          )}
                        </div>
                        {pm.card && (
                          <div className="text-sm text-muted-foreground">
                            Expires{" "}
                            {formatExpiry(pm.card.expMonth, pm.card.expYear)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!pm.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDefault.mutate({ id: pm.id })}
                          disabled={setDefault.isPending}
                        >
                          Set as default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        disabled={removeDisabled}
                        title={
                          removeDisabled
                            ? "You can't remove your default or only payment method. Add another card and set it as default first."
                            : undefined
                        }
                        onClick={() => setPendingRemoval(pm)}
                      >
                        <TrashIcon className="size-4" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Your default payment method can't be removed — set another card as the
          default first. This keeps your subscription invoices payable.
        </p>
      </div>

      {addOpen && clientSecret && publishableKey && (
        <Suspense fallback={null}>
          <AddPaymentMethodDialog
            open={addOpen}
            onOpenChange={(open) => {
              setAddOpen(open);
              if (!open) setClientSecret(null);
            }}
            publishableKey={publishableKey}
            clientSecret={clientSecret}
            onSuccess={async () => {
              setAddOpen(false);
              setClientSecret(null);
              await methodsQuery.refetch();
            }}
          />
        </Suspense>
      )}

      <Dialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove payment method?</DialogTitle>
            <DialogDescription>
              {pendingRemoval?.card
                ? `${formatBrand(pendingRemoval.card.brand)} •••• ${pendingRemoval.card.last4} will be detached from your account.`
                : "This payment method will be detached from your account."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={removeMethod.isPending}
              onClick={() =>
                pendingRemoval && removeMethod.mutate({ id: pendingRemoval.id })
              }
            >
              {removeMethod.isPending ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentMethodsPage;
