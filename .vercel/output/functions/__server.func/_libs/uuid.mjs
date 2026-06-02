import require$$0 from "crypto";
import { g as getDefaultExportFromCjs } from "./react.mjs";
var dist$1 = {};
var v1$1 = {};
var rng$1 = {};
var hasRequiredRng$1;
function requireRng$1() {
  if (hasRequiredRng$1) return rng$1;
  hasRequiredRng$1 = 1;
  Object.defineProperty(rng$1, "__esModule", {
    value: true
  });
  rng$1.default = rng2;
  var _crypto = _interopRequireDefault(require$$0);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  const rnds8Pool = new Uint8Array(256);
  let poolPtr = rnds8Pool.length;
  function rng2() {
    if (poolPtr > rnds8Pool.length - 16) {
      _crypto.default.randomFillSync(rnds8Pool);
      poolPtr = 0;
    }
    return rnds8Pool.slice(poolPtr, poolPtr += 16);
  }
  return rng$1;
}
var stringify$1 = {};
var validate$1 = {};
var regex$1 = {};
var hasRequiredRegex$1;
function requireRegex$1() {
  if (hasRequiredRegex$1) return regex$1;
  hasRequiredRegex$1 = 1;
  Object.defineProperty(regex$1, "__esModule", {
    value: true
  });
  regex$1.default = void 0;
  var _default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
  regex$1.default = _default;
  return regex$1;
}
var hasRequiredValidate$1;
function requireValidate$1() {
  if (hasRequiredValidate$1) return validate$1;
  hasRequiredValidate$1 = 1;
  Object.defineProperty(validate$1, "__esModule", {
    value: true
  });
  validate$1.default = void 0;
  var _regex = _interopRequireDefault(/* @__PURE__ */ requireRegex$1());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function validate2(uuid2) {
    return typeof uuid2 === "string" && _regex.default.test(uuid2);
  }
  var _default = validate2;
  validate$1.default = _default;
  return validate$1;
}
var hasRequiredStringify$1;
function requireStringify$1() {
  if (hasRequiredStringify$1) return stringify$1;
  hasRequiredStringify$1 = 1;
  Object.defineProperty(stringify$1, "__esModule", {
    value: true
  });
  stringify$1.default = void 0;
  var _validate = _interopRequireDefault(/* @__PURE__ */ requireValidate$1());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  const byteToHex = [];
  for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 256).toString(16).substr(1));
  }
  function stringify2(arr, offset = 0) {
    const uuid2 = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
    if (!(0, _validate.default)(uuid2)) {
      throw TypeError("Stringified UUID is invalid");
    }
    return uuid2;
  }
  var _default = stringify2;
  stringify$1.default = _default;
  return stringify$1;
}
var hasRequiredV1$1;
function requireV1$1() {
  if (hasRequiredV1$1) return v1$1;
  hasRequiredV1$1 = 1;
  Object.defineProperty(v1$1, "__esModule", {
    value: true
  });
  v1$1.default = void 0;
  var _rng = _interopRequireDefault(/* @__PURE__ */ requireRng$1());
  var _stringify = _interopRequireDefault(/* @__PURE__ */ requireStringify$1());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  let _nodeId;
  let _clockseq;
  let _lastMSecs = 0;
  let _lastNSecs = 0;
  function v12(options, buf, offset) {
    let i = buf && offset || 0;
    const b = buf || new Array(16);
    options = options || {};
    let node = options.node || _nodeId;
    let clockseq = options.clockseq !== void 0 ? options.clockseq : _clockseq;
    if (node == null || clockseq == null) {
      const seedBytes = options.random || (options.rng || _rng.default)();
      if (node == null) {
        node = _nodeId = [seedBytes[0] | 1, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
      }
      if (clockseq == null) {
        clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 16383;
      }
    }
    let msecs = options.msecs !== void 0 ? options.msecs : Date.now();
    let nsecs = options.nsecs !== void 0 ? options.nsecs : _lastNSecs + 1;
    const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
    if (dt < 0 && options.clockseq === void 0) {
      clockseq = clockseq + 1 & 16383;
    }
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === void 0) {
      nsecs = 0;
    }
    if (nsecs >= 1e4) {
      throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
    }
    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;
    msecs += 122192928e5;
    const tl = ((msecs & 268435455) * 1e4 + nsecs) % 4294967296;
    b[i++] = tl >>> 24 & 255;
    b[i++] = tl >>> 16 & 255;
    b[i++] = tl >>> 8 & 255;
    b[i++] = tl & 255;
    const tmh = msecs / 4294967296 * 1e4 & 268435455;
    b[i++] = tmh >>> 8 & 255;
    b[i++] = tmh & 255;
    b[i++] = tmh >>> 24 & 15 | 16;
    b[i++] = tmh >>> 16 & 255;
    b[i++] = clockseq >>> 8 | 128;
    b[i++] = clockseq & 255;
    for (let n = 0; n < 6; ++n) {
      b[i + n] = node[n];
    }
    return buf || (0, _stringify.default)(b);
  }
  var _default = v12;
  v1$1.default = _default;
  return v1$1;
}
var v3$1 = {};
var v35$1 = {};
var parse$1 = {};
var hasRequiredParse$1;
function requireParse$1() {
  if (hasRequiredParse$1) return parse$1;
  hasRequiredParse$1 = 1;
  Object.defineProperty(parse$1, "__esModule", {
    value: true
  });
  parse$1.default = void 0;
  var _validate = _interopRequireDefault(/* @__PURE__ */ requireValidate$1());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function parse2(uuid2) {
    if (!(0, _validate.default)(uuid2)) {
      throw TypeError("Invalid UUID");
    }
    let v;
    const arr = new Uint8Array(16);
    arr[0] = (v = parseInt(uuid2.slice(0, 8), 16)) >>> 24;
    arr[1] = v >>> 16 & 255;
    arr[2] = v >>> 8 & 255;
    arr[3] = v & 255;
    arr[4] = (v = parseInt(uuid2.slice(9, 13), 16)) >>> 8;
    arr[5] = v & 255;
    arr[6] = (v = parseInt(uuid2.slice(14, 18), 16)) >>> 8;
    arr[7] = v & 255;
    arr[8] = (v = parseInt(uuid2.slice(19, 23), 16)) >>> 8;
    arr[9] = v & 255;
    arr[10] = (v = parseInt(uuid2.slice(24, 36), 16)) / 1099511627776 & 255;
    arr[11] = v / 4294967296 & 255;
    arr[12] = v >>> 24 & 255;
    arr[13] = v >>> 16 & 255;
    arr[14] = v >>> 8 & 255;
    arr[15] = v & 255;
    return arr;
  }
  var _default = parse2;
  parse$1.default = _default;
  return parse$1;
}
var hasRequiredV35$1;
function requireV35$1() {
  if (hasRequiredV35$1) return v35$1;
  hasRequiredV35$1 = 1;
  Object.defineProperty(v35$1, "__esModule", {
    value: true
  });
  v35$1.default = _default;
  v35$1.URL = v35$1.DNS = void 0;
  var _stringify = _interopRequireDefault(/* @__PURE__ */ requireStringify$1());
  var _parse = _interopRequireDefault(/* @__PURE__ */ requireParse$1());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function stringToBytes(str) {
    str = unescape(encodeURIComponent(str));
    const bytes = [];
    for (let i = 0; i < str.length; ++i) {
      bytes.push(str.charCodeAt(i));
    }
    return bytes;
  }
  const DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
  v35$1.DNS = DNS;
  const URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
  v35$1.URL = URL;
  function _default(name, version2, hashfunc) {
    function generateUUID(value, namespace, buf, offset) {
      if (typeof value === "string") {
        value = stringToBytes(value);
      }
      if (typeof namespace === "string") {
        namespace = (0, _parse.default)(namespace);
      }
      if (namespace.length !== 16) {
        throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
      }
      let bytes = new Uint8Array(16 + value.length);
      bytes.set(namespace);
      bytes.set(value, namespace.length);
      bytes = hashfunc(bytes);
      bytes[6] = bytes[6] & 15 | version2;
      bytes[8] = bytes[8] & 63 | 128;
      if (buf) {
        offset = offset || 0;
        for (let i = 0; i < 16; ++i) {
          buf[offset + i] = bytes[i];
        }
        return buf;
      }
      return (0, _stringify.default)(bytes);
    }
    try {
      generateUUID.name = name;
    } catch (err) {
    }
    generateUUID.DNS = DNS;
    generateUUID.URL = URL;
    return generateUUID;
  }
  return v35$1;
}
var md5$1 = {};
var hasRequiredMd5$1;
function requireMd5$1() {
  if (hasRequiredMd5$1) return md5$1;
  hasRequiredMd5$1 = 1;
  Object.defineProperty(md5$1, "__esModule", {
    value: true
  });
  md5$1.default = void 0;
  var _crypto = _interopRequireDefault(require$$0);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function md52(bytes) {
    if (Array.isArray(bytes)) {
      bytes = Buffer.from(bytes);
    } else if (typeof bytes === "string") {
      bytes = Buffer.from(bytes, "utf8");
    }
    return _crypto.default.createHash("md5").update(bytes).digest();
  }
  var _default = md52;
  md5$1.default = _default;
  return md5$1;
}
var hasRequiredV3$1;
function requireV3$1() {
  if (hasRequiredV3$1) return v3$1;
  hasRequiredV3$1 = 1;
  Object.defineProperty(v3$1, "__esModule", {
    value: true
  });
  v3$1.default = void 0;
  var _v = _interopRequireDefault(/* @__PURE__ */ requireV35$1());
  var _md = _interopRequireDefault(/* @__PURE__ */ requireMd5$1());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  const v32 = (0, _v.default)("v3", 48, _md.default);
  var _default = v32;
  v3$1.default = _default;
  return v3$1;
}
var v4$2 = {};
var hasRequiredV4$1;
function requireV4$1() {
  if (hasRequiredV4$1) return v4$2;
  hasRequiredV4$1 = 1;
  Object.defineProperty(v4$2, "__esModule", {
    value: true
  });
  v4$2.default = void 0;
  var _rng = _interopRequireDefault(/* @__PURE__ */ requireRng$1());
  var _stringify = _interopRequireDefault(/* @__PURE__ */ requireStringify$1());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function v42(options, buf, offset) {
    options = options || {};
    const rnds = options.random || (options.rng || _rng.default)();
    rnds[6] = rnds[6] & 15 | 64;
    rnds[8] = rnds[8] & 63 | 128;
    if (buf) {
      offset = offset || 0;
      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = rnds[i];
      }
      return buf;
    }
    return (0, _stringify.default)(rnds);
  }
  var _default = v42;
  v4$2.default = _default;
  return v4$2;
}
var v5$1 = {};
var sha1$1 = {};
var hasRequiredSha1$1;
function requireSha1$1() {
  if (hasRequiredSha1$1) return sha1$1;
  hasRequiredSha1$1 = 1;
  Object.defineProperty(sha1$1, "__esModule", {
    value: true
  });
  sha1$1.default = void 0;
  var _crypto = _interopRequireDefault(require$$0);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function sha12(bytes) {
    if (Array.isArray(bytes)) {
      bytes = Buffer.from(bytes);
    } else if (typeof bytes === "string") {
      bytes = Buffer.from(bytes, "utf8");
    }
    return _crypto.default.createHash("sha1").update(bytes).digest();
  }
  var _default = sha12;
  sha1$1.default = _default;
  return sha1$1;
}
var hasRequiredV5$1;
function requireV5$1() {
  if (hasRequiredV5$1) return v5$1;
  hasRequiredV5$1 = 1;
  Object.defineProperty(v5$1, "__esModule", {
    value: true
  });
  v5$1.default = void 0;
  var _v = _interopRequireDefault(/* @__PURE__ */ requireV35$1());
  var _sha = _interopRequireDefault(/* @__PURE__ */ requireSha1$1());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  const v52 = (0, _v.default)("v5", 80, _sha.default);
  var _default = v52;
  v5$1.default = _default;
  return v5$1;
}
var nil$1 = {};
var hasRequiredNil$1;
function requireNil$1() {
  if (hasRequiredNil$1) return nil$1;
  hasRequiredNil$1 = 1;
  Object.defineProperty(nil$1, "__esModule", {
    value: true
  });
  nil$1.default = void 0;
  var _default = "00000000-0000-0000-0000-000000000000";
  nil$1.default = _default;
  return nil$1;
}
var version$1 = {};
var hasRequiredVersion$1;
function requireVersion$1() {
  if (hasRequiredVersion$1) return version$1;
  hasRequiredVersion$1 = 1;
  Object.defineProperty(version$1, "__esModule", {
    value: true
  });
  version$1.default = void 0;
  var _validate = _interopRequireDefault(/* @__PURE__ */ requireValidate$1());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function version2(uuid2) {
    if (!(0, _validate.default)(uuid2)) {
      throw TypeError("Invalid UUID");
    }
    return parseInt(uuid2.substr(14, 1), 16);
  }
  var _default = version2;
  version$1.default = _default;
  return version$1;
}
var hasRequiredDist$1;
function requireDist$1() {
  if (hasRequiredDist$1) return dist$1;
  hasRequiredDist$1 = 1;
  (function(exports) {
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "v1", {
      enumerable: true,
      get: function() {
        return _v.default;
      }
    });
    Object.defineProperty(exports, "v3", {
      enumerable: true,
      get: function() {
        return _v2.default;
      }
    });
    Object.defineProperty(exports, "v4", {
      enumerable: true,
      get: function() {
        return _v3.default;
      }
    });
    Object.defineProperty(exports, "v5", {
      enumerable: true,
      get: function() {
        return _v4.default;
      }
    });
    Object.defineProperty(exports, "NIL", {
      enumerable: true,
      get: function() {
        return _nil.default;
      }
    });
    Object.defineProperty(exports, "version", {
      enumerable: true,
      get: function() {
        return _version.default;
      }
    });
    Object.defineProperty(exports, "validate", {
      enumerable: true,
      get: function() {
        return _validate.default;
      }
    });
    Object.defineProperty(exports, "stringify", {
      enumerable: true,
      get: function() {
        return _stringify.default;
      }
    });
    Object.defineProperty(exports, "parse", {
      enumerable: true,
      get: function() {
        return _parse.default;
      }
    });
    var _v = _interopRequireDefault(/* @__PURE__ */ requireV1$1());
    var _v2 = _interopRequireDefault(/* @__PURE__ */ requireV3$1());
    var _v3 = _interopRequireDefault(/* @__PURE__ */ requireV4$1());
    var _v4 = _interopRequireDefault(/* @__PURE__ */ requireV5$1());
    var _nil = _interopRequireDefault(/* @__PURE__ */ requireNil$1());
    var _version = _interopRequireDefault(/* @__PURE__ */ requireVersion$1());
    var _validate = _interopRequireDefault(/* @__PURE__ */ requireValidate$1());
    var _stringify = _interopRequireDefault(/* @__PURE__ */ requireStringify$1());
    var _parse = _interopRequireDefault(/* @__PURE__ */ requireParse$1());
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
  })(dist$1);
  return dist$1;
}
var dist = {};
var v1 = {};
var rng = {};
var hasRequiredRng;
function requireRng() {
  if (hasRequiredRng) return rng;
  hasRequiredRng = 1;
  Object.defineProperty(rng, "__esModule", {
    value: true
  });
  rng.default = rng$12;
  var _crypto = _interopRequireDefault(require$$0);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  const rnds8Pool = new Uint8Array(256);
  let poolPtr = rnds8Pool.length;
  function rng$12() {
    if (poolPtr > rnds8Pool.length - 16) {
      _crypto.default.randomFillSync(rnds8Pool);
      poolPtr = 0;
    }
    return rnds8Pool.slice(poolPtr, poolPtr += 16);
  }
  return rng;
}
var stringify = {};
var validate = {};
var regex = {};
var hasRequiredRegex;
function requireRegex() {
  if (hasRequiredRegex) return regex;
  hasRequiredRegex = 1;
  Object.defineProperty(regex, "__esModule", {
    value: true
  });
  regex.default = void 0;
  var _default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
  regex.default = _default;
  return regex;
}
var hasRequiredValidate;
function requireValidate() {
  if (hasRequiredValidate) return validate;
  hasRequiredValidate = 1;
  Object.defineProperty(validate, "__esModule", {
    value: true
  });
  validate.default = void 0;
  var _regex = _interopRequireDefault(/* @__PURE__ */ requireRegex());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function validate$12(uuid2) {
    return typeof uuid2 === "string" && _regex.default.test(uuid2);
  }
  var _default = validate$12;
  validate.default = _default;
  return validate;
}
var hasRequiredStringify;
function requireStringify() {
  if (hasRequiredStringify) return stringify;
  hasRequiredStringify = 1;
  Object.defineProperty(stringify, "__esModule", {
    value: true
  });
  stringify.default = void 0;
  stringify.unsafeStringify = unsafeStringify;
  var _validate = _interopRequireDefault(/* @__PURE__ */ requireValidate());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  const byteToHex = [];
  for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 256).toString(16).slice(1));
  }
  function unsafeStringify(arr, offset = 0) {
    return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
  }
  function stringify$12(arr, offset = 0) {
    const uuid2 = unsafeStringify(arr, offset);
    if (!(0, _validate.default)(uuid2)) {
      throw TypeError("Stringified UUID is invalid");
    }
    return uuid2;
  }
  var _default = stringify$12;
  stringify.default = _default;
  return stringify;
}
var hasRequiredV1;
function requireV1() {
  if (hasRequiredV1) return v1;
  hasRequiredV1 = 1;
  Object.defineProperty(v1, "__esModule", {
    value: true
  });
  v1.default = void 0;
  var _rng = _interopRequireDefault(/* @__PURE__ */ requireRng());
  var _stringify = /* @__PURE__ */ requireStringify();
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  let _nodeId;
  let _clockseq;
  let _lastMSecs = 0;
  let _lastNSecs = 0;
  function v1$12(options, buf, offset) {
    let i = buf && offset || 0;
    const b = buf || new Array(16);
    options = options || {};
    let node = options.node || _nodeId;
    let clockseq = options.clockseq !== void 0 ? options.clockseq : _clockseq;
    if (node == null || clockseq == null) {
      const seedBytes = options.random || (options.rng || _rng.default)();
      if (node == null) {
        node = _nodeId = [seedBytes[0] | 1, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
      }
      if (clockseq == null) {
        clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 16383;
      }
    }
    let msecs = options.msecs !== void 0 ? options.msecs : Date.now();
    let nsecs = options.nsecs !== void 0 ? options.nsecs : _lastNSecs + 1;
    const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
    if (dt < 0 && options.clockseq === void 0) {
      clockseq = clockseq + 1 & 16383;
    }
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === void 0) {
      nsecs = 0;
    }
    if (nsecs >= 1e4) {
      throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
    }
    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;
    msecs += 122192928e5;
    const tl = ((msecs & 268435455) * 1e4 + nsecs) % 4294967296;
    b[i++] = tl >>> 24 & 255;
    b[i++] = tl >>> 16 & 255;
    b[i++] = tl >>> 8 & 255;
    b[i++] = tl & 255;
    const tmh = msecs / 4294967296 * 1e4 & 268435455;
    b[i++] = tmh >>> 8 & 255;
    b[i++] = tmh & 255;
    b[i++] = tmh >>> 24 & 15 | 16;
    b[i++] = tmh >>> 16 & 255;
    b[i++] = clockseq >>> 8 | 128;
    b[i++] = clockseq & 255;
    for (let n = 0; n < 6; ++n) {
      b[i + n] = node[n];
    }
    return buf || (0, _stringify.unsafeStringify)(b);
  }
  var _default = v1$12;
  v1.default = _default;
  return v1;
}
var v3 = {};
var v35 = {};
var parse = {};
var hasRequiredParse;
function requireParse() {
  if (hasRequiredParse) return parse;
  hasRequiredParse = 1;
  Object.defineProperty(parse, "__esModule", {
    value: true
  });
  parse.default = void 0;
  var _validate = _interopRequireDefault(/* @__PURE__ */ requireValidate());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function parse$12(uuid2) {
    if (!(0, _validate.default)(uuid2)) {
      throw TypeError("Invalid UUID");
    }
    let v;
    const arr = new Uint8Array(16);
    arr[0] = (v = parseInt(uuid2.slice(0, 8), 16)) >>> 24;
    arr[1] = v >>> 16 & 255;
    arr[2] = v >>> 8 & 255;
    arr[3] = v & 255;
    arr[4] = (v = parseInt(uuid2.slice(9, 13), 16)) >>> 8;
    arr[5] = v & 255;
    arr[6] = (v = parseInt(uuid2.slice(14, 18), 16)) >>> 8;
    arr[7] = v & 255;
    arr[8] = (v = parseInt(uuid2.slice(19, 23), 16)) >>> 8;
    arr[9] = v & 255;
    arr[10] = (v = parseInt(uuid2.slice(24, 36), 16)) / 1099511627776 & 255;
    arr[11] = v / 4294967296 & 255;
    arr[12] = v >>> 24 & 255;
    arr[13] = v >>> 16 & 255;
    arr[14] = v >>> 8 & 255;
    arr[15] = v & 255;
    return arr;
  }
  var _default = parse$12;
  parse.default = _default;
  return parse;
}
var hasRequiredV35;
function requireV35() {
  if (hasRequiredV35) return v35;
  hasRequiredV35 = 1;
  Object.defineProperty(v35, "__esModule", {
    value: true
  });
  v35.URL = v35.DNS = void 0;
  v35.default = v35$12;
  var _stringify = /* @__PURE__ */ requireStringify();
  var _parse = _interopRequireDefault(/* @__PURE__ */ requireParse());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function stringToBytes(str) {
    str = unescape(encodeURIComponent(str));
    const bytes = [];
    for (let i = 0; i < str.length; ++i) {
      bytes.push(str.charCodeAt(i));
    }
    return bytes;
  }
  const DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
  v35.DNS = DNS;
  const URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
  v35.URL = URL;
  function v35$12(name, version2, hashfunc) {
    function generateUUID(value, namespace, buf, offset) {
      var _namespace;
      if (typeof value === "string") {
        value = stringToBytes(value);
      }
      if (typeof namespace === "string") {
        namespace = (0, _parse.default)(namespace);
      }
      if (((_namespace = namespace) === null || _namespace === void 0 ? void 0 : _namespace.length) !== 16) {
        throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
      }
      let bytes = new Uint8Array(16 + value.length);
      bytes.set(namespace);
      bytes.set(value, namespace.length);
      bytes = hashfunc(bytes);
      bytes[6] = bytes[6] & 15 | version2;
      bytes[8] = bytes[8] & 63 | 128;
      if (buf) {
        offset = offset || 0;
        for (let i = 0; i < 16; ++i) {
          buf[offset + i] = bytes[i];
        }
        return buf;
      }
      return (0, _stringify.unsafeStringify)(bytes);
    }
    try {
      generateUUID.name = name;
    } catch (err) {
    }
    generateUUID.DNS = DNS;
    generateUUID.URL = URL;
    return generateUUID;
  }
  return v35;
}
var md5 = {};
var hasRequiredMd5;
function requireMd5() {
  if (hasRequiredMd5) return md5;
  hasRequiredMd5 = 1;
  Object.defineProperty(md5, "__esModule", {
    value: true
  });
  md5.default = void 0;
  var _crypto = _interopRequireDefault(require$$0);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function md5$12(bytes) {
    if (Array.isArray(bytes)) {
      bytes = Buffer.from(bytes);
    } else if (typeof bytes === "string") {
      bytes = Buffer.from(bytes, "utf8");
    }
    return _crypto.default.createHash("md5").update(bytes).digest();
  }
  var _default = md5$12;
  md5.default = _default;
  return md5;
}
var hasRequiredV3;
function requireV3() {
  if (hasRequiredV3) return v3;
  hasRequiredV3 = 1;
  Object.defineProperty(v3, "__esModule", {
    value: true
  });
  v3.default = void 0;
  var _v = _interopRequireDefault(/* @__PURE__ */ requireV35());
  var _md = _interopRequireDefault(/* @__PURE__ */ requireMd5());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  const v3$12 = (0, _v.default)("v3", 48, _md.default);
  var _default = v3$12;
  v3.default = _default;
  return v3;
}
var v4$1 = {};
var native = {};
var hasRequiredNative;
function requireNative() {
  if (hasRequiredNative) return native;
  hasRequiredNative = 1;
  Object.defineProperty(native, "__esModule", {
    value: true
  });
  native.default = void 0;
  var _crypto = _interopRequireDefault(require$$0);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var _default = {
    randomUUID: _crypto.default.randomUUID
  };
  native.default = _default;
  return native;
}
var hasRequiredV4;
function requireV4() {
  if (hasRequiredV4) return v4$1;
  hasRequiredV4 = 1;
  Object.defineProperty(v4$1, "__esModule", {
    value: true
  });
  v4$1.default = void 0;
  var _native = _interopRequireDefault(/* @__PURE__ */ requireNative());
  var _rng = _interopRequireDefault(/* @__PURE__ */ requireRng());
  var _stringify = /* @__PURE__ */ requireStringify();
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function v42(options, buf, offset) {
    if (_native.default.randomUUID && !buf && !options) {
      return _native.default.randomUUID();
    }
    options = options || {};
    const rnds = options.random || (options.rng || _rng.default)();
    rnds[6] = rnds[6] & 15 | 64;
    rnds[8] = rnds[8] & 63 | 128;
    if (buf) {
      offset = offset || 0;
      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = rnds[i];
      }
      return buf;
    }
    return (0, _stringify.unsafeStringify)(rnds);
  }
  var _default = v42;
  v4$1.default = _default;
  return v4$1;
}
var v5 = {};
var sha1 = {};
var hasRequiredSha1;
function requireSha1() {
  if (hasRequiredSha1) return sha1;
  hasRequiredSha1 = 1;
  Object.defineProperty(sha1, "__esModule", {
    value: true
  });
  sha1.default = void 0;
  var _crypto = _interopRequireDefault(require$$0);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function sha1$12(bytes) {
    if (Array.isArray(bytes)) {
      bytes = Buffer.from(bytes);
    } else if (typeof bytes === "string") {
      bytes = Buffer.from(bytes, "utf8");
    }
    return _crypto.default.createHash("sha1").update(bytes).digest();
  }
  var _default = sha1$12;
  sha1.default = _default;
  return sha1;
}
var hasRequiredV5;
function requireV5() {
  if (hasRequiredV5) return v5;
  hasRequiredV5 = 1;
  Object.defineProperty(v5, "__esModule", {
    value: true
  });
  v5.default = void 0;
  var _v = _interopRequireDefault(/* @__PURE__ */ requireV35());
  var _sha = _interopRequireDefault(/* @__PURE__ */ requireSha1());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  const v5$12 = (0, _v.default)("v5", 80, _sha.default);
  var _default = v5$12;
  v5.default = _default;
  return v5;
}
var nil = {};
var hasRequiredNil;
function requireNil() {
  if (hasRequiredNil) return nil;
  hasRequiredNil = 1;
  Object.defineProperty(nil, "__esModule", {
    value: true
  });
  nil.default = void 0;
  var _default = "00000000-0000-0000-0000-000000000000";
  nil.default = _default;
  return nil;
}
var version = {};
var hasRequiredVersion;
function requireVersion() {
  if (hasRequiredVersion) return version;
  hasRequiredVersion = 1;
  Object.defineProperty(version, "__esModule", {
    value: true
  });
  version.default = void 0;
  var _validate = _interopRequireDefault(/* @__PURE__ */ requireValidate());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function version$12(uuid2) {
    if (!(0, _validate.default)(uuid2)) {
      throw TypeError("Invalid UUID");
    }
    return parseInt(uuid2.slice(14, 15), 16);
  }
  var _default = version$12;
  version.default = _default;
  return version;
}
var hasRequiredDist;
function requireDist() {
  if (hasRequiredDist) return dist;
  hasRequiredDist = 1;
  (function(exports) {
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "NIL", {
      enumerable: true,
      get: function() {
        return _nil.default;
      }
    });
    Object.defineProperty(exports, "parse", {
      enumerable: true,
      get: function() {
        return _parse.default;
      }
    });
    Object.defineProperty(exports, "stringify", {
      enumerable: true,
      get: function() {
        return _stringify.default;
      }
    });
    Object.defineProperty(exports, "v1", {
      enumerable: true,
      get: function() {
        return _v.default;
      }
    });
    Object.defineProperty(exports, "v3", {
      enumerable: true,
      get: function() {
        return _v2.default;
      }
    });
    Object.defineProperty(exports, "v4", {
      enumerable: true,
      get: function() {
        return _v3.default;
      }
    });
    Object.defineProperty(exports, "v5", {
      enumerable: true,
      get: function() {
        return _v4.default;
      }
    });
    Object.defineProperty(exports, "validate", {
      enumerable: true,
      get: function() {
        return _validate.default;
      }
    });
    Object.defineProperty(exports, "version", {
      enumerable: true,
      get: function() {
        return _version.default;
      }
    });
    var _v = _interopRequireDefault(/* @__PURE__ */ requireV1());
    var _v2 = _interopRequireDefault(/* @__PURE__ */ requireV3());
    var _v3 = _interopRequireDefault(/* @__PURE__ */ requireV4());
    var _v4 = _interopRequireDefault(/* @__PURE__ */ requireV5());
    var _nil = _interopRequireDefault(/* @__PURE__ */ requireNil());
    var _version = _interopRequireDefault(/* @__PURE__ */ requireVersion());
    var _validate = _interopRequireDefault(/* @__PURE__ */ requireValidate());
    var _stringify = _interopRequireDefault(/* @__PURE__ */ requireStringify());
    var _parse = _interopRequireDefault(/* @__PURE__ */ requireParse());
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
  })(dist);
  return dist;
}
var distExports = /* @__PURE__ */ requireDist();
const uuid = /* @__PURE__ */ getDefaultExportFromCjs(distExports);
uuid.v1;
uuid.v3;
const v4 = uuid.v4;
uuid.v5;
uuid.NIL;
uuid.version;
uuid.validate;
uuid.stringify;
uuid.parse;
export {
  requireDist$1 as r,
  v4 as v
};
