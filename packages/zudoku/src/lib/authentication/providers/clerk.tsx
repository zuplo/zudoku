import type { Clerk } from "@clerk/clerk-js";
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
import { getClerkFrontendApi } from "./util.js";

export type ClerkProviderData = {
  type: "clerk";
  user: NonNullable<Clerk["session"]>["user"] | undefined;
  accessToken?: string;
};

declare module "../state.js" {
  interface ProviderDataRegistry {
    clerk: ClerkProviderData;
  }
}

let clerkPromise: Promise<Clerk> | undefined;

const loadClerk = (publishableKey: string): Promise<Clerk> => {
  if (clerkPromise) return clerkPromise;

  clerkPromise = new Promise<void>((resolve, reject) => {
    const frontendApiUrl = getClerkFrontendApi(publishableKey);

    const script = document.createElement("script");
    script.src = `https://${frontendApiUrl}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.clerkPublishableKey = publishableKey;
    script.onload = () => resolve();
    script.onerror = () => {
      clerkPromise = undefined;
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

  return clerkPromise;
};

const clerkAuth: AuthenticationProviderInitializer<
  ClerkAuthenticationConfig
> = ({
  clerkPubKey,
  jwtTemplateName,
  redirectToAfterSignOut = "/",
  redirectToAfterSignUp,
  redirectToAfterSignIn,
}): AuthenticationPlugin & ZudokuPlugin => {
  const getClerk = (): Promise<Clerk> => {
    if (typeof window === "undefined") {
      return Promise.reject(new Error("Clerk is not available during SSR"));
    }
    return loadClerk(clerkPubKey);
  };

  const frontendApi = getClerkFrontendApi(clerkPubKey);
  const issuer = `https://${frontendApi}`;
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

  async function refreshUserProfile() {
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

  async function verifyAccessToken(
    token: string,
  ): Promise<VerifyAccessTokenResult> {
    const jose = await import("jose");
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

      const clerk = await getClerk().catch((e) => {
        // biome-ignore lint/suspicious/noConsole: Intentional error logging
        console.error("Clerk failed to initialize:", e);
        return undefined;
      });
      if (!clerk) return;

      if (clerk.session) {
        const profile = await getUserProfile(clerk);

        if (!profile) {
          useAuthState.getState().setLoggedOut();
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
      _: AuthActionContext,
      { redirectTo }: { redirectTo?: string } = {},
    ) => {
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
