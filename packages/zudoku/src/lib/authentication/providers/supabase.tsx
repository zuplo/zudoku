import {
  createClient,
  type Provider,
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";
import type { SupabaseAuthenticationConfig } from "../../../config/config.js";
import { ZudokuError } from "../../util/invariant.js";
import { CoreAuthenticationPlugin } from "../AuthenticationPlugin.js";
import type {
  AuthActionContext,
  AuthActionOptions,
  AuthenticationPlugin,
  AuthenticationProviderInitializer,
} from "../authentication.js";
import { SignOut } from "../components/SignOut.js";
import { AuthorizationError } from "../errors.js";
import { type UserProfile, useAuthState } from "../state.js";
import { EmailVerificationUi } from "../ui/EmailVerificationUi.js";
import {
  ZudokuPasswordResetUi,
  ZudokuSignInUi,
  ZudokuSignUpUi,
} from "../ui/ZudokuAuthUi.js";

class SupabaseAuthenticationProvider
  extends CoreAuthenticationPlugin
  implements AuthenticationPlugin
{
  private readonly client: SupabaseClient;
  private readonly config: SupabaseAuthenticationConfig;
  private readonly providers: string[];
  private readonly enableUsernamePassword: boolean;

  constructor(config: SupabaseAuthenticationConfig) {
    const { supabaseUrl, supabaseKey } = config;
    super();

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    });
    this.config = config;

    // Support both 'provider' (deprecated) and 'providers' config
    const configuredProviders = config.provider
      ? [config.provider]
      : (config.providers ?? []);
    this.providers = configuredProviders;
    this.enableUsernamePassword = !config.onlyThirdPartyProviders;

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

  signUp = async (
    { navigate }: AuthActionContext,
    { redirectTo }: AuthActionOptions,
  ) => {
    void navigate(
      redirectTo
        ? `/signup?redirectTo=${encodeURIComponent(redirectTo)}`
        : `/signup`,
    );
  };

  signIn = async (
    { navigate }: AuthActionContext,
    { redirectTo }: AuthActionOptions,
  ) => {
    void navigate(
      redirectTo
        ? `/signin?redirectTo=${encodeURIComponent(redirectTo)}`
        : `/signin`,
    );
  };

  requestEmailVerification = async (
    { navigate }: AuthActionContext,
    { redirectTo }: AuthActionOptions,
  ) => {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (!user || !user.email) {
      throw new ZudokuError("User is not authenticated", {
        title: "User not authenticated",
      });
    }

    const { error } = await this.client.auth.resend({
      type: "signup",
      email: user.email,
    });
    if (error) {
      throw Error(getSupabaseErrorMessage(error), { cause: error });
    }

    void navigate(
      redirectTo
        ? `/verify-email?redirectTo=${encodeURIComponent(redirectTo)}`
        : `/verify-email`,
    );
  };

  private onUsernamePasswordSignIn = async (
    email: string,
    password: string,
  ) => {
    useAuthState.setState({ isPending: true });
    const { error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    useAuthState.setState({ isPending: false });
    if (error) {
      throw Error(getSupabaseErrorMessage(error), { cause: error });
    }
  };

  private onUsernamePasswordSignUp = async (
    email: string,
    password: string,
  ) => {
    useAuthState.setState({ isPending: true });
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${this.config.basePath ?? ""}/verify-email`,
      },
    });
    useAuthState.setState({ isPending: false });
    if (error) {
      throw Error(getSupabaseErrorMessage(error), { cause: error });
    }

    // If user exists and is confirmed, update state
    if (data.user) {
      const profile: UserProfile = {
        sub: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata.full_name || data.user.user_metadata.name,
        emailVerified: data.user.email_confirmed_at != null,
        pictureUrl: data.user.user_metadata.avatar_url,
      };

      useAuthState.getState().setLoggedIn({
        profile,
        providerData: { session: data.session },
      });
    }
  };

  private onOAuthSignIn = async (providerId: string) => {
    useAuthState.setState({ isPending: true });
    const { error } = await this.client.auth.signInWithOAuth({
      provider: providerId as Provider,
      options: {
        redirectTo:
          this.config.redirectToAfterSignIn ??
          `${window.location.origin}${this.config.basePath ?? ""}`,
      },
    });
    if (error) {
      useAuthState.setState({ isPending: false });
      throw new AuthorizationError(error.message);
    }
    // Note: OAuth sign-in redirects the page, so isPending stays true
  };

  private onPasswordReset = async (email: string) => {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${this.config.basePath ?? ""}/reset-password`,
    });
    if (error) {
      throw Error(getSupabaseErrorMessage(error), { cause: error });
    }
  };

  private onResendVerification = async () => {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (!user || !user.email) {
      throw new ZudokuError("User is not authenticated", {
        title: "User not authenticated",
      });
    }
    const { error } = await this.client.auth.resend({
      type: "signup",
      email: user.email,
    });
    if (error) {
      throw Error(getSupabaseErrorMessage(error), { cause: error });
    }
  };

  private onCheckVerification = async (): Promise<boolean> => {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) {
      return false;
    }

    const isVerified = data.user.email_confirmed_at != null;

    if (isVerified) {
      // Refresh the session to get updated token with verified email
      await this.client.auth.refreshSession();
      const { data: sessionData } = await this.client.auth.getSession();
      if (sessionData.session) {
        await this.updateUserState(sessionData.session);
      }
    }

    return isVerified;
  };

  getRoutes = () => {
    return [
      {
        path: "/verify-email",
        element: (
          <EmailVerificationUi
            onResendVerification={this.onResendVerification}
            onCheckVerification={this.onCheckVerification}
          />
        ),
      },
      {
        path: "/reset-password",
        element: (
          <ZudokuPasswordResetUi onPasswordReset={this.onPasswordReset} />
        ),
      },
      {
        path: "/signin",
        element: (
          <ZudokuSignInUi
            providers={this.providers}
            enableUsernamePassword={this.enableUsernamePassword}
            onOAuthSignIn={this.onOAuthSignIn}
            onUsernamePasswordSignIn={this.onUsernamePasswordSignIn}
          />
        ),
      },
      {
        path: "/signup",
        element: (
          <ZudokuSignUpUi
            providers={this.providers}
            enableUsernamePassword={this.enableUsernamePassword}
            onOAuthSignUp={this.onOAuthSignIn}
            onUsernamePasswordSignUp={this.onUsernamePasswordSignUp}
          />
        ),
      },
      {
        path: "/signout",
        element: <SignOut />,
      },
    ];
  };

  signOut = async () => {
    const { error } = await this.client.auth.signOut({ scope: "local" });
    if (error) {
      // biome-ignore lint/suspicious: Logging is better than not doing anything
      console.error("Error signing out", error);
    }
    useAuthState.getState().setLoggedOut();
  };

  onPageLoad = async () => {
    const { data, error } = await this.client.auth.getSession();

    if (!error && data.session) {
      await this.updateUserState(data.session);
    }
  };
}

