---
title: Deploying Zudoku
zuplo: false
---

Once you are happy with your Zudoku powered documentation and ready to push your docs to production
you will need to deploy it to your own server, or a hosted service of your choice.

## Build locally

Zudoku can produce a build of static HTML, JavaScript and CSS files that you can deploy directly to
your own server.

To prepare the files you need to upload to your server, you will need to use the build command.

```
npm run build
```

Once complete, you will see a new `dist` folder in the root of your project that includes the files
you need to upload.

## Markdown content negotiation

When [`publishMarkdown`](/docs/configuration/docs#publishmarkdown) is enabled, the static build also
contains a `.md` representation for every documentation page. Vercel and SSR deployments handle
`Accept: text/markdown` at canonical page URLs automatically. Other static hosts must add an
`Accept`-aware rule at the CDN, reverse proxy, edge worker, or web server if you want the same
canonical URL behavior. The explicit `.md` URLs work without that rule.

See
[content negotiation for other hosting providers](/docs/configuration/docs#other-hosting-providers)
for the general routing and caching contract.
