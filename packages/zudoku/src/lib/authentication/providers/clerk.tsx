import type { ZudokuPlugin } from "zudoku/plugins";
import type { ClerkAuthenticationConfig } from "../../../config/config.js";
import type {
  AuthActionContext,
  AuthenticationPlugin,
  AuthenticationProviderInitializer,
  VerifyAccessTokenResult,
} from "../authentication.js";
import { SignIn } from "../components/SignIn.js";
import { SignOut } from "../components/SignOut.js";
import { SignUp } from "../components/SignUp.js";
import { type UserProfile, useAuthState } from "../state.js";
import { getClerkFrontendApi, redirectToSignUpUrl } from "./util.js";

type ClerkEmailAddress = {
  emailAddress: string;
  verification: { status: string };
};

export type ClerkUser = {
  id: string;
  fullName: string | null;
  imageUrl: string;
  emailAddresses: ClerkEmailAddress[];
  reload: () => Promise<unknown>;
  [key: string]: unknown;
};

type ClerkSession = {
  user: ClerkUser;
  getToken: (opts: { template?: string }) => Promise<string | null>;
};

type ClerkRedirectOptions = {
  signInForceRedirectUrl?: string;
  signUpForceRedirectUrl?: string;
};

type Clerk = {
  session: ClerkSession | null | undefined;
  load: () => Promise<void>;
  signOut: (opts: { redirectUrl: string }) => Promise<void>;
  redirectToSignIn: (opts: ClerkRedirectOptions) => Promise<void>;
  redirectToSignUp: (opts: ClerkRedirectOptions) => Promise<void>;
};

export type ClerkProviderData = {
  type: "clerk";
  user: ClerkUser | undefined;
  accessToken?: string;
};

declare module "../state.js" {
  interface ProviderDataRegistry {
    clerk: ClerkProviderData;
  }
}

let clerkPromise: Promise<Clerk> | undefined;
const CLERK_ANONYMOUS_RECOVERY_DELAY_MS = 30_000;

const getCookieValue = (name: string) => {
  const prefix = `${name}=`;
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);
};

const hasClerkSessionHint = () => {
  const clientUpdatedAt = getCookieValue("__client_uat");
  const searchParams = new URL(window.location.href).searchParams;

  return Boolean(
    getCookieValue("__session") ||
    getCookieValue("__clerk_db_jwt") ||
    getCookieValue("__clerk_handshake") ||
    (clientUpdatedAt && clientUpdatedAt !== "0") ||
    searchParams.has("__clerk_db_jwt") ||
    searchParams.has("__clerk_handshake"),
  );
};

