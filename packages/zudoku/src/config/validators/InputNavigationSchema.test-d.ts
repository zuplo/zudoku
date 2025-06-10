/* eslint-disable @typescript-eslint/no-explicit-any */
import { assertType, describe, expectTypeOf, it } from "vitest";
import type {
  InputNavigation,
  InputNavigationCategory,
  InputNavigationCustomPage,
  InputNavigationDoc,
  InputNavigationItem,
  InputNavigationLink,
} from "./InputNavigationSchema.js";

describe("InputNavigationSchema types", () => {
  it("infers correct types for navigation items", () => {
    // Test that TypeScript correctly infers the types using satisfies
    const docString = "path/to/doc.md" satisfies InputNavigationItem;
    const docObject = {
      type: "doc",
      file: "path/to/doc.md",
      label: "My Doc",
      icon: "book",
      badge: { label: "New", color: "green" },
      display: "always",
    } satisfies InputNavigationItem;
    const linkObject = {
      type: "link",
      label: "External Link",
      href: "https://example.com",
      icon: "external-link",
      description: "Link description",
      badge: { label: "External", color: "blue" },
      display: "auth",
    } satisfies InputNavigationItem;
    const customPage = {
      type: "custom-page",
      path: "/custom",
      label: "Custom Page",
      element: null,
      icon: "star",
      badge: { label: "Custom", color: "purple" },
      display: "anon",
    } satisfies InputNavigationItem;

    // Test that these are assignable to InputNavigationItem
    assertType<InputNavigationItem>(docString);
    assertType<InputNavigationItem>(docObject);
    assertType<InputNavigationItem>(linkObject);
    assertType<InputNavigationItem>(customPage);
  });

  it("prevents items array from being unknown[]", () => {
    // Core test: ensure items are properly typed
    const category = {
      type: "category",
      label: "Test Category",
      items: [
        "doc.md",
        { type: "doc", file: "test.md" },
        { type: "link", label: "Link", href: "https://example.com" },
        { type: "category", label: "Nested", items: ["nested.md"] },
      ],
    } satisfies InputNavigationCategory;

    // Key assertions - items must be InputNavigationItem[], not unknown[]
    assertType<InputNavigationItem[]>(category.items);
    expectTypeOf(category.items).not.toEqualTypeOf<unknown[]>();
    expectTypeOf(category.items).not.toEqualTypeOf<any[]>();
  });

  it("validates nested structure maintains type safety", () => {
    const navigation = [
      {
        type: "category",
        label: "Parent",
        items: [
          {
            type: "category",
            label: "Child",
            items: ["nested.md", { type: "doc", file: "nested.md" }],
          },
        ],
      },
    ] satisfies InputNavigation;

    const parent = navigation[0]!;
    assertType<InputNavigationItem[]>(parent.items);

    const child = parent.items[0]!;
    assertType<InputNavigationItem[]>(child.items);
    expectTypeOf(child.items).not.toEqualTypeOf<unknown[]>();
  });

  it("validates union types work correctly", () => {
    // Test that all valid types are assignable
    assertType<InputNavigationItem>("doc.md");
    assertType<InputNavigationItem>({ type: "doc", file: "test.md" });
    assertType<InputNavigationItem>({ type: "link", label: "Link", href: "/" });
    assertType<InputNavigationItem>({
      type: "category",
      label: "C",
      items: [],
    });

    // Test type constraints
    expectTypeOf<InputNavigationCategory["items"]>().toEqualTypeOf<
      InputNavigationItem[]
    >();
    expectTypeOf<InputNavigationCategory["items"]>().not.toEqualTypeOf<
      unknown[]
    >();
    expectTypeOf<InputNavigationCategory["items"]>().not.toEqualTypeOf<any[]>();
  });

  it("validates individual type exports", () => {
    const doc = {
      type: "doc",
      file: "test.md",
      label: "Test Doc",
    } satisfies InputNavigationDoc;
    assertType<InputNavigationDoc>(doc);

    const link = {
      type: "link",
      label: "Test Link",
      href: "https://example.com",
    } satisfies InputNavigationLink;
    assertType<InputNavigationLink>(link);

    const customPage = {
      type: "custom-page",
      path: "/test",
      label: "Test Page",
      element: null,
    } satisfies InputNavigationCustomPage;
    assertType<InputNavigationCustomPage>(customPage);

    const category = {
      type: "category",
      label: "Test Category",
      items: ["test.md"] satisfies InputNavigationItem[],
    } satisfies InputNavigationCategory;

    assertType<InputNavigationCategory>(category);
    assertType<InputNavigationItem[]>(category.items);
  });

  it("validates constrained properties", () => {
    const validDisplayValues = ["auth", "anon", "always", "hide"] as const;

    for (const display of validDisplayValues) {
      const item = {
        type: "doc",
        file: "test.md",
        display,
      } satisfies InputNavigationItem;
      assertType<InputNavigationItem>(item);
    }
  });

  it("rejects invalid types", () => {
    // Test that invalid values fail at compile time

    // @ts-expect-error - number not assignable to InputNavigationItem
    assertType<InputNavigationItem>(0);

    // @ts-expect-error - missing required 'file' property
    assertType<InputNavigationItem>({ type: "doc" });

    // @ts-expect-error - missing required 'href' property
    assertType<InputNavigationItem>({ type: "link", label: "Invalid Link" });

    assertType<InputNavigationCategory>({
      type: "category",
      label: "Test",
      // @ts-expect-error - items should not accept unknown[]
      items: [] as unknown[],
    });
  });
});
