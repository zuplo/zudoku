import type { Provider, SupabaseClient } from "@supabase/supabase-js";
import {
  type Auth,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  type User,
} from "firebase/auth";
import type {
  FirebaseAuthenticationConfig,
  SupabaseAuthenticationConfig,
} from "../../../config/config.js";
import { CoreAuthenticationPlugin } from "../AuthenticationPlugin.js";
import type {
  AuthActionContext,
  AuthActionOptions,
  AuthenticationPlugin,
  AuthenticationProviderInitializer,
} from "../authentication.js";
import { SignOut } from "../components/SignOut.js";
import { AuthorizationError } from "../errors.js";
import { useAuthState } from "../state.js";
import {
  type AuthProviderType,
  ZudokuLoginUi,
  ZudokuSignUpUi,
} from "../ui/ZudokuAuthUi.js";

class FirebaseAuthenticationProvider
  extends CoreAuthenticationPlugin
  implements AuthenticationPlugin
{
  private readonly client: SupabaseClient;
  private readonly providers: Provider[];
  private readonly config: FirebaseAuthenticationConfig;

  private readonly app: FirebaseApp;
  private readonly auth: Auth;

  constructor(config: FirebaseAuthenticationConfig) {
    super();
    this.config = config;

    const firebaseConfig: FirebaseOptions = {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
      measurementId: config.measurementId,
    };

    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);

    // Listen to auth state changes
    onAuthStateChanged(this.auth, async (user: User | null) => {
      if (user) {
        await this.updateUserState(user);
      } else {
        useAuthState.getState().setLoggedOut();
      }
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
          <ZudokuLoginUi
            onOAuthSignIn={async (providerId: string) => {
              try {
                const provider = await getProviderForId(providerId);
                if (!provider) {
                  throw new Error(`Unknown provider: ${providerId}`);
                }
                await signInWithPopup(this.auth, provider);
              } 
            }}
            onUsernamePasswordSignIn={async (email: string, password: string) => {
              try {
                await signInWithEmailAndPassword(this.auth, email, password);
              } catch (err) {
                setError(err);
              }
            }}
          />
        ),
      },
      {
        path: "/signup",
        element: <ZudokuSignUpUi />,
      },
      {
        path: "/signout",
        element: <SignOut />,
      },
    ];
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
    const { data, error } = await this.client.auth.getSession();

    if (!error && data.session) {
      await this.updateUserState(data.session);
    }
  };
}

const supabaseAuth: AuthenticationProviderInitializer<
  SupabaseAuthenticationConfig
> = (options) => new FirebaseAuthenticationProvider(options);

export default supabaseAuth;

const getProviderForId = async (
  providerId: string,
): Promise<AuthProviderType | null> => {
  switch (providerId) {
    case "google": {
      const { GoogleAuthProvider } = await import("firebase/auth");
      return new GoogleAuthProvider();
    }
    case "github": {
      const { GithubAuthProvider } = await import("firebase/auth");
      return new GithubAuthProvider();
    }
    case "facebook": {
      const { FacebookAuthProvider } = await import("firebase/auth");
      return new FacebookAuthProvider();
    }
    case "twitter": {
      const { TwitterAuthProvider } = await import("firebase/auth");
      return new TwitterAuthProvider();
    }
    case "microsoft": {
      const { OAuthProvider } = await import("firebase/auth");
      return new OAuthProvider("microsoft.com");
    }
    case "apple": {
      const { OAuthProvider } = await import("firebase/auth");
      return new OAuthProvider("apple.com");
    }
    case "yahoo": {
      const { OAuthProvider } = await import("firebase/auth");
      return new OAuthProvider("yahoo.com");
    }
    default:
      return null;
  }
};
