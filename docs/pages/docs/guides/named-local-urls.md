---
title: Named local URLs
sidebar_icon: globe
---

By default the dev server is reachable at a port-based URL like `http://localhost:3000`. For
multiple projects, feature branches, or anything that needs a stable URL (cookies, OAuth redirects,
CORS allowlists), you can put a reverse proxy in front that maps a name like
`feature-branch.localhost` to the dev server's port.

Zudoku's dev server honors the `PORT` environment variable, so any wrapper that picks a port and
spawns the dev server works without extra configuration.

## With [portless](https://portless.sh)

[portless](https://portless.sh) is a zero-config local proxy that assigns a free port, sets `PORT`
when it spawns your script, and exposes the server under `https://<name>.localhost`.

**Zero config** — runs the `dev` script from `package.json` and uses its `name` field as the
subdomain:

```sh
portless
```

**Wrap an arbitrary command** without any config file:

```sh
portless feature-branch pnpm dev
```

Opens the dev server at `https://feature-branch.localhost`.

**Config file** for more control — add `portless.json` at the project root, or a `"portless"` key in
`package.json`:

```json title=portless.json
{
  "name": "feature-branch",
  "script": "dev"
}
```

In every mode, Portless picks a free port, exports `PORT=<that port>`, and spawns the command.
Zudoku reads `PORT` and binds there; Portless proxies traffic to it.

## With other proxies

Any reverse proxy that fronts the dev server works the same way — point it at the Zudoku port (set
`PORT`, pass `--port`, or use the config file) and route traffic from whatever hostname you want.
