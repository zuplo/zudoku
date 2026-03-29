---
title: CLI Installation Steps Explained
description: Understanding what happens when you run create-zudoku and what each prompt does
---

When you run `npm create zudoku@latest`, the CLI guides you through several steps to set up your Zudoku project. This guide explains each step, why it's there, and what happens when you answer "yes" or "no".

## Installation Flow Overview

The `create-zudoku` CLI provides an interactive experience with sensible defaults. You can skip all prompts by using the `--yes` flag, or use specific flags to pre-answer individual questions.

## Step-by-Step Breakdown

### Step 1: Project Name

```bash
? What is your project named? › my-app
```

**Why this step exists:**
- Sets the directory name where your project will be created
- Becomes your project's package name in `package.json`
- Must follow npm naming restrictions (lowercase, no spaces, etc.)

**What happens:**
- Creates a new directory with this name
- Validates the name against npm package naming rules
- Checks if the directory is empty or doesn't exist

**Skip with:** Pass the directory as the first argument: `npm create zudoku@latest my-docs`

---

### Step 2: TypeScript or JavaScript

```bash
? Would you like to use TypeScript? › Yes / No
```

**Why this step exists:**
TypeScript provides type safety, better IDE support, and catches errors before runtime. However, some developers prefer JavaScript's simplicity.

**Choosing "Yes" (TypeScript) will:**
- Create a `tsconfig.json` configuration file
- Generate `.tsx` files for your Zudoku config
- Install TypeScript development dependencies:
  - `typescript`
  - `@types/node`
  - `@types/react`
  - `@types/react-dom`
- Enable type checking and autocomplete in your editor

**Choosing "No" (JavaScript) will:**
- Create `.jsx` files for your Zudoku config
- Skip TypeScript dependencies
- Smaller initial install size
- No type checking (faster compilation, less safety)

**Default:** Yes (TypeScript)

**Skip with:** `--typescript` or `--js` / `--javascript` flags

**Your choice is remembered:** The CLI saves your preference for future projects. Reset with `--reset-preferences`.

---

### Step 3: ESLint Configuration

```bash
? Would you like to use ESLint? › Yes / No
```

**Why this step exists:**
ESLint helps catch common coding mistakes and enforces consistent code style across your project. It's especially useful in team environments.

**Choosing "Yes" (ESLint enabled) will:**
- Create an `.eslintrc.json` configuration file
- Install ESLint development dependencies:
  - `eslint`
  - `@typescript-eslint/eslint-plugin` (if TypeScript is enabled)
  - `@typescript-eslint/parser` (if TypeScript is enabled)
- Add `npm run lint` script to your `package.json`
- Enable real-time error checking in most editors

**Choosing "No" (Skip ESLint) will:**
- Skip ESLint configuration and dependencies
- Slightly faster install
- No automatic code quality checks
- You can always add ESLint later manually

**Default:** Yes (ESLint enabled)

**Skip with:** `--eslint` or `--no-eslint` flags

**Your choice is remembered:** Like TypeScript, this preference is saved for future projects.

---

### Step 4: Example Fallback (Only appears on download errors)

```bash
? Could not download "example-name" because of a connectivity issue.
  Do you want to use the default template instead? › Yes / No
```

**Why this step exists:**
If you specified an example with the `--example` flag but the download fails (due to network issues or invalid example name), the CLI offers to fall back to the default template instead of failing completely.

**Choosing "Yes" will:**
- Use the built-in default template
- Continue installation without the example code
- You get a working Zudoku project, just without the specific example you requested

**Choosing "No" will:**
- Abort the installation
- Exit with an error
- You can fix connectivity/example issues and try again

---

## Behind the Scenes: What Happens After Your Choices

### 1. Validation Phase
- Checks directory is writable
- Ensures directory is empty or contains only safe files (`.git`, `LICENSE`, etc.)
- Detects internet connectivity (for package installation)

### 2. Template Generation
Based on your choices, the CLI generates:

```
your-project/
├── .gitignore
├── package.json           # With appropriate dependencies
├── zudoku.config.tsx      # Or .jsx if JavaScript
├── tsconfig.json          # Only if TypeScript
└── .eslintrc.json         # Only if ESLint
```