const loadClerk = (publishableKey: string): Promise<Clerk> => {
  if (clerkPromise) return clerkPromise;

  const promise = new Promise<void>((resolve, reject) => {
    const frontendApiUrl = getClerkFrontendApi(publishableKey);

    const script = document.createElement("script");
    script.src = `https://${frontendApiUrl}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.clerkPublishableKey = publishableKey;
    script.onload = () => resolve();
    script.onerror = () => {
      reject(new Error("Failed to load Clerk from CDN"));
    };
    document.head.appendChild(script);
  }).then(async () => {
    const clerk = (window as { Clerk?: Clerk }).Clerk;
    if (!clerk) {
      throw new Error("Clerk script loaded but window.Clerk is not available");
    }
    await clerk.load();
    return clerk;
  });

  clerkPromise = promise;
  void promise.catch(() => {
    if (clerkPromise === promise) clerkPromise = undefined;
  });

  return promise;
};

const clerkAuth: AuthenticationProviderInitializer<
  ClerkAuthenticationConfig
> = ({
  clerkPubKey,
  jwtTemplateName,
  redirectToAfterSignOut = "/",
  redirectToAfterSignUp,
  redirectToAfterSignIn,
  signUp: signUpConfig,
  disableSignUp,
}): AuthenticationPlugin & ZudokuPlugin => {
  const getClerk = (): Promise<Clerk> => {
    if (typeof window === "undefined") {
      return Promise.reject(new Error("Clerk is not available during SSR"));
    }
    return loadClerk(clerkPubKey);
  };

  let cachedIssuer: string | undefined;
  const getIssuer = () => {
    cachedIssuer ??= `https://${getClerkFrontendApi(clerkPubKey)}`;
    return cachedIssuer;
  };
  let jwks: ReturnType<typeof import("jose").createRemoteJWKSet> | undefined;

  async function getAccessToken() {
    const clerk = await getClerk();

    if (!clerk.session) {
      throw new Error("No session available");
    }
    const response = await clerk.session.getToken({
      template: jwtTemplateName,
    });
    if (!response) {
      throw new Error("Could not get access token from Clerk");
    }
    return response;
  }

  async function getUserProfile(
    clerk: Clerk,
  ): Promise<UserProfile | undefined> {
    const user = clerk.session?.user;
    if (!user) return undefined;

    const verifiedEmail = user.emailAddresses.find(
      (email) => email.verification.status === "verified",
    );

    return {
      sub: user.id ?? "",
      email:
        verifiedEmail?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        "",
      name: user.fullName ?? undefined,
      emailVerified: !!verifiedEmail?.emailAddress,
      pictureUrl: user.imageUrl ?? undefined,
    };
  }

  let initializationPromise: Promise<void> | undefined;
  let clerkInitializationAttempted = false;
  let clerkInitialized = false;

  async function refreshUserProfile() {
    if (typeof window !== "undefined") {
      // initialize() has already seeded authoritative SSR state or resolved a
      // clean anonymous SSG visit. Do not let the shared profile-refresh hook
      // defeat that fast path by loading Clerk during the first render. Once
      // interaction starts the SDK, explicit and focus refreshes work normally.
      if (
        !clerkInitializationAttempted &&
        window.ZUDOKU_SSR_AUTH !== undefined
      ) {
        return Boolean(window.ZUDOKU_SSR_AUTH.profile);
      }

      if (
        !clerkInitializationAttempted &&
        !useAuthState.getState().isAuthenticated &&
        !hasClerkSessionHint()
      ) {
        return false;
      }

      if (initializationPromise && !clerkInitialized) {
        await initializationPromise;
        return useAuthState.getState().isAuthenticated;
      }
    }

    const clerk = await getClerk().catch((e) => {
      // biome-ignore lint/suspicious/noConsole: Intentional warning
      console.warn("Clerk unavailable during profile refresh:", e);
      return undefined;
    });
    if (!clerk) return false;

    await clerk.session?.user?.reload();

    const profile = await getUserProfile(clerk);

    if (!profile) {
      return false;
    }

    const accessToken = await getAccessToken().catch(() => undefined);

    useAuthState.setState({
      isAuthenticated: true,
      isPending: false,
      profile,
      providerData: {
        type: "clerk",
        user: clerk.session?.user,
        accessToken,
      },
    });

    return true;
  }

  async function signRequest(request: Request): Promise<Request> {
    const response = await getAccessToken();
    request.headers.set("Authorization", `Bearer ${response}`);
    return request;
  }

  const initializeClerk = () => {
    clerkInitializationAttempted = true;
    initializationPromise ??= (async () => {
      try {
        const clerk = await getClerk();

        if (clerk.session) {
          const profile = await getUserProfile(clerk);

          if (!profile) {
            useAuthState.getState().setLoggedOut();
            clerkInitialized = true;
            return;
          }

          const accessToken = await getAccessToken().catch(() => undefined);

          useAuthState.getState().setLoggedIn({
            profile,
            providerData: {
              type: "clerk",
              user: clerk.session.user,
              accessToken,
            },
          });
        } else {
          useAuthState.getState().setLoggedOut();
        }
        clerkInitialized = true;
      } catch (e) {
        clerkInitialized = false;
        // biome-ignore lint/suspicious/noConsole: Intentional error logging
        console.error("Clerk failed to initialize:", e);

        // An SSR result remains authoritative for this request. A returning
        // SSG profile, however, was unverified and must resolve fail-closed.
        if (window.ZUDOKU_SSR_AUTH === undefined) {
          useAuthState.getState().setLoggedOut();
        }

        // loadClerk also clears its cached rejection, so a later auth action
        // or recovery attempt can retry the CDN instead of reusing a failure.
        initializationPromise = undefined;
      }
    })();

    return initializationPromise;
  };

  let deferredInitializationScheduled = false;
  const deferClerkInitialization = () => {
    if (deferredInitializationScheduled) return;
    deferredInitializationScheduled = true;

    let fallbackTimer: number;
    const startClerk = () => {
      window.removeEventListener("pointerdown", startClerk);
      window.removeEventListener("keydown", startClerk);
      window.clearTimeout(fallbackTimer);
      void initializeClerk();
    };

    window.addEventListener("pointerdown", startClerk, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", startClerk, { once: true });
    fallbackTimer = window.setTimeout(
      startClerk,
      CLERK_ANONYMOUS_RECOVERY_DELAY_MS,
    );
  };

  async function verifyAccessToken(
    token: string,
  ): Promise<VerifyAccessTokenResult> {
    const jose = await import("jose");
    const issuer = getIssuer();
    if (!jwks) {
      jwks = jose.createRemoteJWKSet(
        new URL(`${issuer}/.well-known/jwks.json`),
      );
    }
    try {
      const { payload } = await jose.jwtVerify(token, jwks, { issuer });
      if (!payload.sub) return undefined;
      return {
        profile: {
          sub: String(payload.sub),
          email: (payload.email ?? payload.email_address) as string | undefined,
          name: payload.name as string | undefined,
          emailVerified: Boolean(payload.email_verified),
          pictureUrl: (payload.picture ?? payload.image_url) as
            | string
            | undefined,
        },
        expiresAt: typeof payload.exp === "number" ? payload.exp : undefined,
      };
    } catch (e) {
      // JOSEError = invalid token (→ 401). Rethrow anything else so the
      // handler can surface 502 for misconfig / JWKS fetch failures.
      if (e instanceof jose.errors.JOSEError) return undefined;
      throw e;
    }
  }

  return {
    disableSignUp: disableSignUp ?? false,
    getRoutes: () => [
      { path: "/signout", element: <SignOut /> },
      { path: "/signin", element: <SignIn /> },
      { path: "/signup", element: <SignUp /> },
    ],
    refreshUserProfile,
    getProfileMenuItems() {
      return [];
    },
    initialize: async () => {
      if (typeof window === "undefined") return;

      // An SSR auth signal is authoritative for this request. Preserve it and
      // reconcile Clerk after first interaction; auth actions still load the
      // SDK immediately when needed.
      if (window.ZUDOKU_SSR_AUTH !== undefined) {
        deferClerkInitialization();
        return;
      }

      // A statically generated page without a Clerk session or handshake hint
      // is anonymous. Resolve that state synchronously and keep the remote SDK
      // out of the lab-test/first-paint window.
      const authState = useAuthState.getState();
      if (!hasClerkSessionHint() && !authState.isAuthenticated) {
        authState.setLoggedOut();
        deferClerkInitialization();
        return;
      }

      // Returning SSG users need session restoration, but it must not suspend
      // the public app shell while Clerk downloads and initializes.
      useAuthState.setState({
        isAuthenticated: false,
        isPending: true,
        profile: null,
        providerData: null,
      });
      void initializeClerk();
    },
    getAccessToken,
    signRequest,
    verifyAccessToken,
    signOut: async () => {
      const clerk = await getClerk();
      useAuthState.getState().setLoggedOut();
      await clerk.signOut({
        redirectUrl: window.location.origin + redirectToAfterSignOut,
      });
    },
    signIn: async (
      _: AuthActionContext,
      { redirectTo }: { redirectTo?: string } = {},
    ) => {
      const clerk = await getClerk();
      await clerk.redirectToSignIn({
        signInForceRedirectUrl: redirectToAfterSignIn
          ? window.location.origin + redirectToAfterSignIn
          : redirectTo,
        signUpForceRedirectUrl: redirectToAfterSignUp
          ? window.location.origin + redirectToAfterSignUp
          : redirectTo,
      });
    },
    signUp: async (
      { navigate }: AuthActionContext,
      {
        redirectTo,
        replace = false,
      }: { redirectTo?: string; replace?: boolean } = {},
    ) => {
      if (signUpConfig) {
        redirectToSignUpUrl(signUpConfig.url, navigate, replace);
        return;
      }
      const clerk = await getClerk();
      await clerk.redirectToSignUp({
        signInForceRedirectUrl: redirectToAfterSignIn
          ? window.location.origin + redirectToAfterSignIn
          : redirectTo,
        signUpForceRedirectUrl: redirectToAfterSignUp
          ? window.location.origin + redirectToAfterSignUp
          : redirectTo,
      });
    },
  };
};

export default clerkAuth;
