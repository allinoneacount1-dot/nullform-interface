// Stub for static SPA build — replaces @tanstack/react-start server functions.
// Typed as a generic builder so handler return types propagate through to
// callers (e.g. `getNullConfig()` keeps its `{ mint, rpcHttp, rpcWs }` shape
// instead of collapsing to `null`).

type AnyHandler = (ctx: { data: unknown }) => unknown;

interface Builder<TInput = unknown> {
  inputValidator<T>(schema: T): Builder<T>;
  handler<H extends AnyHandler>(
    fn: H,
  ): (
    args?: { data: TInput },
  ) => Promise<Awaited<ReturnType<H>>>;
}

export function createServerFn(_opts?: { method?: string }): Builder {
  const builder: Builder = {
    inputValidator() {
      return builder as Builder;
    },
    handler(_fn) {
      return (async () => {
        console.warn("Server function called in static mode — not available");
        return null as never;
      }) as never;
    },
  };
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