### 3. Dependency Installation
Unless you used `--skip-install`, the CLI automatically installs:

**Core dependencies (always installed):**
- `react` (>=19.0.0)
- `react-dom` (>=19.0.0)
- `zudoku` (latest version)

**TypeScript dependencies (if TypeScript selected):**
- `typescript`
- `@types/node`
- `@types/react`
- `@types/react-dom`

**ESLint dependencies (if ESLint selected):**
- `eslint`
- `@typescript-eslint/eslint-plugin` (TypeScript only)
- `@typescript-eslint/parser` (TypeScript only)

### 4. Git Initialization
If the directory is not already in a git repository, the CLI automatically:
- Runs `git init`
- Creates an initial commit (if git is configured)
- Sets up `.gitignore` to exclude `node_modules` and build artifacts

### 5. Success Message
After installation, you'll see available commands:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint (if enabled)

---

## Quick Start Modes

### Interactive Mode (Default)
```bash
npm create zudoku@latest
```
Asks all questions, shows helpful messages, saves your preferences.

### Express Mode
```bash
npm create zudoku@latest my-docs --yes
```
Uses defaults or saved preferences for everything:
- TypeScript: Yes
- ESLint: Yes
- Directory: `my-docs` (or `my-app` if not specified)

### Fully Customized
```bash
npm create zudoku@latest my-docs --js --no-eslint --skip-install
```
Specify exactly what you want:
- JavaScript project
- No ESLint
- Skip package installation (you'll run `npm install` manually later)

---

## Using Examples

Instead of the default template, you can start from an example:

```bash
npm create zudoku@latest my-docs --example example-name
```

**What happens:**
1. CLI downloads the example from the Zudoku examples repository
2. Extracts it to your project directory
3. Installs dependencies from the example's `package.json`
4. Skips TypeScript/ESLint prompts (uses example's configuration)

**Example sources:**
- Official examples: Use the example name (e.g., `--example with-zuplo`)
- GitHub repos: Use full URL (e.g., `--example https://github.com/user/repo`)

---

## Advanced Options

### Package Manager Selection
```bash
npm create zudoku@latest --use-pnpm
npm create zudoku@latest --use-yarn
npm create zudoku@latest --use-bun
```
Override automatic package manager detection.

### Import Alias
```bash
npm create zudoku@latest --import-alias "~/*"
```
Set custom import alias (default is `@/*`).

### Skip Installation
```bash
npm create zudoku@latest --skip-install
```
Set up project files but don't install dependencies yet. Useful for:
- Reviewing `package.json` before installing
- Using a different package manager later
- Adding dependencies before first install

### Reset Preferences
```bash
npm create zudoku@latest --reset-preferences
```
Clear all saved preferences and start fresh with defaults.

---

## Troubleshooting

### "The application path is not writable"
**Cause:** You don't have write permissions for the target directory.
**Solution:** Run with appropriate permissions or choose a different directory.

### "Invalid project name"
**Cause:** Project name violates npm naming rules.
**Solution:** Use lowercase letters, hyphens, and no spaces (e.g., `my-zudoku-app`).

### "Folder is not empty"
**Cause:** Target directory contains files that might conflict.
**Solution:** Use an empty directory or remove conflicting files. Safe files (`.git`, `LICENSE`, `README.md`) are allowed.

### "Could not download example"
**Cause:** Network issues or invalid example name/URL.
**Solution:**
- Check your internet connection
- Verify the example name/URL is correct
- Choose "Yes" to use the default template instead

---

## Summary: Why These Prompts?

| Prompt | Purpose | "Yes" Gets You | "No" Gets You |
|--------|---------|----------------|---------------|
| **TypeScript** | Type safety vs simplicity | Type checking, better IDE support, `.tsx` files | Simpler setup, `.jsx` files, no types |
| **ESLint** | Code quality checks | Automatic linting, consistent style, `npm run lint` | Faster setup, manual code review |
| **Example Fallback** | Reliability on errors | Working default project | Exit to fix issues |

All choices can be changed later by modifying configuration files or installing/removing dependencies.
