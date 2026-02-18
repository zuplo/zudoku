import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, expect } from "vitest";

configure({
  getElementError: (message: string, container) => {
    const error = new Error(message);
    error.name = "TestingLibraryElementError";
    error.stack = null;
    return error;
  },
});

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
