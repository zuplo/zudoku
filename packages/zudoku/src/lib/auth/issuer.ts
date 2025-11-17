import type { ZudokuConfig } from "../../config/validators/validate.js";
import invariant from "../util/invariant.js";

export const getIssuer = async (config: ZudokuConfig) => {
  switch (config.authentication?.type) {
    case "clerk": {
      const frontendApiEncoded = config.authentication.clerkPubKey
        .split("_")
        .at(-1);
      invariant(frontendApiEncoded, "Clerk public key is invalid");
      const frontendApiParts = atob(frontendApiEncoded).split("$");

      if (frontendApiParts.length !== 2) {
        throw new Error("Clerk public key is invalid");
      }

      const frontendApi = frontendApiParts.at(0);
      invariant(frontendApi, "Clerk public key is invalid");

      return `https://${frontendApi}`;
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
    case "workos": {
      return `https://${config.authentication.environment}.workos.com/`;
    }
    case undefined: {
      return undefined;
    }
    default: {
      throw new Error(`Unsupported authentication type`);
    }
  }
};
