import { type FirebaseApp, initializeApp } from "firebase/app";
import {
  type Auth,
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import type { FirebaseAuthenticationConfig } from "../../../config/config.js";
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
import { useAuthState } from "../state.js";
import { EmailVerificationUi } from "../ui/EmailVerificationUi.js";
import {
  ZudokuPasswordResetUi,
  ZudokuSignInUi,
  ZudokuSignUpUi,
} from "../ui/ZudokuAuthUi.js";

class FirebaseAuthenticationProvider
  extends CoreAuthenticationPlugin
  implements AuthenticationPlugin
{
  private readonly app: FirebaseApp;
  private readonly auth: Auth;
  private readonly providers: string[];
  private readonly enableUsernamePassword: boolean;

  constructor(config: FirebaseAuthenticationConfig) {
    super();

    this.app = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
      measurementId: config.measurementId,
    });
    this.auth = getAuth(this.app);
    this.providers = config.providers?.filter((p) => p !== "password") ?? [];
    this.enableUsernamePassword =
      config.providers?.includes("password") ?? false;
  }

  async initialize() {
    await this.auth.authStateReady();
  }

  async signRequest(request: Request): Promise<Request> {
    const accessToken = await this.auth.currentUser?.getIdToken();
    if (!accessToken) {
      throw new AuthorizationError("User is not authenticated");
    }
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
    if (!this.auth.currentUser) {
      throw new ZudokuError("User is not authenticated", {
        title: "User not authenticated",
      });
    }

    await sendEmailVerification(this.auth.currentUser);
    void navigate(
      redirectTo
        ? `/verify-email?redirectTo=${encodeURIComponent(redirectTo)}`
        : `/verify-email`,
    );
  };

  getRoutes = () => {
    return [
      {
        path: "/verify-email",
        element: (
          <EmailVerificationUi
            onResendVerification={async () => {
              if (!this.auth.currentUser) {
                throw new ZudokuError("User is not authenticated", {
                  title: "User not authenticated",
                });
              }
              await sendEmailVerification(this.auth.currentUser);
            }}
            onCheckVerification={async () => {
              if (!this.auth.currentUser) {
                throw new ZudokuError("User is not authenticated", {
                  title: "User not authenticated",
                });
              }
              await this.auth.currentUser.reload();
              const isVerified = this.auth.currentUser.emailVerified;

              if (isVerified) {
                await this.auth.currentUser.getIdToken(true);
                await this.setUserLoggedIn(this.auth.currentUser);
              }

              return isVerified;
            }}
          />
        ),
      },
      {
        path: "/reset-password",
        element: (
          <ZudokuPasswordResetUi
            onPasswordReset={async (email: string) => {
              try {
                await sendPasswordResetEmail(this.auth, email);
              } catch (error) {
                throw Error(getFirebaseErrorMessage(error), { cause: error });
              }
            }}
          />
        ),
      },
      {
        path: "/signin",
        element: (
          <ZudokuSignInUi
            providers={this.providers}
            enableUsernamePassword={this.enableUsernamePassword}
            onOAuthSignIn={async (providerId: string) => {
              useAuthState.setState({ isPending: true });
              const provider = await getProviderForId(providerId);
              if (!provider) {
                throw new AuthorizationError(
                  `Provider ${providerId} not found`,
                );
              }
              const result = await signInWithPopup(this.auth, provider);
              useAuthState.setState({ isPending: false });
              useAuthState.getState().setLoggedIn({
                providerData: { user: result.user },
                profile: {
                  sub: result.user.uid,
                  email: result.user.email ?? undefined,
                  name: result.user.displayName ?? undefined,
                  emailVerified: result.user.emailVerified,
                  pictureUrl: result.user.photoURL ?? undefined,
                },
              });
            }}
            onUsernamePasswordSignIn={async (
              email: string,
              password: string,
            ) => {
              try {
                useAuthState.setState({ isPending: false });
                const result = await signInWithEmailAndPassword(
                  this.auth,
                  email,
                  password,
                );
                await this.setUserLoggedIn(result.user);
              } catch (error) {
                throw Error(getFirebaseErrorMessage(error), { cause: error });
              }
            }}
          />
        ),
      },
      {
        path: "/signup",
        element: (
          <ZudokuSignUpUi
            providers={this.providers}
            enableUsernamePassword={this.enableUsernamePassword}
            onOAuthSignUp={async (providerId: string) => {
              const provider = await getProviderForId(providerId);
              if (!provider) {
                throw new AuthorizationError(
                  `Provider ${providerId} not found`,
                );
              }
              await signInWithPopup(this.auth, provider);
            }}
            onUsernamePasswordSignUp={async (
              email: string,
              password: string,
            ) => {
              useAuthState.setState({ isPending: true });
              const createUser = await createUserWithEmailAndPassword(
                this.auth,
                email,
                password,
              );
              await this.setUserLoggedIn(createUser.user);
            }}
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
    await signOut(this.auth);

    useAuthState.setState({
      isAuthenticated: false,
      isPending: false,
      profile: undefined,
      providerData: undefined,
    });
  };

  onPageLoad = async () => {
    const user = this.auth.currentUser;

    if (user) {
      await this.setUserLoggedIn(user);
    } else {
      useAuthState.setState({ isPending: false });
    }
  };

  private async setUserLoggedIn(user: User) {
    useAuthState.getState().setLoggedIn({
      profile: {
        sub: user.uid,
        email: user.email ?? undefined,
        name: user.displayName ?? undefined,
        emailVerified: user.emailVerified,
        pictureUrl: user.photoURL ?? undefined,
      },
      providerData: { user },
    });
  }
}

const supabaseAuth: AuthenticationProviderInitializer<
  FirebaseAuthenticationConfig
> = (options) => new FirebaseAuthenticationProvider(options);

export default supabaseAuth;

const getProviderForId = async (providerId: string) => {
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
  }

  throw new AuthorizationError(`Provider ${providerId} not found`);
};

const getFirebaseErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return "An unexpected error occurred. Please try again.";
  }

  const errorCode = (error as { code?: string }).code;

  switch (errorCode) {
    case "auth/email-already-in-use":
      return "The email address is already used by another account.";
    case "auth/invalid-email":
      return "That email address isn't correct.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled. Please contact support.";
    case "auth/weak-password":
      return "The password must be at least 6 characters long.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
      return "That email address doesn't match an existing account.";
    case "auth/wrong-password":
      return "The email and password you entered don't match.";
    case "auth/too-many-requests":
      return "You have entered an incorrect password too many times. Please try again in a few minutes.";
    case "auth/popup-blocked":
      return "The sign-in popup was blocked by your browser. Please allow popups and try again.";
    case "auth/popup-closed-by-user":
      return "The sign-in popup was closed before completing. Please try again.";
    case "auth/network-request-failed":
      return "A network error has occurred. Please check your connection and try again.";
    case "auth/requires-recent-login":
      return "Please login again to perform this operation.";
    case "auth/invalid-credential":
      return "The credential is invalid or has expired. Please try again.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with the same email address but different sign-in credentials.";
    case "auth/credential-already-in-use":
      return "This credential is already associated with a different user account.";
    case "auth/invalid-verification-code":
      return "Wrong code. Try again.";
    case "auth/invalid-verification-id":
      return "The verification ID is invalid.";
    case "auth/missing-verification-code":
      return "Please enter the verification code.";
    case "auth/user-cancelled":
      return "Please authorize the required permissions to sign in.";
    case "auth/expired-action-code":
      return "This code has expired.";
    case "auth/invalid-action-code":
      return "The action code is invalid. This can happen if the code is malformed or has already been used.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for OAuth operations.";
    default:
      return (
        error.message ||
        "An error occurred during authentication. Please try again."
      );
  }
};
