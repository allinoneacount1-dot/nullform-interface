// Stub for node:crypto — browser-compatible no-op for static SPA build
import { randomBytes as _randomBytes } from "crypto-browserify";

export function createHmac(_algo: string, _key: string) {
  return {
    update(_data: string) {
      return this;
    },
    digest(_encoding?: string) {
      return "stub-digest";
    },
  };
}

export function randomBytes(size: number): Buffer {
  const arr = new Uint8Array(size);
  crypto.getRandomValues(arr);
  return Buffer.from(arr);
}

export function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

export default { createHmac, randomBytes, timingSafeEqual };
