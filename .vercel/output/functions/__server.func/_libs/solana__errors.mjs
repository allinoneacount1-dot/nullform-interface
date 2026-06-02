var SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY = 8078e3;
var SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH = 8078001;
var SOLANA_ERROR__CODECS__ENCODER_DECODER_SIZE_COMPATIBILITY_MISMATCH = 8078004;
var SOLANA_ERROR__CODECS__ENCODER_DECODER_FIXED_SIZE_MISMATCH = 8078005;
var SOLANA_ERROR__CODECS__ENCODER_DECODER_MAX_SIZE_MISMATCH = 8078006;
var SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE = 8078011;
function encodeValue(value) {
  if (Array.isArray(value)) {
    const commaSeparatedValues = value.map(encodeValue).join(
      "%2C%20"
      /* ", " */
    );
    return "%5B" + commaSeparatedValues + /* "]" */
    "%5D";
  } else if (typeof value === "bigint") {
    return `${value}n`;
  } else {
    return encodeURIComponent(
      String(
        value != null && Object.getPrototypeOf(value) === null ? (
          // Plain objects with no prototype don't have a `toString` method.
          // Convert them before stringifying them.
          { ...value }
        ) : value
      )
    );
  }
}
function encodeObjectContextEntry([key, value]) {
  return `${key}=${encodeValue(value)}`;
}
function encodeContextObject(context) {
  const searchParamsString = Object.entries(context).map(encodeObjectContextEntry).join("&");
  return Buffer.from(searchParamsString, "utf8").toString("base64");
}
function getErrorMessage(code, context = {}) {
  {
    let decodingAdviceMessage = `Solana error #${code}; Decode this error by running \`npx @solana/errors decode -- ${code}`;
    if (Object.keys(context).length) {
      decodingAdviceMessage += ` '${encodeContextObject(context)}'`;
    }
    return `${decodingAdviceMessage}\``;
  }
}
var SolanaError = class extends Error {
  /**
   * Indicates the root cause of this {@link SolanaError}, if any.
   *
   * For example, a transaction error might have an instruction error as its root cause. In this
   * case, you will be able to access the instruction error on the transaction error as `cause`.
   */
  cause = this.cause;
  /**
   * Contains context that can assist in understanding or recovering from a {@link SolanaError}.
   */
  context;
  constructor(...[code, contextAndErrorOptions]) {
    let context;
    let errorOptions;
    if (contextAndErrorOptions) {
      const { cause, ...contextRest } = contextAndErrorOptions;
      if (cause) {
        errorOptions = { cause };
      }
      if (Object.keys(contextRest).length > 0) {
        context = contextRest;
      }
    }
    const message = getErrorMessage(code, context);
    super(message, errorOptions);
    this.context = {
      __code: code,
      ...context
    };
    this.name = "SolanaError";
  }
};
export {
  SolanaError as S,
  SOLANA_ERROR__CODECS__ENCODER_DECODER_SIZE_COMPATIBILITY_MISMATCH as a,
  SOLANA_ERROR__CODECS__ENCODER_DECODER_FIXED_SIZE_MISMATCH as b,
  SOLANA_ERROR__CODECS__ENCODER_DECODER_MAX_SIZE_MISMATCH as c,
  SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY as d,
  SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH as e,
  SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE as f
};
