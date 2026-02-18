import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

configure({
  getElementError: (message: string, container) => {
    const error = new Error(message);
    error.name = "TestingLibraryElementError";
    error.stack = null;
    return error;
  },
});

afterEach(() => {
  cleanup();
});
