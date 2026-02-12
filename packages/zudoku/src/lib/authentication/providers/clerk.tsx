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

const clerkAuth: AuthenticationProviderInitializer<
  ClerkAuthenticationConfig
> = ({
  clerkPubKey,
  jwtTemplateName,
  redirectToAfterSignOut = "/",
  redirectToAfterSignUp,
  redirectToAfterSignIn,
}): AuthenticationPlugin & ZudokuPlugin => {
  let clerkApi: Clerk | undefined;
  const ensureLoaded = (async () => {
    if (typeof window === "undefined") return;
    const { Clerk } = await import("@clerk/clerk-js");
    clerkApi = new Clerk(clerkPubKey);

    await clerkApi.load();

    return clerkApi;
  })();

  async function getAccessToken() {
    await ensureLoaded;
    if (!clerkApi?.session) {
      throw new Error("No session available");
    }
    const response = await clerkApi.session.getToken({
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
    if (!clerk.session?.user) {
      return undefined;
    }

    const verifiedEmail = clerk.session?.user?.emailAddresses.find(
      (email) => email.verification.status === "verified",
    );

    return {
      sub: clerk.session?.user?.id ?? "",
      email:
        verifiedEmail?.emailAddress ??
        clerk.session?.user?.emailAddresses[0]?.emailAddress ??
        "",
      name: clerk.session?.user?.fullName ?? "",
      emailVerified: !!verifiedEmail?.emailAddress,
      pictureUrl: clerk.session?.user?.imageUrl ?? "",
    };
  }

  async function refreshUserProfile() {
    const clerk = await ensureLoaded;
    if (!clerk) {
      return false;
    }

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
    getRoutes: () => {
      return [
        {
          path: "/signout",
          element: <SignOut />,
        },
        {
          path: "/signin",
          element: <SignIn />,
        },
        {
          path: "/signup",
          element: <SignUp />,
        },
      ];
    },

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
      const clerk = await ensureLoaded;

      if (!clerk) {
        return;
      }

      if (clerk.session) {
        const profile = await getUserProfile(clerk);

        if (!profile) {
          useAuthState.getState().setLoggedOut();
          return;
        }

        useAuthState.getState().setLoggedIn({
          profile,
          providerData: {
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
      await ensureLoaded;
      useAuthState.getState().setLoggedOut();
      await clerkApi?.signOut({
        redirectUrl: window.location.origin + redirectToAfterSignOut,
      });
    },
    signIn: async (
      _: AuthActionContext,
      { redirectTo }: { redirectTo?: string } = {},
    ) => {
      await ensureLoaded;
      await clerkApi?.redirectToSignIn({
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
      await ensureLoaded;
      await clerkApi?.redirectToSignUp({
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
