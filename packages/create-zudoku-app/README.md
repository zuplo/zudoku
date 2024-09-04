# Create Zudoku App

Create a new Zudoku app in seconds with `create-zudoku-app`.

### Interactive

You can create a new project interactively by running:

```bash
npm create zudoku-app@latest
# or
yarn create zudoku-app
# or
pnpm create zudoku-app
# or
bunx create-zudoku-app
```

You will be asked for the name of your project, and then whether you want to create a TypeScript project:

```bash
✔ Would you like to use TypeScript? … No / Yes
```

Select **Yes** to install the necessary types/dependencies and create a new TS project.

### Non-interactive

You can also pass command line arguments to set up a new project non-interactively. See `create-zudoku-app --help`:

```bash
Usage: create-zudoku-app [project-directory] [options]

Options:
  -V, --version                        output the version number
  --ts, --typescript

    Initialize as a TypeScript project. (default)

  --js, --javascript

    Initialize as a JavaScript project.

  --eslint

    Initialize with ESLint config.

  --import-alias <alias-to-configure>

    Specify import alias to use (default "@/*").

  --empty

    Initialize an empty project.

  --use-npm

    Explicitly tell the CLI to bootstrap the application using npm

  --use-pnpm

    Explicitly tell the CLI to bootstrap the application using pnpm

  --use-yarn

    Explicitly tell the CLI to bootstrap the application using Yarn

  --use-bun

    Explicitly tell the CLI to bootstrap the application using Bun

  -e, --example [name]|[github-url]

    An example to bootstrap the app with. You can use an example name
    from the official Zudoku repo or a GitHub URL. The URL can use
    any branch and/or subdirectory

  --example-path <path-to-example>

    In a rare case, your GitHub URL might contain a branch name with
    a slash (e.g. bug/fix-1) and the path to the example (e.g. foo/bar).
    In this case, you must specify the path to the example separately:
    --example-path foo/bar

  --reset-preferences

    Explicitly tell the CLI to reset any stored preferences

  --skip-install

    Explicitly tell the CLI to skip installing packages

  --yes

    Use previous preferences or defaults for all options that were not
    explicitly specified, without prompting.

  -h, --help                           display help for command
```

### Why use Create Zudoku App?

`create-zudoku-app` allows you to create a new Zudoku app within seconds. It is officially maintained by the creators of Zudoku, and includes a number of benefits:

- **Interactive Experience**: Running `npm create zudoku-app@latest` (with no arguments) launches an interactive experience that guides you through setting up a project.
- **Zero Dependencies**: Initializing a project is as quick as one second. Create Zudoku App has zero dependencies.
- **Offline Support**: Create Zudoku App will automatically detect if you're offline and bootstrap your project using your local package cache.
- **Support for Examples**: Create Zudoku App can bootstrap your application using an example from the Zudoku examples collection (e.g. `npx create-zudoku-app --example my-docs`).
