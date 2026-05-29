import type { ReactNode } from "react";

export function Redacted({ children }: { children: ReactNode }) {
  return <span className="redacted">{children}</span>;
}