const supabaseAuth: AuthenticationProviderInitializer<
  SupabaseAuthenticationConfig
> = (options) => new SupabaseAuthenticationProvider(options);

export default supabaseAuth;

const getSupabaseErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return "An unexpected error occurred. Please try again.";
  }

  const errorMessage = error.message;

  // Map common Supabase error messages to user-friendly messages
  if (errorMessage.includes("Invalid login credentials")) {
    return "The email and password you entered don't match.";
  }
  if (errorMessage.includes("Email not confirmed")) {
    return "Please verify your email address before signing in.";
  }
  if (errorMessage.includes("User already registered")) {
    return "The email address is already used by another account.";
  }
  if (
    errorMessage.includes("Password should be at least") ||
    errorMessage.includes("Password must be at least")
  ) {
    return "The password must be at least 6 characters long.";
  }
  if (errorMessage.includes("Invalid email")) {
    return "That email address isn't correct.";
  }
  if (errorMessage.includes("Email rate limit exceeded")) {
    return "Too many requests. Please wait a moment and try again.";
  }
  if (errorMessage.includes("For security purposes")) {
    return "For security purposes, please wait a moment before trying again.";
  }
  if (errorMessage.includes("Unable to validate email address")) {
    return "Unable to validate email address. Please check and try again.";
  }
  if (errorMessage.includes("Signups not allowed")) {
    return "Sign ups are not allowed at this time.";
  }
  if (errorMessage.includes("User not found")) {
    return "That email address doesn't match an existing account.";
  }
  if (errorMessage.includes("New password should be different")) {
    return "Your new password must be different from your current password.";
  }

  // Return the original message if no mapping found
  return (
    errorMessage || "An error occurred during authentication. Please try again."
  );
};
