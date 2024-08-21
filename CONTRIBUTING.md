# Contributing

## Setup

Run `pnpm install` to install dependancies.

The project using [nx](https://nx.dev/) for running tasks.

To install nx globally run:

```
pnpm add --global nx@latest
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
