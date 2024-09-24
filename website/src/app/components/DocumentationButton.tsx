"use client";
export const DocumentationButton = () => {
  return (
    <a
      href="/docs"
      onClick={() => {
        if (typeof window !== "undefined") {
          window.gtag?.("event", "conversion", {
            send_to: "AW-11213523037/vG6NCLrNwdUZEN2Qg-Mp",
            value: 1.0,
            currency: "USD",
          });
        }
      }}
      className="bg-white/5 rounded p-2 px-4 hover:bg-white hover:text-gray-950"
    >
      Documentation
    </a>
  );
};
