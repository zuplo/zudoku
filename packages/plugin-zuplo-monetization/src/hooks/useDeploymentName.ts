import { useZudoku } from "zudoku/hooks";

export const useDeploymentName = () => {
  const zudoku = useZudoku();
  const deploymentName = zudoku.env.ZUPLO_PUBLIC_DEPLOYMENT_NAME;

  if (!deploymentName) {
    throw new Error("ZUPLO_PUBLIC_DEPLOYMENT_NAME is not set");
  }

  return deploymentName;
};
