import Script from "next/script";

export default function Page() {
  return (
    <>
      <Script
        type="module"
        crossOrigin="anonymous"
        src="https://cdn.zudoku.dev/latest/demo.js"
      />
      <link rel="stylesheet" href="https://cdn.zudoku.dev/latest/style.css" />
      <div className="bg-white m-5 border rounded overflow-auto max-h-full">
        <div id="root" />
      </div>
    </>
  );
}
