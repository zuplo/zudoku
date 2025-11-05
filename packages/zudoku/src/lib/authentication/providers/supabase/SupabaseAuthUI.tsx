import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa, type ViewType } from "@supabase/auth-ui-shared";
import type { SupabaseClient } from "@supabase/supabase-js";
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
  const providers = config.provider ? [config.provider] : undefined;

  return (
    <div className="flex items-center justify-center">
      <div className="max-w-md w-full mt-10">
        <Heading level={1}>
          {view === "sign_in" ? "Sign in" : "Sign up"}
        </Heading>
        <Auth
          view="sign_in"
          supabaseClient={client}
          appearance={{
            theme: ThemeSupa,
            ...config.appearance,
          }}
          providers={providers}
          redirectTo={config.redirectToAfterSignIn ?? "/"}
        />
      </div>
    </div>
  );
};
