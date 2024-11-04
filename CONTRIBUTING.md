# Contributing

## Setup

Run `pnpm install` to install dependancies.

The project using [nx](https://nx.dev/) for running tasks.

To install nx globally run:

```
pnpm add --global nx@latest
```

## Environment Variables

When working on Zudoku, you will need to create a `.env` file in the root of the project and set the following environment variable in order to run the project locally.

```
ZUDOKU_INTERNAL_DEV=true
```

## NX Cache

If you are a Zuplo employee you should authenticate to NX Cloud in order to use the build cache.

To authenticate run:

```
nx login
```

## Build

To build all projects run:

```
nx run-many -t build
```

## Dev

To run a sample locally, run the following.

```
nx run with-config:dev
```

# Submitting Contributions

## Guidelines

To contribute to Zudoku please submit your changes as a pull request and ensure that it adheres to the following guidelines:

- Ensure you have tested your changes and are happy with how they work
- Include a list of the new features or changes to existing features that you are adding
- Include direction on how to test the new features/changes, as well as what a successful and unsuccessful test should look like (does not apply to README changes)
- If adding text to the UI, please check your spelling and grammar.
