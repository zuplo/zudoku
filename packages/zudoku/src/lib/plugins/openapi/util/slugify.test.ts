import { describe, expect, it } from "vitest";
import { slugify } from "./slugify.js";

describe("slugify", () => {
  it("should handle empty strings", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
    expect(slugify("\r\n")).toBe("");
  });

  it("should convert special characters and whitespace to hyphens", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
    expect(slugify("This & That")).toBe("this-that");
    expect(slugify("Multiple   Spaces")).toBe("multiple-spaces");
    expect(slugify("Line\r\nBreaks")).toBe("line-breaks");
  });

  it("should build result from right to left within maxLength", () => {
    const input =
      "Loan's\r\n \r\nHELOCFixedSegment's\r\n \r\nPaymentDetails\r\n \r\n";
    expect(slugify(input)).toBe("paymentdetails-helocfixedsegments-loans");
    expect(slugify(input, 20)).toBe("paymentdetails");
    expect(slugify(input, 30)).toBe("paymentdetails-helocfixedsegments");
  });

  it("should handle consecutive special characters", () => {
    expect(slugify("Multiple!!!Special&&Characters")).toBe(
      "multiple-special-characters",
    );
    expect(slugify("!!!Start&&&Middle***End!!!")).toBe("start-middle-end");
  });

  it("should trim hyphens from start and end", () => {
    expect(slugify("-start-middle-end-")).toBe("start-middle-end");
    expect(slugify("---multiple---hyphens---")).toBe("multiple-hyphens");
  });
});
