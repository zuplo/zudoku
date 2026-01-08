import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  site: {
    title: "My Developer Portal",
    banner: {
      message: (
        <div className="w-full text-center">
          <strong>Congrats!</strong> 🙌 You just created your first developer
          portal.
        </div>
      ),
      color: "info",
      dismissible: true,
    },
  },
  basePath: "/docs",
  navigation: [
    {
      type: "category",
      label: "Documentation",
      items: [
        {
          type: "category",
          label: "Getting Started",
          icon: "sparkles",
          items: [
            "/introduction",
            {
              type: "link",
              icon: "folder-cog",
              badge: {
                label: "New",
                color: "purple",
              },
              label: "API Reference",
              to: "/api",
            },
          ],
        },
        {
          type: "category",
          label: "Useful Links",
          collapsible: false,
          icon: "link",
          items: [
            {
              type: "link",
              label: "Zuplo Docs",
              to: "https://zuplo.com/docs/dev-portal/introduction",
            },
            {
              type: "link",
              label: "Developer Portal Docs",
              to: "https://zuplo.com/docs/dev-portal/introduction",
            },
          ],
        },
      ],
    },
    {
      type: "link",
      to: "/api",
      label: "API Reference",
    },
  ],
  redirects: [{ from: "/", to: "/introduction" }],
  apis: {
    type: "file",
    input: "../config/routes.oas.json",
    path: "/api",
  },
  docs: {
    files: "/pages/**/*.mdx",
  },
  authentication: {
    type: "firebase",
    // Replace these with your Firebase project configuration
    // Get these values from Firebase Console > Project Settings
    apiKey: "AIzaSyDQ9VFPwbe32RyZmDiqPDyDq3BitymujDw",
    authDomain: "testing-fa0bf.firebaseapp.com",
    projectId: "testing-fa0bf",
    storageBucket: "testing-fa0bf.firebasestorage.app",
    messagingSenderId: "296819355813",
    appId: "1:296819355813:web:91d29f11cac6f073595d4c",
    measurementId: "G-12W6TTNR75",
    // Optional: specify which providers to show
    // See: https://firebase.google.com/docs/auth/web/start
    providers: [
      "github",
      "google",
      "facebook",
      "password",
      "twitter",
      "microsoft",
      "apple",
    ],
  },
  apiKeys: {
    enabled: true,
  },
};

export default config;
