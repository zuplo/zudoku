export function getDevHtml({
  jsEntry,
  dir,
}: {
  jsEntry: string;
  dir?: "ltr" | "rtl";
}) {
  return `
<!doctype html>
<html lang="en" ${dir ? `dir="${dir}"` : ""}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">
    <!--app-helmet-->
    <link rel="preconnect" href="https://cdn.zudoku.dev/">
  </head>
  <body>
    <div id="root"><!--app-html--></div>
    <script type="module" src="${jsEntry}"></script>
  </body>
</html>
`.trim();
}

export function getBuildHtml({
  jsEntry,
  cssEntry,
  dir,
}: {
  jsEntry: string;
  cssEntry: string;
  dir?: "ltr" | "rtl";
}) {
  return `
<!doctype html>
<html lang="en" ${dir ? `dir="${dir}"` : ""}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">
    <script type="module" crossorigin src="${jsEntry}"></script>
    <link rel="stylesheet" crossorigin href="${cssEntry}">
    <!--app-helmet-->
    <link rel="preconnect" href="https://cdn.zudoku.dev/">
  </head>
  <body>
    <div id="root"><!--app-html--></div>
  </body>
</html>
`.trim();
}
