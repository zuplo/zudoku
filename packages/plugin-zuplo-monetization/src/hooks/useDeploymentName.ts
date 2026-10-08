import { useZudoku } from "zudoku/hooks";
import { resolveDeploymentName } from "../deploymentName.js";

export const useDeploymentName = () => {
  const zudoku = useZudoku();

  return resolveDeploymentName(zudoku.env.ZUPLO_PUBLIC_DEPLOYMENT_NAME);
};
