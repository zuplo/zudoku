import {
  type FirebaseApp,
  type FirebaseOptions,
  initializeApp,
} from "firebase/app";
import {
  type Auth,
  type AuthProvider,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  getAuth,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { useState } from "react";
import type { FirebaseAuthenticationConfig } from "../../../config/config.js";
import { CoreAuthenticationPlugin } from "../AuthenticationPlugin.js";
import type {
  AuthenticationPlugin,
  AuthenticationProviderInitializer,
} from "../authentication.js";
import { AuthorizationError } from "../errors.js";
import { type UserProfile, useAuthState } from "../state.js";

class FirebaseAuthenticationProvider
  extends CoreAuthenticationPlugin
  implements AuthenticationPlugin
{
  private readonly app: FirebaseApp;
  private readonly auth: Auth;
  private readonly config: FirebaseAuthenticationConfig;
  public readonly hasCustomUI = true;

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

  private async updateUserState(user: User) {
    const profile: UserProfile = {
      sub: user.uid,
      email: user.email ?? undefined,
      name: user.displayName ?? undefined,
      emailVerified: user.emailVerified,
      pictureUrl: user.photoURL ?? undefined,
    };

    useAuthState.getState().setLoggedIn({
      profile,
      providerData: { user },
    });
  }

  async getAccessToken(): Promise<string> {
    const user = this.auth.currentUser;

    if (!user) {
      throw new AuthorizationError("User is not authenticated");
    }

    return await user.getIdToken();
  }

  async signRequest(request: Request): Promise<Request> {
    const accessToken = await this.getAccessToken();
    request.headers.set("Authorization", `Bearer ${accessToken}`);
    return request;
  }

  // Custom UI rendering - return component functions, not JSX
  renderSignInUI = () => {
    const auth = this.auth;
    const config = this.config;
    return () => (
      <FirebaseAuthUI auth={auth} config={config} initialMode="signin" />
    );
  };

  renderSignUpUI = () => {
    const auth = this.auth;
    const config = this.config;
    return () => (
      <FirebaseAuthUI auth={auth} config={config} initialMode="signup" />
    );
  };

  // No-op methods since Auth UI handles the interactions
  signUp = async () => {
    // Auth UI handles this
  };

  signIn = async () => {
    // Auth UI handles this
  };

  signOut = async () => {
    await firebaseSignOut(this.auth);

    useAuthState.setState({
      isAuthenticated: false,
      isPending: false,
      profile: undefined,
      providerData: undefined,
    });
  };

  onPageLoad = async () => {
    // Check if the user is signing in with an email link
    if (isSignInWithEmailLink(this.auth, window.location.href)) {
      // Get the email from localStorage
      const email = window.localStorage.getItem("emailForSignIn");
      if (email) {
        try {
          await signInWithEmailLink(this.auth, email, window.location.href);
          // Clear the email from storage
          window.localStorage.removeItem("emailForSignIn");
          // The onAuthStateChanged listener will handle updating the state
        } catch {
          // Failed to sign in with email link
          useAuthState.setState({ isPending: false });
        }
      } else {
        // Email not found, user needs to enter it
        useAuthState.setState({ isPending: false });
      }
    } else {
      // Firebase Auth automatically handles session restoration
      // via onAuthStateChanged listener
      const user = this.auth.currentUser;

      if (user) {
        await this.updateUserState(user);
      } else {
        useAuthState.setState({ isPending: false });
      }
    }
  };

  getTroubleshootingDocs(): string | undefined {
    return `
## Firebase Authentication Troubleshooting

### Common Issues

1. **Configuration Errors**: Verify your Firebase configuration values in \`zudoku.config.ts\`
   - Check that \`apiKey\`, \`authDomain\`, and \`projectId\` are correct
   - These values can be found in Firebase Console → Project Settings → General

2. **Domain Not Authorized**: Add your domain to Firebase authorized domains
   - Go to Firebase Console → Authentication → Settings → Authorized domains
   - Add \`localhost\` for development
   - Add your production domain(s)

3. **Provider Not Enabled**: Enable authentication providers in Firebase Console
   - Go to Authentication → Sign-in method
   - Enable your desired providers (Google, GitHub, Email/Password, etc.)
   - Configure OAuth credentials for social providers

4. **API Key Restrictions**: Check if your Firebase API key has restrictions
   - Go to Google Cloud Console → Credentials
   - Ensure the API key allows requests from your domain

5. **Session Persistence**: Firebase Auth persists sessions in localStorage by default
   - Ensure localStorage is not blocked
   - Check browser privacy settings

### Get More Help

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com)
- Check browser console for detailed error messages
`;
  }
}

// Helper to get provider instance from provider ID using dynamic imports for tree shaking
const getProviderForId = async (
  providerId: string,
): Promise<AuthProvider | null> => {
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

// Provider display names
const PROVIDER_NAMES: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  facebook: "Facebook",
  twitter: "Twitter",
  microsoft: "Microsoft",
  apple: "Apple",
  yahoo: "Yahoo",
  password: "Email",
  phone: "Phone",
};

// Map Firebase error codes to user-friendly messages
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
      // Return the error message from Firebase, or a generic message
      return (
        error.message ||
        "An error occurred during authentication. Please try again."
      );
  }
};

