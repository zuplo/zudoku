import { Auth } from "@supabase/auth-ui-react";
import {
  ThemeSupa,
  type ThemeVariables,
  type ViewType,
} from "@supabase/auth-ui-shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useSearchParams } from "react-router";
import type { SupabaseAuthenticationConfig } from "../../../../config/config.js";
import { Heading } from "../../../components/Heading.js";

export const SupabaseAuthUI = ({
  client,
  config,
  view = "sign_in",
}: {
  client: SupabaseClient;
  config: SupabaseAuthenticationConfig;
  view: ViewType;
}) => {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const providers = config.provider ? [config.provider] : config.providers;
  const root = config.basePath ?? "/";
  const redirectToAfterSignUp =
    redirectTo ?? config.redirectToAfterSignUp ?? root;
  const redirectToAfterSignIn =
    redirectTo ?? config.redirectToAfterSignIn ?? root;
  const redirectToAfterSignOut =
    redirectTo ?? config.redirectToAfterSignOut ?? root;

  return (
    <div className="flex items-center justify-center">
      <div className="max-w-md w-full mt-10">
        <Heading level={1}>
          {view === "sign_in" ? "Sign in" : "Sign up"}
        </Heading>
        <Auth
          view={view}
          redirectToAfterSignIn={redirectToAfterSignIn}
          redirectToAfterSignUp={redirectToAfterSignUp}
          redirectToAfterSignOut={redirectToAfterSignOut}
          supabaseClient={client}
          onlyThirdPartyProviders={config.onlyThirdPartyProviders}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  dividerBackground: "var(--border)",
                  brand: "var(--primary)",
                  brandAccent: "hsla(from var(--primary) h s l / 0.8)",
                  brandButtonText: "var(--primary-foreground)",
                  defaultButtonBorder: "var(--border)",
                  inputBorder: "var(--border)",
                  inputText: "var(--foreground)",
                  inputBorderHover: "var(--accent)",
                  defaultButtonBackground: "var(--secondary)",
                  defaultButtonBackgroundHover: "var(--accent)",
                },
                radii: {
                  borderRadiusButton: "var(--radius)",
                  buttonBorderRadius: "var(--radius)",
                  inputBorderRadius: "var(--radius)",
                },
              } satisfies ThemeVariables,
            },
          }}
          providers={providers}
          redirectTo={config.redirectToAfterSignIn ?? "/"}
        />
      </div>
    </div>
  );
};
