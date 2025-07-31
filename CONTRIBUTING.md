# Contributing

## 1. Clone Project

- [Fork the repository](https://github.com/zuplo/zudoku/fork)

- Clone the project locally

```bash
git clone https://github.com/your_github_username/zudoku.git
```

- Change the working directory

```
cd zudoku
```

## 2. Project Setup

1. Install [`pnpm`](https://pnpm.io/installation)

```
npm install -g pnpm
```

2. Run `pnpm install` to install dependencies.

3. Install [nx](https://nx.dev/) globally by running:

```
pnpm add --global nx@latest
```

4. **Editor Setup**: This project uses [Biome](https://biomejs.dev/) for linting and formatting. For
   the best development experience, install the Biome extension for your editor or IDE. Setup
   instructions can be found at
   [their documentation page](https://biomejs.dev/guides/editors/first-party-extensions/). Note that
   Prettier is used for Markdown and YAML files since Biome doesn't support them yet.

## 3. Environment Variables

When working on Zudoku, you will need to create a `.env` file in the root of the project and set the
following environment variable in order to run the project locally.

```
ZUDOKU_INTERNAL_DEV=true
```

> [!IMPORTANT] If you are a Zuplo employee you should authenticate to NX Cloud in order to use the
> build cache.

To authenticate run:

```
nx login
```

## 4. Dev

To run the extensive sample project called "Cosmo Cargo" locally, run the following:

```
nx run cosmo-cargo:dev
```

# Submitting Contributions

## Guidelines

To contribute to Zudoku please submit your changes as a pull request and ensure that it adheres to
the following guidelines:

- Ensure you have tested your changes and are happy with how they work
- Include a list of the new features or changes to existing features that you are adding
- Include direction on how to test the new features/changes, as well as what a successful and
  unsuccessful test should look like (does not apply to README changes)
- If adding text to the UI, please check your spelling and grammar.
