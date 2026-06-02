import { b as base, r as requireSrc, a as requireSrc$1, c as requireSrc$2 } from "./base-x.mjs";
import { g as getDefaultExportFromCjs } from "./react.mjs";
var ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const bs58$5 = base(ALPHABET);
var bs58$4;
var hasRequiredBs58$2;
function requireBs58$2() {
  if (hasRequiredBs58$2) return bs58$4;
  hasRequiredBs58$2 = 1;
  var basex = requireSrc();
  var ALPHABET2 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  bs58$4 = basex(ALPHABET2);
  return bs58$4;
}
var bs58Exports$1 = requireBs58$2();
const bs58$3 = /* @__PURE__ */ getDefaultExportFromCjs(bs58Exports$1);
var bs58$2;
var hasRequiredBs58$1;
function requireBs58$1() {
  if (hasRequiredBs58$1) return bs58$2;
  hasRequiredBs58$1 = 1;
  var basex = requireSrc$1();
  var ALPHABET2 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  bs58$2 = basex(ALPHABET2);
  return bs58$2;
}
var bs58$1;
var hasRequiredBs58;
function requireBs58() {
  if (hasRequiredBs58) return bs58$1;
  hasRequiredBs58 = 1;
  const basex = requireSrc$2();
  const ALPHABET2 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  bs58$1 = basex(ALPHABET2);
  return bs58$1;
}
var bs58Exports = requireBs58();
const bs58 = /* @__PURE__ */ getDefaultExportFromCjs(bs58Exports);
export {
  bs58$5 as a,
  bs58$3 as b,
  bs58 as c,
  requireBs58$1 as r
};
