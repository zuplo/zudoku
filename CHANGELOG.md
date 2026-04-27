# Changelog

This project uses GitHub Releases to publish changes.

See: https://github.com/zuplo/zudoku/releases

## Unreleased

- Merged `topNavigation`, `sidebar` and `customPages` into a single `navigation` configuration.
- Plugins now require a `path` property instead of `navigationId`.
- Added migration guide in `docs/pages/guides/navigation-migration.md`.
- **Breaking:** Protected routes now redirect unauthenticated users straight to the authentication
  provider instead of showing a "Login to continue" dialog. The `redirectTo` URL also preserves the
  hash fragment. The Cancel and Register affordances on the dialog are gone; if you have
  `redirectToAfterSignIn` configured, it still takes precedence over the originally-requested URL.
