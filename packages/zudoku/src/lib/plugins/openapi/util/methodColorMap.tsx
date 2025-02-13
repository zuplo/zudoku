import { ColorMap } from "../../../components/navigation/SidebarBadge.js";

export const MethodColorMap: Record<string, keyof typeof ColorMap> = {
  get: "green",
  post: "blue",
  put: "yellow",
  delete: "red",
  patch: "purple",
  options: "gray",
  head: "gray",
};
