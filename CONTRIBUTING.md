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

3. **Editor Setup**: This project uses [Biome](https://biomejs.dev/) for linting and
   [oxfmt](https://oxc.rs/docs/guide/usage/formatter/quickstart.html) for formatting. Install the
   Biome and OXC extensions for your editor for the best development experience.

## 3. Dev

To run the extensive sample project called "Cosmo Cargo" locally:

```
pnpm -F cosmo-cargo dev
```

The CLI runs from source via `tsx`, so no build step is required first.

## 4. Changesets

This repo uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing.

When your PR includes a user-visible change, add a changeset:

```
pnpm changeset
```

Pick the affected package(s), the semver bump, and a one-line summary. Commit the generated
`.changeset/*.md` file with your PR. A bot opens a "Version Packages" PR that, when merged, releases
to npm.

To preview a build on npm without releasing, run the **pkg.pr.new** workflow manually (Actions →
pkg.pr.new → Run workflow), pick the branch and package; the run summary shows the install URLs via
[pkg.pr.new](https://pkg.pr.new). Every push to `main` also publishes a `zudoku` preview.

# Submitting Contributions

## Guidelines

To contribute to Zudoku please submit your changes as a pull request and ensure that it adheres to
the following guidelines:

- Ensure you have tested your changes and are happy with how they work
- Include a list of the new features or changes to existing features that you are adding
- Include direction on how to test the new features/changes, as well as what a successful and
  unsuccessful test should look like (does not apply to README changes)
- If adding text to the UI, please check your spelling and grammar.
