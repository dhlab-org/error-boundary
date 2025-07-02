import "@testing-library/jest-dom";
import "whatwg-fetch";

import { cleanup } from "@testing-library/react";
// vitest globals
import { afterAll, afterEach, beforeAll, vi } from "vitest";

// cleanup DOM after each test
afterEach(() => {
  cleanup();
});

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});
