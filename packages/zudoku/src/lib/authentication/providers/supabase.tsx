import {
  createClient,
  type Provider,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { type SupabaseAuthenticationConfig } from "../../../config/config.js";
import {
  type AuthenticationProvider,
  type AuthenticationProviderInitializer,
} from "../authentication.js";
import { AuthenticationPlugin } from "../AuthenticationPlugin.js";
import { AuthorizationError } from "../errors.js";
import { useAuthState, type UserProfile } from "../state.js";

class SupabaseAuthPlugin extends AuthenticationPlugin {}

class SupabaseAuthenticationProvider implements AuthenticationProvider {
  private readonly client: SupabaseClient;
  private readonly provider: Provider;
  private readonly redirectToAfterSignUp: string;
  private readonly redirectToAfterSignIn: string;
  private readonly redirectToAfterSignOut: string;

  constructor({
    supabaseUrl,
    supabaseKey,
    provider,
    redirectToAfterSignUp,
    redirectToAfterSignIn,
    redirectToAfterSignOut,
    basePath,
  }: SupabaseAuthenticationConfig) {
    this.provider = provider;
    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    });

    const root = basePath ?? "/";

    this.redirectToAfterSignUp = redirectToAfterSignUp ?? root;
    this.redirectToAfterSignIn = redirectToAfterSignIn ?? root;
    this.redirectToAfterSignOut = redirectToAfterSignOut ?? root;

    this.client.auth.onAuthStateChange(async (event, _session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await this.updateUserState();
      } else if (event === "SIGNED_OUT") {
        useAuthState.setState({
          isAuthenticated: false,
          isPending: false,
          profile: undefined,
          providerData: undefined,
        });
      }
    });
  }

  private async updateUserState() {
    const { data, error } = await this.client.auth.getUser();

    if (error || !data.user) {
      useAuthState.setState({
        isAuthenticated: false,
        isPending: false,
        profile: undefined,
        providerData: undefined,
      });

      throw new AuthorizationError("User is not authenticated");
    }

    const { data: sessionData } = await this.client.auth.getSession();

    const profile: UserProfile = {
      sub: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata.full_name || data.user.user_metadata.name,
      emailVerified: data.user.email_confirmed_at !== null,
      pictureUrl: data.user.user_metadata.avatar_url,
    };

    useAuthState.setState({
      isAuthenticated: true,
      isPending: false,
      profile,
      providerData: {
        session: sessionData.session || null,
      },
    });
  }

  async getAccessToken(): Promise<string> {
    const { data, error } = await this.client.auth.getSession();

    if (error || !data.session) {
      throw new AuthorizationError("User is not authenticated");
    }

    return data.session.access_token;
  }

  signUp = async ({ redirectTo }: { redirectTo?: string }) => {
    const finalRedirectTo = redirectTo ?? this.redirectToAfterSignUp;

    // Open Supabase Auth UI in a new window
    await this.client.auth.signInWithOAuth({
      provider: this.provider,
      options: {
        redirectTo: window.location.origin + finalRedirectTo,
      },
    });
  };

  signIn = async ({ redirectTo }: { redirectTo?: string }) => {
    const finalRedirectTo = redirectTo ?? this.redirectToAfterSignIn;

    await this.client.auth.signInWithOAuth({
      provider: this.provider,
      options: {
        redirectTo: window.location.origin + finalRedirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  };

  signOut = async () => {
    await this.client.auth.signOut();

    useAuthState.setState({
      isAuthenticated: false,
      isPending: false,
      profile: undefined,
      providerData: undefined,
    });

    window.location.href = window.location.origin + this.redirectToAfterSignOut;
  };

  getAuthenticationPlugin = () => new SupabaseAuthPlugin();

  onPageLoad = async () => {
    await this.updateUserState();
  };
}

const supabaseAuth: AuthenticationProviderInitializer<
  SupabaseAuthenticationConfig
> = (options) => new SupabaseAuthenticationProvider(options);

export default supabaseAuth;
