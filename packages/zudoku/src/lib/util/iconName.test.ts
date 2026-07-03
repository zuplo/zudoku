import { describe, expect, it } from "vitest";
import {
  iconVirtualId,
  isIconNameShape,
  parseIconName,
  parseIconVirtualId,
} from "./iconName.js";

describe("parseIconName", () => {
  it("defaults a bare name to the lucide prefix", () => {
    expect(parseIconName("home")).toEqual({
      prefix: "lucide",
      name: "home",
      id: "lucide:home",
    });
  });

  it("keeps an explicit prefix", () => {
    expect(parseIconName("ph:acorn-duotone")).toEqual({
      prefix: "ph",
      name: "acorn-duotone",
      id: "ph:acorn-duotone",
    });
  });

  it("treats a bare name and its lucide-prefixed form as the same id", () => {
    expect(parseIconName("home").id).toBe(parseIconName("lucide:home").id);
  });
});

describe("iconVirtualId", () => {
  it("maps a bare name to a lucide virtual module id", () => {
    expect(iconVirtualId("home")).toBe("virtual:zudoku-icon/lucide/home");
  });

  it("maps a prefixed name to its set's virtual module id", () => {
    expect(iconVirtualId("ph:acorn-duotone")).toBe(
      "virtual:zudoku-icon/ph/acorn-duotone",
    );
  });
});

describe("parseIconVirtualId", () => {
  it.each(["home", "ph:acorn-duotone", "lucide:chevron-right"])(
    "round-trips %s through iconVirtualId",
    (raw) => {
      expect(parseIconVirtualId(iconVirtualId(raw))).toEqual(
        parseIconName(raw),
      );
    },
  );
});

describe("isIconNameShape", () => {
  it.each([
    "home",
    "a-arrow-down",
    "circle-help",
    "lucide:home",
    "ph:acorn-duotone",
    "1password", // leading digit (valid iconify name, e.g. simple-icons:1password)
    "tabler:2fa",
    "twemoji:1st-place-medal",
  ])("accepts %s", (value) => expect(isIconNameShape(value)).toBe(true));

  it.each([
    "", // empty
    "Home", // uppercase
    "trailing-", // trailing dash
    "double--dash", // empty dash segment
    "snake_case", // underscore
    ":home", // empty prefix
    "lucide:", // empty name
    "a:b:c", // too many segments
    "https://example.com", // url
    "ph:Acorn", // uppercase in name
  ])("rejects %s", (value) => expect(isIconNameShape(value)).toBe(false));
});
