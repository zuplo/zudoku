/** @type {import("syncpack").RcFile} */
export default {
  semverGroups: [
    {
      label: "Use exact versions for packages",
      range: "",
      dependencyTypes: ["dev", "prod", "overrides", "resolutions"],
      dependencies: ["**"],
      packages: ["**"],
    },
    {
      label: "Allow minor range for peer dependencies",
      range: "^",
      packages: ["**"],
      dependencyTypes: ["peer"],
    },
  ],
  versionGroups: [
    {
      label: "Use workspace protocol when developing local packages",
      dependencies: ["$LOCAL"],
      dependencyTypes: ["!local", "!peer"],
      pinVersion: "workspace:*",
    },
    {
      label: "Align versions of dependencies to Zudoku",
      dependencies: [
        "@types/node",
        "@types/react",
        "@types/react-dom",
        "@types/mdx",
        "typescript",
        "vite",
        "tailwindcss",
        "@mdxjs/react",
        "react",
        "react-dom",
        "react-router",
      ],
      packages: ["**"],
      snapTo: ["zudoku"],
    },
    {
      dependencies: ["@types/**"],
      dependencyTypes: ["!dev"],
      isBanned: true,
      label: "@types packages should only be under devDependencies",
    },
  ],
};
