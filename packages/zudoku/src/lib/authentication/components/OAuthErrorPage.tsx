import { HomeIcon } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "../../components/context/useTranslation.js";
import { DeveloperHint } from "../../components/DeveloperHint.js";
import { Heading } from "../../components/Heading.js";
import { Typography } from "../../components/Typography.js";
import { Button } from "../../ui/Button.js";
import { OAuthAuthorizationError } from "../errors.js";
import { useAuth } from "../hook.js";

const KNOWN_ERROR_TYPES = new Set([
  "invalid_request",
  "unauthorized_client",
  "access_denied",
  "unsupported_response_type",
  "invalid_scope",
  "server_error",
  "temporarily_unavailable",
  "invalid_client",
  "invalid_grant",
  "unsupported_grant_type",
  "invalid_state",
  "missing_code_verifier",
  "network_error",
  "token_expired",
  "configuration_error",
  "unknown_error",
]);

const TYPES_WITH_HELP = new Set([
  "access_denied",
  "invalid_state",
  "missing_code_verifier",
  "network_error",
  "server_error",
  "temporarily_unavailable",
]);

export function OAuthErrorPage({ error }: { error: unknown }) {
  const { login } = useAuth();
  const { t, defaultLocale, locale } = useTranslation();

  if (!(error instanceof OAuthAuthorizationError)) {
    throw error;
  }

  const oauthError = error.error as
    | { error?: string; error_description?: string; error_uri?: string }
    | undefined;
  const type =
    oauthError && typeof oauthError === "object" && "error" in oauthError
      ? String(oauthError.error)
      : "unknown_error";
  const resolvedType = KNOWN_ERROR_TYPES.has(type) ? type : "unknown_error";

  const titleKey = `auth.oauth.title.${resolvedType}`;
  // Fall through to a generic "Authentication Error" header if the specific
  // title key has no translation (e.g. truly unknown error code).
  const title =
    t(titleKey) === titleKey && locale !== defaultLocale
      ? t("auth.oauth.title.default")
      : t(titleKey);
  const message = t(`auth.oauth.message.${resolvedType}`);
  const helpKey = TYPES_WITH_HELP.has(resolvedType)
    ? `auth.oauth.help.${resolvedType}`
    : null;

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-4 items-center">
          <Heading level={2} className="text-2xl inline-block font-bold">
            {title}
          </Heading>

          <Typography className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {message}
          </Typography>

          <DeveloperHint>
            <p>
              <strong>{t("auth.oauth.errorLabel")}:</strong> <code>{type}</code>
            </p>
            {oauthError?.error_description != null && (
              <p>
                <strong>{t("auth.oauth.descriptionLabel")}:</strong>{" "}
                {oauthError.error_description}
              </p>
            )}
            {oauthError?.error_uri?.startsWith("http") && (
              <p>
                <strong>{t("auth.oauth.moreInfoLabel")}:</strong>{" "}
                <a
                  href={oauthError.error_uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {oauthError.error_uri}
                </a>
              </p>
            )}
          </DeveloperHint>
        </div>

        <div className="space-y-3 pt-4">
          <div className="space-y-2">
            {(resolvedType === "access_denied" ||
              resolvedType === "invalid_grant" ||
              resolvedType === "token_expired") && (
              <Button
                onClick={() => login()}
                className="w-full capitalize"
                variant={"default"}
              >
                {t("auth.oauth.signInAgain")}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button asChild className="flex-1" variant="outline">
              <Link to="/">
                <HomeIcon className="w-4 h-4 mr-2" />
                {t("auth.oauth.goHome")}
              </Link>
            </Button>
          </div>
        </div>

        {helpKey && (
          <Typography className="text-sm text-gray-500 dark:text-gray-400">
            {t(helpKey)}
          </Typography>
        )}
      </div>
    </div>
  );
}
