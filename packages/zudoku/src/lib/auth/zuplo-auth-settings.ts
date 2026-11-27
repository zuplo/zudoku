import type { ZudokuConfig } from "../../config/validators/ZudokuConfig.js";
import { getIssuer } from "./issuer.js";

export type ZuploAuthSettings = {
  issuer: string;
  provider: NonNullable<ZudokuConfig["authentication"]>["type"];
  clientId?: string;
  audience?: string;
};

const getClientSettings = (
  auth: NonNullable<ZudokuConfig["authentication"]>,
): Pick<ZuploAuthSettings, "clientId" | "audience"> => {
  switch (auth.type) {
    case "auth0":
    case "openid":
    case "entra":
      return { clientId: auth.clientId, audience: auth.audience };
    case "azureb2c":
      return { clientId: auth.clientId };
    default:
      return {};
  }
};

// The dev portal authentication settings the Zuplo platform reads from the
// build output (`.output/zuplo.json`), derived from the authentication config
// in one place. Returns undefined when no authentication is configured.
export const getZuploAuthSettings = async (
  config: ZudokuConfig,
): Promise<ZuploAuthSettings | undefined> => {
  const auth = config.authentication;
  const issuer = await getIssuer(config);

  if (!auth || !issuer) return undefined;

  return { issuer, provider: auth.type, ...getClientSettings(auth) };
};
