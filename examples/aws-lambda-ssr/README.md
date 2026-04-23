# Zudoku + AWS Lambda SSR

Zudoku with server-side rendering on AWS Lambda.

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

Produces `dist/` containing the client bundle, static assets, and `dist/server/entry.js` which
exports a native Lambda handler via `hono/aws-lambda`.

## Deploy

First time: create a Node.js 22.x Lambda function with handler `server/entry.handler`, attach a
Function URL, and set memory to 1024 MB and timeout to 30s.

Subsequent deploys:

```bash
LAMBDA_FUNCTION_NAME=my-fn pnpm deploy
```

This zips `dist/` and runs `aws lambda update-function-code`. You need the AWS CLI configured with
credentials that can update the function.

## Production notes

- Static assets are served by the Lambda handler by default. For real traffic, put CloudFront in
  front and route `/assets/*` to an S3 bucket synced from `dist/` to avoid per-request invocations.
- Cold start is ~300-800ms on 1024 MB. Enable SnapStart for Node 22 or provisioned concurrency if
  that matters.
- The output zip is fully self-contained. No `node_modules` or Web Adapter layer is required.

## Configuration

`zudoku.config.ts` demonstrates `protectedRoutes` to gate pages behind the configured authentication
provider.
