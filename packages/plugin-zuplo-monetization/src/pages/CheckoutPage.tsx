import { useAuth, useZudoku } from "zudoku/hooks";
import { ShieldIcon } from "zudoku/icons";
import { useQuery } from "zudoku/react-query";
import { useParams } from "zudoku/router";

import { useUrlUtils } from "../hooks/useUrlUtils";

const CheckoutPage = () => {
  const { planId } = useParams();
  const zudoku = useZudoku();
  const auth = useAuth();
  const { generateUrl } = useUrlUtils();

  const { data: _data } = useQuery({
    queryKey: ["plan", planId],
    queryFn: async () => {
      if (!auth.profile?.email) {
        throw new Error(
          "No email found for user. Make sure your Authentication Provider exposes the email address.",
        );
      }

      const request = await zudoku.signRequest(
        new Request(
          `https://api.zuploedge.com/v3/zudoku-metering/${zudoku.env.ZUPLO_PUBLIC_DEPLOYMENT_NAME}/stripe/checkout`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: auth.profile?.email,
              planId,
              successURL:
                generateUrl(`/checkout-confirm`) +
                `?${planId ? `plan=${planId}` : ""}`,
              cancelURL:
                generateUrl(`/checkout-failed`) +
                `?${planId ? `plan=${planId}` : ""}`,
            }),
          },
        ),
      );

      const checkoutRequest = await fetch(request).then((res) => res.json());

      if (checkoutRequest.url) {
        window.location.href = checkoutRequest.url;
      }

      return checkoutRequest;
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="flex max-w-md flex-col items-center space-y-6 text-center">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-foreground/10">
            <ShieldIcon className="w-12 h-12 text-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-card-foreground">
            Establishing encrypted connection...
          </h2>
          <p className="text-muted-foreground">
            Setting up your secure checkout experience
          </p>
          <p className="text-sm text-muted-foreground">
            Powered by Stripe for maximum security
          </p>
        </div>

        <div className="flex space-x-2">
          <div className="h-3 w-3 animate-pulse rounded-full bg-primary [animation-delay:-0.3s]"></div>
          <div className="h-3 w-3 animate-pulse rounded-full bg-primary [animation-delay:-0.15s]"></div>
          <div className="h-3 w-3 animate-pulse rounded-full bg-primary"></div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
