import type { Clerk } from "@clerk/clerk-js";
import { ClerkAuthenticationConfig } from "../../../config/config.js";
import { AuthenticationProviderInitializer } from "../authentication.js";
import { AuthenticationPlugin } from "../AuthenticationPlugin.js";
import { useAuthState } from "../state.js";

class ClerkAuthPlugin extends AuthenticationPlugin {
  constructor(private clerk: Promise<Clerk | undefined>) {
    super();
  }
  initialize = async () => {
    const clerk = await this.clerk;

    if (!clerk) {
      return;
    }

    if (clerk.session) {
      useAuthState.setState({
        isAuthenticated: true,
        isPending: false,
        profile: {
          sub: clerk.session.user.id,
          name: clerk.session.user.fullName ?? undefined,
          email: clerk.session.user.emailAddresses[0]?.emailAddress,
          emailVerified: false, // TODO: Check this
          pictureUrl: clerk.session.user.imageUrl,
        },
      });
    } else {
      useAuthState.setState({
        isAuthenticated: false,
        isPending: false,
        profile: undefined,
      });
    }
  };
}

const clerkAuth: AuthenticationProviderInitializer<
  ClerkAuthenticationConfig
> = ({
  clerkPubKey,
  redirectToAfterSignOut = "/",
  redirectToAfterSignUp = "/",
  redirectToAfterSignIn = "/",
}) => {
  let clerkApi: Clerk;
  const ensureLoaded = (async () => {
    if (typeof window === "undefined") return;
    const { Clerk } = await import("@clerk/clerk-js");
    clerkApi = new Clerk(clerkPubKey);

    await clerkApi.load();
    return clerkApi;
  })();

  async function getAccessToken() {
    await ensureLoaded;
    if (!clerkApi.session) {
      throw new Error("No session available");
    }
    const response = await clerkApi.session.getToken();
    if (!response) {
      throw new Error("Could not get access token from Clerk");
    }
    return response;
  }

  return {
    getAccessToken,
    signOut: async () => {
      await ensureLoaded;
      await clerkApi.signOut({
        redirectUrl: window.location.origin + redirectToAfterSignOut,
      });
    },
    signIn: async () => {
      await ensureLoaded;
      await clerkApi.redirectToSignIn({
        signInForceRedirectUrl: window.location.origin + redirectToAfterSignIn,
        signUpForceRedirectUrl: window.location.origin + redirectToAfterSignUp,
      });
    },
    signUp: async () => {
      await ensureLoaded;
      await clerkApi.redirectToSignUp({
        signInForceRedirectUrl: window.location.origin + redirectToAfterSignIn,
        signUpForceRedirectUrl: window.location.origin + redirectToAfterSignUp,
      });
    },
    getAuthenticationPlugin() {
      return new ClerkAuthPlugin(ensureLoaded);
    },
  };
};

export default clerkAuth;
