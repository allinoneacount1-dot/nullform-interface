import { b as getAugmentedNamespace } from "./react.mjs";
function inRange(a, min, max) {
  return min <= a && a <= max;
}
function ToDictionary(o) {
  if (o === void 0) return {};
  if (o === Object(o)) return o;
  throw TypeError("Could not convert argument to dictionary");
}
function stringToCodePoints(string) {
  var s = String(string);
  var n = s.length;
  var i = 0;
  var u = [];
  while (i < n) {
    var c = s.charCodeAt(i);
    if (c < 55296 || c > 57343) {
      u.push(c);
    } else if (56320 <= c && c <= 57343) {
      u.push(65533);
    } else if (55296 <= c && c <= 56319) {
      if (i === n - 1) {
        u.push(65533);
      } else {
        var d = string.charCodeAt(i + 1);
        if (56320 <= d && d <= 57343) {
          var a = c & 1023;
          var b = d & 1023;
          u.push(65536 + (a << 10) + b);
          i += 1;
        } else {
          u.push(65533);
        }
      }
    }
    i += 1;
  }
  return u;
}
function codePointsToString(code_points) {
  var s = "";
  for (var i = 0; i < code_points.length; ++i) {
    var cp = code_points[i];
    if (cp <= 65535) {
      s += String.fromCharCode(cp);
    } else {
      cp -= 65536;
      s += String.fromCharCode(
        (cp >> 10) + 55296,
        (cp & 1023) + 56320
      );
    }
  }
  return s;
}
var end_of_stream = -1;
function Stream(tokens) {
  this.tokens = [].slice.call(tokens);
}
Stream.prototype = {
  /**
   * @return {boolean} True if end-of-stream has been hit.
   */
  endOfStream: function() {
    return !this.tokens.length;
  },
  /**
   * When a token is read from a stream, the first token in the
   * stream must be returned and subsequently removed, and
   * end-of-stream must be returned otherwise.
   *
   * @return {number} Get the next token from the stream, or
   * end_of_stream.
   */
  read: function() {
    if (!this.tokens.length)
      return end_of_stream;
    return this.tokens.shift();
  },
  /**
   * When one or more tokens are prepended to a stream, those tokens
   * must be inserted, in given order, before the first token in the
   * stream.
   *
   * @param {(number|!Array.<number>)} token The token(s) to prepend to the stream.
   */
  prepend: function(token) {
    if (Array.isArray(token)) {
      var tokens = (
        /**@type {!Array.<number>}*/
        token
      );
      while (tokens.length)
        this.tokens.unshift(tokens.pop());
    } else {
      this.tokens.unshift(token);
    }
  },
  /**
   * When one or more tokens are pushed to a stream, those tokens
   * must be inserted, in given order, after the last token in the
   * stream.
   *
   * @param {(number|!Array.<number>)} token The tokens(s) to prepend to the stream.
   */
  push: function(token) {
    if (Array.isArray(token)) {
      var tokens = (
        /**@type {!Array.<number>}*/
        token
      );
      while (tokens.length)
        this.tokens.push(tokens.shift());
    } else {
      this.tokens.push(token);
    }
  }
};
var finished = -1;
function decoderError(fatal, opt_code_point) {
  if (fatal)
    throw TypeError("Decoder error");
  return opt_code_point || 65533;
}
var DEFAULT_ENCODING = "utf-8";
function TextDecoder(encoding2, options) {
  if (!(this instanceof TextDecoder)) {
    return new TextDecoder(encoding2, options);
  }
  encoding2 = encoding2 !== void 0 ? String(encoding2).toLowerCase() : DEFAULT_ENCODING;
  if (encoding2 !== DEFAULT_ENCODING) {
    throw new Error("Encoding not supported. Only utf-8 is supported");
  }
  options = ToDictionary(options);
  this._streaming = false;
  this._BOMseen = false;
  this._decoder = null;
  this._fatal = Boolean(options["fatal"]);
  this._ignoreBOM = Boolean(options["ignoreBOM"]);
  Object.defineProperty(this, "encoding", { value: "utf-8" });
  Object.defineProperty(this, "fatal", { value: this._fatal });
  Object.defineProperty(this, "ignoreBOM", { value: this._ignoreBOM });
}
TextDecoder.prototype = {
  /**
   * @param {ArrayBufferView=} input The buffer of bytes to decode.
   * @param {Object=} options
   * @return {string} The decoded string.
   */
  decode: function decode(input, options) {
    var bytes;
    if (typeof input === "object" && input instanceof ArrayBuffer) {
      bytes = new Uint8Array(input);
    } else if (typeof input === "object" && "buffer" in input && input.buffer instanceof ArrayBuffer) {
      bytes = new Uint8Array(
        input.buffer,
        input.byteOffset,
        input.byteLength
      );
    } else {
      bytes = new Uint8Array(0);
    }
    options = ToDictionary(options);
    if (!this._streaming) {
      this._decoder = new UTF8Decoder({ fatal: this._fatal });
      this._BOMseen = false;
    }
    this._streaming = Boolean(options["stream"]);
    var input_stream = new Stream(bytes);
    var code_points = [];
    var result;
    while (!input_stream.endOfStream()) {
      result = this._decoder.handler(input_stream, input_stream.read());
      if (result === finished)
        break;
      if (result === null)
        continue;
      if (Array.isArray(result))
        code_points.push.apply(
          code_points,
          /**@type {!Array.<number>}*/
          result
        );
      else
        code_points.push(result);
    }
    if (!this._streaming) {
      do {
        result = this._decoder.handler(input_stream, input_stream.read());
        if (result === finished)
          break;
        if (result === null)
          continue;
        if (Array.isArray(result))
          code_points.push.apply(
            code_points,
            /**@type {!Array.<number>}*/
            result
          );
        else
          code_points.push(result);
      } while (!input_stream.endOfStream());
      this._decoder = null;
    }
    if (code_points.length) {
      if (["utf-8"].indexOf(this.encoding) !== -1 && !this._ignoreBOM && !this._BOMseen) {
        if (code_points[0] === 65279) {
          this._BOMseen = true;
          code_points.shift();
        } else {
          this._BOMseen = true;
        }
      }
    }
    return codePointsToString(code_points);
  }
};
function TextEncoder(encoding2, options) {
  if (!(this instanceof TextEncoder))
    return new TextEncoder(encoding2, options);
  encoding2 = encoding2 !== void 0 ? String(encoding2).toLowerCase() : DEFAULT_ENCODING;
  if (encoding2 !== DEFAULT_ENCODING) {
    throw new Error("Encoding not supported. Only utf-8 is supported");
  }
  options = ToDictionary(options);
  this._streaming = false;
  this._encoder = null;
  this._options = { fatal: Boolean(options["fatal"]) };
  Object.defineProperty(this, "encoding", { value: "utf-8" });
}
TextEncoder.prototype = {
  /**
   * @param {string=} opt_string The string to encode.
   * @param {Object=} options
   * @return {Uint8Array} Encoded bytes, as a Uint8Array.
   */
  encode: function encode(opt_string, options) {
    opt_string = opt_string ? String(opt_string) : "";
    options = ToDictionary(options);
    if (!this._streaming)
      this._encoder = new UTF8Encoder(this._options);
    this._streaming = Boolean(options["stream"]);
    var bytes = [];
    var input_stream = new Stream(stringToCodePoints(opt_string));
    var result;
    while (!input_stream.endOfStream()) {
      result = this._encoder.handler(input_stream, input_stream.read());
      if (result === finished)
        break;
      if (Array.isArray(result))
        bytes.push.apply(
          bytes,
          /**@type {!Array.<number>}*/
          result
        );
      else
        bytes.push(result);
    }
    if (!this._streaming) {
      while (true) {
        result = this._encoder.handler(input_stream, input_stream.read());
        if (result === finished)
          break;
        if (Array.isArray(result))
          bytes.push.apply(
            bytes,
            /**@type {!Array.<number>}*/
            result
          );
        else
          bytes.push(result);
      }
      this._encoder = null;
    }
    return new Uint8Array(bytes);
  }
};
function UTF8Decoder(options) {
  var fatal = options.fatal;
  var utf8_code_point = 0, utf8_bytes_seen = 0, utf8_bytes_needed = 0, utf8_lower_boundary = 128, utf8_upper_boundary = 191;
  this.handler = function(stream, bite) {
    if (bite === end_of_stream && utf8_bytes_needed !== 0) {
      utf8_bytes_needed = 0;
      return decoderError(fatal);
    }
    if (bite === end_of_stream)
      return finished;
    if (utf8_bytes_needed === 0) {
      if (inRange(bite, 0, 127)) {
        return bite;
      }
      if (inRange(bite, 194, 223)) {
        utf8_bytes_needed = 1;
        utf8_code_point = bite - 192;
      } else if (inRange(bite, 224, 239)) {
        if (bite === 224)
          utf8_lower_boundary = 160;
        if (bite === 237)
          utf8_upper_boundary = 159;
        utf8_bytes_needed = 2;
        utf8_code_point = bite - 224;
      } else if (inRange(bite, 240, 244)) {
        if (bite === 240)
          utf8_lower_boundary = 144;
        if (bite === 244)
          utf8_upper_boundary = 143;
        utf8_bytes_needed = 3;
        utf8_code_point = bite - 240;
      } else {
        return decoderError(fatal);
      }
      utf8_code_point = utf8_code_point << 6 * utf8_bytes_needed;
      return null;
    }
    if (!inRange(bite, utf8_lower_boundary, utf8_upper_boundary)) {
      utf8_code_point = utf8_bytes_needed = utf8_bytes_seen = 0;
      utf8_lower_boundary = 128;
      utf8_upper_boundary = 191;
      stream.prepend(bite);
      return decoderError(fatal);
    }
    utf8_lower_boundary = 128;
    utf8_upper_boundary = 191;
    utf8_bytes_seen += 1;
    utf8_code_point += bite - 128 << 6 * (utf8_bytes_needed - utf8_bytes_seen);
    if (utf8_bytes_seen !== utf8_bytes_needed)
      return null;
    var code_point = utf8_code_point;
    utf8_code_point = utf8_bytes_needed = utf8_bytes_seen = 0;
    return code_point;
  };
}
function UTF8Encoder(options) {
  options.fatal;
  this.handler = function(stream, code_point) {
    if (code_point === end_of_stream)
      return finished;
    if (inRange(code_point, 0, 127))
      return code_point;
    var count, offset;
    if (inRange(code_point, 128, 2047)) {
      count = 1;
      offset = 192;
    } else if (inRange(code_point, 2048, 65535)) {
      count = 2;
      offset = 224;
    } else if (inRange(code_point, 65536, 1114111)) {
      count = 3;
      offset = 240;
    }
    var bytes = [(code_point >> 6 * count) + offset];
    while (count > 0) {
      var temp = code_point >> 6 * (count - 1);
      bytes.push(128 | temp & 63);
      count -= 1;
    }
    return bytes;
  };
}
const encoding = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  TextDecoder,
  TextEncoder
});
const require$$2 = /* @__PURE__ */ getAugmentedNamespace(encoding);
export {
  require$$2 as r
};
