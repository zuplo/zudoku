import type { ZudokuConfig } from "../../config/validators/validate.js";
import { getClerkFrontendApi } from "../authentication/providers/util.js";

export const getIssuer = async (config: ZudokuConfig) => {
  switch (config.authentication?.type) {
    case "clerk": {
      return `https://${getClerkFrontendApi(config.authentication.clerkPubKey)}`;
    }
    case "auth0": {
      return `https://${config.authentication.domain}/`;
    }
    case "openid": {
      return config.authentication.issuer;
    }
    case "supabase": {
      return config.authentication.supabaseUrl;
    }
    case "azureb2c": {
      return config.authentication.issuer;
    }
    case "firebase": {
      return `https://securetoken.google.com/${config.authentication.projectId}`;
    }
    case undefined: {
      return undefined;
    }
    default: {
      throw new Error(`Unsupported authentication type`);
    }
  }
};
