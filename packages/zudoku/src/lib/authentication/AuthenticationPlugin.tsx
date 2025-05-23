import { LogOutIcon } from "lucide-react";
import {
  type CommonPlugin,
  type NavigationPlugin,
  type ProfileMenuPlugin,
} from "../core/plugins.js";
import { SignIn } from "./components/SignIn.js";
import { SignOut } from "./components/SignOut.js";
import { SignUp } from "./components/SignUp.js";

type PluginInterface = NavigationPlugin & CommonPlugin & ProfileMenuPlugin;

export class AuthenticationPlugin implements PluginInterface {
  getRoutes() {
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
  }

  async getSidebar(path: string) {
    if (path.startsWith("/settings")) {
      return [
        {
          type: "link" as const,
          label: "Logout",
          href: "/signout",
        },
      ];
    }

    return [];
  }

  getProfileMenuItems() {
    return [
      {
        label: "Logout",
        path: "/signout",
        category: "bottom",
        icon: LogOutIcon,
      } as const,
    ];
  }
}
