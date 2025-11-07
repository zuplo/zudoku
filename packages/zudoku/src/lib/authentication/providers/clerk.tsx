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
import { useAuthState } from "../state.js";

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

    if (clerkApi.user) {
      const verifiedEmail = clerkApi.user.emailAddresses.find(
        (email) => email.verification.status === "verified",
      );
      useAuthState.getState().setLoggedIn({
        profile: {
          sub: clerkApi.user.id,
          name: clerkApi.user.fullName ?? undefined,
          email:
            verifiedEmail?.emailAddress ??
            clerkApi.user.emailAddresses[0]?.emailAddress,
          emailVerified: verifiedEmail !== undefined,
          pictureUrl: clerkApi.user.imageUrl,
        },
        providerData: {
          user: {
            publicMetadata: clerkApi.user.publicMetadata,
            id: clerkApi.user.id,
            emailAddresses: clerkApi.user.emailAddresses,
            imageUrl: clerkApi.user.imageUrl,
            fullName: clerkApi.user.fullName,
          },
        },
      });
    }

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
        const verifiedEmail = clerk.session.user.emailAddresses.find(
          (email) => email.verification.status === "verified",
        );
        useAuthState.getState().setLoggedIn({
          profile: {
            sub: clerk.session.user.id,
            name: clerk.session.user.fullName ?? undefined,
            email:
              verifiedEmail?.emailAddress ??
              clerk.session.user.emailAddresses[0]?.emailAddress,
            emailVerified: verifiedEmail !== undefined,
            pictureUrl: clerk.session.user.imageUrl,
          },
          providerData: {
            user: clerk.session.user,
          },
        });
      } else {
        useAuthState.setState({
          isAuthenticated: false,
          isPending: false,
          profile: undefined,
        });
      }
    },
    getAccessToken,
    signRequest,
    signOut: async () => {
      await ensureLoaded;
      await clerkApi?.signOut({
        redirectUrl: window.location.origin + redirectToAfterSignOut,
      });
      useAuthState.getState().setLoggedOut();
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
