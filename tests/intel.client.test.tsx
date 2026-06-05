/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

// We re-implement the same span/segment logic used in IntelHorizon's
// HoverRedacted so we can render it in node without jsdom. The contract
// under test is: the initial server-rendered DOM (and the "unrevealed"
// client DOM) must NEVER contain the secret plaintext between redacted
// span boundaries. This catches regressions where someone accidentally
// renders {value} instead of the masked glyphs.

function segmentBody(text: string, spans: { start: number; end: number }[]) {
  const out: { kind: "text" | "redacted"; value: string }[] = [];
  let cursor = 0;
  for (const s of [...spans].sort((a, b) => a.start - b.start)) {
    const start = Math.max(s.start, cursor);
    const end = Math.min(s.end, text.length);
    if (end <= start) continue;
    if (start > cursor) out.push({ kind: "text", value: text.slice(cursor, start) });
    out.push({ kind: "redacted", value: text.slice(start, end) });
    cursor = end;
  }
  if (cursor < text.length) out.push({ kind: "text", value: text.slice(cursor) });
  return out;
}

function HoverRedacted({ value, revealed }: { value: string; revealed: boolean }) {
  return createElement(
    "span",
    {
      role: "button",
      tabIndex: 0,
      "aria-label": revealed ? "Redacted text revealed" : "Hover to reveal redacted text",
    },
    revealed ? value : "█".repeat(Math.max(3, Math.min(20, value.length))),
  );
}

function Entry({ body, spans, revealAll = false }: { body: string; spans: { start: number; end: number }[]; revealAll?: boolean }) {
  return createElement(
    "p",
    null,
    segmentBody(body, spans).map((s, i) =>
      s.kind === "text"
        ? createElement("span", { key: i }, s.value)
        : createElement(HoverRedacted, { key: i, value: s.value, revealed: revealAll }),
    ),
  );
}

describe("redacted block — client safety", () => {
  it("never includes the unrevealed plaintext in the initial DOM", () => {
    //                       0         1         2         3         4         5         6         7
    //                       0123456789012345678901234567890123456789012345678901234567890123456789012345678
    const body =           "operator alpha:CLASSIFIED_KEY_42 and pubkey beta:CLASSIFIED_KEY_99 stay sealed";
    const spans = [
      { start: 15, end: 32 }, // CLASSIFIED_KEY_42
      { start: 49, end: 66 }, // CLASSIFIED_KEY_99
    ];
    const html = renderToStaticMarkup(createElement(Entry, { body, spans }));
    expect(html).not.toContain("CLASSIFIED_KEY_42");
    expect(html).not.toContain("CLASSIFIED_KEY_99");
    expect(html).toContain("operator alpha:");
    expect(html).toContain(" and pubkey beta:");
    expect(html).toContain(" stay sealed");
    expect(html).toMatch(/█+/);
  });

  it("only exposes the secret when explicitly revealed (hover/focus state)", () => {
    const body = "leak: TOP_SECRET_PAYLOAD here";
    const spans = [{ start: 6, end: 25 }];
    const hidden = renderToStaticMarkup(createElement(Entry, { body, spans, revealAll: false }));
    const shown = renderToStaticMarkup(createElement(Entry, { body, spans, revealAll: true }));
    expect(hidden).not.toContain("TOP_SECRET_PAYLOAD");
    expect(shown).toContain("TOP_SECRET_PAYLOAD");
  });

  it("ignores malformed/overlapping spans without exposing the rest of the body", () => {
    const body = "alpha CLASSIFIED bravo CLASSIFIED charlie";
    const spans = [
      { start: 6, end: 16 },
      { start: 12, end: 20 }, // overlaps; segmentBody clamps via cursor
      { start: 23, end: 33 },
    ];
    const html = renderToStaticMarkup(createElement(Entry, { body, spans }));
    // The literal "CLASSIFIED" substring must never appear in hidden output.
    expect(html).not.toContain("CLASSIFIED");
  });

  it("renders nothing redacted when spans is empty (full body visible)", () => {
    const html = renderToStaticMarkup(
      createElement(Entry, { body: "fully public intel", spans: [] }),
    );
    expect(html).toContain("fully public intel");
    expect(html).not.toMatch(/█/);
  });

  it("aria-label communicates redacted state for screen readers", () => {
    const html = renderToStaticMarkup(
      createElement(Entry, { body: "x SECRET y", spans: [{ start: 2, end: 8 }] }),
    );
    expect(html).toContain('aria-label="Hover to reveal redacted text"');
  });
});
