import {
  createClient,
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";
import type { SupabaseAuthenticationConfig } from "../../../config/config.js";
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
import { SupabaseAuthUI } from "./supabase/SupabaseAuthUI.js";

class SupabaseAuthenticationProvider
  extends CoreAuthenticationPlugin
  implements AuthenticationPlugin
{
  private readonly client: SupabaseClient;
  private readonly config: SupabaseAuthenticationConfig;

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

  getRoutes = () => {
    return [
      {
        path: "/signin",
        element: (
          <SupabaseAuthUI
            view="sign_in"
            client={this.client}
            config={this.config}
          />
        ),
      },
      {
        path: "/signup",
        element: (
          <SupabaseAuthUI
            view="sign_up"
            client={this.client}
            config={this.config}
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
