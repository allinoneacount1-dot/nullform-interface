// Stub for static SPA build — replaces @tanstack/react-start server functions
import { z } from "zod";

export function createServerFn(opts?: { method?: string }) {
  return {
    inputValidator: (_schema: z.ZodType) => ({
      handler: (_fn: (...args: unknown[]) => unknown) => {
        return async function clientSideStub() {
          console.warn("Server function called in static mode — not available");
          return null;
        };
      },
    }),
    handler: (_fn: (...args: unknown[]) => unknown) => {
      return async function clientSideStub() {
        console.warn("Server function called in static mode — not available");
        return null;
      };
    },
  };
}

// Cookie stubs for browser
export function getCookie(_name: string): string | null {
  return null;
}

export function setCookie(_name: string, _value: string, _opts?: Record<string, unknown>) {
  // no-op in static mode
}

export function deleteCookie(_name: string, _opts?: Record<string, unknown>) {
  // no-op in static mode
}
