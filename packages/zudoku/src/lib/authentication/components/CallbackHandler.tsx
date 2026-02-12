import { useSuspenseQuery } from "@tanstack/react-query";
import { Navigate } from "react-router";
import { useZudoku } from "zudoku/components";
import { joinUrl } from "../../util/joinUrl.js";
import { normalizeRedirectUrl } from "../../util/url.js";
import { OAuthAuthorizationError, type OAuthErrorType } from "../errors.js";

export function CallbackHandler({
  handleCallback,
}: {
  handleCallback: () => Promise<string>;
}) {
  const { options } = useZudoku();
  const executeCallback = useSuspenseQuery({
    retry: false,
    queryKey: ["oauth-callback", window.location.search],
    queryFn: async () => {
      const url = new URL(window.location.href);

      const errorParam = url.searchParams.get("error");
      const errorDescription =
        url.searchParams.get("error_description") ?? undefined;
      const errorUri = url.searchParams.get("error_uri") ?? undefined;
      if (errorParam) {
        throw new OAuthAuthorizationError(
          `OAuth error '${errorParam}': ${errorDescription}`,
          {
            error: errorParam as OAuthErrorType,
            error_description: errorDescription,
            error_uri: errorUri,
          },
        );
      }
      return joinUrl(
        normalizeRedirectUrl(
          await handleCallback(),
          window.location.origin,
          options.basePath,
        ),
      );
    },
  });

  return <Navigate to={executeCallback.data} replace />;
}
