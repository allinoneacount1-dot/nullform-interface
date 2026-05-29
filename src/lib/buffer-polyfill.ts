// Browser polyfill for Buffer (required by @solana/web3.js internals).
// Server bundles have native Buffer and skip this no-op assignment.
import { Buffer } from "buffer";
if (typeof globalThis !== "undefined" && !(globalThis as { Buffer?: unknown }).Buffer) {
  (globalThis as { Buffer: typeof Buffer }).Buffer = Buffer;
}
export {};
