import { useSuspenseQuery } from "@tanstack/react-query";
import { Navigate } from "react-router";
import { useZudoku } from "zudoku/components";
import { ZudokuError } from "../../util/invariant.js";
import { joinUrl } from "../../util/joinUrl.js";
import { normalizeRedirectUrl } from "../../util/url.js";

export function CallbackHandler({
  handleCallback,
}: {
  handleCallback: () => Promise<string>;
}) {
  const { options } = useZudoku();
  const executeCallback = useSuspenseQuery({
    retry: false,
    queryKey: ["oauth-callback"],
    queryFn: async () => {
      try {
        return joinUrl(
          normalizeRedirectUrl(
            await handleCallback(),
            window.location.origin,
            options.basePath,
          ),
        );
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
