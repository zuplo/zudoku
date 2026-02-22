import type { Clerk } from "@clerk/clerk-js";
import { LogOutIcon } from "lucide-react";
import type { ZudokuPlugin } from "zudoku/plugins";
import type { ClerkAuthenticationConfig } from "../../../config/config.js";
import type {
  AuthActionContext,
  AuthenticationPlugin,
  AuthenticationProviderInitializer,
} from "../authentication.js";
import { SignIn } from "../components/SignIn.js";
import { SignOut } from "../components/SignOut.js";
import { SignUp } from "../components/SignUp.js";
import { type UserProfile, useAuthState } from "../state.js";
import { getClerkFrontendApi } from "./util.js";

export type ClerkProviderData = {
  type: "clerk";
  user: NonNullable<Clerk["session"]>["user"] | undefined;
};

declare module "../state.js" {
  interface ProviderDataRegistry {
    clerk: ClerkProviderData;
  }
}

const loadClerkCdn = (publishableKey: string): Promise<void> =>
  new Promise((resolve, reject) => {
    if (document.querySelector("script[data-clerk=loaded]")) {
      resolve();
      return;
    }

    const pending = document.querySelector("script[data-clerk=loading]");
    if (pending) {
      pending.addEventListener("load", () => resolve());
      pending.addEventListener("error", () =>
        reject(new Error("Failed to load Clerk from CDN")),
      );
      // Re-check in case load fired between querySelector and addEventListener
      if ((pending as HTMLElement).dataset.clerk === "loaded") resolve();
      return;
    }

    const frontendApiUrl = getClerkFrontendApi(publishableKey);

    const script = document.createElement("script");
    script.src = `https://${frontendApiUrl}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.clerkPublishableKey = publishableKey;
    script.dataset.clerk = "loading";
    script.onload = () => {
      script.dataset.clerk = "loaded";
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Clerk from CDN"));
    document.head.appendChild(script);
  });

const clerkAuth: AuthenticationProviderInitializer<
  ClerkAuthenticationConfig
> = ({
  clerkPubKey,
  jwtTemplateName,
  redirectToAfterSignOut = "/",
  redirectToAfterSignUp,
  redirectToAfterSignIn,
}): AuthenticationPlugin & ZudokuPlugin => {
  const clerkInstance = (async () => {
    if (typeof window === "undefined") return undefined;
    await loadClerkCdn(clerkPubKey);
    const clerk = (window as { Clerk?: Clerk }).Clerk;
    await clerk?.load();
    return clerk;
  })();

  async function getAccessToken() {
    const clerk = await clerkInstance;

    if (!clerk?.session) {
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
      name: user.fullName ?? "",
      emailVerified: !!verifiedEmail?.emailAddress,
      pictureUrl: user.imageUrl ?? "",
    };
  }

  async function refreshUserProfile() {
    const clerk = await clerkInstance.catch(() => undefined);
    if (!clerk) return false;

    await clerk.session?.user?.reload();

    const profile = await getUserProfile(clerk);

    if (!profile) {
      return false;
    }

    useAuthState.setState({
      isAuthenticated: true,
      isPending: false,
      profile,
      providerData: {
        type: "clerk",
        user: clerk.session?.user,
      },
    });

    return true;
  }

  async function signRequest(request: Request): Promise<Request> {
    const response = await getAccessToken();
    request.headers.set("Authorization", `Bearer ${response}`);
    return request;
  }

  return {
    getRoutes: () => [
      { path: "/signout", element: <SignOut /> },
      { path: "/signin", element: <SignIn /> },
      { path: "/signup", element: <SignUp /> },
    ],
    refreshUserProfile,
    getProfileMenuItems() {
      return [
        {
          label: "Logout",
          path: "/signout",
          category: "bottom",
          icon: LogOutIcon,
        } as const,
      ];
    },
    initialize: async () => {
      let clerk: Clerk | undefined;
      try {
        clerk = await clerkInstance;
      } catch (e) {
        // biome-ignore lint/suspicious/noConsole: Intentional error logging
        console.error("Clerk failed to initialize:", e);
        return;
      }

      if (!clerk) return;

      if (clerk.session) {
        const profile = await getUserProfile(clerk);

        if (!profile) {
          useAuthState.getState().setLoggedOut();
          return;
        }

        useAuthState.getState().setLoggedIn({
          profile,
          providerData: {
            type: "clerk",
            user: clerk.session.user,
          },
        });
      } else {
        useAuthState.getState().setLoggedOut();
      }
    },
    getAccessToken,
    signRequest,
    signOut: async () => {
      const clerk = await clerkInstance;
      useAuthState.getState().setLoggedOut();
      await clerk?.signOut({
        redirectUrl: window.location.origin + redirectToAfterSignOut,
      });
    },
    signIn: async (
      _: AuthActionContext,
      { redirectTo }: { redirectTo?: string } = {},
    ) => {
      const clerk = await clerkInstance;
      await clerk?.redirectToSignIn({
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
      const clerk = await clerkInstance;
      await clerk?.redirectToSignUp({
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
