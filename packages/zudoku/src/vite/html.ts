const themeScript = `if (
  localStorage.getItem("theme") === "dark" ||
  (!("theme" in localStorage) &&
    window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}`;

export function getDevHtml(jsEntry: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!--app-helmet-->
    <script type="module">${themeScript}</script>
    <link rel="preconnect" href="https://cdn.zudoku.dev/">
  </head>
  <body>
    <div id="root"><!--app-html--></div>
    <script type="module" src="${jsEntry}"></script>
  </body>
</html>
`;
}

export function getBuildHtml({
  jsEntry,
  cssEntry,
}: {
  jsEntry: string;
  cssEntry: string;
}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script type="module" crossorigin src="${jsEntry}"></script>
    <link rel="stylesheet" crossorigin href="${cssEntry}">
    <!--app-helmet-->
    <script type="module">${themeScript}</script>
    <link rel="preconnect" href="https://cdn.zudoku.dev/">
  </head>
  <body>
    <div id="root"><!--app-html--></div>
  </body>
</html>`;
}
