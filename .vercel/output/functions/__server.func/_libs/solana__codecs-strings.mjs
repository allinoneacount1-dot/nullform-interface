import { f as createDecoder } from "./solana__codecs-core.mjs";
var getBaseXDecoder = (alphabet4) => {
  return createDecoder({
    read(rawBytes, offset) {
      const bytes = offset === 0 || offset <= -rawBytes.byteLength ? rawBytes : rawBytes.slice(offset);
      if (bytes.length === 0) return ["", 0];
      let trailIndex = bytes.findIndex((n) => n !== 0);
      trailIndex = trailIndex === -1 ? bytes.length : trailIndex;
      const leadingZeroes = alphabet4[0].repeat(trailIndex);
      if (trailIndex === bytes.length) return [leadingZeroes, rawBytes.length];
      const base10Number = bytes.slice(trailIndex).reduce((sum, byte) => sum * 256n + BigInt(byte), 0n);
      const tailChars = getBaseXFromBigInt(base10Number, alphabet4);
      return [leadingZeroes + tailChars, rawBytes.length];
    }
  });
};
function getBaseXFromBigInt(value, alphabet4) {
  const base = BigInt(alphabet4.length);
  const tailChars = [];
  while (value > 0n) {
    tailChars.unshift(alphabet4[Number(value % base)]);
    value /= base;
  }
  return tailChars.join("");
}
var alphabet2 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
var getBase58Decoder = () => getBaseXDecoder(alphabet2);
export {
  getBase58Decoder as g
};
