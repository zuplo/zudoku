import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

configure({
  getElementError: (message, _container) => {
    const error = new Error(message ?? "Unknown error");
    error.name = "TestingLibraryElementError";
    error.stack = undefined;
    return error;
  },
});

afterEach(() => {
  cleanup();
});
