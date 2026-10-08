import { describe, expect, it } from "vitest";
import type { Plan } from "../types/PlanType.js";
import { getPlanContact } from "./planContact.js";

const withMetadata = (metadata: Plan["metadata"]): Pick<Plan, "metadata"> => ({
  metadata,
});

describe("getPlanContact", () => {
  it("uses an absolute URL as-is and marks it external", () => {
    expect(
      getPlanContact(withMetadata({ contactUrl: "https://acme.com/contact" })),
    ).toEqual({
      href: "https://acme.com/contact",
      label: "Contact Sales",
      isExternal: true,
    });
  });

  it("turns a bare email address into a mailto link", () => {
    expect(
      getPlanContact(withMetadata({ contactUrl: "sales@acme.com" })),
    ).toEqual({
      href: "mailto:sales@acme.com",
      label: "Contact Sales",
      isExternal: false,
    });
  });

  it("keeps an explicit mailto link", () => {
    expect(
      getPlanContact(
        withMetadata({
          contactUrl: "mailto:sales@acme.com?subject=Enterprise",
        }),
      )?.href,
    ).toBe("mailto:sales@acme.com?subject=Enterprise");
  });

  it("accepts in-app paths and hash links as internal", () => {
    expect(getPlanContact(withMetadata({ contactUrl: "/contact" }))).toEqual({
      href: "/contact",
      label: "Contact Sales",
      isExternal: false,
    });
    expect(
      getPlanContact(withMetadata({ contactUrl: "#contact" }))?.isExternal,
    ).toBe(false);
  });

  it("overrides the label from metadata", () => {
    expect(
      getPlanContact(
        withMetadata({
          contactUrl: "https://acme.com/contact",
          contactLabel: "Talk to us",
        }),
      )?.label,
    ).toBe("Talk to us");
  });

  it("falls back to the default label for a blank override", () => {
    expect(
      getPlanContact(
        withMetadata({ contactUrl: "/contact", contactLabel: "   " }),
      )?.label,
    ).toBe("Contact Sales");
  });

  it("is undefined without a usable target", () => {
    expect(getPlanContact(withMetadata(undefined))).toBeUndefined();
    expect(getPlanContact(withMetadata({}))).toBeUndefined();
    expect(getPlanContact(withMetadata({ contactUrl: "  " }))).toBeUndefined();
    expect(getPlanContact(withMetadata({ contactUrl: 42 }))).toBeUndefined();
    expect(
      getPlanContact(withMetadata({ contactLabel: "Talk to us" })),
    ).toBeUndefined();
  });

  it("rejects malformed bare emails", () => {
    for (const contactUrl of [
      "sales@@acme.com",
      "sales@acme@com",
      "@acme.com",
      "sales@acme",
      "sales@.com",
      "sales@acme.",
      "sales @acme.com",
    ]) {
      expect(getPlanContact(withMetadata({ contactUrl }))).toBeUndefined();
    }
  });

  it("drops targets that are not safe to link to", () => {
    expect(
      getPlanContact(withMetadata({ contactUrl: "javascript:alert(1)" })),
    ).toBeUndefined();
    expect(
      getPlanContact(withMetadata({ contactUrl: "data:text/html,<script>" })),
    ).toBeUndefined();
    expect(
      getPlanContact(withMetadata({ contactUrl: "acme.com/contact" })),
    ).toBeUndefined();
  });

  it("drops relative targets that escape the origin", () => {
    // Browsers fold a backslash into a slash, so both of these read as in-app
    // paths but navigate to evil.example.com.
    for (const contactUrl of [
      "//evil.example.com",
      "/\\evil.example.com",
      "/\\\\evil.example.com",
    ]) {
      expect(getPlanContact(withMetadata({ contactUrl }))).toBeUndefined();
    }
  });

  it("drops http(s) targets that are not absolute URLs", () => {
    for (const contactUrl of ["https:", "http:", "https://"]) {
      expect(getPlanContact(withMetadata({ contactUrl }))).toBeUndefined();
    }
    // Scheme-relative shorthand is a real URL; it is normalized on the way out.
    expect(
      getPlanContact(withMetadata({ contactUrl: "https:acme.com" }))?.href,
    ).toBe("https://acme.com/");
  });

  it("requires a recipient on an explicit mailto link", () => {
    expect(
      getPlanContact(withMetadata({ contactUrl: "mailto:" })),
    ).toBeUndefined();
    expect(
      getPlanContact(withMetadata({ contactUrl: "mailto:?subject=Hi" })),
    ).toBeUndefined();
    // Multi-recipient lists stay valid.
    expect(
      getPlanContact(
        withMetadata({ contactUrl: "mailto:a@acme.com,b@acme.com" }),
      )?.href,
    ).toBe("mailto:a@acme.com,b@acme.com");
  });
});