// Provider icons (simple SVG icons for OAuth providers)
const ProviderIcons: Record<string, React.FC<{ className?: string }>> = {
  google: ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  ),
  github: ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  ),
  facebook: ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="#1877F2"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  twitter: ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  microsoft: ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#00A4EF" d="M13 1h10v10H13z" />
      <path fill="#7FBA00" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  ),
  apple: ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  ),
  yahoo: ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="#6001D2"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12.186 3l-3.047 7.521L6.088 3H0l6.614 12.615V21h4.744v-5.385L18 3h-5.814z" />
    </svg>
  ),
};

// Custom Firebase Auth UI Component
const FirebaseAuthUI = ({
  auth,
  config,
  initialMode = "signin",
}: {
  auth: Auth;
  config: FirebaseAuthenticationConfig;
  initialMode?: "signin" | "signup";
}) => {
  const [mode, setMode] = useState<"signin" | "signup" | "reset" | "emailLink">(
    initialMode,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [emailLinkSent, setEmailLinkSent] = useState(false);

  const providers = config.providers?.length ? config.providers : ["password"];
  const oauthProviders = providers.filter(
    (p) => p !== "password" && p !== "phone" && p !== "emailLink",
  );
  const hasEmailPassword = providers.includes("password");
  const hasEmailLink = providers.includes("emailLink");

  const handleOAuthSignIn = async (providerId: string) => {
    try {
      setError(null);
      setLoading(true);
      const provider = await getProviderForId(providerId);
      if (!provider) {
        throw new Error(`Unknown provider: ${providerId}`);
      }
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else if (mode === "reset") {
        await sendPasswordResetEmail(auth, email);
        setResetEmailSent(true);
      } else if (mode === "emailLink") {
        const actionCodeSettings = {
          url: window.location.origin + window.location.pathname,
          handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        // Save email to localStorage to complete sign-in later
        window.localStorage.setItem("emailForSignIn", email);
        setEmailLinkSent(true);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* OAuth Providers */}
      {oauthProviders.length > 0 && (
        <div className="space-y-3">
          {oauthProviders.map((providerId) => {
            const Icon = ProviderIcons[providerId];
            return (
              <button
                key={providerId}
                type="button"
                onClick={() => handleOAuthSignIn(providerId)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-input rounded-md bg-background hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {Icon && <Icon className="w-5 h-5 shrink-0" />}
                <span>
                  Continue with {PROVIDER_NAMES[providerId] || providerId}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Divider */}
      {oauthProviders.length > 0 && (hasEmailPassword || hasEmailLink) && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>
      )}

      {/* Email/Password/Link Form */}
      {(hasEmailPassword || hasEmailLink) && (
        <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
          {mode === "emailLink" && emailLinkSent ? (
            <div className="rounded-md bg-accent p-4 text-sm">
              <p>Sign-in link sent! Check your email inbox.</p>
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setEmailLinkSent(false);
                }}
                className="mt-2 text-primary hover:underline"
              >
                Back to sign in
              </button>
            </div>
          ) : mode === "reset" && resetEmailSent ? (
            <div className="rounded-md bg-accent p-4 text-sm">
              <p>Password reset email sent! Check your inbox.</p>
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setResetEmailSent(false);
                }}
                className="mt-2 text-primary hover:underline"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="you@example.com"
                />
              </div>

              {mode !== "reset" && mode !== "emailLink" && (
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="••••••••"
                  />
                </div>
              )}

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 h-9 px-4 py-2"
              >
                {loading
                  ? "Loading..."
                  : mode === "reset"
                    ? "Send reset email"
                    : mode === "emailLink"
                      ? "Send sign-in link"
                      : mode === "signup"
                        ? "Sign up"
                        : "Sign in"}
              </button>

              <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                {mode === "signin" && (
                  <>
                    {hasEmailPassword && (
                      <button
                        type="button"
                        onClick={() => setMode("reset")}
                        className="text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                    {hasEmailLink && (
                      <button
                        type="button"
                        onClick={() => setMode("emailLink")}
                        className="text-primary hover:underline"
                      >
                        Email link
                      </button>
                    )}
                    {hasEmailPassword && (
                      <button
                        type="button"
                        onClick={() => setMode("signup")}
                        className="text-primary hover:underline"
                      >
                        Create account
                      </button>
                    )}
                  </>
                )}
                {(mode === "signup" ||
                  mode === "reset" ||
                  mode === "emailLink") && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setResetEmailSent(false);
                      setEmailLinkSent(false);
                    }}
                    className="text-primary hover:underline"
                  >
                    Back to sign in
                  </button>
                )}
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
};

const firebaseAuth: AuthenticationProviderInitializer<
  FirebaseAuthenticationConfig
> = (options) => new FirebaseAuthenticationProvider(options);

export default firebaseAuth;
