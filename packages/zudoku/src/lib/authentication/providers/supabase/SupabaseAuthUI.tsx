import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import type { SupabaseAuthenticationConfig } from "../../../../config/config.js";

export const SupabaseAuthUI = ({
  client,
  config,
}: {
  client: SupabaseClient;
  config: SupabaseAuthenticationConfig;
}) => {
  const [authComponents, setAuthComponents] = useState<{
    // biome-ignore lint/suspicious/noExplicitAny: External component types
    Auth: any;
    // biome-ignore lint/suspicious/noExplicitAny: External component types
    ThemeSupa: any;
  } | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Lazy load Auth UI components
    const loadAuthComponents = async () => {
      try {
        const [authUiReact, authUiShared] = await Promise.all([
          import("@supabase/auth-ui-react"),
          import("@supabase/auth-ui-shared"),
        ]);

        setAuthComponents({
          Auth: authUiReact.Auth,
          ThemeSupa: authUiShared.ThemeSupa,
        });
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError
            : new Error("Failed to load Supabase Auth UI"),
        );
      }
    };

    void loadAuthComponents();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-600">
          Failed to load Supabase Auth UI. Make sure @supabase/auth-ui-react and
          @supabase/auth-ui-shared are installed.
        </div>
      </div>
    );
  }

  if (!authComponents) {
    return (
      <div className="flex items-center justify-center p-8">
        <div>Loading authentication...</div>
      </div>
    );
  }

  const { Auth, ThemeSupa } = authComponents;

  // Handle backward compatibility: convert singular provider to array
  const providers = config.provider ? [config.provider] : undefined;

  return (
    <div className="w-full max-w-md">
      <Auth
        supabaseClient={client}
        appearance={{
          theme: ThemeSupa,
          // ...config.appearance,
        }}
        providers={providers}
        redirectTo={
          window.location.origin + (config.redirectToAfterSignIn ?? "/")
        }
      />
    </div>
  );
};
