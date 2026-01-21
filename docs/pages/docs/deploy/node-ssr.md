---
title: Node.js (SSR)
---

Deploy Zudoku as a server-rendered application on Node.js.

## Build

```bash
npx zudoku build --ssr
```

## Output

- `dist/` - Static assets
- `dist/server/entry.js` - Server entry

## Run

```bash
node dist/server/entry.js
```

Server starts on port 3000 (configurable via `PORT` env var).

## Production

Use a process manager like PM2:

```bash
pm2 start dist/server/entry.js --name zudoku
```

Or with Docker:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server/entry.js"]
```
