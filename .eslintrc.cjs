/**@type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  ignorePatterns: ["dist", ".eslintrc.cjs", "packages/config/src/index.d.ts"],
  parserOptions: {
    project: "./tsconfig.eslint.json",
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  plugins: ["@typescript-eslint", "react-refresh"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",

    "plugin:react-hooks/recommended",
    "prettier",
  ],
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],

    "no-debugger": "error",
    "no-console": "error",

    // Typescript
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: ["class"],
        format: ["PascalCase"],
      },
      {
        selector: "interface",
        format: ["PascalCase"],
        custom: {
          regex: "^I[A-Z]",
          match: false,
        },
      },
    ],
    "@typescript-eslint/switch-exhaustiveness-check": "error",
    "@typescript-eslint/prefer-nullish-coalescing": [
      "warn",
      {
        ignorePrimitives: { string: true },
        ignoreConditionalTests: true,
      },
    ],
    "@typescript-eslint/prefer-optional-chain": "warn",
    "@typescript-eslint/no-unnecessary-condition": "warn",
    // Typescript extension rules: https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin/docs/rules#extension-rules
    "brace-style": "off",
    "default-param-last": "off",
    "@typescript-eslint/default-param-last": ["warn"],

    // React styles
    // Disabling due to false positives
    // "react/boolean-prop-naming": [
    //   "warn",
    //   {
    //     propTypeNames: ["bool", "boolean"],
    //     rule: "^(is|has|was|should|show)[A-Z]([A-Za-z0-9]?)+",
    //   },
    // ],
    "react/destructuring-assignment": "off",
    "react/jsx-uses-react": "error",
    "react/jsx-uses-vars": "error",
    "react/button-has-type": "warn",
    "react/no-array-index-key": "warn",
    "react/prop-types": "off",
    "react/no-multi-comp": ["warn", { ignoreStateless: true }],
    "react/no-unescaped-entities": "off",
    // Formatting (handled by prettier)
    "@typescript-eslint/brace-style": "off",
  },
  overrides: [
    {
      files: ["src/lib/**/*", "src/app/**/*"],
      rules: {
        "import/no-nodejs-modules": [
          "error",
          {
            allow: [
              "constants/defaults",
              "constants/routes",
              "constants/storage",
              "constants/support",
              "constants/colors",
              "constants/user",
              "constants/analytics",
              "constants/file-items",
              "constants/status-code",
              "constants/strings/CommonStrings",
              "constants/strings/FilesStrings",
              "constants/strings/PolicyStrings",
              "constants/strings/RouteStrings",
            ],
          },
        ],
      },
    },
    {
      files: ["**.test.ts", "**.spec.ts", "scripts/**/*"],
      rules: {
        // Floating promises in tests
        // https://github.com/nodejs/node/issues/51292
        "@typescript-eslint/no-floating-promises": "off",
        "import/no-nodejs-modules": "off",
        "no-console": "off",
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
  ],
};
