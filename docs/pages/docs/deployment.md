---
title: Deploying Zudoku
---

Once you are happy with your Zudoku powered documentation and ready to push your docs to production you will need to deploy it to your own server, or a hosted service of your choice.

## Build locally

Zudoku can produce a build of static HTML, JavaScript and CSS files that you can deploy directly to your own server.

To prepare the files you need to upload to your server, you will need to use the build command.

```
npm run build
```

Once complete, you will see a new `dist` folder in the root of your project that includes the files you need to upload.
