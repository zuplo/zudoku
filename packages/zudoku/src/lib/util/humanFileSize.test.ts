import { humanFileSize } from "./humanFileSize.js";

describe("humanFileSize", () => {
  it("should handle zero bytes", () => {
    expect(humanFileSize(0)).toBe("0 B");
    expect(humanFileSize()).toBe("0 B");
  });

  it("should handle undefined bytes", () => {
    expect(humanFileSize(undefined)).toBe("0 B");
  });

  it("should handle positive bytes", () => {
    expect(humanFileSize(200)).toBe("200 B");
    expect(humanFileSize(1000)).toBe("1.00 kB");
    expect(humanFileSize(1000000)).toBe("1.00 MB");
    expect(humanFileSize(1000000000)).toBe("1.00 GB");
    expect(humanFileSize(1000000000000)).toBe("1.00 TB");
    expect(humanFileSize(1000000000000000)).toBe("1.00 PB");
    expect(humanFileSize(1000000000000000000)).toBe("1.00 EB");
    expect(humanFileSize(1000000000000000000000)).toBe("1.00 ZB");
    expect(humanFileSize(1000000000000000000000000)).toBe("1.00 YB");
  });
});
