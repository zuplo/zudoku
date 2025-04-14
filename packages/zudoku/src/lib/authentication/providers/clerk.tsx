import type { Clerk } from "@clerk/clerk-js";
import { type ClerkAuthenticationConfig } from "../../../config/config.js";
import { type AuthenticationProviderInitializer } from "../authentication.js";
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
      const verifiedEmail = clerk.session.user.emailAddresses.find(
        (email) => email.verification.status === "verified",
      );
      useAuthState.setState({
        isAuthenticated: true,
        isPending: false,
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
      useAuthState.setState({
        isAuthenticated: true,
        isPending: false,
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
    const response = await clerkApi.session.getToken();
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
    clerk: clerkApi,
    getAccessToken,
    signRequest,
    signOut: async () => {
      await ensureLoaded;
      await clerkApi?.signOut({
        redirectUrl: window.location.origin + redirectToAfterSignOut,
      });
      useAuthState.setState({
        isAuthenticated: false,
        isPending: false,
        profile: null,
        providerData: null,
      });
    },
    signIn: async ({ redirectTo }: { redirectTo?: string } = {}) => {
      await ensureLoaded;
      await clerkApi?.redirectToSignIn({
        signInForceRedirectUrl:
          redirectTo ?? window.location.origin + redirectToAfterSignIn,
        signUpForceRedirectUrl:
          redirectTo ?? window.location.origin + redirectToAfterSignUp,
      });
    },
    signUp: async ({ redirectTo }: { redirectTo?: string } = {}) => {
      await ensureLoaded;
      await clerkApi?.redirectToSignUp({
        signInForceRedirectUrl:
          redirectTo ?? window.location.origin + redirectToAfterSignIn,
        signUpForceRedirectUrl:
          redirectTo ?? window.location.origin + redirectToAfterSignUp,
      });
    },
    getAuthenticationPlugin() {
      return new ClerkAuthPlugin(ensureLoaded);
    },
  };
};

export default clerkAuth;
