import { useSuspenseQuery } from "@tanstack/react-query";
import { Navigate } from "react-router";
import { ZudokuError } from "../../util/invariant.js";

export function CallbackHandler({
  handleCallback,
}: {
  handleCallback: () => Promise<string>;
}) {
  const executeCallback = useSuspenseQuery({
    retry: false,
    queryKey: ["oauth-callback"],
    queryFn: async () => {
      try {
        return await handleCallback();
      } catch (error) {
        throw new ZudokuError("Could not validate user", {
          cause: error,
          title: "Authentication Error",
          developerHint:
            "Check the configuration of your authorization provider and ensure all settings such as the callback URL are configured correctly.",
        });
      }
    },
  });

  return <Navigate to={executeCallback.data} />;
}
