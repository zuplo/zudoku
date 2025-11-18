import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  site: {
    logo: {
      src: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
      alt: "Zudoku",
      width: 130,
    },
  },
  theme: {
    registryUrl: "https://tweakcn.com/r/themes/amber-minimal.json",
  },
  navigation: [
    {
      type: "category",
      label: "Documentation",
      items: [
        {
          type: "category",
          label: "Get started",
          items: ["documentation/introduction", "documentation/installation"],
        },
      ],
    },
    {
      type: "link",
      to: "/api",
      label: "Rick & Morty API",
    },
  ],
  protectedRoutes: ["/documentation/installation", "/api/*"],
  redirects: [{ from: "/", to: "/documentation/introduction" }],
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
      "twitter",
      "microsoft",
      "apple",
    ],
  },
  apis: {
    type: "url",
    input: "https://rickandmorty.zuplo.io/openapi.json",
    path: "api",
  },
};

export default config;
