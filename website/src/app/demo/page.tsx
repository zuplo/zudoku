import Script from "next/script";

export default function Page() {
  return (
    <>
      <Script
        type="module"
        crossOrigin="anonymous"
        strategy="beforeInteractive"
        src="https://cdn.zudoku.dev/latest/demo.js"
        stylesheets={["https://cdn.zudoku.dev/latest/style.css"]}
      />
      <div id="root" />
    </>
  );
}
