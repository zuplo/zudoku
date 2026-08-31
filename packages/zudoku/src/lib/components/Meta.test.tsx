import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useHead: vi.fn(),
  useLocation: vi.fn(() => ({ pathname: "/guide" })),
  useZudoku: vi.fn(),
}));

vi.mock("@unhead/react", () => ({ useHead: mocks.useHead }));
vi.mock("react-router", () => ({ useLocation: mocks.useLocation }));
vi.mock("./context/ZudokuContext.js", () => ({
  useZudoku: mocks.useZudoku,
}));

const { Meta } = await import("./Meta.js");

describe("Meta", () => {
  beforeEach(() => {
    mocks.useHead.mockClear();
    mocks.useZudoku.mockReturnValue({
      options: {
        canonicalUrlOrigin: "https://developers.example.com",
        metadata: {
          openGraph: {
            type: "website",
            title: "Example Developers",
            description: "Build with Example",
            url: "https://developers.example.com",
            image: ["https://developers.example.com/one.png", "/two.png"],
          },
          jsonLd: [
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Example </script><script>alert(1)</script> & Co",
            },
          ],
        },
      },
    });
  });

  it("renders Open Graph metadata through normal core configuration", () => {
    Meta({ children: null });

    expect(mocks.useHead).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: expect.arrayContaining([
          { property: "og:type", content: "website" },
          { property: "og:title", content: "Example Developers" },
          { property: "og:description", content: "Build with Example" },
          {
            property: "og:url",
            content: "https://developers.example.com",
          },
          {
            property: "og:image",
            content: "https://developers.example.com/one.png",
          },
          { property: "og:image", content: "/two.png" },
        ]),
      }),
    );
  });

  it("escapes JSON-LD script-breaking characters", () => {
    Meta({ children: null });

    const head = mocks.useHead.mock.calls[0]?.[0];
    const jsonLd = head?.script?.[0]?.innerHTML;
    expect(jsonLd).toContain("\\u003c/script\\u003e");
    expect(jsonLd).toContain("\\u0026 Co");
    expect(jsonLd).not.toContain("</script>");
    expect(jsonLd).not.toContain("<script>");
  });
});
