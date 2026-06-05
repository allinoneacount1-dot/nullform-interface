// Stub for static SPA build — replaces @tanstack/react-start server functions.
// Typed as a generic builder so handler return types and zod-inferred input
// types propagate to callers.

import type { z } from "zod";

type AnyHandler<TInput> = (ctx: { data: TInput }) => unknown;

interface Builder<TInput = unknown> {
  inputValidator<S>(
    schema: S,
  ): Builder<S extends z.ZodType<infer O> ? O : S extends (input: infer I) => infer O ? (O extends I ? O : O) : unknown>;
  handler<H extends AnyHandler<TInput>>(
    fn: H,
  ): (args?: { data: TInput }) => Promise<Awaited<ReturnType<H>>>;
}

export function createServerFn(_opts?: { method?: string }): Builder {
  const builder = {
    inputValidator() {
      return builder as unknown as Builder;
    },
    handler() {
      return (async () => {
        console.warn("Server function called in static mode — not available");
        return null as never;
      }) as never;
    },
  } as unknown as Builder;
  return builder;
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
