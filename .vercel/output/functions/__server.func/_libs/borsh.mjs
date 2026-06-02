import { r as requireBn } from "./bn.js.mjs";
import { r as requireBs58 } from "./bs58.mjs";
import { r as require$$2 } from "./text-encoding-utf-8.mjs";
var lib = {};
var hasRequiredLib;
function requireLib() {
  if (hasRequiredLib) return lib;
  hasRequiredLib = 1;
  var __createBinding = lib && lib.__createBinding || (Object.create ? (function(o, m, k, k2) {
    if (k2 === void 0) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  }) : (function(o, m, k, k2) {
    if (k2 === void 0) k2 = k;
    o[k2] = m[k];
  }));
  var __setModuleDefault = lib && lib.__setModuleDefault || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
  }) : function(o, v) {
    o["default"] = v;
  });
  var __decorate = lib && lib.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __importStar = lib && lib.__importStar || function(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) {
      for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    }
    __setModuleDefault(result, mod);
    return result;
  };
  var __importDefault = lib && lib.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { "default": mod };
  };
  Object.defineProperty(lib, "__esModule", { value: true });
  lib.deserializeUnchecked = lib.deserialize = lib.serialize = lib.BinaryReader = lib.BinaryWriter = lib.BorshError = lib.baseDecode = lib.baseEncode = void 0;
  const bn_js_1 = __importDefault(requireBn());
  const bs58_1 = __importDefault(requireBs58());
  const encoding = __importStar(require$$2);
  const ResolvedTextDecoder = typeof TextDecoder !== "function" ? encoding.TextDecoder : TextDecoder;
  const textDecoder = new ResolvedTextDecoder("utf-8", { fatal: true });
  function baseEncode(value) {
    if (typeof value === "string") {
      value = Buffer.from(value, "utf8");
    }
    return bs58_1.default.encode(Buffer.from(value));
  }
  lib.baseEncode = baseEncode;
  function baseDecode(value) {
    return Buffer.from(bs58_1.default.decode(value));
  }
  lib.baseDecode = baseDecode;
  const INITIAL_LENGTH = 1024;
  class BorshError extends Error {
    constructor(message) {
      super(message);
      this.fieldPath = [];
      this.originalMessage = message;
    }
    addToFieldPath(fieldName) {
      this.fieldPath.splice(0, 0, fieldName);
      this.message = this.originalMessage + ": " + this.fieldPath.join(".");
    }
  }
  lib.BorshError = BorshError;
  class BinaryWriter {
    constructor() {
      this.buf = Buffer.alloc(INITIAL_LENGTH);
      this.length = 0;
    }
    maybeResize() {
      if (this.buf.length < 16 + this.length) {
        this.buf = Buffer.concat([this.buf, Buffer.alloc(INITIAL_LENGTH)]);
      }
    }
    writeU8(value) {
      this.maybeResize();
      this.buf.writeUInt8(value, this.length);
      this.length += 1;
    }
    writeU16(value) {
      this.maybeResize();
      this.buf.writeUInt16LE(value, this.length);
      this.length += 2;
    }
    writeU32(value) {
      this.maybeResize();
      this.buf.writeUInt32LE(value, this.length);
      this.length += 4;
    }
    writeU64(value) {
      this.maybeResize();
      this.writeBuffer(Buffer.from(new bn_js_1.default(value).toArray("le", 8)));
    }
    writeU128(value) {
      this.maybeResize();
      this.writeBuffer(Buffer.from(new bn_js_1.default(value).toArray("le", 16)));
    }
    writeU256(value) {
      this.maybeResize();
      this.writeBuffer(Buffer.from(new bn_js_1.default(value).toArray("le", 32)));
    }
    writeU512(value) {
      this.maybeResize();
      this.writeBuffer(Buffer.from(new bn_js_1.default(value).toArray("le", 64)));
    }
    writeBuffer(buffer) {
      this.buf = Buffer.concat([
        Buffer.from(this.buf.subarray(0, this.length)),
        buffer,
        Buffer.alloc(INITIAL_LENGTH)
      ]);
      this.length += buffer.length;
    }
    writeString(str) {
      this.maybeResize();
      const b = Buffer.from(str, "utf8");
      this.writeU32(b.length);
      this.writeBuffer(b);
    }
    writeFixedArray(array) {
      this.writeBuffer(Buffer.from(array));
    }
    writeArray(array, fn) {
      this.maybeResize();
      this.writeU32(array.length);
      for (const elem of array) {
        this.maybeResize();
        fn(elem);
      }
    }
    toArray() {
      return this.buf.subarray(0, this.length);
    }
  }
  lib.BinaryWriter = BinaryWriter;
  function handlingRangeError(target, propertyKey, propertyDescriptor) {
    const originalMethod = propertyDescriptor.value;
    propertyDescriptor.value = function(...args) {
      try {
        return originalMethod.apply(this, args);
      } catch (e) {
        if (e instanceof RangeError) {
          const code = e.code;
          if (["ERR_BUFFER_OUT_OF_BOUNDS", "ERR_OUT_OF_RANGE"].indexOf(code) >= 0) {
            throw new BorshError("Reached the end of buffer when deserializing");
          }
        }
        throw e;
      }
    };
  }
  class BinaryReader {
    constructor(buf) {
      this.buf = buf;
      this.offset = 0;
    }
    readU8() {
      const value = this.buf.readUInt8(this.offset);
      this.offset += 1;
      return value;
    }
    readU16() {
      const value = this.buf.readUInt16LE(this.offset);
      this.offset += 2;
      return value;
    }
    readU32() {
      const value = this.buf.readUInt32LE(this.offset);
      this.offset += 4;
      return value;
    }
    readU64() {
      const buf = this.readBuffer(8);
      return new bn_js_1.default(buf, "le");
    }
    readU128() {
      const buf = this.readBuffer(16);
      return new bn_js_1.default(buf, "le");
    }
    readU256() {
      const buf = this.readBuffer(32);
      return new bn_js_1.default(buf, "le");
    }
    readU512() {
      const buf = this.readBuffer(64);
      return new bn_js_1.default(buf, "le");
    }
    readBuffer(len) {
      if (this.offset + len > this.buf.length) {
        throw new BorshError(`Expected buffer length ${len} isn't within bounds`);
      }
      const result = this.buf.slice(this.offset, this.offset + len);
      this.offset += len;
      return result;
    }
    readString() {
      const len = this.readU32();
      const buf = this.readBuffer(len);
      try {
        return textDecoder.decode(buf);
      } catch (e) {
        throw new BorshError(`Error decoding UTF-8 string: ${e}`);
      }
    }
    readFixedArray(len) {
      return new Uint8Array(this.readBuffer(len));
    }
    readArray(fn) {
      const len = this.readU32();
      const result = Array();
      for (let i = 0; i < len; ++i) {
        result.push(fn());
      }
      return result;
    }
  }
  __decorate([
    handlingRangeError
  ], BinaryReader.prototype, "readU8", null);
  __decorate([
    handlingRangeError
  ], BinaryReader.prototype, "readU16", null);
  __decorate([
    handlingRangeError
  ], BinaryReader.prototype, "readU32", null);
  __decorate([
    handlingRangeError
  ], BinaryReader.prototype, "readU64", null);
  __decorate([
    handlingRangeError
  ], BinaryReader.prototype, "readU128", null);
  __decorate([
    handlingRangeError
  ], BinaryReader.prototype, "readU256", null);
  __decorate([
    handlingRangeError
  ], BinaryReader.prototype, "readU512", null);
  __decorate([
    handlingRangeError
  ], BinaryReader.prototype, "readString", null);
  __decorate([
    handlingRangeError
  ], BinaryReader.prototype, "readFixedArray", null);
  __decorate([
    handlingRangeError
  ], BinaryReader.prototype, "readArray", null);
  lib.BinaryReader = BinaryReader;
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  function serializeField(schema, fieldName, value, fieldType, writer) {
    try {
      if (typeof fieldType === "string") {
        writer[`write${capitalizeFirstLetter(fieldType)}`](value);
      } else if (fieldType instanceof Array) {
        if (typeof fieldType[0] === "number") {
          if (value.length !== fieldType[0]) {
            throw new BorshError(`Expecting byte array of length ${fieldType[0]}, but got ${value.length} bytes`);
          }
          writer.writeFixedArray(value);
        } else if (fieldType.length === 2 && typeof fieldType[1] === "number") {
          if (value.length !== fieldType[1]) {
            throw new BorshError(`Expecting byte array of length ${fieldType[1]}, but got ${value.length} bytes`);
          }
          for (let i = 0; i < fieldType[1]; i++) {
            serializeField(schema, null, value[i], fieldType[0], writer);
          }
        } else {
          writer.writeArray(value, (item) => {
            serializeField(schema, fieldName, item, fieldType[0], writer);
          });
        }
      } else if (fieldType.kind !== void 0) {
        switch (fieldType.kind) {
          case "option": {
            if (value === null || value === void 0) {
              writer.writeU8(0);
            } else {
              writer.writeU8(1);
              serializeField(schema, fieldName, value, fieldType.type, writer);
            }
            break;
          }
          case "map": {
            writer.writeU32(value.size);
            value.forEach((val, key) => {
              serializeField(schema, fieldName, key, fieldType.key, writer);
              serializeField(schema, fieldName, val, fieldType.value, writer);
            });
            break;
          }
          default:
            throw new BorshError(`FieldType ${fieldType} unrecognized`);
        }
      } else {
        serializeStruct(schema, value, writer);
      }
    } catch (error) {
      if (error instanceof BorshError) {
        error.addToFieldPath(fieldName);
      }
      throw error;
    }
  }
  function serializeStruct(schema, obj, writer) {
    if (typeof obj.borshSerialize === "function") {
      obj.borshSerialize(writer);
      return;
    }
    const structSchema = schema.get(obj.constructor);
    if (!structSchema) {
      throw new BorshError(`Class ${obj.constructor.name} is missing in schema`);
    }
    if (structSchema.kind === "struct") {
      structSchema.fields.map(([fieldName, fieldType]) => {
        serializeField(schema, fieldName, obj[fieldName], fieldType, writer);
      });
    } else if (structSchema.kind === "enum") {
      const name = obj[structSchema.field];
      for (let idx = 0; idx < structSchema.values.length; ++idx) {
        const [fieldName, fieldType] = structSchema.values[idx];
        if (fieldName === name) {
          writer.writeU8(idx);
          serializeField(schema, fieldName, obj[fieldName], fieldType, writer);
          break;
        }
      }
    } else {
      throw new BorshError(`Unexpected schema kind: ${structSchema.kind} for ${obj.constructor.name}`);
    }
  }
  function serialize(schema, obj, Writer = BinaryWriter) {
    const writer = new Writer();
    serializeStruct(schema, obj, writer);
    return writer.toArray();
  }
  lib.serialize = serialize;
  function deserializeField(schema, fieldName, fieldType, reader) {
    try {
      if (typeof fieldType === "string") {
        return reader[`read${capitalizeFirstLetter(fieldType)}`]();
      }
      if (fieldType instanceof Array) {
        if (typeof fieldType[0] === "number") {
          return reader.readFixedArray(fieldType[0]);
        } else if (typeof fieldType[1] === "number") {
          const arr = [];
          for (let i = 0; i < fieldType[1]; i++) {
            arr.push(deserializeField(schema, null, fieldType[0], reader));
          }
          return arr;
        } else {
          return reader.readArray(() => deserializeField(schema, fieldName, fieldType[0], reader));
        }
      }
      if (fieldType.kind === "option") {
        const option = reader.readU8();
        if (option) {
          return deserializeField(schema, fieldName, fieldType.type, reader);
        }
        return void 0;
      }
      if (fieldType.kind === "map") {
        let map = /* @__PURE__ */ new Map();
        const length = reader.readU32();
        for (let i = 0; i < length; i++) {
          const key = deserializeField(schema, fieldName, fieldType.key, reader);
          const val = deserializeField(schema, fieldName, fieldType.value, reader);
          map.set(key, val);
        }
        return map;
      }
      return deserializeStruct(schema, fieldType, reader);
    } catch (error) {
      if (error instanceof BorshError) {
        error.addToFieldPath(fieldName);
      }
      throw error;
    }
  }
  function deserializeStruct(schema, classType, reader) {
    if (typeof classType.borshDeserialize === "function") {
      return classType.borshDeserialize(reader);
    }
    const structSchema = schema.get(classType);
    if (!structSchema) {
      throw new BorshError(`Class ${classType.name} is missing in schema`);
    }
    if (structSchema.kind === "struct") {
      const result = {};
      for (const [fieldName, fieldType] of schema.get(classType).fields) {
        result[fieldName] = deserializeField(schema, fieldName, fieldType, reader);
      }
      return new classType(result);
    }
    if (structSchema.kind === "enum") {
      const idx = reader.readU8();
      if (idx >= structSchema.values.length) {
        throw new BorshError(`Enum index: ${idx} is out of range`);
      }
      const [fieldName, fieldType] = structSchema.values[idx];
      const fieldValue = deserializeField(schema, fieldName, fieldType, reader);
      return new classType({ [fieldName]: fieldValue });
    }
    throw new BorshError(`Unexpected schema kind: ${structSchema.kind} for ${classType.constructor.name}`);
  }
  function deserialize(schema, classType, buffer, Reader = BinaryReader) {
    const reader = new Reader(buffer);
    const result = deserializeStruct(schema, classType, reader);
    if (reader.offset < buffer.length) {
      throw new BorshError(`Unexpected ${buffer.length - reader.offset} bytes after deserialized data`);
    }
    return result;
  }
  lib.deserialize = deserialize;
  function deserializeUnchecked(schema, classType, buffer, Reader = BinaryReader) {
    const reader = new Reader(buffer);
    return deserializeStruct(schema, classType, reader);
  }
  lib.deserializeUnchecked = deserializeUnchecked;
  return lib;
}
var libExports = requireLib();
export {
  libExports as l
};
