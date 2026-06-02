import { r as requireNodeGypBuild } from "./node-gyp-build.mjs";
var bufferutil = { exports: {} };
var fallback;
var hasRequiredFallback;
function requireFallback() {
  if (hasRequiredFallback) return fallback;
  hasRequiredFallback = 1;
  const mask = (source, mask2, output, offset, length) => {
    for (var i = 0; i < length; i++) {
      output[offset + i] = source[i] ^ mask2[i & 3];
    }
  };
  const unmask = (buffer, mask2) => {
    const length = buffer.length;
    for (var i = 0; i < length; i++) {
      buffer[i] ^= mask2[i & 3];
    }
  };
  fallback = { mask, unmask };
  return fallback;
}
var hasRequiredBufferutil;
function requireBufferutil() {
  if (hasRequiredBufferutil) return bufferutil.exports;
  hasRequiredBufferutil = 1;
  try {
    bufferutil.exports = requireNodeGypBuild()(__dirname);
  } catch (e) {
    bufferutil.exports = requireFallback();
  }
  return bufferutil.exports;
}
export {
  requireBufferutil as r
};
