import {
  createClient,
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import type { SupabaseAuthenticationConfig } from "../../../config/config.js";
import { CoreAuthenticationPlugin } from "../AuthenticationPlugin.js";
import type {
  AuthenticationPlugin,
  AuthenticationProviderInitializer,
} from "../authentication.js";
import { AuthorizationError } from "../errors.js";
import { type UserProfile, useAuthState } from "../state.js";

class SupabaseAuthenticationProvider
  extends CoreAuthenticationPlugin
  implements AuthenticationPlugin
{
  private readonly client: SupabaseClient;
  private readonly config: SupabaseAuthenticationConfig;
  public readonly hasCustomUI = true;

  constructor(config: SupabaseAuthenticationConfig) {
    super();
    this.config = config;
    this.client = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    });

    this.client.auth.onAuthStateChange(async (event, session) => {
      if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        await this.updateUserState(session);
      } else if (event === "SIGNED_OUT") {
        useAuthState.getState().setLoggedOut();
      }
    });
  }

  private async updateUserState(session: Session) {
    const { user } = session;

    const profile: UserProfile = {
      sub: user.id,
      email: user.email,
      name: user.user_metadata.full_name || user.user_metadata.name,
      emailVerified: user.email_confirmed_at != null,
      pictureUrl: user.user_metadata.avatar_url,
    };

    useAuthState.getState().setLoggedIn({
      profile,
      providerData: { session },
    });
  }

  async getAccessToken(): Promise<string> {
    const { data, error } = await this.client.auth.getSession();

    if (error || !data.session) {
      throw new AuthorizationError("User is not authenticated");
    }

    return data.session.access_token;
  }

  async signRequest(request: Request): Promise<Request> {
    const accessToken = await this.getAccessToken();
    request.headers.set("Authorization", `Bearer ${accessToken}`);
    return request;
  }

  // Custom UI rendering - return component functions, not JSX
  renderSignInUI = () => {
    const client = this.client;
    const config = this.config;
    return () => <SupabaseAuthUI client={client} config={config} />;
  };

  renderSignUpUI = () => {
    // Supabase Auth UI handles both sign in and sign up
    return this.renderSignInUI();
  };

  // No-op methods since Auth UI handles the interactions
  signUp = async () => {
    // Auth UI handles this
  };

  signIn = async () => {
    // Auth UI handles this
  };

  signOut = async () => {
    await new Promise<void>((resolve) => {
      const { data } = this.client.auth.onAuthStateChange(async (event) => {
        if (event !== "SIGNED_OUT") return;
        data.subscription.unsubscribe();
        resolve();
      });
      void this.client.auth.signOut();
    });

    useAuthState.setState({
      isAuthenticated: false,
      isPending: false,
      profile: undefined,
      providerData: undefined,
    });
  };

  onPageLoad = async () => {
    // Check for OAuth errors in URL hash (Supabase redirects errors in hash)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const error = hashParams.get("error");
    const errorDescription = hashParams.get("error_description");
    const errorCode = hashParams.get("error_code");

    if (error) {
      // Store error in state for display
      useAuthState.setState({
        oauthError: {
          error,
          error_description: errorDescription || undefined,
          error_code: errorCode || undefined,
        },
      });

      // Clear error from URL but preserve the rest of the URL
      const newUrl = window.location.pathname + window.location.search;
      window.history.replaceState({}, "", newUrl);

      // Navigate to error page
      window.location.href = "/signin?error=true";
      return;
    }

    const { data, error: sessionError } = await this.client.auth.getSession();

    if (!sessionError && data.session) {
      await this.updateUserState(data.session);
    }
  };

  getTroubleshootingDocs(error: {
    error: string;
    error_description?: string;
    error_code?: string;
  }): string | undefined {
    const { error: errorType, error_description, error_code } = error;

    // Handle server_error specifically for "Error getting user profile"
    if (
      errorType === "server_error" &&
      error_description?.includes("Error getting user profile")
    ) {
      return `
## Common Causes for "Error getting user profile from external provider"

This error occurs when Supabase successfully authenticates with the OAuth provider (GitHub, Google, etc.) but fails to retrieve your user profile information.

### 1. Check OAuth App Type (GitHub Only)

**Problem**: Using a "GitHub App" instead of an "OAuth App"

- GitHub has two types of apps: **OAuth Apps** (legacy) and **GitHub Apps** (newer)
- Supabase Auth requires an **OAuth App**, not a GitHub App
- They are configured differently and are not interchangeable

**Solution**:
1. Go to https://github.com/settings/developers
2. Check if your app is under "OAuth Apps" or "GitHub Apps"
3. If it's a GitHub App, create a new **OAuth App** instead:
   - Click "New OAuth App"
   - **Application name**: Your app name
   - **Homepage URL**: \`${this.config.supabaseUrl}\` or your production URL
   - **Authorization callback URL**: \`${this.config.supabaseUrl}/auth/v1/callback\`
   - Click "Register application"
4. Copy the new Client ID and Client Secret to Supabase

### 2. Verify OAuth Scopes

**Problem**: Missing required scopes/permissions

**Solution**:
1. In Supabase Dashboard → **Authentication** → **Providers** → Select your provider
2. Check the "Scopes" field includes:
   - **GitHub**: \`read:user user:email\`
   - **Google**: \`openid profile email\`
   - **Azure**: \`openid profile email\`
3. Save and try again

### 3. Check Email Privacy Settings (GitHub)

**Problem**: GitHub email is set to private

**Solution**:
1. Go to https://github.com/settings/emails
2. Temporarily uncheck "Keep my email addresses private"
3. Try signing in again
4. Once working, you can re-enable privacy (Supabase will have cached your email)

### 4. Verify Supabase Configuration

**Problem**: Incorrect OAuth credentials or configuration

**Solution**:
1. In Supabase Dashboard → **Authentication** → **Providers**
2. Select your OAuth provider (GitHub, Google, etc.)
3. Verify:
   - ✅ Provider is **Enabled**
   - ✅ **Client ID** matches your OAuth app
   - ✅ **Client Secret** matches your OAuth app (regenerate if unsure)
   - ✅ **Site URL** is set correctly in Settings → General
   - ✅ **Redirect URLs** includes your development URL in Settings → Authentication → URL Configuration

### 5. Check Supabase Logs

**Problem**: Need more details about what's failing

**Solution**:
1. Go to [Supabase Dashboard → Logs → Auth Logs](${this.config.supabaseUrl.replace("//", "//supabase.com/dashboard/project/").split(".supabase.co")[0]}/logs/auth-logs)
2. Look for recent failed authentication attempts
3. Check the error messages for specific details
4. Common issues shown in logs:
   - Invalid OAuth credentials
   - Missing scopes
   - Network errors to OAuth provider
   - Rate limiting

### 6. OAuth App Not Approved (Google Only)

**Problem**: Google OAuth app is in testing mode with restricted users

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID
3. Check OAuth consent screen status:
   - If "Testing", add your email to test users, OR
   - Publish the app to production (if ready)

### 7. Clear Browser State and Retry

**Problem**: Cached OAuth state causing issues

**Solution**:
1. Clear cookies and localStorage for localhost:3000
2. Try signing in again
3. If still failing, try in an incognito/private browser window

### Testing Your OAuth Configuration

To verify your OAuth app works independently:

**GitHub**:
\`\`\`
https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID&scope=read:user%20user:email
\`\`\`

**Google**:
\`\`\`
https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=openid%20profile%20email
\`\`\`

If this fails, the issue is with your OAuth app configuration, not Supabase.
`;
    }

    // Handle access_denied errors
    if (errorType === "access_denied") {
      return `
## Access Denied by User

The user cancelled the OAuth authorization or denied permission to access their account.

**This is expected behavior** - no action needed unless users are reporting they can't sign in even when granting permission.

### If Users Are Reporting Issues:

1. **Check OAuth Scopes**: Make sure you're not requesting excessive permissions
2. **Verify OAuth App**: Ensure the OAuth app name and details look trustworthy to users
3. **Test the Flow**: Try the sign-in process yourself to see what users experience
`;
    }

    // Handle invalid_request errors
    if (errorType === "invalid_request") {
      return `
## Invalid OAuth Request

The OAuth request was malformed or missing required parameters.

### Common Causes:

1. **Incorrect Redirect URI**: The redirect URI in your OAuth app doesn't match what Supabase is sending
   - Should be: \`${this.config.supabaseUrl}/auth/v1/callback\`

2. **Missing Client ID/Secret**: Check Supabase provider configuration has both values set

3. **Invalid OAuth Configuration**: Review all provider settings in Supabase Dashboard → Authentication → Providers
`;
    }

    // Generic troubleshooting for other errors
    return `
## General Troubleshooting Steps

1. **Check Supabase Logs**: Go to your [Supabase Dashboard Logs](${this.config.supabaseUrl.replace("//", "//supabase.com/dashboard/project/").split(".supabase.co")[0]}/logs/auth-logs) for detailed error information

2. **Verify OAuth Provider Configuration**:
   - In your OAuth provider's console, check:
     - Client ID and Secret are correct
     - Redirect URI is: \`${this.config.supabaseUrl}/auth/v1/callback\`
     - Required scopes are enabled

3. **Check Supabase Configuration**:
   - Dashboard → Authentication → Providers
   - Ensure provider is enabled
   - Verify credentials match your OAuth app

4. **Test in Incognito Mode**: Sometimes cached OAuth state causes issues

5. **Check Network**: Ensure your OAuth provider's services are accessible from your location

### Get More Help

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Discord](https://discord.supabase.com)
- Check the Supabase logs for specific error details (link above)
`;
  }
}

// Component that renders the Supabase Auth UI
const SupabaseAuthUI = ({
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
  const providers =
    config.providers ?? (config.provider ? [config.provider] : undefined);

  return (
    <div className="w-full max-w-md">
      <Auth
        supabaseClient={client}
        appearance={{
          theme: ThemeSupa,
          ...config.appearance,
        }}
        providers={providers}
        redirectTo={
          window.location.origin + (config.redirectToAfterSignIn ?? "/")
        }
      />
    </div>
  );
};

const supabaseAuth: AuthenticationProviderInitializer<
  SupabaseAuthenticationConfig
> = (options) => new SupabaseAuthenticationProvider(options);

export default supabaseAuth;
