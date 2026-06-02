import { Buffer } from "buffer";
import { e as ed25519, s as secp256k1 } from "./noble__curves.mjs";
import { B as BN } from "./bn.js.mjs";
import { b as bs58 } from "./bs58.mjs";
import { j as sha256 } from "./noble__hashes.mjs";
import { l as libExports } from "./borsh.mjs";
import { L as LayoutExports } from "./solana__buffer-layout.mjs";
import { g as getU64Codec } from "./solana__codecs-numbers.mjs";
import require$$0 from "util";
import http from "http";
import https, { Agent } from "https";
import { c as create, n as number, a as nullable, b as array, s as string, d as coerce, t as type, o as optional, u as union, l as literal, e as any, f as unknown, g as boolean, i as instance, h as tuple, r as record } from "./superstruct.mjs";
import { R as RpcClient } from "./jayson.mjs";
import { f as fetch } from "./node-fetch.mjs";
import { C as CommonClient, W as WebSocket } from "./rpc-websockets.mjs";
ed25519.utils.randomPrivateKey;
ed25519.getPublicKey;
function isOnCurve(publicKey2) {
  try {
    ed25519.ExtendedPoint.fromHex(publicKey2);
    return true;
  } catch {
    return false;
  }
}
const sign = (message, secretKey) => ed25519.sign(message, secretKey.slice(0, 32));
const verify = ed25519.verify;
const toBuffer = (arr) => {
  if (Buffer.isBuffer(arr)) {
    return arr;
  } else if (arr instanceof Uint8Array) {
    return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  } else {
    return Buffer.from(arr);
  }
};
class Struct {
  constructor(properties) {
    Object.assign(this, properties);
  }
  encode() {
    return Buffer.from(libExports.serialize(SOLANA_SCHEMA, this));
  }
  static decode(data) {
    return libExports.deserialize(SOLANA_SCHEMA, this, data);
  }
  static decodeUnchecked(data) {
    return libExports.deserializeUnchecked(SOLANA_SCHEMA, this, data);
  }
}
const SOLANA_SCHEMA = /* @__PURE__ */ new Map();
var _PublicKey;
const MAX_SEED_LENGTH = 32;
const PUBLIC_KEY_LENGTH = 32;
function isPublicKeyData(value) {
  return value._bn !== void 0;
}
let uniquePublicKeyCounter = 1;
class PublicKey extends Struct {
  /**
   * Create a new PublicKey object
   * @param value ed25519 public key as buffer or base-58 encoded string
   */
  constructor(value) {
    super({});
    this._bn = void 0;
    if (isPublicKeyData(value)) {
      this._bn = value._bn;
    } else {
      if (typeof value === "string") {
        const decoded = bs58.decode(value);
        if (decoded.length != PUBLIC_KEY_LENGTH) {
          throw new Error(`Invalid public key input`);
        }
        this._bn = new BN(decoded);
      } else {
        this._bn = new BN(value);
      }
      if (this._bn.byteLength() > PUBLIC_KEY_LENGTH) {
        throw new Error(`Invalid public key input`);
      }
    }
  }
  /**
   * Returns a unique PublicKey for tests and benchmarks using a counter
   */
  static unique() {
    const key = new PublicKey(uniquePublicKeyCounter);
    uniquePublicKeyCounter += 1;
    return new PublicKey(key.toBuffer());
  }
  /**
   * Default public key value. The base58-encoded string representation is all ones (as seen below)
   * The underlying BN number is 32 bytes that are all zeros
   */
  /**
   * Checks if two publicKeys are equal
   */
  equals(publicKey2) {
    return this._bn.eq(publicKey2._bn);
  }
  /**
   * Return the base-58 representation of the public key
   */
  toBase58() {
    return bs58.encode(this.toBytes());
  }
  toJSON() {
    return this.toBase58();
  }
  /**
   * Return the byte array representation of the public key in big endian
   */
  toBytes() {
    const buf = this.toBuffer();
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  /**
   * Return the Buffer representation of the public key in big endian
   */
  toBuffer() {
    const b = this._bn.toArrayLike(Buffer);
    if (b.length === PUBLIC_KEY_LENGTH) {
      return b;
    }
    const zeroPad = Buffer.alloc(32);
    b.copy(zeroPad, 32 - b.length);
    return zeroPad;
  }
  get [Symbol.toStringTag]() {
    return `PublicKey(${this.toString()})`;
  }
  /**
   * Return the base-58 representation of the public key
   */
  toString() {
    return this.toBase58();
  }
  /**
   * Derive a public key from another key, a seed, and a program ID.
   * The program ID will also serve as the owner of the public key, giving
   * it permission to write data to the account.
   */
  /* eslint-disable require-await */
  static async createWithSeed(fromPublicKey, seed, programId) {
    const buffer = Buffer.concat([fromPublicKey.toBuffer(), Buffer.from(seed), programId.toBuffer()]);
    const publicKeyBytes = sha256(buffer);
    return new PublicKey(publicKeyBytes);
  }
  /**
   * Derive a program address from seeds and a program ID.
   */
  /* eslint-disable require-await */
  static createProgramAddressSync(seeds, programId) {
    let buffer = Buffer.alloc(0);
    seeds.forEach(function(seed) {
      if (seed.length > MAX_SEED_LENGTH) {
        throw new TypeError(`Max seed length exceeded`);
      }
      buffer = Buffer.concat([buffer, toBuffer(seed)]);
    });
    buffer = Buffer.concat([buffer, programId.toBuffer(), Buffer.from("ProgramDerivedAddress")]);
    const publicKeyBytes = sha256(buffer);
    if (isOnCurve(publicKeyBytes)) {
      throw new Error(`Invalid seeds, address must fall off the curve`);
    }
    return new PublicKey(publicKeyBytes);
  }
  /**
   * Async version of createProgramAddressSync
   * For backwards compatibility
   *
   * @deprecated Use {@link createProgramAddressSync} instead
   */
  /* eslint-disable require-await */
  static async createProgramAddress(seeds, programId) {
    return this.createProgramAddressSync(seeds, programId);
  }
  /**
   * Find a valid program address
   *
   * Valid program addresses must fall off the ed25519 curve.  This function
   * iterates a nonce until it finds one that when combined with the seeds
   * results in a valid program address.
   */
  static findProgramAddressSync(seeds, programId) {
    let nonce = 255;
    let address;
    while (nonce != 0) {
      try {
        const seedsWithNonce = seeds.concat(Buffer.from([nonce]));
        address = this.createProgramAddressSync(seedsWithNonce, programId);
      } catch (err) {
        if (err instanceof TypeError) {
          throw err;
        }
        nonce--;
        continue;
      }
      return [address, nonce];
    }
    throw new Error(`Unable to find a viable program address nonce`);
  }
  /**
   * Async version of findProgramAddressSync
   * For backwards compatibility
   *
   * @deprecated Use {@link findProgramAddressSync} instead
   */
  static async findProgramAddress(seeds, programId) {
    return this.findProgramAddressSync(seeds, programId);
  }
  /**
   * Check that a pubkey is on the ed25519 curve.
   */
  static isOnCurve(pubkeyData) {
    const pubkey = new PublicKey(pubkeyData);
    return isOnCurve(pubkey.toBytes());
  }
}
_PublicKey = PublicKey;
PublicKey.default = new _PublicKey("11111111111111111111111111111111");
SOLANA_SCHEMA.set(PublicKey, {
  kind: "struct",
  fields: [["_bn", "u256"]]
});
new PublicKey("BPFLoader1111111111111111111111111111111111");
const PACKET_DATA_SIZE = 1280 - 40 - 8;
const VERSION_PREFIX_MASK = 127;
const SIGNATURE_LENGTH_IN_BYTES = 64;
class TransactionExpiredBlockheightExceededError extends Error {
  constructor(signature2) {
    super(`Signature ${signature2} has expired: block height exceeded.`);
    this.signature = void 0;
    this.signature = signature2;
  }
}
Object.defineProperty(TransactionExpiredBlockheightExceededError.prototype, "name", {
  value: "TransactionExpiredBlockheightExceededError"
});
class TransactionExpiredTimeoutError extends Error {
  constructor(signature2, timeoutSeconds) {
    super(`Transaction was not confirmed in ${timeoutSeconds.toFixed(2)} seconds. It is unknown if it succeeded or failed. Check signature ${signature2} using the Solana Explorer or CLI tools.`);
    this.signature = void 0;
    this.signature = signature2;
  }
}
Object.defineProperty(TransactionExpiredTimeoutError.prototype, "name", {
  value: "TransactionExpiredTimeoutError"
});
class TransactionExpiredNonceInvalidError extends Error {
  constructor(signature2) {
    super(`Signature ${signature2} has expired: the nonce is no longer valid.`);
    this.signature = void 0;
    this.signature = signature2;
  }
}
Object.defineProperty(TransactionExpiredNonceInvalidError.prototype, "name", {
  value: "TransactionExpiredNonceInvalidError"
});
class MessageAccountKeys {
  constructor(staticAccountKeys, accountKeysFromLookups) {
    this.staticAccountKeys = void 0;
    this.accountKeysFromLookups = void 0;
    this.staticAccountKeys = staticAccountKeys;
    this.accountKeysFromLookups = accountKeysFromLookups;
  }
  keySegments() {
    const keySegments = [this.staticAccountKeys];
    if (this.accountKeysFromLookups) {
      keySegments.push(this.accountKeysFromLookups.writable);
      keySegments.push(this.accountKeysFromLookups.readonly);
    }
    return keySegments;
  }
  get(index) {
    for (const keySegment of this.keySegments()) {
      if (index < keySegment.length) {
        return keySegment[index];
      } else {
        index -= keySegment.length;
      }
    }
    return;
  }
  get length() {
    return this.keySegments().flat().length;
  }
  compileInstructions(instructions) {
    const U8_MAX = 255;
    if (this.length > U8_MAX + 1) {
      throw new Error("Account index overflow encountered during compilation");
    }
    const keyIndexMap = /* @__PURE__ */ new Map();
    this.keySegments().flat().forEach((key, index) => {
      keyIndexMap.set(key.toBase58(), index);
    });
    const findKeyIndex = (key) => {
      const keyIndex = keyIndexMap.get(key.toBase58());
      if (keyIndex === void 0) throw new Error("Encountered an unknown instruction account key during compilation");
      return keyIndex;
    };
    return instructions.map((instruction) => {
      return {
        programIdIndex: findKeyIndex(instruction.programId),
        accountKeyIndexes: instruction.keys.map((meta) => findKeyIndex(meta.pubkey)),
        data: instruction.data
      };
    });
  }
}
const publicKey = (property = "publicKey") => {
  return LayoutExports.blob(32, property);
};
const signature = (property = "signature") => {
  return LayoutExports.blob(64, property);
};
const rustString = (property = "string") => {
  const rsl = LayoutExports.struct([LayoutExports.u32("length"), LayoutExports.u32("lengthPadding"), LayoutExports.blob(LayoutExports.offset(LayoutExports.u32(), -8), "chars")], property);
  const _decode = rsl.decode.bind(rsl);
  const _encode = rsl.encode.bind(rsl);
  const rslShim = rsl;
  rslShim.decode = (b, offset) => {
    const data = _decode(b, offset);
    return data["chars"].toString();
  };
  rslShim.encode = (str, b, offset) => {
    const data = {
      chars: Buffer.from(str, "utf8")
    };
    return _encode(data, b, offset);
  };
  rslShim.alloc = (str) => {
    return LayoutExports.u32().span + LayoutExports.u32().span + Buffer.from(str, "utf8").length;
  };
  return rslShim;
};
const authorized = (property = "authorized") => {
  return LayoutExports.struct([publicKey("staker"), publicKey("withdrawer")], property);
};
const lockup = (property = "lockup") => {
  return LayoutExports.struct([LayoutExports.ns64("unixTimestamp"), LayoutExports.ns64("epoch"), publicKey("custodian")], property);
};
const voteInit = (property = "voteInit") => {
  return LayoutExports.struct([publicKey("nodePubkey"), publicKey("authorizedVoter"), publicKey("authorizedWithdrawer"), LayoutExports.u8("commission")], property);
};
const voteAuthorizeWithSeedArgs = (property = "voteAuthorizeWithSeedArgs") => {
  return LayoutExports.struct([LayoutExports.u32("voteAuthorizationType"), publicKey("currentAuthorityDerivedKeyOwnerPubkey"), rustString("currentAuthorityDerivedKeySeed"), publicKey("newAuthorized")], property);
};
function decodeLength(bytes) {
  let len = 0;
  let size = 0;
  for (; ; ) {
    let elem = bytes.shift();
    len |= (elem & 127) << size * 7;
    size += 1;
    if ((elem & 128) === 0) {
      break;
    }
  }
  return len;
}
function encodeLength(bytes, len) {
  let rem_len = len;
  for (; ; ) {
    let elem = rem_len & 127;
    rem_len >>= 7;
    if (rem_len == 0) {
      bytes.push(elem);
      break;
    } else {
      elem |= 128;
      bytes.push(elem);
    }
  }
}
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}
class CompiledKeys {
  constructor(payer, keyMetaMap) {
    this.payer = void 0;
    this.keyMetaMap = void 0;
    this.payer = payer;
    this.keyMetaMap = keyMetaMap;
  }
  static compile(instructions, payer) {
    const keyMetaMap = /* @__PURE__ */ new Map();
    const getOrInsertDefault = (pubkey) => {
      const address = pubkey.toBase58();
      let keyMeta = keyMetaMap.get(address);
      if (keyMeta === void 0) {
        keyMeta = {
          isSigner: false,
          isWritable: false,
          isInvoked: false
        };
        keyMetaMap.set(address, keyMeta);
      }
      return keyMeta;
    };
    const payerKeyMeta = getOrInsertDefault(payer);
    payerKeyMeta.isSigner = true;
    payerKeyMeta.isWritable = true;
    for (const ix of instructions) {
      getOrInsertDefault(ix.programId).isInvoked = true;
      for (const accountMeta of ix.keys) {
        const keyMeta = getOrInsertDefault(accountMeta.pubkey);
        keyMeta.isSigner ||= accountMeta.isSigner;
        keyMeta.isWritable ||= accountMeta.isWritable;
      }
    }
    return new CompiledKeys(payer, keyMetaMap);
  }
  getMessageComponents() {
    const mapEntries = [...this.keyMetaMap.entries()];
    assert(mapEntries.length <= 256, "Max static account keys length exceeded");
    const writableSigners = mapEntries.filter(([, meta]) => meta.isSigner && meta.isWritable);
    const readonlySigners = mapEntries.filter(([, meta]) => meta.isSigner && !meta.isWritable);
    const writableNonSigners = mapEntries.filter(([, meta]) => !meta.isSigner && meta.isWritable);
    const readonlyNonSigners = mapEntries.filter(([, meta]) => !meta.isSigner && !meta.isWritable);
    const header = {
      numRequiredSignatures: writableSigners.length + readonlySigners.length,
      numReadonlySignedAccounts: readonlySigners.length,
      numReadonlyUnsignedAccounts: readonlyNonSigners.length
    };
    {
      assert(writableSigners.length > 0, "Expected at least one writable signer key");
      const [payerAddress] = writableSigners[0];
      assert(payerAddress === this.payer.toBase58(), "Expected first writable signer key to be the fee payer");
    }
    const staticAccountKeys = [...writableSigners.map(([address]) => new PublicKey(address)), ...readonlySigners.map(([address]) => new PublicKey(address)), ...writableNonSigners.map(([address]) => new PublicKey(address)), ...readonlyNonSigners.map(([address]) => new PublicKey(address))];
    return [header, staticAccountKeys];
  }
  extractTableLookup(lookupTable) {
    const [writableIndexes, drainedWritableKeys] = this.drainKeysFoundInLookupTable(lookupTable.state.addresses, (keyMeta) => !keyMeta.isSigner && !keyMeta.isInvoked && keyMeta.isWritable);
    const [readonlyIndexes, drainedReadonlyKeys] = this.drainKeysFoundInLookupTable(lookupTable.state.addresses, (keyMeta) => !keyMeta.isSigner && !keyMeta.isInvoked && !keyMeta.isWritable);
    if (writableIndexes.length === 0 && readonlyIndexes.length === 0) {
      return;
    }
    return [{
      accountKey: lookupTable.key,
      writableIndexes,
      readonlyIndexes
    }, {
      writable: drainedWritableKeys,
      readonly: drainedReadonlyKeys
    }];
  }
  /** @internal */
  drainKeysFoundInLookupTable(lookupTableEntries, keyMetaFilter) {
    const lookupTableIndexes = new Array();
    const drainedKeys = new Array();
    for (const [address, keyMeta] of this.keyMetaMap.entries()) {
      if (keyMetaFilter(keyMeta)) {
        const key = new PublicKey(address);
        const lookupTableIndex = lookupTableEntries.findIndex((entry) => entry.equals(key));
        if (lookupTableIndex >= 0) {
          assert(lookupTableIndex < 256, "Max lookup table index exceeded");
          lookupTableIndexes.push(lookupTableIndex);
          drainedKeys.push(key);
          this.keyMetaMap.delete(address);
        }
      }
    }
    return [lookupTableIndexes, drainedKeys];
  }
}
const END_OF_BUFFER_ERROR_MESSAGE = "Reached end of buffer unexpectedly";
function guardedShift(byteArray) {
  if (byteArray.length === 0) {
    throw new Error(END_OF_BUFFER_ERROR_MESSAGE);
  }
  return byteArray.shift();
}
function guardedSplice(byteArray, ...args) {
  const [start] = args;
  if (args.length === 2 ? start + (args[1] ?? 0) > byteArray.length : start >= byteArray.length) {
    throw new Error(END_OF_BUFFER_ERROR_MESSAGE);
  }
  return byteArray.splice(...args);
}
class Message {
  constructor(args) {
    this.header = void 0;
    this.accountKeys = void 0;
    this.recentBlockhash = void 0;
    this.instructions = void 0;
    this.indexToProgramIds = /* @__PURE__ */ new Map();
    this.header = args.header;
    this.accountKeys = args.accountKeys.map((account) => new PublicKey(account));
    this.recentBlockhash = args.recentBlockhash;
    this.instructions = args.instructions;
    this.instructions.forEach((ix) => this.indexToProgramIds.set(ix.programIdIndex, this.accountKeys[ix.programIdIndex]));
  }
  get version() {
    return "legacy";
  }
  get staticAccountKeys() {
    return this.accountKeys;
  }
  get compiledInstructions() {
    return this.instructions.map((ix) => ({
      programIdIndex: ix.programIdIndex,
      accountKeyIndexes: ix.accounts,
      data: bs58.decode(ix.data)
    }));
  }
  get addressTableLookups() {
    return [];
  }
  getAccountKeys() {
    return new MessageAccountKeys(this.staticAccountKeys);
  }
  static compile(args) {
    const compiledKeys = CompiledKeys.compile(args.instructions, args.payerKey);
    const [header, staticAccountKeys] = compiledKeys.getMessageComponents();
    const accountKeys = new MessageAccountKeys(staticAccountKeys);
    const instructions = accountKeys.compileInstructions(args.instructions).map((ix) => ({
      programIdIndex: ix.programIdIndex,
      accounts: ix.accountKeyIndexes,
      data: bs58.encode(ix.data)
    }));
    return new Message({
      header,
      accountKeys: staticAccountKeys,
      recentBlockhash: args.recentBlockhash,
      instructions
    });
  }
  isAccountSigner(index) {
    return index < this.header.numRequiredSignatures;
  }
  isAccountWritable(index) {
    const numSignedAccounts = this.header.numRequiredSignatures;
    if (index >= this.header.numRequiredSignatures) {
      const unsignedAccountIndex = index - numSignedAccounts;
      const numUnsignedAccounts = this.accountKeys.length - numSignedAccounts;
      const numWritableUnsignedAccounts = numUnsignedAccounts - this.header.numReadonlyUnsignedAccounts;
      return unsignedAccountIndex < numWritableUnsignedAccounts;
    } else {
      const numWritableSignedAccounts = numSignedAccounts - this.header.numReadonlySignedAccounts;
      return index < numWritableSignedAccounts;
    }
  }
  isProgramId(index) {
    return this.indexToProgramIds.has(index);
  }
  programIds() {
    return [...this.indexToProgramIds.values()];
  }
  nonProgramIds() {
    return this.accountKeys.filter((_, index) => !this.isProgramId(index));
  }
  serialize() {
    const numKeys = this.accountKeys.length;
    let keyCount = [];
    encodeLength(keyCount, numKeys);
    const instructions = this.instructions.map((instruction) => {
      const {
        accounts,
        programIdIndex
      } = instruction;
      const data = Array.from(bs58.decode(instruction.data));
      let keyIndicesCount = [];
      encodeLength(keyIndicesCount, accounts.length);
      let dataCount = [];
      encodeLength(dataCount, data.length);
      return {
        programIdIndex,
        keyIndicesCount: Buffer.from(keyIndicesCount),
        keyIndices: accounts,
        dataLength: Buffer.from(dataCount),
        data
      };
    });
    let instructionCount = [];
    encodeLength(instructionCount, instructions.length);
    let instructionBuffer = Buffer.alloc(PACKET_DATA_SIZE);
    Buffer.from(instructionCount).copy(instructionBuffer);
    let instructionBufferLength = instructionCount.length;
    instructions.forEach((instruction) => {
      const instructionLayout = LayoutExports.struct([LayoutExports.u8("programIdIndex"), LayoutExports.blob(instruction.keyIndicesCount.length, "keyIndicesCount"), LayoutExports.seq(LayoutExports.u8("keyIndex"), instruction.keyIndices.length, "keyIndices"), LayoutExports.blob(instruction.dataLength.length, "dataLength"), LayoutExports.seq(LayoutExports.u8("userdatum"), instruction.data.length, "data")]);
      const length2 = instructionLayout.encode(instruction, instructionBuffer, instructionBufferLength);
      instructionBufferLength += length2;
    });
    instructionBuffer = instructionBuffer.slice(0, instructionBufferLength);
    const signDataLayout = LayoutExports.struct([LayoutExports.blob(1, "numRequiredSignatures"), LayoutExports.blob(1, "numReadonlySignedAccounts"), LayoutExports.blob(1, "numReadonlyUnsignedAccounts"), LayoutExports.blob(keyCount.length, "keyCount"), LayoutExports.seq(publicKey("key"), numKeys, "keys"), publicKey("recentBlockhash")]);
    const transaction = {
      numRequiredSignatures: Buffer.from([this.header.numRequiredSignatures]),
      numReadonlySignedAccounts: Buffer.from([this.header.numReadonlySignedAccounts]),
      numReadonlyUnsignedAccounts: Buffer.from([this.header.numReadonlyUnsignedAccounts]),
      keyCount: Buffer.from(keyCount),
      keys: this.accountKeys.map((key) => toBuffer(key.toBytes())),
      recentBlockhash: bs58.decode(this.recentBlockhash)
    };
    let signData = Buffer.alloc(2048);
    const length = signDataLayout.encode(transaction, signData);
    instructionBuffer.copy(signData, length);
    return signData.slice(0, length + instructionBuffer.length);
  }
  /**
   * Decode a compiled message into a Message object.
   */
  static from(buffer) {
    let byteArray = [...buffer];
    const numRequiredSignatures = guardedShift(byteArray);
    if (numRequiredSignatures !== (numRequiredSignatures & VERSION_PREFIX_MASK)) {
      throw new Error("Versioned messages must be deserialized with VersionedMessage.deserialize()");
    }
    const numReadonlySignedAccounts = guardedShift(byteArray);
    const numReadonlyUnsignedAccounts = guardedShift(byteArray);
    const accountCount = decodeLength(byteArray);
    let accountKeys = [];
    for (let i = 0; i < accountCount; i++) {
      const account = guardedSplice(byteArray, 0, PUBLIC_KEY_LENGTH);
      accountKeys.push(new PublicKey(Buffer.from(account)));
    }
    const recentBlockhash = guardedSplice(byteArray, 0, PUBLIC_KEY_LENGTH);
    const instructionCount = decodeLength(byteArray);
    let instructions = [];
    for (let i = 0; i < instructionCount; i++) {
      const programIdIndex = guardedShift(byteArray);
      const accountCount2 = decodeLength(byteArray);
      const accounts = guardedSplice(byteArray, 0, accountCount2);
      const dataLength = decodeLength(byteArray);
      const dataSlice = guardedSplice(byteArray, 0, dataLength);
      const data = bs58.encode(Buffer.from(dataSlice));
      instructions.push({
        programIdIndex,
        accounts,
        data
      });
    }
    const messageArgs = {
      header: {
        numRequiredSignatures,
        numReadonlySignedAccounts,
        numReadonlyUnsignedAccounts
      },
      recentBlockhash: bs58.encode(Buffer.from(recentBlockhash)),
      accountKeys,
      instructions
    };
    return new Message(messageArgs);
  }
}
class MessageV0 {
  constructor(args) {
    this.header = void 0;
    this.staticAccountKeys = void 0;
    this.recentBlockhash = void 0;
    this.compiledInstructions = void 0;
    this.addressTableLookups = void 0;
    this.header = args.header;
    this.staticAccountKeys = args.staticAccountKeys;
    this.recentBlockhash = args.recentBlockhash;
    this.compiledInstructions = args.compiledInstructions;
    this.addressTableLookups = args.addressTableLookups;
  }
  get version() {
    return 0;
  }
  get numAccountKeysFromLookups() {
    let count = 0;
    for (const lookup of this.addressTableLookups) {
      count += lookup.readonlyIndexes.length + lookup.writableIndexes.length;
    }
    return count;
  }
  getAccountKeys(args) {
    let accountKeysFromLookups;
    if (args && "accountKeysFromLookups" in args && args.accountKeysFromLookups) {
      if (this.numAccountKeysFromLookups != args.accountKeysFromLookups.writable.length + args.accountKeysFromLookups.readonly.length) {
        throw new Error("Failed to get account keys because of a mismatch in the number of account keys from lookups");
      }
      accountKeysFromLookups = args.accountKeysFromLookups;
    } else if (args && "addressLookupTableAccounts" in args && args.addressLookupTableAccounts) {
      accountKeysFromLookups = this.resolveAddressTableLookups(args.addressLookupTableAccounts);
    } else if (this.addressTableLookups.length > 0) {
      throw new Error("Failed to get account keys because address table lookups were not resolved");
    }
    return new MessageAccountKeys(this.staticAccountKeys, accountKeysFromLookups);
  }
  isAccountSigner(index) {
    return index < this.header.numRequiredSignatures;
  }
  isAccountWritable(index) {
    const numSignedAccounts = this.header.numRequiredSignatures;
    const numStaticAccountKeys = this.staticAccountKeys.length;
    if (index >= numStaticAccountKeys) {
      const lookupAccountKeysIndex = index - numStaticAccountKeys;
      const numWritableLookupAccountKeys = this.addressTableLookups.reduce((count, lookup) => count + lookup.writableIndexes.length, 0);
      return lookupAccountKeysIndex < numWritableLookupAccountKeys;
    } else if (index >= this.header.numRequiredSignatures) {
      const unsignedAccountIndex = index - numSignedAccounts;
      const numUnsignedAccounts = numStaticAccountKeys - numSignedAccounts;
      const numWritableUnsignedAccounts = numUnsignedAccounts - this.header.numReadonlyUnsignedAccounts;
      return unsignedAccountIndex < numWritableUnsignedAccounts;
    } else {
      const numWritableSignedAccounts = numSignedAccounts - this.header.numReadonlySignedAccounts;
      return index < numWritableSignedAccounts;
    }
  }
  resolveAddressTableLookups(addressLookupTableAccounts) {
    const accountKeysFromLookups = {
      writable: [],
      readonly: []
    };
    for (const tableLookup of this.addressTableLookups) {
      const tableAccount = addressLookupTableAccounts.find((account) => account.key.equals(tableLookup.accountKey));
      if (!tableAccount) {
        throw new Error(`Failed to find address lookup table account for table key ${tableLookup.accountKey.toBase58()}`);
      }
      for (const index of tableLookup.writableIndexes) {
        if (index < tableAccount.state.addresses.length) {
          accountKeysFromLookups.writable.push(tableAccount.state.addresses[index]);
        } else {
          throw new Error(`Failed to find address for index ${index} in address lookup table ${tableLookup.accountKey.toBase58()}`);
        }
      }
      for (const index of tableLookup.readonlyIndexes) {
        if (index < tableAccount.state.addresses.length) {
          accountKeysFromLookups.readonly.push(tableAccount.state.addresses[index]);
        } else {
          throw new Error(`Failed to find address for index ${index} in address lookup table ${tableLookup.accountKey.toBase58()}`);
        }
      }
    }
    return accountKeysFromLookups;
  }
  static compile(args) {
    const compiledKeys = CompiledKeys.compile(args.instructions, args.payerKey);
    const addressTableLookups = new Array();
    const accountKeysFromLookups = {
      writable: new Array(),
      readonly: new Array()
    };
    const lookupTableAccounts = args.addressLookupTableAccounts || [];
    for (const lookupTable of lookupTableAccounts) {
      const extractResult = compiledKeys.extractTableLookup(lookupTable);
      if (extractResult !== void 0) {
        const [addressTableLookup, {
          writable,
          readonly
        }] = extractResult;
        addressTableLookups.push(addressTableLookup);
        accountKeysFromLookups.writable.push(...writable);
        accountKeysFromLookups.readonly.push(...readonly);
      }
    }
    const [header, staticAccountKeys] = compiledKeys.getMessageComponents();
    const accountKeys = new MessageAccountKeys(staticAccountKeys, accountKeysFromLookups);
    const compiledInstructions = accountKeys.compileInstructions(args.instructions);
    return new MessageV0({
      header,
      staticAccountKeys,
      recentBlockhash: args.recentBlockhash,
      compiledInstructions,
      addressTableLookups
    });
  }
  serialize() {
    const encodedStaticAccountKeysLength = Array();
    encodeLength(encodedStaticAccountKeysLength, this.staticAccountKeys.length);
    const serializedInstructions = this.serializeInstructions();
    const encodedInstructionsLength = Array();
    encodeLength(encodedInstructionsLength, this.compiledInstructions.length);
    const serializedAddressTableLookups = this.serializeAddressTableLookups();
    const encodedAddressTableLookupsLength = Array();
    encodeLength(encodedAddressTableLookupsLength, this.addressTableLookups.length);
    const messageLayout = LayoutExports.struct([LayoutExports.u8("prefix"), LayoutExports.struct([LayoutExports.u8("numRequiredSignatures"), LayoutExports.u8("numReadonlySignedAccounts"), LayoutExports.u8("numReadonlyUnsignedAccounts")], "header"), LayoutExports.blob(encodedStaticAccountKeysLength.length, "staticAccountKeysLength"), LayoutExports.seq(publicKey(), this.staticAccountKeys.length, "staticAccountKeys"), publicKey("recentBlockhash"), LayoutExports.blob(encodedInstructionsLength.length, "instructionsLength"), LayoutExports.blob(serializedInstructions.length, "serializedInstructions"), LayoutExports.blob(encodedAddressTableLookupsLength.length, "addressTableLookupsLength"), LayoutExports.blob(serializedAddressTableLookups.length, "serializedAddressTableLookups")]);
    const serializedMessage = new Uint8Array(PACKET_DATA_SIZE);
    const MESSAGE_VERSION_0_PREFIX = 1 << 7;
    const serializedMessageLength = messageLayout.encode({
      prefix: MESSAGE_VERSION_0_PREFIX,
      header: this.header,
      staticAccountKeysLength: new Uint8Array(encodedStaticAccountKeysLength),
      staticAccountKeys: this.staticAccountKeys.map((key) => key.toBytes()),
      recentBlockhash: bs58.decode(this.recentBlockhash),
      instructionsLength: new Uint8Array(encodedInstructionsLength),
      serializedInstructions,
      addressTableLookupsLength: new Uint8Array(encodedAddressTableLookupsLength),
      serializedAddressTableLookups
    }, serializedMessage);
    return serializedMessage.slice(0, serializedMessageLength);
  }
  serializeInstructions() {
    let serializedLength = 0;
    const serializedInstructions = new Uint8Array(PACKET_DATA_SIZE);
    for (const instruction of this.compiledInstructions) {
      const encodedAccountKeyIndexesLength = Array();
      encodeLength(encodedAccountKeyIndexesLength, instruction.accountKeyIndexes.length);
      const encodedDataLength = Array();
      encodeLength(encodedDataLength, instruction.data.length);
      const instructionLayout = LayoutExports.struct([LayoutExports.u8("programIdIndex"), LayoutExports.blob(encodedAccountKeyIndexesLength.length, "encodedAccountKeyIndexesLength"), LayoutExports.seq(LayoutExports.u8(), instruction.accountKeyIndexes.length, "accountKeyIndexes"), LayoutExports.blob(encodedDataLength.length, "encodedDataLength"), LayoutExports.blob(instruction.data.length, "data")]);
      serializedLength += instructionLayout.encode({
        programIdIndex: instruction.programIdIndex,
        encodedAccountKeyIndexesLength: new Uint8Array(encodedAccountKeyIndexesLength),
        accountKeyIndexes: instruction.accountKeyIndexes,
        encodedDataLength: new Uint8Array(encodedDataLength),
        data: instruction.data
      }, serializedInstructions, serializedLength);
    }
    return serializedInstructions.slice(0, serializedLength);
  }
  serializeAddressTableLookups() {
    let serializedLength = 0;
    const serializedAddressTableLookups = new Uint8Array(PACKET_DATA_SIZE);
    for (const lookup of this.addressTableLookups) {
      const encodedWritableIndexesLength = Array();
      encodeLength(encodedWritableIndexesLength, lookup.writableIndexes.length);
      const encodedReadonlyIndexesLength = Array();
      encodeLength(encodedReadonlyIndexesLength, lookup.readonlyIndexes.length);
      const addressTableLookupLayout = LayoutExports.struct([publicKey("accountKey"), LayoutExports.blob(encodedWritableIndexesLength.length, "encodedWritableIndexesLength"), LayoutExports.seq(LayoutExports.u8(), lookup.writableIndexes.length, "writableIndexes"), LayoutExports.blob(encodedReadonlyIndexesLength.length, "encodedReadonlyIndexesLength"), LayoutExports.seq(LayoutExports.u8(), lookup.readonlyIndexes.length, "readonlyIndexes")]);
      serializedLength += addressTableLookupLayout.encode({
        accountKey: lookup.accountKey.toBytes(),
        encodedWritableIndexesLength: new Uint8Array(encodedWritableIndexesLength),
        writableIndexes: lookup.writableIndexes,
        encodedReadonlyIndexesLength: new Uint8Array(encodedReadonlyIndexesLength),
        readonlyIndexes: lookup.readonlyIndexes
      }, serializedAddressTableLookups, serializedLength);
    }
    return serializedAddressTableLookups.slice(0, serializedLength);
  }
  static deserialize(serializedMessage) {
    let byteArray = [...serializedMessage];
    const prefix = guardedShift(byteArray);
    const maskedPrefix = prefix & VERSION_PREFIX_MASK;
    assert(prefix !== maskedPrefix, `Expected versioned message but received legacy message`);
    const version = maskedPrefix;
    assert(version === 0, `Expected versioned message with version 0 but found version ${version}`);
    const header = {
      numRequiredSignatures: guardedShift(byteArray),
      numReadonlySignedAccounts: guardedShift(byteArray),
      numReadonlyUnsignedAccounts: guardedShift(byteArray)
    };
    const staticAccountKeys = [];
    const staticAccountKeysLength = decodeLength(byteArray);
    for (let i = 0; i < staticAccountKeysLength; i++) {
      staticAccountKeys.push(new PublicKey(guardedSplice(byteArray, 0, PUBLIC_KEY_LENGTH)));
    }
    const recentBlockhash = bs58.encode(guardedSplice(byteArray, 0, PUBLIC_KEY_LENGTH));
    const instructionCount = decodeLength(byteArray);
    const compiledInstructions = [];
    for (let i = 0; i < instructionCount; i++) {
      const programIdIndex = guardedShift(byteArray);
      const accountKeyIndexesLength = decodeLength(byteArray);
      const accountKeyIndexes = guardedSplice(byteArray, 0, accountKeyIndexesLength);
      const dataLength = decodeLength(byteArray);
      const data = new Uint8Array(guardedSplice(byteArray, 0, dataLength));
      compiledInstructions.push({
        programIdIndex,
        accountKeyIndexes,
        data
      });
    }
    const addressTableLookupsCount = decodeLength(byteArray);
    const addressTableLookups = [];
    for (let i = 0; i < addressTableLookupsCount; i++) {
      const accountKey = new PublicKey(guardedSplice(byteArray, 0, PUBLIC_KEY_LENGTH));
      const writableIndexesLength = decodeLength(byteArray);
      const writableIndexes = guardedSplice(byteArray, 0, writableIndexesLength);
      const readonlyIndexesLength = decodeLength(byteArray);
      const readonlyIndexes = guardedSplice(byteArray, 0, readonlyIndexesLength);
      addressTableLookups.push({
        accountKey,
        writableIndexes,
        readonlyIndexes
      });
    }
    return new MessageV0({
      header,
      staticAccountKeys,
      recentBlockhash,
      compiledInstructions,
      addressTableLookups
    });
  }
}
const VersionedMessage = {
  deserializeMessageVersion(serializedMessage) {
    const prefix = serializedMessage[0];
    const maskedPrefix = prefix & VERSION_PREFIX_MASK;
    if (maskedPrefix === prefix) {
      return "legacy";
    }
    return maskedPrefix;
  },
  deserialize: (serializedMessage) => {
    const version = VersionedMessage.deserializeMessageVersion(serializedMessage);
    if (version === "legacy") {
      return Message.from(serializedMessage);
    }
    if (version === 0) {
      return MessageV0.deserialize(serializedMessage);
    } else {
      throw new Error(`Transaction message version ${version} deserialization is not supported`);
    }
  }
};
let TransactionStatus = /* @__PURE__ */ (function(TransactionStatus2) {
  TransactionStatus2[TransactionStatus2["BLOCKHEIGHT_EXCEEDED"] = 0] = "BLOCKHEIGHT_EXCEEDED";
  TransactionStatus2[TransactionStatus2["PROCESSED"] = 1] = "PROCESSED";
  TransactionStatus2[TransactionStatus2["TIMED_OUT"] = 2] = "TIMED_OUT";
  TransactionStatus2[TransactionStatus2["NONCE_INVALID"] = 3] = "NONCE_INVALID";
  return TransactionStatus2;
})({});
const DEFAULT_SIGNATURE = Buffer.alloc(SIGNATURE_LENGTH_IN_BYTES).fill(0);
class TransactionInstruction {
  constructor(opts) {
    this.keys = void 0;
    this.programId = void 0;
    this.data = Buffer.alloc(0);
    this.programId = opts.programId;
    this.keys = opts.keys;
    if (opts.data) {
      this.data = opts.data;
    }
  }
  /**
   * @internal
   */
  toJSON() {
    return {
      keys: this.keys.map(({
        pubkey,
        isSigner,
        isWritable
      }) => ({
        pubkey: pubkey.toJSON(),
        isSigner,
        isWritable
      })),
      programId: this.programId.toJSON(),
      data: [...this.data]
    };
  }
}
class Transaction {
  /**
   * The first (payer) Transaction signature
   *
   * @returns {Buffer | null} Buffer of payer's signature
   */
  get signature() {
    if (this.signatures.length > 0) {
      return this.signatures[0].signature;
    }
    return null;
  }
  /**
   * The transaction fee payer
   */
  // Construct a transaction with a blockhash and lastValidBlockHeight
  // Construct a transaction using a durable nonce
  /**
   * @deprecated `TransactionCtorFields` has been deprecated and will be removed in a future version.
   * Please supply a `TransactionBlockhashCtor` instead.
   */
  /**
   * Construct an empty Transaction
   */
  constructor(opts) {
    this.signatures = [];
    this.feePayer = void 0;
    this.instructions = [];
    this.recentBlockhash = void 0;
    this.lastValidBlockHeight = void 0;
    this.nonceInfo = void 0;
    this.minNonceContextSlot = void 0;
    this._message = void 0;
    this._json = void 0;
    if (!opts) {
      return;
    }
    if (opts.feePayer) {
      this.feePayer = opts.feePayer;
    }
    if (opts.signatures) {
      this.signatures = opts.signatures;
    }
    if (Object.prototype.hasOwnProperty.call(opts, "nonceInfo")) {
      const {
        minContextSlot,
        nonceInfo
      } = opts;
      this.minNonceContextSlot = minContextSlot;
      this.nonceInfo = nonceInfo;
    } else if (Object.prototype.hasOwnProperty.call(opts, "lastValidBlockHeight")) {
      const {
        blockhash,
        lastValidBlockHeight
      } = opts;
      this.recentBlockhash = blockhash;
      this.lastValidBlockHeight = lastValidBlockHeight;
    } else {
      const {
        recentBlockhash,
        nonceInfo
      } = opts;
      if (nonceInfo) {
        this.nonceInfo = nonceInfo;
      }
      this.recentBlockhash = recentBlockhash;
    }
  }
  /**
   * @internal
   */
  toJSON() {
    return {
      recentBlockhash: this.recentBlockhash || null,
      feePayer: this.feePayer ? this.feePayer.toJSON() : null,
      nonceInfo: this.nonceInfo ? {
        nonce: this.nonceInfo.nonce,
        nonceInstruction: this.nonceInfo.nonceInstruction.toJSON()
      } : null,
      instructions: this.instructions.map((instruction) => instruction.toJSON()),
      signers: this.signatures.map(({
        publicKey: publicKey2
      }) => {
        return publicKey2.toJSON();
      })
    };
  }
  /**
   * Add one or more instructions to this Transaction
   *
   * @param {Array< Transaction | TransactionInstruction | TransactionInstructionCtorFields >} items - Instructions to add to the Transaction
   */
  add(...items) {
    if (items.length === 0) {
      throw new Error("No instructions");
    }
    items.forEach((item) => {
      if ("instructions" in item) {
        this.instructions = this.instructions.concat(item.instructions);
      } else if ("data" in item && "programId" in item && "keys" in item) {
        this.instructions.push(item);
      } else {
        this.instructions.push(new TransactionInstruction(item));
      }
    });
    return this;
  }
  /**
   * Compile transaction data
   */
  compileMessage() {
    if (this._message && JSON.stringify(this.toJSON()) === JSON.stringify(this._json)) {
      return this._message;
    }
    let recentBlockhash;
    let instructions;
    if (this.nonceInfo) {
      recentBlockhash = this.nonceInfo.nonce;
      if (this.instructions[0] != this.nonceInfo.nonceInstruction) {
        instructions = [this.nonceInfo.nonceInstruction, ...this.instructions];
      } else {
        instructions = this.instructions;
      }
    } else {
      recentBlockhash = this.recentBlockhash;
      instructions = this.instructions;
    }
    if (!recentBlockhash) {
      throw new Error("Transaction recentBlockhash required");
    }
    if (instructions.length < 1) {
      console.warn("No instructions provided");
    }
    let feePayer;
    if (this.feePayer) {
      feePayer = this.feePayer;
    } else if (this.signatures.length > 0 && this.signatures[0].publicKey) {
      feePayer = this.signatures[0].publicKey;
    } else {
      throw new Error("Transaction fee payer required");
    }
    for (let i = 0; i < instructions.length; i++) {
      if (instructions[i].programId === void 0) {
        throw new Error(`Transaction instruction index ${i} has undefined program id`);
      }
    }
    const programIds = [];
    const accountMetas = [];
    instructions.forEach((instruction) => {
      instruction.keys.forEach((accountMeta) => {
        accountMetas.push({
          ...accountMeta
        });
      });
      const programId = instruction.programId.toString();
      if (!programIds.includes(programId)) {
        programIds.push(programId);
      }
    });
    programIds.forEach((programId) => {
      accountMetas.push({
        pubkey: new PublicKey(programId),
        isSigner: false,
        isWritable: false
      });
    });
    const uniqueMetas = [];
    accountMetas.forEach((accountMeta) => {
      const pubkeyString = accountMeta.pubkey.toString();
      const uniqueIndex = uniqueMetas.findIndex((x) => {
        return x.pubkey.toString() === pubkeyString;
      });
      if (uniqueIndex > -1) {
        uniqueMetas[uniqueIndex].isWritable = uniqueMetas[uniqueIndex].isWritable || accountMeta.isWritable;
        uniqueMetas[uniqueIndex].isSigner = uniqueMetas[uniqueIndex].isSigner || accountMeta.isSigner;
      } else {
        uniqueMetas.push(accountMeta);
      }
    });
    uniqueMetas.sort(function(x, y) {
      if (x.isSigner !== y.isSigner) {
        return x.isSigner ? -1 : 1;
      }
      if (x.isWritable !== y.isWritable) {
        return x.isWritable ? -1 : 1;
      }
      const options = {
        localeMatcher: "best fit",
        usage: "sort",
        sensitivity: "variant",
        ignorePunctuation: false,
        numeric: false,
        caseFirst: "lower"
      };
      return x.pubkey.toBase58().localeCompare(y.pubkey.toBase58(), "en", options);
    });
    const feePayerIndex = uniqueMetas.findIndex((x) => {
      return x.pubkey.equals(feePayer);
    });
    if (feePayerIndex > -1) {
      const [payerMeta] = uniqueMetas.splice(feePayerIndex, 1);
      payerMeta.isSigner = true;
      payerMeta.isWritable = true;
      uniqueMetas.unshift(payerMeta);
    } else {
      uniqueMetas.unshift({
        pubkey: feePayer,
        isSigner: true,
        isWritable: true
      });
    }
    for (const signature2 of this.signatures) {
      const uniqueIndex = uniqueMetas.findIndex((x) => {
        return x.pubkey.equals(signature2.publicKey);
      });
      if (uniqueIndex > -1) {
        if (!uniqueMetas[uniqueIndex].isSigner) {
          uniqueMetas[uniqueIndex].isSigner = true;
          console.warn("Transaction references a signature that is unnecessary, only the fee payer and instruction signer accounts should sign a transaction. This behavior is deprecated and will throw an error in the next major version release.");
        }
      } else {
        throw new Error(`unknown signer: ${signature2.publicKey.toString()}`);
      }
    }
    let numRequiredSignatures = 0;
    let numReadonlySignedAccounts = 0;
    let numReadonlyUnsignedAccounts = 0;
    const signedKeys = [];
    const unsignedKeys = [];
    uniqueMetas.forEach(({
      pubkey,
      isSigner,
      isWritable
    }) => {
      if (isSigner) {
        signedKeys.push(pubkey.toString());
        numRequiredSignatures += 1;
        if (!isWritable) {
          numReadonlySignedAccounts += 1;
        }
      } else {
        unsignedKeys.push(pubkey.toString());
        if (!isWritable) {
          numReadonlyUnsignedAccounts += 1;
        }
      }
    });
    const accountKeys = signedKeys.concat(unsignedKeys);
    const compiledInstructions = instructions.map((instruction) => {
      const {
        data,
        programId
      } = instruction;
      return {
        programIdIndex: accountKeys.indexOf(programId.toString()),
        accounts: instruction.keys.map((meta) => accountKeys.indexOf(meta.pubkey.toString())),
        data: bs58.encode(data)
      };
    });
    compiledInstructions.forEach((instruction) => {
      assert(instruction.programIdIndex >= 0);
      instruction.accounts.forEach((keyIndex) => assert(keyIndex >= 0));
    });
    return new Message({
      header: {
        numRequiredSignatures,
        numReadonlySignedAccounts,
        numReadonlyUnsignedAccounts
      },
      accountKeys,
      recentBlockhash,
      instructions: compiledInstructions
    });
  }
  /**
   * @internal
   */
  _compile() {
    const message = this.compileMessage();
    const signedKeys = message.accountKeys.slice(0, message.header.numRequiredSignatures);
    if (this.signatures.length === signedKeys.length) {
      const valid = this.signatures.every((pair, index) => {
        return signedKeys[index].equals(pair.publicKey);
      });
      if (valid) return message;
    }
    this.signatures = signedKeys.map((publicKey2) => ({
      signature: null,
      publicKey: publicKey2
    }));
    return message;
  }
  /**
   * Get a buffer of the Transaction data that need to be covered by signatures
   */
  serializeMessage() {
    return this._compile().serialize();
  }
  /**
   * Get the estimated fee associated with a transaction
   *
   * @param {Connection} connection Connection to RPC Endpoint.
   *
   * @returns {Promise<number | null>} The estimated fee for the transaction
   */
  async getEstimatedFee(connection) {
    return (await connection.getFeeForMessage(this.compileMessage())).value;
  }
  /**
   * Specify the public keys which will be used to sign the Transaction.
   * The first signer will be used as the transaction fee payer account.
   *
   * Signatures can be added with either `partialSign` or `addSignature`
   *
   * @deprecated Deprecated since v0.84.0. Only the fee payer needs to be
   * specified and it can be set in the Transaction constructor or with the
   * `feePayer` property.
   */
  setSigners(...signers) {
    if (signers.length === 0) {
      throw new Error("No signers");
    }
    const seen = /* @__PURE__ */ new Set();
    this.signatures = signers.filter((publicKey2) => {
      const key = publicKey2.toString();
      if (seen.has(key)) {
        return false;
      } else {
        seen.add(key);
        return true;
      }
    }).map((publicKey2) => ({
      signature: null,
      publicKey: publicKey2
    }));
  }
  /**
   * Sign the Transaction with the specified signers. Multiple signatures may
   * be applied to a Transaction. The first signature is considered "primary"
   * and is used identify and confirm transactions.
   *
   * If the Transaction `feePayer` is not set, the first signer will be used
   * as the transaction fee payer account.
   *
   * Transaction fields should not be modified after the first call to `sign`,
   * as doing so may invalidate the signature and cause the Transaction to be
   * rejected.
   *
   * The Transaction must be assigned a valid `recentBlockhash` before invoking this method
   *
   * @param {Array<Signer>} signers Array of signers that will sign the transaction
   */
  sign(...signers) {
    if (signers.length === 0) {
      throw new Error("No signers");
    }
    const seen = /* @__PURE__ */ new Set();
    const uniqueSigners = [];
    for (const signer of signers) {
      const key = signer.publicKey.toString();
      if (seen.has(key)) {
        continue;
      } else {
        seen.add(key);
        uniqueSigners.push(signer);
      }
    }
    this.signatures = uniqueSigners.map((signer) => ({
      signature: null,
      publicKey: signer.publicKey
    }));
    const message = this._compile();
    this._partialSign(message, ...uniqueSigners);
  }
  /**
   * Partially sign a transaction with the specified accounts. All accounts must
   * correspond to either the fee payer or a signer account in the transaction
   * instructions.
   *
   * All the caveats from the `sign` method apply to `partialSign`
   *
   * @param {Array<Signer>} signers Array of signers that will sign the transaction
   */
  partialSign(...signers) {
    if (signers.length === 0) {
      throw new Error("No signers");
    }
    const seen = /* @__PURE__ */ new Set();
    const uniqueSigners = [];
    for (const signer of signers) {
      const key = signer.publicKey.toString();
      if (seen.has(key)) {
        continue;
      } else {
        seen.add(key);
        uniqueSigners.push(signer);
      }
    }
    const message = this._compile();
    this._partialSign(message, ...uniqueSigners);
  }
  /**
   * @internal
   */
  _partialSign(message, ...signers) {
    const signData = message.serialize();
    signers.forEach((signer) => {
      const signature2 = sign(signData, signer.secretKey);
      this._addSignature(signer.publicKey, toBuffer(signature2));
    });
  }
  /**
   * Add an externally created signature to a transaction. The public key
   * must correspond to either the fee payer or a signer account in the transaction
   * instructions.
   *
   * @param {PublicKey} pubkey Public key that will be added to the transaction.
   * @param {Buffer} signature An externally created signature to add to the transaction.
   */
  addSignature(pubkey, signature2) {
    this._compile();
    this._addSignature(pubkey, signature2);
  }
  /**
   * @internal
   */
  _addSignature(pubkey, signature2) {
    assert(signature2.length === 64);
    const index = this.signatures.findIndex((sigpair) => pubkey.equals(sigpair.publicKey));
    if (index < 0) {
      throw new Error(`unknown signer: ${pubkey.toString()}`);
    }
    this.signatures[index].signature = Buffer.from(signature2);
  }
  /**
   * Verify signatures of a Transaction
   * Optional parameter specifies if we're expecting a fully signed Transaction or a partially signed one.
   * If no boolean is provided, we expect a fully signed Transaction by default.
   *
   * @param {boolean} [requireAllSignatures=true] Require a fully signed Transaction
   */
  verifySignatures(requireAllSignatures = true) {
    const signatureErrors = this._getMessageSignednessErrors(this.serializeMessage(), requireAllSignatures);
    return !signatureErrors;
  }
  /**
   * @internal
   */
  _getMessageSignednessErrors(message, requireAllSignatures) {
    const errors = {};
    for (const {
      signature: signature2,
      publicKey: publicKey2
    } of this.signatures) {
      if (signature2 === null) {
        if (requireAllSignatures) {
          (errors.missing ||= []).push(publicKey2);
        }
      } else {
        if (!verify(signature2, message, publicKey2.toBytes())) {
          (errors.invalid ||= []).push(publicKey2);
        }
      }
    }
    return errors.invalid || errors.missing ? errors : void 0;
  }
  /**
   * Serialize the Transaction in the wire format.
   *
   * @param {Buffer} [config] Config of transaction.
   *
   * @returns {Buffer} Signature of transaction in wire format.
   */
  serialize(config) {
    const {
      requireAllSignatures,
      verifySignatures
    } = Object.assign({
      requireAllSignatures: true,
      verifySignatures: true
    }, config);
    const signData = this.serializeMessage();
    if (verifySignatures) {
      const sigErrors = this._getMessageSignednessErrors(signData, requireAllSignatures);
      if (sigErrors) {
        let errorMessage = "Signature verification failed.";
        if (sigErrors.invalid) {
          errorMessage += `
Invalid signature for public key${sigErrors.invalid.length === 1 ? "" : "(s)"} [\`${sigErrors.invalid.map((p) => p.toBase58()).join("`, `")}\`].`;
        }
        if (sigErrors.missing) {
          errorMessage += `
Missing signature for public key${sigErrors.missing.length === 1 ? "" : "(s)"} [\`${sigErrors.missing.map((p) => p.toBase58()).join("`, `")}\`].`;
        }
        throw new Error(errorMessage);
      }
    }
    return this._serialize(signData);
  }
  /**
   * @internal
   */
  _serialize(signData) {
    const {
      signatures
    } = this;
    const signatureCount = [];
    encodeLength(signatureCount, signatures.length);
    const transactionLength = signatureCount.length + signatures.length * 64 + signData.length;
    const wireTransaction = Buffer.alloc(transactionLength);
    assert(signatures.length < 256);
    Buffer.from(signatureCount).copy(wireTransaction, 0);
    signatures.forEach(({
      signature: signature2
    }, index) => {
      if (signature2 !== null) {
        assert(signature2.length === 64, `signature has invalid length`);
        Buffer.from(signature2).copy(wireTransaction, signatureCount.length + index * 64);
      }
    });
    signData.copy(wireTransaction, signatureCount.length + signatures.length * 64);
    assert(wireTransaction.length <= PACKET_DATA_SIZE, `Transaction too large: ${wireTransaction.length} > ${PACKET_DATA_SIZE}`);
    return wireTransaction;
  }
  /**
   * Deprecated method
   * @internal
   */
  get keys() {
    assert(this.instructions.length === 1);
    return this.instructions[0].keys.map((keyObj) => keyObj.pubkey);
  }
  /**
   * Deprecated method
   * @internal
   */
  get programId() {
    assert(this.instructions.length === 1);
    return this.instructions[0].programId;
  }
  /**
   * Deprecated method
   * @internal
   */
  get data() {
    assert(this.instructions.length === 1);
    return this.instructions[0].data;
  }
  /**
   * Parse a wire transaction into a Transaction object.
   *
   * @param {Buffer | Uint8Array | Array<number>} buffer Signature of wire Transaction
   *
   * @returns {Transaction} Transaction associated with the signature
   */
  static from(buffer) {
    let byteArray = [...buffer];
    const signatureCount = decodeLength(byteArray);
    let signatures = [];
    for (let i = 0; i < signatureCount; i++) {
      const signature2 = guardedSplice(byteArray, 0, SIGNATURE_LENGTH_IN_BYTES);
      signatures.push(bs58.encode(Buffer.from(signature2)));
    }
    return Transaction.populate(Message.from(byteArray), signatures);
  }
  /**
   * Populate Transaction object from message and signatures
   *
   * @param {Message} message Message of transaction
   * @param {Array<string>} signatures List of signatures to assign to the transaction
   *
   * @returns {Transaction} The populated Transaction
   */
  static populate(message, signatures = []) {
    const transaction = new Transaction();
    transaction.recentBlockhash = message.recentBlockhash;
    if (message.header.numRequiredSignatures > 0) {
      transaction.feePayer = message.accountKeys[0];
    }
    signatures.forEach((signature2, index) => {
      const sigPubkeyPair = {
        signature: signature2 == bs58.encode(DEFAULT_SIGNATURE) ? null : bs58.decode(signature2),
        publicKey: message.accountKeys[index]
      };
      transaction.signatures.push(sigPubkeyPair);
    });
    message.instructions.forEach((instruction) => {
      const keys = instruction.accounts.map((account) => {
        const pubkey = message.accountKeys[account];
        return {
          pubkey,
          isSigner: transaction.signatures.some((keyObj) => keyObj.publicKey.toString() === pubkey.toString()) || message.isAccountSigner(account),
          isWritable: message.isAccountWritable(account)
        };
      });
      transaction.instructions.push(new TransactionInstruction({
        keys,
        programId: message.accountKeys[instruction.programIdIndex],
        data: bs58.decode(instruction.data)
      }));
    });
    transaction._message = message;
    transaction._json = transaction.toJSON();
    return transaction;
  }
}
class VersionedTransaction {
  get version() {
    return this.message.version;
  }
  constructor(message, signatures) {
    this.signatures = void 0;
    this.message = void 0;
    if (signatures !== void 0) {
      assert(signatures.length === message.header.numRequiredSignatures, "Expected signatures length to be equal to the number of required signatures");
      this.signatures = signatures;
    } else {
      const defaultSignatures = [];
      for (let i = 0; i < message.header.numRequiredSignatures; i++) {
        defaultSignatures.push(new Uint8Array(SIGNATURE_LENGTH_IN_BYTES));
      }
      this.signatures = defaultSignatures;
    }
    this.message = message;
  }
  serialize() {
    const serializedMessage = this.message.serialize();
    const encodedSignaturesLength = Array();
    encodeLength(encodedSignaturesLength, this.signatures.length);
    const transactionLayout = LayoutExports.struct([LayoutExports.blob(encodedSignaturesLength.length, "encodedSignaturesLength"), LayoutExports.seq(signature(), this.signatures.length, "signatures"), LayoutExports.blob(serializedMessage.length, "serializedMessage")]);
    const serializedTransaction = new Uint8Array(2048);
    const serializedTransactionLength = transactionLayout.encode({
      encodedSignaturesLength: new Uint8Array(encodedSignaturesLength),
      signatures: this.signatures,
      serializedMessage
    }, serializedTransaction);
    return serializedTransaction.slice(0, serializedTransactionLength);
  }
  static deserialize(serializedTransaction) {
    let byteArray = [...serializedTransaction];
    const signatures = [];
    const signaturesLength = decodeLength(byteArray);
    for (let i = 0; i < signaturesLength; i++) {
      signatures.push(new Uint8Array(guardedSplice(byteArray, 0, SIGNATURE_LENGTH_IN_BYTES)));
    }
    const message = VersionedMessage.deserialize(new Uint8Array(byteArray));
    return new VersionedTransaction(message, signatures);
  }
  sign(signers) {
    const messageData = this.message.serialize();
    const signerPubkeys = this.message.staticAccountKeys.slice(0, this.message.header.numRequiredSignatures);
    for (const signer of signers) {
      const signerIndex = signerPubkeys.findIndex((pubkey) => pubkey.equals(signer.publicKey));
      assert(signerIndex >= 0, `Cannot sign with non signer key ${signer.publicKey.toBase58()}`);
      this.signatures[signerIndex] = sign(messageData, signer.secretKey);
    }
  }
  addSignature(publicKey2, signature2) {
    assert(signature2.byteLength === 64, "Signature must be 64 bytes long");
    const signerPubkeys = this.message.staticAccountKeys.slice(0, this.message.header.numRequiredSignatures);
    const signerIndex = signerPubkeys.findIndex((pubkey) => pubkey.equals(publicKey2));
    assert(signerIndex >= 0, `Can not add signature; \`${publicKey2.toBase58()}\` is not required to sign this transaction`);
    this.signatures[signerIndex] = signature2;
  }
}
const NUM_TICKS_PER_SECOND = 160;
const DEFAULT_TICKS_PER_SLOT = 64;
const NUM_SLOTS_PER_SECOND = NUM_TICKS_PER_SECOND / DEFAULT_TICKS_PER_SLOT;
const MS_PER_SLOT = 1e3 / NUM_SLOTS_PER_SECOND;
new PublicKey("SysvarC1ock11111111111111111111111111111111");
new PublicKey("SysvarEpochSchedu1e111111111111111111111111");
new PublicKey("Sysvar1nstructions1111111111111111111111111");
new PublicKey("SysvarRecentB1ockHashes11111111111111111111");
new PublicKey("SysvarRent111111111111111111111111111111111");
new PublicKey("SysvarRewards111111111111111111111111111111");
new PublicKey("SysvarS1otHashes111111111111111111111111111");
new PublicKey("SysvarS1otHistory11111111111111111111111111");
new PublicKey("SysvarStakeHistory1111111111111111111111111");
class SendTransactionError extends Error {
  constructor({
    action,
    signature: signature2,
    transactionMessage,
    logs
  }) {
    const maybeLogsOutput = logs ? `Logs: 
${JSON.stringify(logs.slice(-10), null, 2)}. ` : "";
    const guideText = "\nCatch the `SendTransactionError` and call `getLogs()` on it for full details.";
    let message;
    switch (action) {
      case "send":
        message = `Transaction ${signature2} resulted in an error. 
${transactionMessage}. ` + maybeLogsOutput + guideText;
        break;
      case "simulate":
        message = `Simulation failed. 
Message: ${transactionMessage}. 
` + maybeLogsOutput + guideText;
        break;
      default: {
        message = `Unknown action '${/* @__PURE__ */ ((a) => a)(action)}'`;
      }
    }
    super(message);
    this.signature = void 0;
    this.transactionMessage = void 0;
    this.transactionLogs = void 0;
    this.signature = signature2;
    this.transactionMessage = transactionMessage;
    this.transactionLogs = logs ? logs : void 0;
  }
  get transactionError() {
    return {
      message: this.transactionMessage,
      logs: Array.isArray(this.transactionLogs) ? this.transactionLogs : void 0
    };
  }
  /* @deprecated Use `await getLogs()` instead */
  get logs() {
    const cachedLogs = this.transactionLogs;
    if (cachedLogs != null && typeof cachedLogs === "object" && "then" in cachedLogs) {
      return void 0;
    }
    return cachedLogs;
  }
  async getLogs(connection) {
    if (!Array.isArray(this.transactionLogs)) {
      this.transactionLogs = new Promise((resolve, reject) => {
        connection.getTransaction(this.signature).then((tx) => {
          if (tx && tx.meta && tx.meta.logMessages) {
            const logs = tx.meta.logMessages;
            this.transactionLogs = logs;
            resolve(logs);
          } else {
            reject(new Error("Log messages not found"));
          }
        }).catch(reject);
      });
    }
    return await this.transactionLogs;
  }
}
class SolanaJSONRPCError extends Error {
  constructor({
    code,
    message,
    data
  }, customMessage) {
    super(customMessage != null ? `${customMessage}: ${message}` : message);
    this.code = void 0;
    this.data = void 0;
    this.code = code;
    this.data = data;
    this.name = "SolanaJSONRPCError";
  }
}
function sleep(ms2) {
  return new Promise((resolve) => setTimeout(resolve, ms2));
}
const FeeCalculatorLayout = LayoutExports.nu64("lamportsPerSignature");
const NonceAccountLayout = LayoutExports.struct([LayoutExports.u32("version"), LayoutExports.u32("state"), publicKey("authorizedPubkey"), publicKey("nonce"), LayoutExports.struct([FeeCalculatorLayout], "feeCalculator")]);
NonceAccountLayout.span;
class NonceAccount {
  /**
   * @internal
   */
  constructor(args) {
    this.authorizedPubkey = void 0;
    this.nonce = void 0;
    this.feeCalculator = void 0;
    this.authorizedPubkey = args.authorizedPubkey;
    this.nonce = args.nonce;
    this.feeCalculator = args.feeCalculator;
  }
  /**
   * Deserialize NonceAccount from the account data.
   *
   * @param buffer account data
   * @return NonceAccount
   */
  static fromAccountData(buffer) {
    const nonceAccount = NonceAccountLayout.decode(toBuffer(buffer), 0);
    return new NonceAccount({
      authorizedPubkey: new PublicKey(nonceAccount.authorizedPubkey),
      nonce: new PublicKey(nonceAccount.nonce).toString(),
      feeCalculator: nonceAccount.feeCalculator
    });
  }
}
function u64(property) {
  const layout = LayoutExports.blob(8, property);
  const decode = layout.decode.bind(layout);
  const encode = layout.encode.bind(layout);
  const bigIntLayout = layout;
  const codec = getU64Codec();
  bigIntLayout.decode = (buffer, offset) => {
    const src = decode(buffer, offset);
    return codec.decode(src);
  };
  bigIntLayout.encode = (bigInt, buffer, offset) => {
    const src = codec.encode(bigInt);
    return encode(src, buffer, offset);
  };
  return bigIntLayout;
}
Object.freeze({
  Create: {
    index: 0,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), LayoutExports.ns64("lamports"), LayoutExports.ns64("space"), publicKey("programId")])
  },
  Assign: {
    index: 1,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), publicKey("programId")])
  },
  Transfer: {
    index: 2,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), u64("lamports")])
  },
  CreateWithSeed: {
    index: 3,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), publicKey("base"), rustString("seed"), LayoutExports.ns64("lamports"), LayoutExports.ns64("space"), publicKey("programId")])
  },
  AdvanceNonceAccount: {
    index: 4,
    layout: LayoutExports.struct([LayoutExports.u32("instruction")])
  },
  WithdrawNonceAccount: {
    index: 5,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), LayoutExports.ns64("lamports")])
  },
  InitializeNonceAccount: {
    index: 6,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), publicKey("authorized")])
  },
  AuthorizeNonceAccount: {
    index: 7,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), publicKey("authorized")])
  },
  Allocate: {
    index: 8,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), LayoutExports.ns64("space")])
  },
  AllocateWithSeed: {
    index: 9,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), publicKey("base"), rustString("seed"), LayoutExports.ns64("space"), publicKey("programId")])
  },
  AssignWithSeed: {
    index: 10,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), publicKey("base"), rustString("seed"), publicKey("programId")])
  },
  TransferWithSeed: {
    index: 11,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), u64("lamports"), rustString("seed"), publicKey("programId")])
  },
  UpgradeNonceAccount: {
    index: 12,
    layout: LayoutExports.struct([LayoutExports.u32("instruction")])
  }
});
new PublicKey("11111111111111111111111111111111");
new PublicKey("BPFLoader2111111111111111111111111111111111");
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var agentkeepalive = { exports: {} };
var ms;
var hasRequiredMs;
function requireMs() {
  if (hasRequiredMs) return ms;
  hasRequiredMs = 1;
  var s = 1e3;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var w = d * 7;
  var y = d * 365.25;
  ms = function(val, options) {
    options = options || {};
    var type2 = typeof val;
    if (type2 === "string" && val.length > 0) {
      return parse(val);
    } else if (type2 === "number" && isFinite(val)) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
    );
  };
  function parse(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
      str
    );
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type2 = (match[2] || "ms").toLowerCase();
    switch (type2) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n * y;
      case "weeks":
      case "week":
      case "w":
        return n * w;
      case "days":
      case "day":
      case "d":
        return n * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n * s;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n;
      default:
        return void 0;
    }
  }
  function fmtShort(ms2) {
    var msAbs = Math.abs(ms2);
    if (msAbs >= d) {
      return Math.round(ms2 / d) + "d";
    }
    if (msAbs >= h) {
      return Math.round(ms2 / h) + "h";
    }
    if (msAbs >= m) {
      return Math.round(ms2 / m) + "m";
    }
    if (msAbs >= s) {
      return Math.round(ms2 / s) + "s";
    }
    return ms2 + "ms";
  }
  function fmtLong(ms2) {
    var msAbs = Math.abs(ms2);
    if (msAbs >= d) {
      return plural(ms2, msAbs, d, "day");
    }
    if (msAbs >= h) {
      return plural(ms2, msAbs, h, "hour");
    }
    if (msAbs >= m) {
      return plural(ms2, msAbs, m, "minute");
    }
    if (msAbs >= s) {
      return plural(ms2, msAbs, s, "second");
    }
    return ms2 + " ms";
  }
  function plural(ms2, msAbs, n, name) {
    var isPlural = msAbs >= n * 1.5;
    return Math.round(ms2 / n) + " " + name + (isPlural ? "s" : "");
  }
  return ms;
}
var humanizeMs;
var hasRequiredHumanizeMs;
function requireHumanizeMs() {
  if (hasRequiredHumanizeMs) return humanizeMs;
  hasRequiredHumanizeMs = 1;
  var util = require$$0;
  var ms2 = /* @__PURE__ */ requireMs();
  humanizeMs = function(t) {
    if (typeof t === "number") return t;
    var r = ms2(t);
    if (r === void 0) {
      var err = new Error(util.format("humanize-ms(%j) result undefined", t));
      console.warn(err.stack);
    }
    return r;
  };
  return humanizeMs;
}
var constants;
var hasRequiredConstants;
function requireConstants() {
  if (hasRequiredConstants) return constants;
  hasRequiredConstants = 1;
  constants = {
    // agent
    CURRENT_ID: /* @__PURE__ */ Symbol("agentkeepalive#currentId"),
    CREATE_ID: /* @__PURE__ */ Symbol("agentkeepalive#createId"),
    INIT_SOCKET: /* @__PURE__ */ Symbol("agentkeepalive#initSocket"),
    CREATE_HTTPS_CONNECTION: /* @__PURE__ */ Symbol("agentkeepalive#createHttpsConnection"),
    // socket
    SOCKET_CREATED_TIME: /* @__PURE__ */ Symbol("agentkeepalive#socketCreatedTime"),
    SOCKET_NAME: /* @__PURE__ */ Symbol("agentkeepalive#socketName"),
    SOCKET_REQUEST_COUNT: /* @__PURE__ */ Symbol("agentkeepalive#socketRequestCount"),
    SOCKET_REQUEST_FINISHED_COUNT: /* @__PURE__ */ Symbol("agentkeepalive#socketRequestFinishedCount")
  };
  return constants;
}
var agent;
var hasRequiredAgent;
function requireAgent() {
  if (hasRequiredAgent) return agent;
  hasRequiredAgent = 1;
  const OriginalAgent = http.Agent;
  const ms2 = /* @__PURE__ */ requireHumanizeMs();
  const debug = require$$0.debuglog("agentkeepalive");
  const {
    INIT_SOCKET,
    CURRENT_ID,
    CREATE_ID,
    SOCKET_CREATED_TIME,
    SOCKET_NAME,
    SOCKET_REQUEST_COUNT,
    SOCKET_REQUEST_FINISHED_COUNT
  } = /* @__PURE__ */ requireConstants();
  let defaultTimeoutListenerCount = 1;
  const majorVersion = parseInt(process.version.split(".", 1)[0].substring(1));
  if (majorVersion >= 11 && majorVersion <= 12) {
    defaultTimeoutListenerCount = 2;
  } else if (majorVersion >= 13) {
    defaultTimeoutListenerCount = 3;
  }
  function deprecate(message) {
    console.log("[agentkeepalive:deprecated] %s", message);
  }
  class Agent2 extends OriginalAgent {
    constructor(options) {
      options = options || {};
      options.keepAlive = options.keepAlive !== false;
      if (options.freeSocketTimeout === void 0) {
        options.freeSocketTimeout = 4e3;
      }
      if (options.keepAliveTimeout) {
        deprecate("options.keepAliveTimeout is deprecated, please use options.freeSocketTimeout instead");
        options.freeSocketTimeout = options.keepAliveTimeout;
        delete options.keepAliveTimeout;
      }
      if (options.freeSocketKeepAliveTimeout) {
        deprecate("options.freeSocketKeepAliveTimeout is deprecated, please use options.freeSocketTimeout instead");
        options.freeSocketTimeout = options.freeSocketKeepAliveTimeout;
        delete options.freeSocketKeepAliveTimeout;
      }
      if (options.timeout === void 0) {
        options.timeout = Math.max(options.freeSocketTimeout * 2, 8e3);
      }
      options.timeout = ms2(options.timeout);
      options.freeSocketTimeout = ms2(options.freeSocketTimeout);
      options.socketActiveTTL = options.socketActiveTTL ? ms2(options.socketActiveTTL) : 0;
      super(options);
      this[CURRENT_ID] = 0;
      this.createSocketCount = 0;
      this.createSocketCountLastCheck = 0;
      this.createSocketErrorCount = 0;
      this.createSocketErrorCountLastCheck = 0;
      this.closeSocketCount = 0;
      this.closeSocketCountLastCheck = 0;
      this.errorSocketCount = 0;
      this.errorSocketCountLastCheck = 0;
      this.requestCount = 0;
      this.requestCountLastCheck = 0;
      this.timeoutSocketCount = 0;
      this.timeoutSocketCountLastCheck = 0;
      this.on("free", (socket) => {
        const timeout = this.calcSocketTimeout(socket);
        if (timeout > 0 && socket.timeout !== timeout) {
          socket.setTimeout(timeout);
        }
      });
    }
    get freeSocketKeepAliveTimeout() {
      deprecate("agent.freeSocketKeepAliveTimeout is deprecated, please use agent.options.freeSocketTimeout instead");
      return this.options.freeSocketTimeout;
    }
    get timeout() {
      deprecate("agent.timeout is deprecated, please use agent.options.timeout instead");
      return this.options.timeout;
    }
    get socketActiveTTL() {
      deprecate("agent.socketActiveTTL is deprecated, please use agent.options.socketActiveTTL instead");
      return this.options.socketActiveTTL;
    }
    calcSocketTimeout(socket) {
      let freeSocketTimeout = this.options.freeSocketTimeout;
      const socketActiveTTL = this.options.socketActiveTTL;
      if (socketActiveTTL) {
        const aliveTime = Date.now() - socket[SOCKET_CREATED_TIME];
        const diff = socketActiveTTL - aliveTime;
        if (diff <= 0) {
          return diff;
        }
        if (freeSocketTimeout && diff < freeSocketTimeout) {
          freeSocketTimeout = diff;
        }
      }
      if (freeSocketTimeout) {
        const customFreeSocketTimeout = socket.freeSocketTimeout || socket.freeSocketKeepAliveTimeout;
        return customFreeSocketTimeout || freeSocketTimeout;
      }
    }
    keepSocketAlive(socket) {
      const result = super.keepSocketAlive(socket);
      if (!result) return result;
      const customTimeout = this.calcSocketTimeout(socket);
      if (typeof customTimeout === "undefined") {
        return true;
      }
      if (customTimeout <= 0) {
        debug(
          "%s(requests: %s, finished: %s) free but need to destroy by TTL, request count %s, diff is %s",
          socket[SOCKET_NAME],
          socket[SOCKET_REQUEST_COUNT],
          socket[SOCKET_REQUEST_FINISHED_COUNT],
          customTimeout
        );
        return false;
      }
      if (socket.timeout !== customTimeout) {
        socket.setTimeout(customTimeout);
      }
      return true;
    }
    // only call on addRequest
    reuseSocket(...args) {
      super.reuseSocket(...args);
      const socket = args[0];
      const req = args[1];
      req.reusedSocket = true;
      const agentTimeout = this.options.timeout;
      if (getSocketTimeout(socket) !== agentTimeout) {
        socket.setTimeout(agentTimeout);
        debug("%s reset timeout to %sms", socket[SOCKET_NAME], agentTimeout);
      }
      socket[SOCKET_REQUEST_COUNT]++;
      debug(
        "%s(requests: %s, finished: %s) reuse on addRequest, timeout %sms",
        socket[SOCKET_NAME],
        socket[SOCKET_REQUEST_COUNT],
        socket[SOCKET_REQUEST_FINISHED_COUNT],
        getSocketTimeout(socket)
      );
    }
    [CREATE_ID]() {
      const id = this[CURRENT_ID]++;
      if (this[CURRENT_ID] === Number.MAX_SAFE_INTEGER) this[CURRENT_ID] = 0;
      return id;
    }
    [INIT_SOCKET](socket, options) {
      if (options.timeout) {
        const timeout = getSocketTimeout(socket);
        if (!timeout) {
          socket.setTimeout(options.timeout);
        }
      }
      if (this.options.keepAlive) {
        socket.setNoDelay(true);
      }
      this.createSocketCount++;
      if (this.options.socketActiveTTL) {
        socket[SOCKET_CREATED_TIME] = Date.now();
      }
      socket[SOCKET_NAME] = `sock[${this[CREATE_ID]()}#${options._agentKey}]`.split("-----BEGIN", 1)[0];
      socket[SOCKET_REQUEST_COUNT] = 1;
      socket[SOCKET_REQUEST_FINISHED_COUNT] = 0;
      installListeners(this, socket, options);
    }
    createConnection(options, oncreate) {
      let called = false;
      const onNewCreate = (err, socket) => {
        if (called) return;
        called = true;
        if (err) {
          this.createSocketErrorCount++;
          return oncreate(err);
        }
        this[INIT_SOCKET](socket, options);
        oncreate(err, socket);
      };
      const newSocket = super.createConnection(options, onNewCreate);
      if (newSocket) onNewCreate(null, newSocket);
      return newSocket;
    }
    get statusChanged() {
      const changed = this.createSocketCount !== this.createSocketCountLastCheck || this.createSocketErrorCount !== this.createSocketErrorCountLastCheck || this.closeSocketCount !== this.closeSocketCountLastCheck || this.errorSocketCount !== this.errorSocketCountLastCheck || this.timeoutSocketCount !== this.timeoutSocketCountLastCheck || this.requestCount !== this.requestCountLastCheck;
      if (changed) {
        this.createSocketCountLastCheck = this.createSocketCount;
        this.createSocketErrorCountLastCheck = this.createSocketErrorCount;
        this.closeSocketCountLastCheck = this.closeSocketCount;
        this.errorSocketCountLastCheck = this.errorSocketCount;
        this.timeoutSocketCountLastCheck = this.timeoutSocketCount;
        this.requestCountLastCheck = this.requestCount;
      }
      return changed;
    }
    getCurrentStatus() {
      return {
        createSocketCount: this.createSocketCount,
        createSocketErrorCount: this.createSocketErrorCount,
        closeSocketCount: this.closeSocketCount,
        errorSocketCount: this.errorSocketCount,
        timeoutSocketCount: this.timeoutSocketCount,
        requestCount: this.requestCount,
        freeSockets: inspect(this.freeSockets),
        sockets: inspect(this.sockets),
        requests: inspect(this.requests)
      };
    }
  }
  function getSocketTimeout(socket) {
    return socket.timeout || socket._idleTimeout;
  }
  function installListeners(agent2, socket, options) {
    debug("%s create, timeout %sms", socket[SOCKET_NAME], getSocketTimeout(socket));
    function onFree() {
      if (!socket._httpMessage && socket[SOCKET_REQUEST_COUNT] === 1) return;
      socket[SOCKET_REQUEST_FINISHED_COUNT]++;
      agent2.requestCount++;
      debug(
        "%s(requests: %s, finished: %s) free",
        socket[SOCKET_NAME],
        socket[SOCKET_REQUEST_COUNT],
        socket[SOCKET_REQUEST_FINISHED_COUNT]
      );
      const name = agent2.getName(options);
      if (socket.writable && agent2.requests[name] && agent2.requests[name].length) {
        socket[SOCKET_REQUEST_COUNT]++;
        debug(
          "%s(requests: %s, finished: %s) will be reuse on agent free event",
          socket[SOCKET_NAME],
          socket[SOCKET_REQUEST_COUNT],
          socket[SOCKET_REQUEST_FINISHED_COUNT]
        );
      }
    }
    socket.on("free", onFree);
    function onClose(isError) {
      debug(
        "%s(requests: %s, finished: %s) close, isError: %s",
        socket[SOCKET_NAME],
        socket[SOCKET_REQUEST_COUNT],
        socket[SOCKET_REQUEST_FINISHED_COUNT],
        isError
      );
      agent2.closeSocketCount++;
    }
    socket.on("close", onClose);
    function onTimeout() {
      const listenerCount = socket.listeners("timeout").length;
      const timeout = getSocketTimeout(socket);
      const req = socket._httpMessage;
      const reqTimeoutListenerCount = req && req.listeners("timeout").length || 0;
      debug(
        "%s(requests: %s, finished: %s) timeout after %sms, listeners %s, defaultTimeoutListenerCount %s, hasHttpRequest %s, HttpRequest timeoutListenerCount %s",
        socket[SOCKET_NAME],
        socket[SOCKET_REQUEST_COUNT],
        socket[SOCKET_REQUEST_FINISHED_COUNT],
        timeout,
        listenerCount,
        defaultTimeoutListenerCount,
        !!req,
        reqTimeoutListenerCount
      );
      if (debug.enabled) {
        debug("timeout listeners: %s", socket.listeners("timeout").map((f) => f.name).join(", "));
      }
      agent2.timeoutSocketCount++;
      const name = agent2.getName(options);
      if (agent2.freeSockets[name] && agent2.freeSockets[name].indexOf(socket) !== -1) {
        socket.destroy();
        agent2.removeSocket(socket, options);
        debug("%s is free, destroy quietly", socket[SOCKET_NAME]);
      } else {
        if (reqTimeoutListenerCount === 0) {
          const error = new Error("Socket timeout");
          error.code = "ERR_SOCKET_TIMEOUT";
          error.timeout = timeout;
          socket.destroy(error);
          agent2.removeSocket(socket, options);
          debug("%s destroy with timeout error", socket[SOCKET_NAME]);
        }
      }
    }
    socket.on("timeout", onTimeout);
    function onError(err) {
      const listenerCount = socket.listeners("error").length;
      debug(
        "%s(requests: %s, finished: %s) error: %s, listenerCount: %s",
        socket[SOCKET_NAME],
        socket[SOCKET_REQUEST_COUNT],
        socket[SOCKET_REQUEST_FINISHED_COUNT],
        err,
        listenerCount
      );
      agent2.errorSocketCount++;
      if (listenerCount === 1) {
        debug("%s emit uncaught error event", socket[SOCKET_NAME]);
        socket.removeListener("error", onError);
        socket.emit("error", err);
      }
    }
    socket.on("error", onError);
    function onRemove() {
      debug(
        "%s(requests: %s, finished: %s) agentRemove",
        socket[SOCKET_NAME],
        socket[SOCKET_REQUEST_COUNT],
        socket[SOCKET_REQUEST_FINISHED_COUNT]
      );
      socket.removeListener("close", onClose);
      socket.removeListener("error", onError);
      socket.removeListener("free", onFree);
      socket.removeListener("timeout", onTimeout);
      socket.removeListener("agentRemove", onRemove);
    }
    socket.on("agentRemove", onRemove);
  }
  agent = Agent2;
  function inspect(obj) {
    const res = {};
    for (const key in obj) {
      res[key] = obj[key].length;
    }
    return res;
  }
  return agent;
}
var https_agent;
var hasRequiredHttps_agent;
function requireHttps_agent() {
  if (hasRequiredHttps_agent) return https_agent;
  hasRequiredHttps_agent = 1;
  const OriginalHttpsAgent = https.Agent;
  const HttpAgent = /* @__PURE__ */ requireAgent();
  const {
    INIT_SOCKET,
    CREATE_HTTPS_CONNECTION
  } = /* @__PURE__ */ requireConstants();
  class HttpsAgent extends HttpAgent {
    constructor(options) {
      super(options);
      this.defaultPort = 443;
      this.protocol = "https:";
      this.maxCachedSessions = this.options.maxCachedSessions;
      if (this.maxCachedSessions === void 0) {
        this.maxCachedSessions = 100;
      }
      this._sessionCache = {
        map: {},
        list: []
      };
    }
    createConnection(options, oncreate) {
      const socket = this[CREATE_HTTPS_CONNECTION](options, oncreate);
      this[INIT_SOCKET](socket, options);
      return socket;
    }
  }
  HttpsAgent.prototype[CREATE_HTTPS_CONNECTION] = OriginalHttpsAgent.prototype.createConnection;
  [
    "getName",
    "_getSession",
    "_cacheSession",
    // https://github.com/nodejs/node/pull/4982
    "_evictSession"
  ].forEach(function(method) {
    if (typeof OriginalHttpsAgent.prototype[method] === "function") {
      HttpsAgent.prototype[method] = OriginalHttpsAgent.prototype[method];
    }
  });
  https_agent = HttpsAgent;
  return https_agent;
}
var hasRequiredAgentkeepalive;
function requireAgentkeepalive() {
  if (hasRequiredAgentkeepalive) return agentkeepalive.exports;
  hasRequiredAgentkeepalive = 1;
  agentkeepalive.exports = /* @__PURE__ */ requireAgent();
  agentkeepalive.exports.HttpsAgent = /* @__PURE__ */ requireHttps_agent();
  agentkeepalive.exports.constants = /* @__PURE__ */ requireConstants();
  return agentkeepalive.exports;
}
var agentkeepaliveExports = /* @__PURE__ */ requireAgentkeepalive();
var HttpKeepAliveAgent = /* @__PURE__ */ getDefaultExportFromCjs(agentkeepaliveExports);
var fastStableStringify$1;
var hasRequiredFastStableStringify;
function requireFastStableStringify() {
  if (hasRequiredFastStableStringify) return fastStableStringify$1;
  hasRequiredFastStableStringify = 1;
  var objToString = Object.prototype.toString;
  var objKeys = Object.keys || function(obj) {
    var keys = [];
    for (var name in obj) {
      keys.push(name);
    }
    return keys;
  };
  function stringify(val, isArrayProp) {
    var i, max, str, keys, key, propVal, toStr;
    if (val === true) {
      return "true";
    }
    if (val === false) {
      return "false";
    }
    switch (typeof val) {
      case "object":
        if (val === null) {
          return null;
        } else if (val.toJSON && typeof val.toJSON === "function") {
          return stringify(val.toJSON(), isArrayProp);
        } else {
          toStr = objToString.call(val);
          if (toStr === "[object Array]") {
            str = "[";
            max = val.length - 1;
            for (i = 0; i < max; i++) {
              str += stringify(val[i], true) + ",";
            }
            if (max > -1) {
              str += stringify(val[i], true);
            }
            return str + "]";
          } else if (toStr === "[object Object]") {
            keys = objKeys(val).sort();
            max = keys.length;
            str = "";
            i = 0;
            while (i < max) {
              key = keys[i];
              propVal = stringify(val[key], false);
              if (propVal !== void 0) {
                if (str) {
                  str += ",";
                }
                str += JSON.stringify(key) + ":" + propVal;
              }
              i++;
            }
            return "{" + str + "}";
          } else {
            return JSON.stringify(val);
          }
        }
      case "function":
      case "undefined":
        return isArrayProp ? null : void 0;
      case "string":
        return JSON.stringify(val);
      default:
        return isFinite(val) ? val : null;
    }
  }
  fastStableStringify$1 = function(val) {
    var returnVal = stringify(val, false);
    if (returnVal !== void 0) {
      return "" + returnVal;
    }
  };
  return fastStableStringify$1;
}
var fastStableStringifyExports = /* @__PURE__ */ requireFastStableStringify();
var fastStableStringify = /* @__PURE__ */ getDefaultExportFromCjs(fastStableStringifyExports);
const MINIMUM_SLOT_PER_EPOCH = 32;
function trailingZeros(n) {
  let trailingZeros2 = 0;
  while (n > 1) {
    n /= 2;
    trailingZeros2++;
  }
  return trailingZeros2;
}
function nextPowerOfTwo(n) {
  if (n === 0) return 1;
  n--;
  n |= n >> 1;
  n |= n >> 2;
  n |= n >> 4;
  n |= n >> 8;
  n |= n >> 16;
  n |= n >> 32;
  return n + 1;
}
class EpochSchedule {
  constructor(slotsPerEpoch, leaderScheduleSlotOffset, warmup, firstNormalEpoch, firstNormalSlot) {
    this.slotsPerEpoch = void 0;
    this.leaderScheduleSlotOffset = void 0;
    this.warmup = void 0;
    this.firstNormalEpoch = void 0;
    this.firstNormalSlot = void 0;
    this.slotsPerEpoch = slotsPerEpoch;
    this.leaderScheduleSlotOffset = leaderScheduleSlotOffset;
    this.warmup = warmup;
    this.firstNormalEpoch = firstNormalEpoch;
    this.firstNormalSlot = firstNormalSlot;
  }
  getEpoch(slot) {
    return this.getEpochAndSlotIndex(slot)[0];
  }
  getEpochAndSlotIndex(slot) {
    if (slot < this.firstNormalSlot) {
      const epoch = trailingZeros(nextPowerOfTwo(slot + MINIMUM_SLOT_PER_EPOCH + 1)) - trailingZeros(MINIMUM_SLOT_PER_EPOCH) - 1;
      const epochLen = this.getSlotsInEpoch(epoch);
      const slotIndex = slot - (epochLen - MINIMUM_SLOT_PER_EPOCH);
      return [epoch, slotIndex];
    } else {
      const normalSlotIndex = slot - this.firstNormalSlot;
      const normalEpochIndex = Math.floor(normalSlotIndex / this.slotsPerEpoch);
      const epoch = this.firstNormalEpoch + normalEpochIndex;
      const slotIndex = normalSlotIndex % this.slotsPerEpoch;
      return [epoch, slotIndex];
    }
  }
  getFirstSlotInEpoch(epoch) {
    if (epoch <= this.firstNormalEpoch) {
      return (Math.pow(2, epoch) - 1) * MINIMUM_SLOT_PER_EPOCH;
    } else {
      return (epoch - this.firstNormalEpoch) * this.slotsPerEpoch + this.firstNormalSlot;
    }
  }
  getLastSlotInEpoch(epoch) {
    return this.getFirstSlotInEpoch(epoch) + this.getSlotsInEpoch(epoch) - 1;
  }
  getSlotsInEpoch(epoch) {
    if (epoch < this.firstNormalEpoch) {
      return Math.pow(2, epoch + trailingZeros(MINIMUM_SLOT_PER_EPOCH));
    } else {
      return this.slotsPerEpoch;
    }
  }
}
var fetchImpl = typeof globalThis.fetch === "function" ? (
  // The Fetch API is supported experimentally in Node 17.5+ and natively in Node 18+.
  globalThis.fetch
) : (
  // Otherwise use the polyfill.
  async function(input, init) {
    const processedInput = typeof input === "string" && input.slice(0, 2) === "//" ? "https:" + input : input;
    return await fetch(processedInput, init);
  }
);
class RpcWebSocketClient extends CommonClient {
  constructor(address, options, generate_request_id) {
    const webSocketFactory = (url) => {
      const rpc = WebSocket(url, {
        autoconnect: true,
        max_reconnects: 5,
        reconnect: true,
        reconnect_interval: 1e3,
        ...options
      });
      if ("socket" in rpc) {
        this.underlyingSocket = rpc.socket;
      } else {
        this.underlyingSocket = rpc;
      }
      return rpc;
    };
    super(webSocketFactory, address, options, generate_request_id);
    this.underlyingSocket = void 0;
  }
  call(...args) {
    const readyState = this.underlyingSocket?.readyState;
    if (readyState === 1) {
      return super.call(...args);
    }
    return Promise.reject(new Error("Tried to call a JSON-RPC method `" + args[0] + "` but the socket was not `CONNECTING` or `OPEN` (`readyState` was " + readyState + ")"));
  }
  notify(...args) {
    const readyState = this.underlyingSocket?.readyState;
    if (readyState === 1) {
      return super.notify(...args);
    }
    return Promise.reject(new Error("Tried to send a JSON-RPC notification `" + args[0] + "` but the socket was not `CONNECTING` or `OPEN` (`readyState` was " + readyState + ")"));
  }
}
function decodeData(type2, data) {
  let decoded;
  try {
    decoded = type2.layout.decode(data);
  } catch (err) {
    throw new Error("invalid instruction; " + err);
  }
  if (decoded.typeIndex !== type2.index) {
    throw new Error(`invalid account data; account type mismatch ${decoded.typeIndex} != ${type2.index}`);
  }
  return decoded;
}
const LOOKUP_TABLE_META_SIZE = 56;
class AddressLookupTableAccount {
  constructor(args) {
    this.key = void 0;
    this.state = void 0;
    this.key = args.key;
    this.state = args.state;
  }
  isActive() {
    const U64_MAX = BigInt("0xffffffffffffffff");
    return this.state.deactivationSlot === U64_MAX;
  }
  static deserialize(accountData) {
    const meta = decodeData(LookupTableMetaLayout, accountData);
    const serializedAddressesLen = accountData.length - LOOKUP_TABLE_META_SIZE;
    assert(serializedAddressesLen >= 0, "lookup table is invalid");
    assert(serializedAddressesLen % 32 === 0, "lookup table is invalid");
    const numSerializedAddresses = serializedAddressesLen / 32;
    const {
      addresses
    } = LayoutExports.struct([LayoutExports.seq(publicKey(), numSerializedAddresses, "addresses")]).decode(accountData.slice(LOOKUP_TABLE_META_SIZE));
    return {
      deactivationSlot: meta.deactivationSlot,
      lastExtendedSlot: meta.lastExtendedSlot,
      lastExtendedSlotStartIndex: meta.lastExtendedStartIndex,
      authority: meta.authority.length !== 0 ? new PublicKey(meta.authority[0]) : void 0,
      addresses: addresses.map((address) => new PublicKey(address))
    };
  }
}
const LookupTableMetaLayout = {
  index: 1,
  layout: LayoutExports.struct([
    LayoutExports.u32("typeIndex"),
    u64("deactivationSlot"),
    LayoutExports.nu64("lastExtendedSlot"),
    LayoutExports.u8("lastExtendedStartIndex"),
    LayoutExports.u8(),
    // option
    LayoutExports.seq(publicKey(), LayoutExports.offset(LayoutExports.u8(), -1), "authority")
  ])
};
const URL_RE = /^[^:]+:\/\/([^:[]+|\[[^\]]+\])(:\d+)?(.*)/i;
function makeWebsocketUrl(endpoint) {
  const matches = endpoint.match(URL_RE);
  if (matches == null) {
    throw TypeError(`Failed to validate endpoint URL \`${endpoint}\``);
  }
  const [
    _,
    // eslint-disable-line @typescript-eslint/no-unused-vars
    hostish,
    portWithColon,
    rest
  ] = matches;
  const protocol = endpoint.startsWith("https:") ? "wss:" : "ws:";
  const startPort = portWithColon == null ? null : parseInt(portWithColon.slice(1), 10);
  const websocketPort = (
    // Only shift the port by +1 as a convention for ws(s) only if given endpoint
    // is explicitly specifying the endpoint port (HTTP-based RPC), assuming
    // we're directly trying to connect to agave-validator's ws listening port.
    // When the endpoint omits the port, we're connecting to the protocol
    // default ports: http(80) or https(443) and it's assumed we're behind a reverse
    // proxy which manages WebSocket upgrade and backend port redirection.
    startPort == null ? "" : `:${startPort + 1}`
  );
  return `${protocol}//${hostish}${websocketPort}${rest}`;
}
const PublicKeyFromString = coerce(instance(PublicKey), string(), (value) => new PublicKey(value));
const RawAccountDataResult = tuple([string(), literal("base64")]);
const BufferFromRawAccountData = coerce(instance(Buffer), RawAccountDataResult, (value) => Buffer.from(value[0], "base64"));
const BLOCKHASH_CACHE_TIMEOUT_MS = 30 * 1e3;
function assertEndpointUrl(putativeUrl) {
  if (/^https?:/.test(putativeUrl) === false) {
    throw new TypeError("Endpoint URL must start with `http:` or `https:`.");
  }
  return putativeUrl;
}
function extractCommitmentFromConfig(commitmentOrConfig) {
  let commitment;
  let config;
  if (typeof commitmentOrConfig === "string") {
    commitment = commitmentOrConfig;
  } else if (commitmentOrConfig) {
    const {
      commitment: specifiedCommitment,
      ...specifiedConfig
    } = commitmentOrConfig;
    commitment = specifiedCommitment;
    config = specifiedConfig;
  }
  return {
    commitment,
    config
  };
}
function applyDefaultMemcmpEncodingToFilters(filters) {
  return filters.map((filter) => "memcmp" in filter ? {
    ...filter,
    memcmp: {
      ...filter.memcmp,
      encoding: filter.memcmp.encoding ?? "base58"
    }
  } : filter);
}
function createRpcResult(result) {
  return union([type({
    jsonrpc: literal("2.0"),
    id: string(),
    result
  }), type({
    jsonrpc: literal("2.0"),
    id: string(),
    error: type({
      code: unknown(),
      message: string(),
      data: optional(any())
    })
  })]);
}
const UnknownRpcResult = createRpcResult(unknown());
function jsonRpcResult(schema) {
  return coerce(createRpcResult(schema), UnknownRpcResult, (value) => {
    if ("error" in value) {
      return value;
    } else {
      return {
        ...value,
        result: create(value.result, schema)
      };
    }
  });
}
function jsonRpcResultAndContext(value) {
  return jsonRpcResult(type({
    context: type({
      slot: number()
    }),
    value
  }));
}
function notificationResultAndContext(value) {
  return type({
    context: type({
      slot: number()
    }),
    value
  });
}
function versionedMessageFromResponse(version, response) {
  if (version === 0) {
    return new MessageV0({
      header: response.header,
      staticAccountKeys: response.accountKeys.map((accountKey) => new PublicKey(accountKey)),
      recentBlockhash: response.recentBlockhash,
      compiledInstructions: response.instructions.map((ix) => ({
        programIdIndex: ix.programIdIndex,
        accountKeyIndexes: ix.accounts,
        data: bs58.decode(ix.data)
      })),
      addressTableLookups: response.addressTableLookups
    });
  } else {
    return new Message(response);
  }
}
const GetInflationGovernorResult = type({
  foundation: number(),
  foundationTerm: number(),
  initial: number(),
  taper: number(),
  terminal: number()
});
const GetInflationRewardResult = jsonRpcResult(array(nullable(type({
  epoch: number(),
  effectiveSlot: number(),
  amount: number(),
  postBalance: number(),
  commission: optional(nullable(number()))
}))));
const GetRecentPrioritizationFeesResult = array(type({
  slot: number(),
  prioritizationFee: number()
}));
const GetInflationRateResult = type({
  total: number(),
  validator: number(),
  foundation: number(),
  epoch: number()
});
const GetEpochInfoResult = type({
  epoch: number(),
  slotIndex: number(),
  slotsInEpoch: number(),
  absoluteSlot: number(),
  blockHeight: optional(number()),
  transactionCount: optional(number())
});
const GetEpochScheduleResult = type({
  slotsPerEpoch: number(),
  leaderScheduleSlotOffset: number(),
  warmup: boolean(),
  firstNormalEpoch: number(),
  firstNormalSlot: number()
});
const GetLeaderScheduleResult = record(string(), array(number()));
const TransactionErrorResult = nullable(union([type({}), string()]));
const SignatureStatusResult = type({
  err: TransactionErrorResult
});
const SignatureReceivedResult = literal("receivedSignature");
const VersionResult = type({
  "solana-core": string(),
  "feature-set": optional(number())
});
const ParsedInstructionStruct = type({
  program: string(),
  programId: PublicKeyFromString,
  parsed: unknown()
});
const PartiallyDecodedInstructionStruct = type({
  programId: PublicKeyFromString,
  accounts: array(PublicKeyFromString),
  data: string()
});
const SimulatedTransactionResponseStruct = jsonRpcResultAndContext(type({
  err: nullable(union([type({}), string()])),
  logs: nullable(array(string())),
  accounts: optional(nullable(array(nullable(type({
    executable: boolean(),
    owner: string(),
    lamports: number(),
    data: array(string()),
    rentEpoch: optional(number())
  }))))),
  unitsConsumed: optional(number()),
  returnData: optional(nullable(type({
    programId: string(),
    data: tuple([string(), literal("base64")])
  }))),
  innerInstructions: optional(nullable(array(type({
    index: number(),
    instructions: array(union([ParsedInstructionStruct, PartiallyDecodedInstructionStruct]))
  }))))
}));
const BlockProductionResponseStruct = jsonRpcResultAndContext(type({
  byIdentity: record(string(), array(number())),
  range: type({
    firstSlot: number(),
    lastSlot: number()
  })
}));
function createRpcClient(url, httpHeaders, customFetch, fetchMiddleware, disableRetryOnRateLimit, httpAgent) {
  const fetch2 = customFetch ? customFetch : fetchImpl;
  let agent2;
  {
    if (httpAgent == null) {
      {
        const agentOptions = {
          // One second fewer than the Solana RPC's keepalive timeout.
          // Read more: https://github.com/solana-labs/solana/issues/27859#issuecomment-1340097889
          freeSocketTimeout: 19e3,
          keepAlive: true,
          maxSockets: 25
        };
        if (url.startsWith("https:")) {
          agent2 = new agentkeepaliveExports.HttpsAgent(agentOptions);
        } else {
          agent2 = new HttpKeepAliveAgent(agentOptions);
        }
      }
    } else {
      if (httpAgent !== false) {
        const isHttps = url.startsWith("https:");
        if (isHttps && !(httpAgent instanceof Agent)) {
          throw new Error("The endpoint `" + url + "` can only be paired with an `https.Agent`. You have, instead, supplied an `http.Agent` through `httpAgent`.");
        } else if (!isHttps && httpAgent instanceof Agent) {
          throw new Error("The endpoint `" + url + "` can only be paired with an `http.Agent`. You have, instead, supplied an `https.Agent` through `httpAgent`.");
        }
        agent2 = httpAgent;
      }
    }
  }
  let fetchWithMiddleware;
  if (fetchMiddleware) {
    fetchWithMiddleware = async (info, init) => {
      const modifiedFetchArgs = await new Promise((resolve, reject) => {
        try {
          fetchMiddleware(info, init, (modifiedInfo, modifiedInit) => resolve([modifiedInfo, modifiedInit]));
        } catch (error) {
          reject(error);
        }
      });
      return await fetch2(...modifiedFetchArgs);
    };
  }
  const clientBrowser = new RpcClient(async (request, callback) => {
    const options = {
      method: "POST",
      body: request,
      agent: agent2,
      headers: Object.assign({
        "Content-Type": "application/json"
      }, httpHeaders || {}, COMMON_HTTP_HEADERS)
    };
    try {
      let too_many_requests_retries = 5;
      let res;
      let waitTime = 500;
      for (; ; ) {
        if (fetchWithMiddleware) {
          res = await fetchWithMiddleware(url, options);
        } else {
          res = await fetch2(url, options);
        }
        if (res.status !== 429) {
          break;
        }
        if (disableRetryOnRateLimit === true) {
          break;
        }
        too_many_requests_retries -= 1;
        if (too_many_requests_retries === 0) {
          break;
        }
        console.error(`Server responded with ${res.status} ${res.statusText}.  Retrying after ${waitTime}ms delay...`);
        await sleep(waitTime);
        waitTime *= 2;
      }
      const text = await res.text();
      if (res.ok) {
        callback(null, text);
      } else {
        callback(new Error(`${res.status} ${res.statusText}: ${text}`));
      }
    } catch (err) {
      if (err instanceof Error) callback(err);
    }
  }, {});
  return clientBrowser;
}
function createRpcRequest(client) {
  return (method, args) => {
    return new Promise((resolve, reject) => {
      client.request(method, args, (err, response) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(response);
      });
    });
  };
}
function createRpcBatchRequest(client) {
  return (requests) => {
    return new Promise((resolve, reject) => {
      if (requests.length === 0) resolve([]);
      const batch = requests.map((params) => {
        return client.request(params.methodName, params.args);
      });
      client.request(batch, (err, response) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(response);
      });
    });
  };
}
const GetInflationGovernorRpcResult = jsonRpcResult(GetInflationGovernorResult);
const GetInflationRateRpcResult = jsonRpcResult(GetInflationRateResult);
const GetRecentPrioritizationFeesRpcResult = jsonRpcResult(GetRecentPrioritizationFeesResult);
const GetEpochInfoRpcResult = jsonRpcResult(GetEpochInfoResult);
const GetEpochScheduleRpcResult = jsonRpcResult(GetEpochScheduleResult);
const GetLeaderScheduleRpcResult = jsonRpcResult(GetLeaderScheduleResult);
const SlotRpcResult = jsonRpcResult(number());
const GetSupplyRpcResult = jsonRpcResultAndContext(type({
  total: number(),
  circulating: number(),
  nonCirculating: number(),
  nonCirculatingAccounts: array(PublicKeyFromString)
}));
const TokenAmountResult = type({
  amount: string(),
  uiAmount: nullable(number()),
  decimals: number(),
  uiAmountString: optional(string())
});
const GetTokenLargestAccountsResult = jsonRpcResultAndContext(array(type({
  address: PublicKeyFromString,
  amount: string(),
  uiAmount: nullable(number()),
  decimals: number(),
  uiAmountString: optional(string())
})));
const GetTokenAccountsByOwner = jsonRpcResultAndContext(array(type({
  pubkey: PublicKeyFromString,
  account: type({
    executable: boolean(),
    owner: PublicKeyFromString,
    lamports: number(),
    data: BufferFromRawAccountData,
    rentEpoch: number()
  })
})));
const ParsedAccountDataResult = type({
  program: string(),
  parsed: unknown(),
  space: number()
});
const GetParsedTokenAccountsByOwner = jsonRpcResultAndContext(array(type({
  pubkey: PublicKeyFromString,
  account: type({
    executable: boolean(),
    owner: PublicKeyFromString,
    lamports: number(),
    data: ParsedAccountDataResult,
    rentEpoch: number()
  })
})));
const GetLargestAccountsRpcResult = jsonRpcResultAndContext(array(type({
  lamports: number(),
  address: PublicKeyFromString
})));
const AccountInfoResult = type({
  executable: boolean(),
  owner: PublicKeyFromString,
  lamports: number(),
  data: BufferFromRawAccountData,
  rentEpoch: number()
});
const KeyedAccountInfoResult = type({
  pubkey: PublicKeyFromString,
  account: AccountInfoResult
});
const ParsedOrRawAccountData = coerce(union([instance(Buffer), ParsedAccountDataResult]), union([RawAccountDataResult, ParsedAccountDataResult]), (value) => {
  if (Array.isArray(value)) {
    return create(value, BufferFromRawAccountData);
  } else {
    return value;
  }
});
const ParsedAccountInfoResult = type({
  executable: boolean(),
  owner: PublicKeyFromString,
  lamports: number(),
  data: ParsedOrRawAccountData,
  rentEpoch: number()
});
const KeyedParsedAccountInfoResult = type({
  pubkey: PublicKeyFromString,
  account: ParsedAccountInfoResult
});
const StakeActivationResult = type({
  state: union([literal("active"), literal("inactive"), literal("activating"), literal("deactivating")]),
  active: number(),
  inactive: number()
});
const GetConfirmedSignaturesForAddress2RpcResult = jsonRpcResult(array(type({
  signature: string(),
  slot: number(),
  err: TransactionErrorResult,
  memo: nullable(string()),
  blockTime: optional(nullable(number()))
})));
const GetSignaturesForAddressRpcResult = jsonRpcResult(array(type({
  signature: string(),
  slot: number(),
  err: TransactionErrorResult,
  memo: nullable(string()),
  blockTime: optional(nullable(number()))
})));
const AccountNotificationResult = type({
  subscription: number(),
  result: notificationResultAndContext(AccountInfoResult)
});
const ProgramAccountInfoResult = type({
  pubkey: PublicKeyFromString,
  account: AccountInfoResult
});
const ProgramAccountNotificationResult = type({
  subscription: number(),
  result: notificationResultAndContext(ProgramAccountInfoResult)
});
const SlotInfoResult = type({
  parent: number(),
  slot: number(),
  root: number()
});
const SlotNotificationResult = type({
  subscription: number(),
  result: SlotInfoResult
});
const SlotUpdateResult = union([type({
  type: union([literal("firstShredReceived"), literal("completed"), literal("optimisticConfirmation"), literal("root")]),
  slot: number(),
  timestamp: number()
}), type({
  type: literal("createdBank"),
  parent: number(),
  slot: number(),
  timestamp: number()
}), type({
  type: literal("frozen"),
  slot: number(),
  timestamp: number(),
  stats: type({
    numTransactionEntries: number(),
    numSuccessfulTransactions: number(),
    numFailedTransactions: number(),
    maxTransactionsPerEntry: number()
  })
}), type({
  type: literal("dead"),
  slot: number(),
  timestamp: number(),
  err: string()
})]);
const SlotUpdateNotificationResult = type({
  subscription: number(),
  result: SlotUpdateResult
});
const SignatureNotificationResult = type({
  subscription: number(),
  result: notificationResultAndContext(union([SignatureStatusResult, SignatureReceivedResult]))
});
const RootNotificationResult = type({
  subscription: number(),
  result: number()
});
const ContactInfoResult = type({
  pubkey: string(),
  gossip: nullable(string()),
  tpu: nullable(string()),
  rpc: nullable(string()),
  version: nullable(string())
});
const VoteAccountInfoResult = type({
  votePubkey: string(),
  nodePubkey: string(),
  activatedStake: number(),
  epochVoteAccount: boolean(),
  epochCredits: array(tuple([number(), number(), number()])),
  commission: number(),
  lastVote: number(),
  rootSlot: nullable(number())
});
const GetVoteAccounts = jsonRpcResult(type({
  current: array(VoteAccountInfoResult),
  delinquent: array(VoteAccountInfoResult)
}));
const ConfirmationStatus = union([literal("processed"), literal("confirmed"), literal("finalized")]);
const SignatureStatusResponse = type({
  slot: number(),
  confirmations: nullable(number()),
  err: TransactionErrorResult,
  confirmationStatus: optional(ConfirmationStatus)
});
const GetSignatureStatusesRpcResult = jsonRpcResultAndContext(array(nullable(SignatureStatusResponse)));
const GetMinimumBalanceForRentExemptionRpcResult = jsonRpcResult(number());
const AddressTableLookupStruct = type({
  accountKey: PublicKeyFromString,
  writableIndexes: array(number()),
  readonlyIndexes: array(number())
});
const ConfirmedTransactionResult = type({
  signatures: array(string()),
  message: type({
    accountKeys: array(string()),
    header: type({
      numRequiredSignatures: number(),
      numReadonlySignedAccounts: number(),
      numReadonlyUnsignedAccounts: number()
    }),
    instructions: array(type({
      accounts: array(number()),
      data: string(),
      programIdIndex: number()
    })),
    recentBlockhash: string(),
    addressTableLookups: optional(array(AddressTableLookupStruct))
  })
});
const AnnotatedAccountKey = type({
  pubkey: PublicKeyFromString,
  signer: boolean(),
  writable: boolean(),
  source: optional(union([literal("transaction"), literal("lookupTable")]))
});
const ConfirmedTransactionAccountsModeResult = type({
  accountKeys: array(AnnotatedAccountKey),
  signatures: array(string())
});
const ParsedInstructionResult = type({
  parsed: unknown(),
  program: string(),
  programId: PublicKeyFromString
});
const RawInstructionResult = type({
  accounts: array(PublicKeyFromString),
  data: string(),
  programId: PublicKeyFromString
});
const InstructionResult = union([RawInstructionResult, ParsedInstructionResult]);
const UnknownInstructionResult = union([type({
  parsed: unknown(),
  program: string(),
  programId: string()
}), type({
  accounts: array(string()),
  data: string(),
  programId: string()
})]);
const ParsedOrRawInstruction = coerce(InstructionResult, UnknownInstructionResult, (value) => {
  if ("accounts" in value) {
    return create(value, RawInstructionResult);
  } else {
    return create(value, ParsedInstructionResult);
  }
});
const ParsedConfirmedTransactionResult = type({
  signatures: array(string()),
  message: type({
    accountKeys: array(AnnotatedAccountKey),
    instructions: array(ParsedOrRawInstruction),
    recentBlockhash: string(),
    addressTableLookups: optional(nullable(array(AddressTableLookupStruct)))
  })
});
const TokenBalanceResult = type({
  accountIndex: number(),
  mint: string(),
  owner: optional(string()),
  programId: optional(string()),
  uiTokenAmount: TokenAmountResult
});
const LoadedAddressesResult = type({
  writable: array(PublicKeyFromString),
  readonly: array(PublicKeyFromString)
});
const ConfirmedTransactionMetaResult = type({
  err: TransactionErrorResult,
  fee: number(),
  innerInstructions: optional(nullable(array(type({
    index: number(),
    instructions: array(type({
      accounts: array(number()),
      data: string(),
      programIdIndex: number()
    }))
  })))),
  preBalances: array(number()),
  postBalances: array(number()),
  logMessages: optional(nullable(array(string()))),
  preTokenBalances: optional(nullable(array(TokenBalanceResult))),
  postTokenBalances: optional(nullable(array(TokenBalanceResult))),
  loadedAddresses: optional(LoadedAddressesResult),
  computeUnitsConsumed: optional(number()),
  costUnits: optional(number())
});
const ParsedConfirmedTransactionMetaResult = type({
  err: TransactionErrorResult,
  fee: number(),
  innerInstructions: optional(nullable(array(type({
    index: number(),
    instructions: array(ParsedOrRawInstruction)
  })))),
  preBalances: array(number()),
  postBalances: array(number()),
  logMessages: optional(nullable(array(string()))),
  preTokenBalances: optional(nullable(array(TokenBalanceResult))),
  postTokenBalances: optional(nullable(array(TokenBalanceResult))),
  loadedAddresses: optional(LoadedAddressesResult),
  computeUnitsConsumed: optional(number()),
  costUnits: optional(number())
});
const TransactionVersionStruct = union([literal(0), literal("legacy")]);
const RewardsResult = type({
  pubkey: string(),
  lamports: number(),
  postBalance: nullable(number()),
  rewardType: nullable(string()),
  commission: optional(nullable(number()))
});
const GetBlockRpcResult = jsonRpcResult(nullable(type({
  blockhash: string(),
  previousBlockhash: string(),
  parentSlot: number(),
  transactions: array(type({
    transaction: ConfirmedTransactionResult,
    meta: nullable(ConfirmedTransactionMetaResult),
    version: optional(TransactionVersionStruct)
  })),
  rewards: optional(array(RewardsResult)),
  blockTime: nullable(number()),
  blockHeight: nullable(number())
})));
const GetNoneModeBlockRpcResult = jsonRpcResult(nullable(type({
  blockhash: string(),
  previousBlockhash: string(),
  parentSlot: number(),
  rewards: optional(array(RewardsResult)),
  blockTime: nullable(number()),
  blockHeight: nullable(number())
})));
const GetAccountsModeBlockRpcResult = jsonRpcResult(nullable(type({
  blockhash: string(),
  previousBlockhash: string(),
  parentSlot: number(),
  transactions: array(type({
    transaction: ConfirmedTransactionAccountsModeResult,
    meta: nullable(ConfirmedTransactionMetaResult),
    version: optional(TransactionVersionStruct)
  })),
  rewards: optional(array(RewardsResult)),
  blockTime: nullable(number()),
  blockHeight: nullable(number())
})));
const GetParsedBlockRpcResult = jsonRpcResult(nullable(type({
  blockhash: string(),
  previousBlockhash: string(),
  parentSlot: number(),
  transactions: array(type({
    transaction: ParsedConfirmedTransactionResult,
    meta: nullable(ParsedConfirmedTransactionMetaResult),
    version: optional(TransactionVersionStruct)
  })),
  rewards: optional(array(RewardsResult)),
  blockTime: nullable(number()),
  blockHeight: nullable(number())
})));
const GetParsedAccountsModeBlockRpcResult = jsonRpcResult(nullable(type({
  blockhash: string(),
  previousBlockhash: string(),
  parentSlot: number(),
  transactions: array(type({
    transaction: ConfirmedTransactionAccountsModeResult,
    meta: nullable(ParsedConfirmedTransactionMetaResult),
    version: optional(TransactionVersionStruct)
  })),
  rewards: optional(array(RewardsResult)),
  blockTime: nullable(number()),
  blockHeight: nullable(number())
})));
const GetParsedNoneModeBlockRpcResult = jsonRpcResult(nullable(type({
  blockhash: string(),
  previousBlockhash: string(),
  parentSlot: number(),
  rewards: optional(array(RewardsResult)),
  blockTime: nullable(number()),
  blockHeight: nullable(number())
})));
const GetConfirmedBlockRpcResult = jsonRpcResult(nullable(type({
  blockhash: string(),
  previousBlockhash: string(),
  parentSlot: number(),
  transactions: array(type({
    transaction: ConfirmedTransactionResult,
    meta: nullable(ConfirmedTransactionMetaResult)
  })),
  rewards: optional(array(RewardsResult)),
  blockTime: nullable(number())
})));
const GetBlockSignaturesRpcResult = jsonRpcResult(nullable(type({
  blockhash: string(),
  previousBlockhash: string(),
  parentSlot: number(),
  signatures: array(string()),
  blockTime: nullable(number())
})));
const GetTransactionRpcResult = jsonRpcResult(nullable(type({
  slot: number(),
  meta: nullable(ConfirmedTransactionMetaResult),
  blockTime: optional(nullable(number())),
  transaction: ConfirmedTransactionResult,
  version: optional(TransactionVersionStruct)
})));
const GetParsedTransactionRpcResult = jsonRpcResult(nullable(type({
  slot: number(),
  transaction: ParsedConfirmedTransactionResult,
  meta: nullable(ParsedConfirmedTransactionMetaResult),
  blockTime: optional(nullable(number())),
  version: optional(TransactionVersionStruct)
})));
const GetLatestBlockhashRpcResult = jsonRpcResultAndContext(type({
  blockhash: string(),
  lastValidBlockHeight: number()
}));
const IsBlockhashValidRpcResult = jsonRpcResultAndContext(boolean());
const PerfSampleResult = type({
  slot: number(),
  numTransactions: number(),
  numSlots: number(),
  samplePeriodSecs: number()
});
const GetRecentPerformanceSamplesRpcResult = jsonRpcResult(array(PerfSampleResult));
const GetFeeCalculatorRpcResult = jsonRpcResultAndContext(nullable(type({
  feeCalculator: type({
    lamportsPerSignature: number()
  })
})));
const RequestAirdropRpcResult = jsonRpcResult(string());
const SendTransactionRpcResult = jsonRpcResult(string());
const LogsResult = type({
  err: TransactionErrorResult,
  logs: array(string()),
  signature: string()
});
const LogsNotificationResult = type({
  result: notificationResultAndContext(LogsResult),
  subscription: number()
});
const COMMON_HTTP_HEADERS = {
  "solana-client": `js/${"1.0.0-maintenance"}`
};
class Connection {
  /**
   * Establish a JSON RPC connection
   *
   * @param endpoint URL to the fullnode JSON RPC endpoint
   * @param commitmentOrConfig optional default commitment level or optional ConnectionConfig configuration object
   */
  constructor(endpoint, _commitmentOrConfig) {
    this._commitment = void 0;
    this._confirmTransactionInitialTimeout = void 0;
    this._rpcEndpoint = void 0;
    this._rpcWsEndpoint = void 0;
    this._rpcClient = void 0;
    this._rpcRequest = void 0;
    this._rpcBatchRequest = void 0;
    this._rpcWebSocket = void 0;
    this._rpcWebSocketConnected = false;
    this._rpcWebSocketHeartbeat = null;
    this._rpcWebSocketIdleTimeout = null;
    this._rpcWebSocketGeneration = 0;
    this._disableBlockhashCaching = false;
    this._pollingBlockhash = false;
    this._blockhashInfo = {
      latestBlockhash: null,
      lastFetch: 0,
      transactionSignatures: [],
      simulatedSignatures: []
    };
    this._nextClientSubscriptionId = 0;
    this._subscriptionDisposeFunctionsByClientSubscriptionId = {};
    this._subscriptionHashByClientSubscriptionId = {};
    this._subscriptionStateChangeCallbacksByHash = {};
    this._subscriptionCallbacksByServerSubscriptionId = {};
    this._subscriptionsByHash = {};
    this._subscriptionsAutoDisposedByRpc = /* @__PURE__ */ new Set();
    this.getBlockHeight = /* @__PURE__ */ (() => {
      const requestPromises = {};
      return async (commitmentOrConfig) => {
        const {
          commitment,
          config
        } = extractCommitmentFromConfig(commitmentOrConfig);
        const args = this._buildArgs([], commitment, void 0, config);
        const requestHash = fastStableStringify(args);
        requestPromises[requestHash] = requestPromises[requestHash] ?? (async () => {
          try {
            const unsafeRes = await this._rpcRequest("getBlockHeight", args);
            const res = create(unsafeRes, jsonRpcResult(number()));
            if ("error" in res) {
              throw new SolanaJSONRPCError(res.error, "failed to get block height information");
            }
            return res.result;
          } finally {
            delete requestPromises[requestHash];
          }
        })();
        return await requestPromises[requestHash];
      };
    })();
    let wsEndpoint;
    let httpHeaders;
    let fetch2;
    let fetchMiddleware;
    let disableRetryOnRateLimit;
    let httpAgent;
    if (_commitmentOrConfig && typeof _commitmentOrConfig === "string") {
      this._commitment = _commitmentOrConfig;
    } else if (_commitmentOrConfig) {
      this._commitment = _commitmentOrConfig.commitment;
      this._confirmTransactionInitialTimeout = _commitmentOrConfig.confirmTransactionInitialTimeout;
      wsEndpoint = _commitmentOrConfig.wsEndpoint;
      httpHeaders = _commitmentOrConfig.httpHeaders;
      fetch2 = _commitmentOrConfig.fetch;
      fetchMiddleware = _commitmentOrConfig.fetchMiddleware;
      disableRetryOnRateLimit = _commitmentOrConfig.disableRetryOnRateLimit;
      httpAgent = _commitmentOrConfig.httpAgent;
    }
    this._rpcEndpoint = assertEndpointUrl(endpoint);
    this._rpcWsEndpoint = wsEndpoint || makeWebsocketUrl(endpoint);
    this._rpcClient = createRpcClient(endpoint, httpHeaders, fetch2, fetchMiddleware, disableRetryOnRateLimit, httpAgent);
    this._rpcRequest = createRpcRequest(this._rpcClient);
    this._rpcBatchRequest = createRpcBatchRequest(this._rpcClient);
    this._rpcWebSocket = new RpcWebSocketClient(this._rpcWsEndpoint, {
      autoconnect: false,
      max_reconnects: Infinity
    });
    this._rpcWebSocket.on("open", this._wsOnOpen.bind(this));
    this._rpcWebSocket.on("error", this._wsOnError.bind(this));
    this._rpcWebSocket.on("close", this._wsOnClose.bind(this));
    this._rpcWebSocket.on("accountNotification", this._wsOnAccountNotification.bind(this));
    this._rpcWebSocket.on("programNotification", this._wsOnProgramAccountNotification.bind(this));
    this._rpcWebSocket.on("slotNotification", this._wsOnSlotNotification.bind(this));
    this._rpcWebSocket.on("slotsUpdatesNotification", this._wsOnSlotUpdatesNotification.bind(this));
    this._rpcWebSocket.on("signatureNotification", this._wsOnSignatureNotification.bind(this));
    this._rpcWebSocket.on("rootNotification", this._wsOnRootNotification.bind(this));
    this._rpcWebSocket.on("logsNotification", this._wsOnLogsNotification.bind(this));
  }
  /**
   * The default commitment used for requests
   */
  get commitment() {
    return this._commitment;
  }
  /**
   * The RPC endpoint
   */
  get rpcEndpoint() {
    return this._rpcEndpoint;
  }
  /**
   * Fetch the balance for the specified public key, return with context
   */
  async getBalanceAndContext(publicKey2, commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([publicKey2.toBase58()], commitment, void 0, config);
    const unsafeRes = await this._rpcRequest("getBalance", args);
    const res = create(unsafeRes, jsonRpcResultAndContext(number()));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get balance for ${publicKey2.toBase58()}`);
    }
    return res.result;
  }
  /**
   * Fetch the balance for the specified public key
   */
  async getBalance(publicKey2, commitmentOrConfig) {
    return await this.getBalanceAndContext(publicKey2, commitmentOrConfig).then((x) => x.value).catch((e) => {
      throw new Error("failed to get balance of account " + publicKey2.toBase58() + ": " + e);
    });
  }
  /**
   * Fetch the estimated production time of a block
   */
  async getBlockTime(slot) {
    const unsafeRes = await this._rpcRequest("getBlockTime", [slot]);
    const res = create(unsafeRes, jsonRpcResult(nullable(number())));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get block time for slot ${slot}`);
    }
    return res.result;
  }
  /**
   * Fetch the lowest slot that the node has information about in its ledger.
   * This value may increase over time if the node is configured to purge older ledger data
   */
  async getMinimumLedgerSlot() {
    const unsafeRes = await this._rpcRequest("minimumLedgerSlot", []);
    const res = create(unsafeRes, jsonRpcResult(number()));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get minimum ledger slot");
    }
    return res.result;
  }
  /**
   * Fetch the slot of the lowest confirmed block that has not been purged from the ledger
   */
  async getFirstAvailableBlock() {
    const unsafeRes = await this._rpcRequest("getFirstAvailableBlock", []);
    const res = create(unsafeRes, SlotRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get first available block");
    }
    return res.result;
  }
  /**
   * Fetch information about the current supply
   */
  async getSupply(config) {
    let configArg = {};
    if (typeof config === "string") {
      configArg = {
        commitment: config
      };
    } else if (config) {
      configArg = {
        ...config,
        commitment: config && config.commitment || this.commitment
      };
    } else {
      configArg = {
        commitment: this.commitment
      };
    }
    const unsafeRes = await this._rpcRequest("getSupply", [configArg]);
    const res = create(unsafeRes, GetSupplyRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get supply");
    }
    return res.result;
  }
  /**
   * Fetch the current supply of a token mint
   */
  async getTokenSupply(tokenMintAddress, commitment) {
    const args = this._buildArgs([tokenMintAddress.toBase58()], commitment);
    const unsafeRes = await this._rpcRequest("getTokenSupply", args);
    const res = create(unsafeRes, jsonRpcResultAndContext(TokenAmountResult));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get token supply");
    }
    return res.result;
  }
  /**
   * Fetch the current balance of a token account
   */
  async getTokenAccountBalance(tokenAddress, commitment) {
    const args = this._buildArgs([tokenAddress.toBase58()], commitment);
    const unsafeRes = await this._rpcRequest("getTokenAccountBalance", args);
    const res = create(unsafeRes, jsonRpcResultAndContext(TokenAmountResult));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get token account balance");
    }
    return res.result;
  }
  /**
   * Fetch all the token accounts owned by the specified account
   *
   * @return {Promise<RpcResponseAndContext<GetProgramAccountsResponse>}
   */
  async getTokenAccountsByOwner(ownerAddress, filter, commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    let _args = [ownerAddress.toBase58()];
    if ("mint" in filter) {
      _args.push({
        mint: filter.mint.toBase58()
      });
    } else {
      _args.push({
        programId: filter.programId.toBase58()
      });
    }
    const args = this._buildArgs(_args, commitment, "base64", config);
    const unsafeRes = await this._rpcRequest("getTokenAccountsByOwner", args);
    const res = create(unsafeRes, GetTokenAccountsByOwner);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get token accounts owned by account ${ownerAddress.toBase58()}`);
    }
    return res.result;
  }
  /**
   * Fetch parsed token accounts owned by the specified account
   *
   * @return {Promise<RpcResponseAndContext<Array<{pubkey: PublicKey, account: AccountInfo<ParsedAccountData>}>>>}
   */
  async getParsedTokenAccountsByOwner(ownerAddress, filter, commitment) {
    let _args = [ownerAddress.toBase58()];
    if ("mint" in filter) {
      _args.push({
        mint: filter.mint.toBase58()
      });
    } else {
      _args.push({
        programId: filter.programId.toBase58()
      });
    }
    const args = this._buildArgs(_args, commitment, "jsonParsed");
    const unsafeRes = await this._rpcRequest("getTokenAccountsByOwner", args);
    const res = create(unsafeRes, GetParsedTokenAccountsByOwner);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get token accounts owned by account ${ownerAddress.toBase58()}`);
    }
    return res.result;
  }
  /**
   * Fetch the 20 largest accounts with their current balances
   */
  async getLargestAccounts(config) {
    const arg = {
      ...config,
      commitment: config && config.commitment || this.commitment
    };
    const args = arg.filter || arg.commitment ? [arg] : [];
    const unsafeRes = await this._rpcRequest("getLargestAccounts", args);
    const res = create(unsafeRes, GetLargestAccountsRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get largest accounts");
    }
    return res.result;
  }
  /**
   * Fetch the 20 largest token accounts with their current balances
   * for a given mint.
   */
  async getTokenLargestAccounts(mintAddress, commitment) {
    const args = this._buildArgs([mintAddress.toBase58()], commitment);
    const unsafeRes = await this._rpcRequest("getTokenLargestAccounts", args);
    const res = create(unsafeRes, GetTokenLargestAccountsResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get token largest accounts");
    }
    return res.result;
  }
  /**
   * Fetch all the account info for the specified public key, return with context
   */
  async getAccountInfoAndContext(publicKey2, commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([publicKey2.toBase58()], commitment, "base64", config);
    const unsafeRes = await this._rpcRequest("getAccountInfo", args);
    const res = create(unsafeRes, jsonRpcResultAndContext(nullable(AccountInfoResult)));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get info about account ${publicKey2.toBase58()}`);
    }
    return res.result;
  }
  /**
   * Fetch parsed account info for the specified public key
   */
  async getParsedAccountInfo(publicKey2, commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([publicKey2.toBase58()], commitment, "jsonParsed", config);
    const unsafeRes = await this._rpcRequest("getAccountInfo", args);
    const res = create(unsafeRes, jsonRpcResultAndContext(nullable(ParsedAccountInfoResult)));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get info about account ${publicKey2.toBase58()}`);
    }
    return res.result;
  }
  /**
   * Fetch all the account info for the specified public key
   */
  async getAccountInfo(publicKey2, commitmentOrConfig) {
    try {
      const res = await this.getAccountInfoAndContext(publicKey2, commitmentOrConfig);
      return res.value;
    } catch (e) {
      throw new Error("failed to get info about account " + publicKey2.toBase58() + ": " + e);
    }
  }
  /**
   * Fetch all the account info for multiple accounts specified by an array of public keys, return with context
   */
  async getMultipleParsedAccounts(publicKeys, rawConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(rawConfig);
    const keys = publicKeys.map((key) => key.toBase58());
    const args = this._buildArgs([keys], commitment, "jsonParsed", config);
    const unsafeRes = await this._rpcRequest("getMultipleAccounts", args);
    const res = create(unsafeRes, jsonRpcResultAndContext(array(nullable(ParsedAccountInfoResult))));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get info for accounts ${keys}`);
    }
    return res.result;
  }
  /**
   * Fetch all the account info for multiple accounts specified by an array of public keys, return with context
   */
  async getMultipleAccountsInfoAndContext(publicKeys, commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const keys = publicKeys.map((key) => key.toBase58());
    const args = this._buildArgs([keys], commitment, "base64", config);
    const unsafeRes = await this._rpcRequest("getMultipleAccounts", args);
    const res = create(unsafeRes, jsonRpcResultAndContext(array(nullable(AccountInfoResult))));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get info for accounts ${keys}`);
    }
    return res.result;
  }
  /**
   * Fetch all the account info for multiple accounts specified by an array of public keys
   */
  async getMultipleAccountsInfo(publicKeys, commitmentOrConfig) {
    const res = await this.getMultipleAccountsInfoAndContext(publicKeys, commitmentOrConfig);
    return res.value;
  }
  /**
   * Returns epoch activation information for a stake account that has been delegated
   *
   * @deprecated Deprecated since RPC v1.18; will be removed in a future version.
   */
  async getStakeActivation(publicKey2, commitmentOrConfig, epoch) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([publicKey2.toBase58()], commitment, void 0, {
      ...config,
      epoch: epoch != null ? epoch : config?.epoch
    });
    const unsafeRes = await this._rpcRequest("getStakeActivation", args);
    const res = create(unsafeRes, jsonRpcResult(StakeActivationResult));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get Stake Activation ${publicKey2.toBase58()}`);
    }
    return res.result;
  }
  /**
   * Fetch all the accounts owned by the specified program id
   *
   * @return {Promise<Array<{pubkey: PublicKey, account: AccountInfo<Buffer>}>>}
   */
  // eslint-disable-next-line no-dupe-class-members
  // eslint-disable-next-line no-dupe-class-members
  async getProgramAccounts(programId, configOrCommitment) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(configOrCommitment);
    const {
      encoding,
      ...configWithoutEncoding
    } = config || {};
    const args = this._buildArgs([programId.toBase58()], commitment, encoding || "base64", {
      ...configWithoutEncoding,
      ...configWithoutEncoding.filters ? {
        filters: applyDefaultMemcmpEncodingToFilters(configWithoutEncoding.filters)
      } : null
    });
    const unsafeRes = await this._rpcRequest("getProgramAccounts", args);
    const baseSchema = array(KeyedAccountInfoResult);
    const res = configWithoutEncoding.withContext === true ? create(unsafeRes, jsonRpcResultAndContext(baseSchema)) : create(unsafeRes, jsonRpcResult(baseSchema));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get accounts owned by program ${programId.toBase58()}`);
    }
    return res.result;
  }
  /**
   * Fetch and parse all the accounts owned by the specified program id
   *
   * @return {Promise<Array<{pubkey: PublicKey, account: AccountInfo<Buffer | ParsedAccountData>}>>}
   */
  async getParsedProgramAccounts(programId, configOrCommitment) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(configOrCommitment);
    const args = this._buildArgs([programId.toBase58()], commitment, "jsonParsed", config);
    const unsafeRes = await this._rpcRequest("getProgramAccounts", args);
    const res = create(unsafeRes, jsonRpcResult(array(KeyedParsedAccountInfoResult)));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get accounts owned by program ${programId.toBase58()}`);
    }
    return res.result;
  }
  /** @deprecated Instead, call `confirmTransaction` and pass in {@link TransactionConfirmationStrategy} */
  // eslint-disable-next-line no-dupe-class-members
  // eslint-disable-next-line no-dupe-class-members
  async confirmTransaction(strategy, commitment) {
    let rawSignature;
    if (typeof strategy == "string") {
      rawSignature = strategy;
    } else {
      const config = strategy;
      if (config.abortSignal?.aborted) {
        return Promise.reject(config.abortSignal.reason);
      }
      rawSignature = config.signature;
    }
    let decodedSignature;
    try {
      decodedSignature = bs58.decode(rawSignature);
    } catch (err) {
      throw new Error("signature must be base58 encoded: " + rawSignature);
    }
    assert(decodedSignature.length === 64, "signature has invalid length");
    if (typeof strategy === "string") {
      return await this.confirmTransactionUsingLegacyTimeoutStrategy({
        commitment: commitment || this.commitment,
        signature: rawSignature
      });
    } else if ("lastValidBlockHeight" in strategy) {
      return await this.confirmTransactionUsingBlockHeightExceedanceStrategy({
        commitment: commitment || this.commitment,
        strategy
      });
    } else {
      return await this.confirmTransactionUsingDurableNonceStrategy({
        commitment: commitment || this.commitment,
        strategy
      });
    }
  }
  getCancellationPromise(signal) {
    return new Promise((_, reject) => {
      if (signal == null) {
        return;
      }
      if (signal.aborted) {
        reject(signal.reason);
      } else {
        signal.addEventListener("abort", () => {
          reject(signal.reason);
        });
      }
    });
  }
  getTransactionConfirmationPromise({
    commitment,
    signature: signature2
  }) {
    let signatureSubscriptionId;
    let disposeSignatureSubscriptionStateChangeObserver;
    let done = false;
    const confirmationPromise = new Promise((resolve, reject) => {
      try {
        signatureSubscriptionId = this.onSignature(signature2, (result, context) => {
          signatureSubscriptionId = void 0;
          const response = {
            context,
            value: result
          };
          resolve({
            __type: TransactionStatus.PROCESSED,
            response
          });
        }, commitment);
        const subscriptionSetupPromise = new Promise((resolveSubscriptionSetup) => {
          if (signatureSubscriptionId == null) {
            resolveSubscriptionSetup();
          } else {
            disposeSignatureSubscriptionStateChangeObserver = this._onSubscriptionStateChange(signatureSubscriptionId, (nextState) => {
              if (nextState === "subscribed") {
                resolveSubscriptionSetup();
              }
            });
          }
        });
        (async () => {
          await subscriptionSetupPromise;
          if (done) return;
          const response = await this.getSignatureStatus(signature2);
          if (done) return;
          if (response == null) {
            return;
          }
          const {
            context,
            value
          } = response;
          if (value == null) {
            return;
          }
          if (value?.err) {
            reject(value.err);
          } else {
            switch (commitment) {
              case "confirmed":
              case "single":
              case "singleGossip": {
                if (value.confirmationStatus === "processed") {
                  return;
                }
                break;
              }
              case "finalized":
              case "max":
              case "root": {
                if (value.confirmationStatus === "processed" || value.confirmationStatus === "confirmed") {
                  return;
                }
                break;
              }
              // exhaust enums to ensure full coverage
              case "processed":
              case "recent":
            }
            done = true;
            resolve({
              __type: TransactionStatus.PROCESSED,
              response: {
                context,
                value
              }
            });
          }
        })();
      } catch (err) {
        reject(err);
      }
    });
    const abortConfirmation = () => {
      if (disposeSignatureSubscriptionStateChangeObserver) {
        disposeSignatureSubscriptionStateChangeObserver();
        disposeSignatureSubscriptionStateChangeObserver = void 0;
      }
      if (signatureSubscriptionId != null) {
        this.removeSignatureListener(signatureSubscriptionId);
        signatureSubscriptionId = void 0;
      }
    };
    return {
      abortConfirmation,
      confirmationPromise
    };
  }
  async confirmTransactionUsingBlockHeightExceedanceStrategy({
    commitment,
    strategy: {
      abortSignal,
      lastValidBlockHeight,
      signature: signature2
    }
  }) {
    let done = false;
    const expiryPromise = new Promise((resolve) => {
      const checkBlockHeight = async () => {
        try {
          const blockHeight = await this.getBlockHeight(commitment);
          return blockHeight;
        } catch (_e) {
          return -1;
        }
      };
      (async () => {
        let currentBlockHeight = await checkBlockHeight();
        if (done) return;
        while (currentBlockHeight <= lastValidBlockHeight) {
          await sleep(1e3);
          if (done) return;
          currentBlockHeight = await checkBlockHeight();
          if (done) return;
        }
        resolve({
          __type: TransactionStatus.BLOCKHEIGHT_EXCEEDED
        });
      })();
    });
    const {
      abortConfirmation,
      confirmationPromise
    } = this.getTransactionConfirmationPromise({
      commitment,
      signature: signature2
    });
    const cancellationPromise = this.getCancellationPromise(abortSignal);
    let result;
    try {
      const outcome = await Promise.race([cancellationPromise, confirmationPromise, expiryPromise]);
      if (outcome.__type === TransactionStatus.PROCESSED) {
        result = outcome.response;
      } else {
        throw new TransactionExpiredBlockheightExceededError(signature2);
      }
    } finally {
      done = true;
      abortConfirmation();
    }
    return result;
  }
  async confirmTransactionUsingDurableNonceStrategy({
    commitment,
    strategy: {
      abortSignal,
      minContextSlot,
      nonceAccountPubkey,
      nonceValue,
      signature: signature2
    }
  }) {
    let done = false;
    const expiryPromise = new Promise((resolve) => {
      let currentNonceValue = nonceValue;
      let lastCheckedSlot = null;
      const getCurrentNonceValue = async () => {
        try {
          const {
            context,
            value: nonceAccount
          } = await this.getNonceAndContext(nonceAccountPubkey, {
            commitment,
            minContextSlot
          });
          lastCheckedSlot = context.slot;
          return nonceAccount?.nonce;
        } catch (e) {
          return currentNonceValue;
        }
      };
      (async () => {
        currentNonceValue = await getCurrentNonceValue();
        if (done) return;
        while (true) {
          if (nonceValue !== currentNonceValue) {
            resolve({
              __type: TransactionStatus.NONCE_INVALID,
              slotInWhichNonceDidAdvance: lastCheckedSlot
            });
            return;
          }
          await sleep(2e3);
          if (done) return;
          currentNonceValue = await getCurrentNonceValue();
          if (done) return;
        }
      })();
    });
    const {
      abortConfirmation,
      confirmationPromise
    } = this.getTransactionConfirmationPromise({
      commitment,
      signature: signature2
    });
    const cancellationPromise = this.getCancellationPromise(abortSignal);
    let result;
    try {
      const outcome = await Promise.race([cancellationPromise, confirmationPromise, expiryPromise]);
      if (outcome.__type === TransactionStatus.PROCESSED) {
        result = outcome.response;
      } else {
        let signatureStatus;
        while (true) {
          const status = await this.getSignatureStatus(signature2);
          if (status == null) {
            break;
          }
          if (status.context.slot < (outcome.slotInWhichNonceDidAdvance ?? minContextSlot)) {
            await sleep(400);
            continue;
          }
          signatureStatus = status;
          break;
        }
        if (signatureStatus?.value) {
          const commitmentForStatus = commitment || "finalized";
          const {
            confirmationStatus
          } = signatureStatus.value;
          switch (commitmentForStatus) {
            case "processed":
            case "recent":
              if (confirmationStatus !== "processed" && confirmationStatus !== "confirmed" && confirmationStatus !== "finalized") {
                throw new TransactionExpiredNonceInvalidError(signature2);
              }
              break;
            case "confirmed":
            case "single":
            case "singleGossip":
              if (confirmationStatus !== "confirmed" && confirmationStatus !== "finalized") {
                throw new TransactionExpiredNonceInvalidError(signature2);
              }
              break;
            case "finalized":
            case "max":
            case "root":
              if (confirmationStatus !== "finalized") {
                throw new TransactionExpiredNonceInvalidError(signature2);
              }
              break;
            default:
              /* @__PURE__ */ ((_) => {
              })(commitmentForStatus);
          }
          result = {
            context: signatureStatus.context,
            value: {
              err: signatureStatus.value.err
            }
          };
        } else {
          throw new TransactionExpiredNonceInvalidError(signature2);
        }
      }
    } finally {
      done = true;
      abortConfirmation();
    }
    return result;
  }
  async confirmTransactionUsingLegacyTimeoutStrategy({
    commitment,
    signature: signature2
  }) {
    let timeoutId;
    const expiryPromise = new Promise((resolve) => {
      let timeoutMs = this._confirmTransactionInitialTimeout || 60 * 1e3;
      switch (commitment) {
        case "processed":
        case "recent":
        case "single":
        case "confirmed":
        case "singleGossip": {
          timeoutMs = this._confirmTransactionInitialTimeout || 30 * 1e3;
          break;
        }
      }
      timeoutId = setTimeout(() => resolve({
        __type: TransactionStatus.TIMED_OUT,
        timeoutMs
      }), timeoutMs);
    });
    const {
      abortConfirmation,
      confirmationPromise
    } = this.getTransactionConfirmationPromise({
      commitment,
      signature: signature2
    });
    let result;
    try {
      const outcome = await Promise.race([confirmationPromise, expiryPromise]);
      if (outcome.__type === TransactionStatus.PROCESSED) {
        result = outcome.response;
      } else {
        throw new TransactionExpiredTimeoutError(signature2, outcome.timeoutMs / 1e3);
      }
    } finally {
      clearTimeout(timeoutId);
      abortConfirmation();
    }
    return result;
  }
  /**
   * Return the list of nodes that are currently participating in the cluster
   */
  async getClusterNodes() {
    const unsafeRes = await this._rpcRequest("getClusterNodes", []);
    const res = create(unsafeRes, jsonRpcResult(array(ContactInfoResult)));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get cluster nodes");
    }
    return res.result;
  }
  /**
   * Return the list of nodes that are currently participating in the cluster
   */
  async getVoteAccounts(commitment) {
    const args = this._buildArgs([], commitment);
    const unsafeRes = await this._rpcRequest("getVoteAccounts", args);
    const res = create(unsafeRes, GetVoteAccounts);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get vote accounts");
    }
    return res.result;
  }
  /**
   * Fetch the current slot that the node is processing
   */
  async getSlot(commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([], commitment, void 0, config);
    const unsafeRes = await this._rpcRequest("getSlot", args);
    const res = create(unsafeRes, jsonRpcResult(number()));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get slot");
    }
    return res.result;
  }
  /**
   * Fetch the current slot leader of the cluster
   */
  async getSlotLeader(commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([], commitment, void 0, config);
    const unsafeRes = await this._rpcRequest("getSlotLeader", args);
    const res = create(unsafeRes, jsonRpcResult(string()));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get slot leader");
    }
    return res.result;
  }
  /**
   * Fetch `limit` number of slot leaders starting from `startSlot`
   *
   * @param startSlot fetch slot leaders starting from this slot
   * @param limit number of slot leaders to return
   */
  async getSlotLeaders(startSlot, limit) {
    const args = [startSlot, limit];
    const unsafeRes = await this._rpcRequest("getSlotLeaders", args);
    const res = create(unsafeRes, jsonRpcResult(array(PublicKeyFromString)));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get slot leaders");
    }
    return res.result;
  }
  /**
   * Fetch the current status of a signature
   */
  async getSignatureStatus(signature2, config) {
    const {
      context,
      value: values
    } = await this.getSignatureStatuses([signature2], config);
    assert(values.length === 1);
    const value = values[0];
    return {
      context,
      value
    };
  }
  /**
   * Fetch the current statuses of a batch of signatures
   */
  async getSignatureStatuses(signatures, config) {
    const params = [signatures];
    if (config) {
      params.push(config);
    }
    const unsafeRes = await this._rpcRequest("getSignatureStatuses", params);
    const res = create(unsafeRes, GetSignatureStatusesRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get signature status");
    }
    return res.result;
  }
  /**
   * Fetch the current transaction count of the cluster
   */
  async getTransactionCount(commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([], commitment, void 0, config);
    const unsafeRes = await this._rpcRequest("getTransactionCount", args);
    const res = create(unsafeRes, jsonRpcResult(number()));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get transaction count");
    }
    return res.result;
  }
  /**
   * Fetch the current total currency supply of the cluster in lamports
   *
   * @deprecated Deprecated since RPC v1.2.8. Please use {@link getSupply} instead.
   */
  async getTotalSupply(commitment) {
    const result = await this.getSupply({
      commitment,
      excludeNonCirculatingAccountsList: true
    });
    return result.value.total;
  }
  /**
   * Fetch the cluster InflationGovernor parameters
   */
  async getInflationGovernor(commitment) {
    const args = this._buildArgs([], commitment);
    const unsafeRes = await this._rpcRequest("getInflationGovernor", args);
    const res = create(unsafeRes, GetInflationGovernorRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get inflation");
    }
    return res.result;
  }
  /**
   * Fetch the inflation reward for a list of addresses for an epoch
   */
  async getInflationReward(addresses, epoch, commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([addresses.map((pubkey) => pubkey.toBase58())], commitment, void 0, {
      ...config,
      epoch: epoch != null ? epoch : config?.epoch
    });
    const unsafeRes = await this._rpcRequest("getInflationReward", args);
    const res = create(unsafeRes, GetInflationRewardResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get inflation reward");
    }
    return res.result;
  }
  /**
   * Fetch the specific inflation values for the current epoch
   */
  async getInflationRate() {
    const unsafeRes = await this._rpcRequest("getInflationRate", []);
    const res = create(unsafeRes, GetInflationRateRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get inflation rate");
    }
    return res.result;
  }
  /**
   * Fetch the Epoch Info parameters
   */
  async getEpochInfo(commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([], commitment, void 0, config);
    const unsafeRes = await this._rpcRequest("getEpochInfo", args);
    const res = create(unsafeRes, GetEpochInfoRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get epoch info");
    }
    return res.result;
  }
  /**
   * Fetch the Epoch Schedule parameters
   */
  async getEpochSchedule() {
    const unsafeRes = await this._rpcRequest("getEpochSchedule", []);
    const res = create(unsafeRes, GetEpochScheduleRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get epoch schedule");
    }
    const epochSchedule = res.result;
    return new EpochSchedule(epochSchedule.slotsPerEpoch, epochSchedule.leaderScheduleSlotOffset, epochSchedule.warmup, epochSchedule.firstNormalEpoch, epochSchedule.firstNormalSlot);
  }
  /**
   * Fetch the leader schedule for the current epoch
   * @return {Promise<RpcResponseAndContext<LeaderSchedule>>}
   */
  async getLeaderSchedule() {
    const unsafeRes = await this._rpcRequest("getLeaderSchedule", []);
    const res = create(unsafeRes, GetLeaderScheduleRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get leader schedule");
    }
    return res.result;
  }
  /**
   * Fetch the minimum balance needed to exempt an account of `dataLength`
   * size from rent
   */
  async getMinimumBalanceForRentExemption(dataLength, commitment) {
    const args = this._buildArgs([dataLength], commitment);
    const unsafeRes = await this._rpcRequest("getMinimumBalanceForRentExemption", args);
    const res = create(unsafeRes, GetMinimumBalanceForRentExemptionRpcResult);
    if ("error" in res) {
      console.warn("Unable to fetch minimum balance for rent exemption");
      return 0;
    }
    return res.result;
  }
  /**
   * Fetch a recent blockhash from the cluster, return with context
   * @return {Promise<RpcResponseAndContext<{blockhash: Blockhash, feeCalculator: FeeCalculator}>>}
   *
   * @deprecated Deprecated since RPC v1.9.0. Please use {@link getLatestBlockhash} instead.
   */
  async getRecentBlockhashAndContext(commitment) {
    const {
      context,
      value: {
        blockhash
      }
    } = await this.getLatestBlockhashAndContext(commitment);
    const feeCalculator = {
      get lamportsPerSignature() {
        throw new Error("The capability to fetch `lamportsPerSignature` using the `getRecentBlockhash` API is no longer offered by the network. Use the `getFeeForMessage` API to obtain the fee for a given message.");
      },
      toJSON() {
        return {};
      }
    };
    return {
      context,
      value: {
        blockhash,
        feeCalculator
      }
    };
  }
  /**
   * Fetch recent performance samples
   * @return {Promise<Array<PerfSample>>}
   */
  async getRecentPerformanceSamples(limit) {
    const unsafeRes = await this._rpcRequest("getRecentPerformanceSamples", limit ? [limit] : []);
    const res = create(unsafeRes, GetRecentPerformanceSamplesRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get recent performance samples");
    }
    return res.result;
  }
  /**
   * Fetch the fee calculator for a recent blockhash from the cluster, return with context
   *
   * @deprecated Deprecated since RPC v1.9.0. Please use {@link getFeeForMessage} instead.
   */
  async getFeeCalculatorForBlockhash(blockhash, commitment) {
    const args = this._buildArgs([blockhash], commitment);
    const unsafeRes = await this._rpcRequest("getFeeCalculatorForBlockhash", args);
    const res = create(unsafeRes, GetFeeCalculatorRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get fee calculator");
    }
    const {
      context,
      value
    } = res.result;
    return {
      context,
      value: value !== null ? value.feeCalculator : null
    };
  }
  /**
   * Fetch the fee for a message from the cluster, return with context
   */
  async getFeeForMessage(message, commitment) {
    const wireMessage = toBuffer(message.serialize()).toString("base64");
    const args = this._buildArgs([wireMessage], commitment);
    const unsafeRes = await this._rpcRequest("getFeeForMessage", args);
    const res = create(unsafeRes, jsonRpcResultAndContext(nullable(number())));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get fee for message");
    }
    if (res.result === null) {
      throw new Error("invalid blockhash");
    }
    return res.result;
  }
  /**
   * Fetch a list of prioritization fees from recent blocks.
   */
  async getRecentPrioritizationFees(config) {
    const accounts = config?.lockedWritableAccounts?.map((key) => key.toBase58());
    const args = accounts?.length ? [accounts] : [];
    const unsafeRes = await this._rpcRequest("getRecentPrioritizationFees", args);
    const res = create(unsafeRes, GetRecentPrioritizationFeesRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get recent prioritization fees");
    }
    return res.result;
  }
  /**
   * Fetch a recent blockhash from the cluster
   * @return {Promise<{blockhash: Blockhash, feeCalculator: FeeCalculator}>}
   *
   * @deprecated Deprecated since RPC v1.8.0. Please use {@link getLatestBlockhash} instead.
   */
  async getRecentBlockhash(commitment) {
    try {
      const res = await this.getRecentBlockhashAndContext(commitment);
      return res.value;
    } catch (e) {
      throw new Error("failed to get recent blockhash: " + e);
    }
  }
  /**
   * Fetch the latest blockhash from the cluster
   * @return {Promise<BlockhashWithExpiryBlockHeight>}
   */
  async getLatestBlockhash(commitmentOrConfig) {
    try {
      const res = await this.getLatestBlockhashAndContext(commitmentOrConfig);
      return res.value;
    } catch (e) {
      throw new Error("failed to get recent blockhash: " + e);
    }
  }
  /**
   * Fetch the latest blockhash from the cluster
   * @return {Promise<BlockhashWithExpiryBlockHeight>}
   */
  async getLatestBlockhashAndContext(commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs([], commitment, void 0, config);
    const unsafeRes = await this._rpcRequest("getLatestBlockhash", args);
    const res = create(unsafeRes, GetLatestBlockhashRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get latest blockhash");
    }
    return res.result;
  }
  /**
   * Returns whether a blockhash is still valid or not
   */
  async isBlockhashValid(blockhash, rawConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(rawConfig);
    const args = this._buildArgs([blockhash], commitment, void 0, config);
    const unsafeRes = await this._rpcRequest("isBlockhashValid", args);
    const res = create(unsafeRes, IsBlockhashValidRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to determine if the blockhash `" + blockhash + "`is valid");
    }
    return res.result;
  }
  /**
   * Fetch the node version
   */
  async getVersion() {
    const unsafeRes = await this._rpcRequest("getVersion", []);
    const res = create(unsafeRes, jsonRpcResult(VersionResult));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get version");
    }
    return res.result;
  }
  /**
   * Fetch the genesis hash
   */
  async getGenesisHash() {
    const unsafeRes = await this._rpcRequest("getGenesisHash", []);
    const res = create(unsafeRes, jsonRpcResult(string()));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get genesis hash");
    }
    return res.result;
  }
  /**
   * Fetch a processed block from the cluster.
   *
   * @deprecated Instead, call `getBlock` using a `GetVersionedBlockConfig` by
   * setting the `maxSupportedTransactionVersion` property.
   */
  /**
   * @deprecated Instead, call `getBlock` using a `GetVersionedBlockConfig` by
   * setting the `maxSupportedTransactionVersion` property.
   */
  // eslint-disable-next-line no-dupe-class-members
  /**
   * @deprecated Instead, call `getBlock` using a `GetVersionedBlockConfig` by
   * setting the `maxSupportedTransactionVersion` property.
   */
  // eslint-disable-next-line no-dupe-class-members
  /**
   * Fetch a processed block from the cluster.
   */
  // eslint-disable-next-line no-dupe-class-members
  // eslint-disable-next-line no-dupe-class-members
  // eslint-disable-next-line no-dupe-class-members
  /**
   * Fetch a processed block from the cluster.
   */
  // eslint-disable-next-line no-dupe-class-members
  async getBlock(slot, rawConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(rawConfig);
    const args = this._buildArgsAtLeastConfirmed([slot], commitment, void 0, config);
    const unsafeRes = await this._rpcRequest("getBlock", args);
    try {
      switch (config?.transactionDetails) {
        case "accounts": {
          const res = create(unsafeRes, GetAccountsModeBlockRpcResult);
          if ("error" in res) {
            throw res.error;
          }
          return res.result;
        }
        case "none": {
          const res = create(unsafeRes, GetNoneModeBlockRpcResult);
          if ("error" in res) {
            throw res.error;
          }
          return res.result;
        }
        default: {
          const res = create(unsafeRes, GetBlockRpcResult);
          if ("error" in res) {
            throw res.error;
          }
          const {
            result
          } = res;
          return result ? {
            ...result,
            transactions: result.transactions.map(({
              transaction,
              meta,
              version
            }) => ({
              meta,
              transaction: {
                ...transaction,
                message: versionedMessageFromResponse(version, transaction.message)
              },
              version
            }))
          } : null;
        }
      }
    } catch (e) {
      throw new SolanaJSONRPCError(e, "failed to get confirmed block");
    }
  }
  /**
   * Fetch parsed transaction details for a confirmed or finalized block
   */
  // eslint-disable-next-line no-dupe-class-members
  // eslint-disable-next-line no-dupe-class-members
  // eslint-disable-next-line no-dupe-class-members
  async getParsedBlock(slot, rawConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(rawConfig);
    const args = this._buildArgsAtLeastConfirmed([slot], commitment, "jsonParsed", config);
    const unsafeRes = await this._rpcRequest("getBlock", args);
    try {
      switch (config?.transactionDetails) {
        case "accounts": {
          const res = create(unsafeRes, GetParsedAccountsModeBlockRpcResult);
          if ("error" in res) {
            throw res.error;
          }
          return res.result;
        }
        case "none": {
          const res = create(unsafeRes, GetParsedNoneModeBlockRpcResult);
          if ("error" in res) {
            throw res.error;
          }
          return res.result;
        }
        default: {
          const res = create(unsafeRes, GetParsedBlockRpcResult);
          if ("error" in res) {
            throw res.error;
          }
          return res.result;
        }
      }
    } catch (e) {
      throw new SolanaJSONRPCError(e, "failed to get block");
    }
  }
  /*
   * Returns recent block production information from the current or previous epoch
   */
  async getBlockProduction(configOrCommitment) {
    let extra;
    let commitment;
    if (typeof configOrCommitment === "string") {
      commitment = configOrCommitment;
    } else if (configOrCommitment) {
      const {
        commitment: c,
        ...rest
      } = configOrCommitment;
      commitment = c;
      extra = rest;
    }
    const args = this._buildArgs([], commitment, "base64", extra);
    const unsafeRes = await this._rpcRequest("getBlockProduction", args);
    const res = create(unsafeRes, BlockProductionResponseStruct);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get block production information");
    }
    return res.result;
  }
  /**
   * Fetch a confirmed or finalized transaction from the cluster.
   *
   * @deprecated Instead, call `getTransaction` using a
   * `GetVersionedTransactionConfig` by setting the
   * `maxSupportedTransactionVersion` property.
   */
  /**
   * Fetch a confirmed or finalized transaction from the cluster.
   */
  // eslint-disable-next-line no-dupe-class-members
  /**
   * Fetch a confirmed or finalized transaction from the cluster.
   */
  // eslint-disable-next-line no-dupe-class-members
  async getTransaction(signature2, rawConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(rawConfig);
    const args = this._buildArgsAtLeastConfirmed([signature2], commitment, void 0, config);
    const unsafeRes = await this._rpcRequest("getTransaction", args);
    const res = create(unsafeRes, GetTransactionRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get transaction");
    }
    const result = res.result;
    if (!result) return result;
    return {
      ...result,
      transaction: {
        ...result.transaction,
        message: versionedMessageFromResponse(result.version, result.transaction.message)
      }
    };
  }
  /**
   * Fetch parsed transaction details for a confirmed or finalized transaction
   */
  async getParsedTransaction(signature2, commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgsAtLeastConfirmed([signature2], commitment, "jsonParsed", config);
    const unsafeRes = await this._rpcRequest("getTransaction", args);
    const res = create(unsafeRes, GetParsedTransactionRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get transaction");
    }
    return res.result;
  }
  /**
   * Fetch parsed transaction details for a batch of confirmed transactions
   */
  async getParsedTransactions(signatures, commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const batch = signatures.map((signature2) => {
      const args = this._buildArgsAtLeastConfirmed([signature2], commitment, "jsonParsed", config);
      return {
        methodName: "getTransaction",
        args
      };
    });
    const unsafeRes = await this._rpcBatchRequest(batch);
    const res = unsafeRes.map((unsafeRes2) => {
      const res2 = create(unsafeRes2, GetParsedTransactionRpcResult);
      if ("error" in res2) {
        throw new SolanaJSONRPCError(res2.error, "failed to get transactions");
      }
      return res2.result;
    });
    return res;
  }
  /**
   * Fetch transaction details for a batch of confirmed transactions.
   * Similar to {@link getParsedTransactions} but returns a {@link TransactionResponse}.
   *
   * @deprecated Instead, call `getTransactions` using a
   * `GetVersionedTransactionConfig` by setting the
   * `maxSupportedTransactionVersion` property.
   */
  /**
   * Fetch transaction details for a batch of confirmed transactions.
   * Similar to {@link getParsedTransactions} but returns a {@link
   * VersionedTransactionResponse}.
   */
  // eslint-disable-next-line no-dupe-class-members
  /**
   * Fetch transaction details for a batch of confirmed transactions.
   * Similar to {@link getParsedTransactions} but returns a {@link
   * VersionedTransactionResponse}.
   */
  // eslint-disable-next-line no-dupe-class-members
  async getTransactions(signatures, commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const batch = signatures.map((signature2) => {
      const args = this._buildArgsAtLeastConfirmed([signature2], commitment, void 0, config);
      return {
        methodName: "getTransaction",
        args
      };
    });
    const unsafeRes = await this._rpcBatchRequest(batch);
    const res = unsafeRes.map((unsafeRes2) => {
      const res2 = create(unsafeRes2, GetTransactionRpcResult);
      if ("error" in res2) {
        throw new SolanaJSONRPCError(res2.error, "failed to get transactions");
      }
      const result = res2.result;
      if (!result) return result;
      return {
        ...result,
        transaction: {
          ...result.transaction,
          message: versionedMessageFromResponse(result.version, result.transaction.message)
        }
      };
    });
    return res;
  }
  /**
   * Fetch a list of Transactions and transaction statuses from the cluster
   * for a confirmed block.
   *
   * @deprecated Deprecated since RPC v1.7.0. Please use {@link getBlock} instead.
   */
  async getConfirmedBlock(slot, commitment) {
    const args = this._buildArgsAtLeastConfirmed([slot], commitment);
    const unsafeRes = await this._rpcRequest("getBlock", args);
    const res = create(unsafeRes, GetConfirmedBlockRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get confirmed block");
    }
    const result = res.result;
    if (!result) {
      throw new Error("Confirmed block " + slot + " not found");
    }
    const block = {
      ...result,
      transactions: result.transactions.map(({
        transaction,
        meta
      }) => {
        const message = new Message(transaction.message);
        return {
          meta,
          transaction: {
            ...transaction,
            message
          }
        };
      })
    };
    return {
      ...block,
      transactions: block.transactions.map(({
        transaction,
        meta
      }) => {
        return {
          meta,
          transaction: Transaction.populate(transaction.message, transaction.signatures)
        };
      })
    };
  }
  /**
   * Fetch confirmed blocks between two slots
   */
  async getBlocks(startSlot, endSlot, commitment) {
    const args = this._buildArgsAtLeastConfirmed(endSlot !== void 0 ? [startSlot, endSlot] : [startSlot], commitment);
    const unsafeRes = await this._rpcRequest("getBlocks", args);
    const res = create(unsafeRes, jsonRpcResult(array(number())));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get blocks");
    }
    return res.result;
  }
  /**
   * Fetch a list of Signatures from the cluster for a block, excluding rewards
   */
  async getBlockSignatures(slot, commitment) {
    const args = this._buildArgsAtLeastConfirmed([slot], commitment, void 0, {
      transactionDetails: "signatures",
      rewards: false
    });
    const unsafeRes = await this._rpcRequest("getBlock", args);
    const res = create(unsafeRes, GetBlockSignaturesRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get block");
    }
    const result = res.result;
    if (!result) {
      throw new Error("Block " + slot + " not found");
    }
    return result;
  }
  /**
   * Fetch a list of Signatures from the cluster for a confirmed block, excluding rewards
   *
   * @deprecated Deprecated since RPC v1.7.0. Please use {@link getBlockSignatures} instead.
   */
  async getConfirmedBlockSignatures(slot, commitment) {
    const args = this._buildArgsAtLeastConfirmed([slot], commitment, void 0, {
      transactionDetails: "signatures",
      rewards: false
    });
    const unsafeRes = await this._rpcRequest("getBlock", args);
    const res = create(unsafeRes, GetBlockSignaturesRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get confirmed block");
    }
    const result = res.result;
    if (!result) {
      throw new Error("Confirmed block " + slot + " not found");
    }
    return result;
  }
  /**
   * Fetch a transaction details for a confirmed transaction
   *
   * @deprecated Deprecated since RPC v1.7.0. Please use {@link getTransaction} instead.
   */
  async getConfirmedTransaction(signature2, commitment) {
    const args = this._buildArgsAtLeastConfirmed([signature2], commitment);
    const unsafeRes = await this._rpcRequest("getTransaction", args);
    const res = create(unsafeRes, GetTransactionRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get transaction");
    }
    const result = res.result;
    if (!result) return result;
    const message = new Message(result.transaction.message);
    const signatures = result.transaction.signatures;
    return {
      ...result,
      transaction: Transaction.populate(message, signatures)
    };
  }
  /**
   * Fetch parsed transaction details for a confirmed transaction
   *
   * @deprecated Deprecated since RPC v1.7.0. Please use {@link getParsedTransaction} instead.
   */
  async getParsedConfirmedTransaction(signature2, commitment) {
    const args = this._buildArgsAtLeastConfirmed([signature2], commitment, "jsonParsed");
    const unsafeRes = await this._rpcRequest("getTransaction", args);
    const res = create(unsafeRes, GetParsedTransactionRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get confirmed transaction");
    }
    return res.result;
  }
  /**
   * Fetch parsed transaction details for a batch of confirmed transactions
   *
   * @deprecated Deprecated since RPC v1.7.0. Please use {@link getParsedTransactions} instead.
   */
  async getParsedConfirmedTransactions(signatures, commitment) {
    const batch = signatures.map((signature2) => {
      const args = this._buildArgsAtLeastConfirmed([signature2], commitment, "jsonParsed");
      return {
        methodName: "getTransaction",
        args
      };
    });
    const unsafeRes = await this._rpcBatchRequest(batch);
    const res = unsafeRes.map((unsafeRes2) => {
      const res2 = create(unsafeRes2, GetParsedTransactionRpcResult);
      if ("error" in res2) {
        throw new SolanaJSONRPCError(res2.error, "failed to get confirmed transactions");
      }
      return res2.result;
    });
    return res;
  }
  /**
   * Fetch a list of all the confirmed signatures for transactions involving an address
   * within a specified slot range. Max range allowed is 10,000 slots.
   *
   * @deprecated Deprecated since RPC v1.3. Please use {@link getConfirmedSignaturesForAddress2} instead.
   *
   * @param address queried address
   * @param startSlot start slot, inclusive
   * @param endSlot end slot, inclusive
   */
  async getConfirmedSignaturesForAddress(address, startSlot, endSlot) {
    let options = {};
    let firstAvailableBlock = await this.getFirstAvailableBlock();
    while (!("until" in options)) {
      startSlot--;
      if (startSlot <= 0 || startSlot < firstAvailableBlock) {
        break;
      }
      try {
        const block = await this.getConfirmedBlockSignatures(startSlot, "finalized");
        if (block.signatures.length > 0) {
          options.until = block.signatures[block.signatures.length - 1].toString();
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("skipped")) {
          continue;
        } else {
          throw err;
        }
      }
    }
    let highestConfirmedRoot = await this.getSlot("finalized");
    while (!("before" in options)) {
      endSlot++;
      if (endSlot > highestConfirmedRoot) {
        break;
      }
      try {
        const block = await this.getConfirmedBlockSignatures(endSlot);
        if (block.signatures.length > 0) {
          options.before = block.signatures[block.signatures.length - 1].toString();
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("skipped")) {
          continue;
        } else {
          throw err;
        }
      }
    }
    const confirmedSignatureInfo = await this.getConfirmedSignaturesForAddress2(address, options);
    return confirmedSignatureInfo.map((info) => info.signature);
  }
  /**
   * Returns confirmed signatures for transactions involving an
   * address backwards in time from the provided signature or most recent confirmed block
   *
   * @deprecated Deprecated since RPC v1.7.0. Please use {@link getSignaturesForAddress} instead.
   */
  async getConfirmedSignaturesForAddress2(address, options, commitment) {
    const args = this._buildArgsAtLeastConfirmed([address.toBase58()], commitment, void 0, options);
    const unsafeRes = await this._rpcRequest("getConfirmedSignaturesForAddress2", args);
    const res = create(unsafeRes, GetConfirmedSignaturesForAddress2RpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get confirmed signatures for address");
    }
    return res.result;
  }
  /**
   * Returns confirmed signatures for transactions involving an
   * address backwards in time from the provided signature or most recent confirmed block
   *
   *
   * @param address queried address
   * @param options
   */
  async getSignaturesForAddress(address, options, commitment) {
    const args = this._buildArgsAtLeastConfirmed([address.toBase58()], commitment, void 0, options);
    const unsafeRes = await this._rpcRequest("getSignaturesForAddress", args);
    const res = create(unsafeRes, GetSignaturesForAddressRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, "failed to get signatures for address");
    }
    return res.result;
  }
  async getAddressLookupTable(accountKey, config) {
    const {
      context,
      value: accountInfo
    } = await this.getAccountInfoAndContext(accountKey, config);
    let value = null;
    if (accountInfo !== null) {
      value = new AddressLookupTableAccount({
        key: accountKey,
        state: AddressLookupTableAccount.deserialize(accountInfo.data)
      });
    }
    return {
      context,
      value
    };
  }
  /**
   * Fetch the contents of a Nonce account from the cluster, return with context
   */
  async getNonceAndContext(nonceAccount, commitmentOrConfig) {
    const {
      context,
      value: accountInfo
    } = await this.getAccountInfoAndContext(nonceAccount, commitmentOrConfig);
    let value = null;
    if (accountInfo !== null) {
      value = NonceAccount.fromAccountData(accountInfo.data);
    }
    return {
      context,
      value
    };
  }
  /**
   * Fetch the contents of a Nonce account from the cluster
   */
  async getNonce(nonceAccount, commitmentOrConfig) {
    return await this.getNonceAndContext(nonceAccount, commitmentOrConfig).then((x) => x.value).catch((e) => {
      throw new Error("failed to get nonce for account " + nonceAccount.toBase58() + ": " + e);
    });
  }
  /**
   * Request an allocation of lamports to the specified address
   *
   * ```typescript
   * import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
   *
   * (async () => {
   *   const connection = new Connection("https://api.testnet.solana.com", "confirmed");
   *   const myAddress = new PublicKey("2nr1bHFT86W9tGnyvmYW4vcHKsQB3sVQfnddasz4kExM");
   *   const signature = await connection.requestAirdrop(myAddress, LAMPORTS_PER_SOL);
   *   await connection.confirmTransaction(signature);
   * })();
   * ```
   */
  async requestAirdrop(to, lamports) {
    const unsafeRes = await this._rpcRequest("requestAirdrop", [to.toBase58(), lamports]);
    const res = create(unsafeRes, RequestAirdropRpcResult);
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, `airdrop to ${to.toBase58()} failed`);
    }
    return res.result;
  }
  /**
   * @internal
   */
  async _blockhashWithExpiryBlockHeight(disableCache) {
    if (!disableCache) {
      while (this._pollingBlockhash) {
        await sleep(100);
      }
      const timeSinceFetch = Date.now() - this._blockhashInfo.lastFetch;
      const expired = timeSinceFetch >= BLOCKHASH_CACHE_TIMEOUT_MS;
      if (this._blockhashInfo.latestBlockhash !== null && !expired) {
        return this._blockhashInfo.latestBlockhash;
      }
    }
    return await this._pollNewBlockhash();
  }
  /**
   * @internal
   */
  async _pollNewBlockhash() {
    this._pollingBlockhash = true;
    try {
      const startTime = Date.now();
      const cachedLatestBlockhash = this._blockhashInfo.latestBlockhash;
      const cachedBlockhash = cachedLatestBlockhash ? cachedLatestBlockhash.blockhash : null;
      for (let i = 0; i < 50; i++) {
        const latestBlockhash = await this.getLatestBlockhash("finalized");
        if (cachedBlockhash !== latestBlockhash.blockhash) {
          this._blockhashInfo = {
            latestBlockhash,
            lastFetch: Date.now(),
            transactionSignatures: [],
            simulatedSignatures: []
          };
          return latestBlockhash;
        }
        await sleep(MS_PER_SLOT / 2);
      }
      throw new Error(`Unable to obtain a new blockhash after ${Date.now() - startTime}ms`);
    } finally {
      this._pollingBlockhash = false;
    }
  }
  /**
   * get the stake minimum delegation
   */
  async getStakeMinimumDelegation(config) {
    const {
      commitment,
      config: configArg
    } = extractCommitmentFromConfig(config);
    const args = this._buildArgs([], commitment, "base64", configArg);
    const unsafeRes = await this._rpcRequest("getStakeMinimumDelegation", args);
    const res = create(unsafeRes, jsonRpcResultAndContext(number()));
    if ("error" in res) {
      throw new SolanaJSONRPCError(res.error, `failed to get stake minimum delegation`);
    }
    return res.result;
  }
  /**
   * Simulate a transaction
   *
   * @deprecated Instead, call {@link simulateTransaction} with {@link
   * VersionedTransaction} and {@link SimulateTransactionConfig} parameters
   */
  /**
   * Simulate a transaction
   */
  // eslint-disable-next-line no-dupe-class-members
  /**
   * Simulate a transaction
   */
  // eslint-disable-next-line no-dupe-class-members
  async simulateTransaction(transactionOrMessage, configOrSigners, includeAccounts) {
    if ("message" in transactionOrMessage) {
      const versionedTx = transactionOrMessage;
      const wireTransaction2 = versionedTx.serialize();
      const encodedTransaction2 = Buffer.from(wireTransaction2).toString("base64");
      if (Array.isArray(configOrSigners) || includeAccounts !== void 0) {
        throw new Error("Invalid arguments");
      }
      const config2 = configOrSigners || {};
      config2.encoding = "base64";
      if (!("commitment" in config2)) {
        config2.commitment = this.commitment;
      }
      if (configOrSigners && typeof configOrSigners === "object" && "innerInstructions" in configOrSigners) {
        config2.innerInstructions = configOrSigners.innerInstructions;
      }
      const args2 = [encodedTransaction2, config2];
      const unsafeRes2 = await this._rpcRequest("simulateTransaction", args2);
      const res2 = create(unsafeRes2, SimulatedTransactionResponseStruct);
      if ("error" in res2) {
        throw new Error("failed to simulate transaction: " + res2.error.message);
      }
      return res2.result;
    }
    let transaction;
    if (transactionOrMessage instanceof Transaction) {
      let originalTx = transactionOrMessage;
      transaction = new Transaction();
      transaction.feePayer = originalTx.feePayer;
      transaction.instructions = transactionOrMessage.instructions;
      transaction.nonceInfo = originalTx.nonceInfo;
      transaction.signatures = originalTx.signatures;
    } else {
      transaction = Transaction.populate(transactionOrMessage);
      transaction._message = transaction._json = void 0;
    }
    if (configOrSigners !== void 0 && !Array.isArray(configOrSigners)) {
      throw new Error("Invalid arguments");
    }
    const signers = configOrSigners;
    if (transaction.nonceInfo && signers) {
      transaction.sign(...signers);
    } else {
      let disableCache = this._disableBlockhashCaching;
      for (; ; ) {
        const latestBlockhash = await this._blockhashWithExpiryBlockHeight(disableCache);
        transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
        transaction.recentBlockhash = latestBlockhash.blockhash;
        if (!signers) break;
        transaction.sign(...signers);
        if (!transaction.signature) {
          throw new Error("!signature");
        }
        const signature2 = transaction.signature.toString("base64");
        if (!this._blockhashInfo.simulatedSignatures.includes(signature2) && !this._blockhashInfo.transactionSignatures.includes(signature2)) {
          this._blockhashInfo.simulatedSignatures.push(signature2);
          break;
        } else {
          disableCache = true;
        }
      }
    }
    const message = transaction._compile();
    const signData = message.serialize();
    const wireTransaction = transaction._serialize(signData);
    const encodedTransaction = wireTransaction.toString("base64");
    const config = {
      encoding: "base64",
      commitment: this.commitment
    };
    if (includeAccounts) {
      const addresses = (Array.isArray(includeAccounts) ? includeAccounts : message.nonProgramIds()).map((key) => key.toBase58());
      config["accounts"] = {
        encoding: "base64",
        addresses
      };
    }
    if (signers) {
      config.sigVerify = true;
    }
    if (configOrSigners && typeof configOrSigners === "object" && "innerInstructions" in configOrSigners) {
      config.innerInstructions = configOrSigners.innerInstructions;
    }
    const args = [encodedTransaction, config];
    const unsafeRes = await this._rpcRequest("simulateTransaction", args);
    const res = create(unsafeRes, SimulatedTransactionResponseStruct);
    if ("error" in res) {
      let logs;
      if ("data" in res.error) {
        logs = res.error.data.logs;
        if (logs && Array.isArray(logs)) {
          const traceIndent = "\n    ";
          const logTrace = traceIndent + logs.join(traceIndent);
          console.error(res.error.message, logTrace);
        }
      }
      throw new SendTransactionError({
        action: "simulate",
        signature: "",
        transactionMessage: res.error.message,
        logs
      });
    }
    return res.result;
  }
  /**
   * Sign and send a transaction
   *
   * @deprecated Instead, call {@link sendTransaction} with a {@link
   * VersionedTransaction}
   */
  /**
   * Send a signed transaction
   */
  // eslint-disable-next-line no-dupe-class-members
  /**
   * Sign and send a transaction
   */
  // eslint-disable-next-line no-dupe-class-members
  async sendTransaction(transaction, signersOrOptions, options) {
    if ("version" in transaction) {
      if (signersOrOptions && Array.isArray(signersOrOptions)) {
        throw new Error("Invalid arguments");
      }
      const wireTransaction2 = transaction.serialize();
      return await this.sendRawTransaction(wireTransaction2, signersOrOptions);
    }
    if (signersOrOptions === void 0 || !Array.isArray(signersOrOptions)) {
      throw new Error("Invalid arguments");
    }
    const signers = signersOrOptions;
    if (transaction.nonceInfo) {
      transaction.sign(...signers);
    } else {
      let disableCache = this._disableBlockhashCaching;
      for (; ; ) {
        const latestBlockhash = await this._blockhashWithExpiryBlockHeight(disableCache);
        transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.sign(...signers);
        if (!transaction.signature) {
          throw new Error("!signature");
        }
        const signature2 = transaction.signature.toString("base64");
        if (!this._blockhashInfo.transactionSignatures.includes(signature2)) {
          this._blockhashInfo.transactionSignatures.push(signature2);
          break;
        } else {
          disableCache = true;
        }
      }
    }
    const wireTransaction = transaction.serialize();
    return await this.sendRawTransaction(wireTransaction, options);
  }
  /**
   * Send a transaction that has already been signed and serialized into the
   * wire format
   */
  async sendRawTransaction(rawTransaction, options) {
    const encodedTransaction = toBuffer(rawTransaction).toString("base64");
    const result = await this.sendEncodedTransaction(encodedTransaction, options);
    return result;
  }
  /**
   * Send a transaction that has already been signed, serialized into the
   * wire format, and encoded as a base64 string
   */
  async sendEncodedTransaction(encodedTransaction, options) {
    const config = {
      encoding: "base64"
    };
    const skipPreflight = options && options.skipPreflight;
    const preflightCommitment = skipPreflight === true ? "processed" : options && options.preflightCommitment || this.commitment;
    if (options && options.maxRetries != null) {
      config.maxRetries = options.maxRetries;
    }
    if (options && options.minContextSlot != null) {
      config.minContextSlot = options.minContextSlot;
    }
    if (skipPreflight) {
      config.skipPreflight = skipPreflight;
    }
    if (preflightCommitment) {
      config.preflightCommitment = preflightCommitment;
    }
    const args = [encodedTransaction, config];
    const unsafeRes = await this._rpcRequest("sendTransaction", args);
    const res = create(unsafeRes, SendTransactionRpcResult);
    if ("error" in res) {
      let logs = void 0;
      if ("data" in res.error) {
        logs = res.error.data.logs;
      }
      throw new SendTransactionError({
        action: skipPreflight ? "send" : "simulate",
        signature: "",
        transactionMessage: res.error.message,
        logs
      });
    }
    return res.result;
  }
  /**
   * @internal
   */
  _wsOnOpen() {
    this._rpcWebSocketConnected = true;
    this._rpcWebSocketHeartbeat = setInterval(() => {
      (async () => {
        try {
          await this._rpcWebSocket.notify("ping");
        } catch {
        }
      })();
    }, 5e3);
    this._updateSubscriptions();
  }
  /**
   * @internal
   */
  _wsOnError(err) {
    this._rpcWebSocketConnected = false;
    console.error("ws error:", err.message);
  }
  /**
   * @internal
   */
  _wsOnClose(code) {
    this._rpcWebSocketConnected = false;
    this._rpcWebSocketGeneration = (this._rpcWebSocketGeneration + 1) % Number.MAX_SAFE_INTEGER;
    if (this._rpcWebSocketIdleTimeout) {
      clearTimeout(this._rpcWebSocketIdleTimeout);
      this._rpcWebSocketIdleTimeout = null;
    }
    if (this._rpcWebSocketHeartbeat) {
      clearInterval(this._rpcWebSocketHeartbeat);
      this._rpcWebSocketHeartbeat = null;
    }
    if (code === 1e3) {
      this._updateSubscriptions();
      return;
    }
    this._subscriptionCallbacksByServerSubscriptionId = {};
    Object.entries(this._subscriptionsByHash).forEach(([hash, subscription]) => {
      this._setSubscription(hash, {
        ...subscription,
        state: "pending"
      });
    });
  }
  /**
   * @internal
   */
  _setSubscription(hash, nextSubscription) {
    const prevState = this._subscriptionsByHash[hash]?.state;
    this._subscriptionsByHash[hash] = nextSubscription;
    if (prevState !== nextSubscription.state) {
      const stateChangeCallbacks = this._subscriptionStateChangeCallbacksByHash[hash];
      if (stateChangeCallbacks) {
        stateChangeCallbacks.forEach((cb) => {
          try {
            cb(nextSubscription.state);
          } catch {
          }
        });
      }
    }
  }
  /**
   * @internal
   */
  _onSubscriptionStateChange(clientSubscriptionId, callback) {
    const hash = this._subscriptionHashByClientSubscriptionId[clientSubscriptionId];
    if (hash == null) {
      return () => {
      };
    }
    const stateChangeCallbacks = this._subscriptionStateChangeCallbacksByHash[hash] ||= /* @__PURE__ */ new Set();
    stateChangeCallbacks.add(callback);
    return () => {
      stateChangeCallbacks.delete(callback);
      if (stateChangeCallbacks.size === 0) {
        delete this._subscriptionStateChangeCallbacksByHash[hash];
      }
    };
  }
  /**
   * @internal
   */
  async _updateSubscriptions() {
    if (Object.keys(this._subscriptionsByHash).length === 0) {
      if (this._rpcWebSocketConnected) {
        this._rpcWebSocketConnected = false;
        this._rpcWebSocketIdleTimeout = setTimeout(() => {
          this._rpcWebSocketIdleTimeout = null;
          try {
            this._rpcWebSocket.close();
          } catch (err) {
            if (err instanceof Error) {
              console.log(`Error when closing socket connection: ${err.message}`);
            }
          }
        }, 500);
      }
      return;
    }
    if (this._rpcWebSocketIdleTimeout !== null) {
      clearTimeout(this._rpcWebSocketIdleTimeout);
      this._rpcWebSocketIdleTimeout = null;
      this._rpcWebSocketConnected = true;
    }
    if (!this._rpcWebSocketConnected) {
      this._rpcWebSocket.connect();
      return;
    }
    const activeWebSocketGeneration = this._rpcWebSocketGeneration;
    const isCurrentConnectionStillActive = () => {
      return activeWebSocketGeneration === this._rpcWebSocketGeneration;
    };
    await Promise.all(
      // Don't be tempted to change this to `Object.entries`. We call
      // `_updateSubscriptions` recursively when processing the state,
      // so it's important that we look up the *current* version of
      // each subscription, every time we process a hash.
      Object.keys(this._subscriptionsByHash).map(async (hash) => {
        const subscription = this._subscriptionsByHash[hash];
        if (subscription === void 0) {
          return;
        }
        switch (subscription.state) {
          case "pending":
          case "unsubscribed":
            if (subscription.callbacks.size === 0) {
              delete this._subscriptionsByHash[hash];
              if (subscription.state === "unsubscribed") {
                delete this._subscriptionCallbacksByServerSubscriptionId[subscription.serverSubscriptionId];
              }
              await this._updateSubscriptions();
              return;
            }
            await (async () => {
              const {
                args,
                method
              } = subscription;
              try {
                this._setSubscription(hash, {
                  ...subscription,
                  state: "subscribing"
                });
                const serverSubscriptionId = await this._rpcWebSocket.call(method, args);
                this._setSubscription(hash, {
                  ...subscription,
                  serverSubscriptionId,
                  state: "subscribed"
                });
                this._subscriptionCallbacksByServerSubscriptionId[serverSubscriptionId] = subscription.callbacks;
                await this._updateSubscriptions();
              } catch (e) {
                console.error(`Received ${e instanceof Error ? "" : "JSON-RPC "}error calling \`${method}\``, {
                  args,
                  error: e
                });
                if (!isCurrentConnectionStillActive()) {
                  return;
                }
                this._setSubscription(hash, {
                  ...subscription,
                  state: "pending"
                });
                await this._updateSubscriptions();
              }
            })();
            break;
          case "subscribed":
            if (subscription.callbacks.size === 0) {
              await (async () => {
                const {
                  serverSubscriptionId,
                  unsubscribeMethod
                } = subscription;
                if (this._subscriptionsAutoDisposedByRpc.has(serverSubscriptionId)) {
                  this._subscriptionsAutoDisposedByRpc.delete(serverSubscriptionId);
                } else {
                  this._setSubscription(hash, {
                    ...subscription,
                    state: "unsubscribing"
                  });
                  this._setSubscription(hash, {
                    ...subscription,
                    state: "unsubscribing"
                  });
                  try {
                    await this._rpcWebSocket.call(unsubscribeMethod, [serverSubscriptionId]);
                  } catch (e) {
                    if (e instanceof Error) {
                      console.error(`${unsubscribeMethod} error:`, e.message);
                    }
                    if (!isCurrentConnectionStillActive()) {
                      return;
                    }
                    this._setSubscription(hash, {
                      ...subscription,
                      state: "subscribed"
                    });
                    await this._updateSubscriptions();
                    return;
                  }
                }
                this._setSubscription(hash, {
                  ...subscription,
                  state: "unsubscribed"
                });
                await this._updateSubscriptions();
              })();
            }
            break;
        }
      })
    );
  }
  /**
   * @internal
   */
  _handleServerNotification(serverSubscriptionId, callbackArgs) {
    const callbacks = this._subscriptionCallbacksByServerSubscriptionId[serverSubscriptionId];
    if (callbacks === void 0) {
      return;
    }
    callbacks.forEach((cb) => {
      try {
        cb(
          ...callbackArgs
        );
      } catch (e) {
        console.error(e);
      }
    });
  }
  /**
   * @internal
   */
  _wsOnAccountNotification(notification) {
    const {
      result,
      subscription
    } = create(notification, AccountNotificationResult);
    this._handleServerNotification(subscription, [result.value, result.context]);
  }
  /**
   * @internal
   */
  _makeSubscription(subscriptionConfig, args) {
    const clientSubscriptionId = this._nextClientSubscriptionId++;
    const hash = fastStableStringify([subscriptionConfig.method, args]);
    const existingSubscription = this._subscriptionsByHash[hash];
    if (existingSubscription === void 0) {
      this._subscriptionsByHash[hash] = {
        ...subscriptionConfig,
        args,
        callbacks: /* @__PURE__ */ new Set([subscriptionConfig.callback]),
        state: "pending"
      };
    } else {
      existingSubscription.callbacks.add(subscriptionConfig.callback);
    }
    this._subscriptionHashByClientSubscriptionId[clientSubscriptionId] = hash;
    this._subscriptionDisposeFunctionsByClientSubscriptionId[clientSubscriptionId] = async () => {
      delete this._subscriptionDisposeFunctionsByClientSubscriptionId[clientSubscriptionId];
      delete this._subscriptionHashByClientSubscriptionId[clientSubscriptionId];
      const subscription = this._subscriptionsByHash[hash];
      assert(subscription !== void 0, `Could not find a \`Subscription\` when tearing down client subscription #${clientSubscriptionId}`);
      subscription.callbacks.delete(subscriptionConfig.callback);
      await this._updateSubscriptions();
    };
    this._updateSubscriptions();
    return clientSubscriptionId;
  }
  /**
   * Register a callback to be invoked whenever the specified account changes
   *
   * @param publicKey Public key of the account to monitor
   * @param callback Function to invoke whenever the account is changed
   * @param config
   * @return subscription id
   */
  /** @deprecated Instead, pass in an {@link AccountSubscriptionConfig} */
  // eslint-disable-next-line no-dupe-class-members
  // eslint-disable-next-line no-dupe-class-members
  onAccountChange(publicKey2, callback, commitmentOrConfig) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs(
      [publicKey2.toBase58()],
      commitment || this._commitment || "finalized",
      // Apply connection/server default.
      "base64",
      config
    );
    return this._makeSubscription({
      callback,
      method: "accountSubscribe",
      unsubscribeMethod: "accountUnsubscribe"
    }, args);
  }
  /**
   * Deregister an account notification callback
   *
   * @param clientSubscriptionId client subscription id to deregister
   */
  async removeAccountChangeListener(clientSubscriptionId) {
    await this._unsubscribeClientSubscription(clientSubscriptionId, "account change");
  }
  /**
   * @internal
   */
  _wsOnProgramAccountNotification(notification) {
    const {
      result,
      subscription
    } = create(notification, ProgramAccountNotificationResult);
    this._handleServerNotification(subscription, [{
      accountId: result.value.pubkey,
      accountInfo: result.value.account
    }, result.context]);
  }
  /**
   * Register a callback to be invoked whenever accounts owned by the
   * specified program change
   *
   * @param programId Public key of the program to monitor
   * @param callback Function to invoke whenever the account is changed
   * @param config
   * @return subscription id
   */
  /** @deprecated Instead, pass in a {@link ProgramAccountSubscriptionConfig} */
  // eslint-disable-next-line no-dupe-class-members
  // eslint-disable-next-line no-dupe-class-members
  onProgramAccountChange(programId, callback, commitmentOrConfig, maybeFilters) {
    const {
      commitment,
      config
    } = extractCommitmentFromConfig(commitmentOrConfig);
    const args = this._buildArgs(
      [programId.toBase58()],
      commitment || this._commitment || "finalized",
      // Apply connection/server default.
      "base64",
      config ? config : maybeFilters ? {
        filters: applyDefaultMemcmpEncodingToFilters(maybeFilters)
      } : void 0
      /* extra */
    );
    return this._makeSubscription({
      callback,
      method: "programSubscribe",
      unsubscribeMethod: "programUnsubscribe"
    }, args);
  }
  /**
   * Deregister an account notification callback
   *
   * @param clientSubscriptionId client subscription id to deregister
   */
  async removeProgramAccountChangeListener(clientSubscriptionId) {
    await this._unsubscribeClientSubscription(clientSubscriptionId, "program account change");
  }
  /**
   * Registers a callback to be invoked whenever logs are emitted.
   */
  onLogs(filter, callback, commitment) {
    const args = this._buildArgs(
      [typeof filter === "object" ? {
        mentions: [filter.toString()]
      } : filter],
      commitment || this._commitment || "finalized"
      // Apply connection/server default.
    );
    return this._makeSubscription({
      callback,
      method: "logsSubscribe",
      unsubscribeMethod: "logsUnsubscribe"
    }, args);
  }
  /**
   * Deregister a logs callback.
   *
   * @param clientSubscriptionId client subscription id to deregister.
   */
  async removeOnLogsListener(clientSubscriptionId) {
    await this._unsubscribeClientSubscription(clientSubscriptionId, "logs");
  }
  /**
   * @internal
   */
  _wsOnLogsNotification(notification) {
    const {
      result,
      subscription
    } = create(notification, LogsNotificationResult);
    this._handleServerNotification(subscription, [result.value, result.context]);
  }
  /**
   * @internal
   */
  _wsOnSlotNotification(notification) {
    const {
      result,
      subscription
    } = create(notification, SlotNotificationResult);
    this._handleServerNotification(subscription, [result]);
  }
  /**
   * Register a callback to be invoked upon slot changes
   *
   * @param callback Function to invoke whenever the slot changes
   * @return subscription id
   */
  onSlotChange(callback) {
    return this._makeSubscription(
      {
        callback,
        method: "slotSubscribe",
        unsubscribeMethod: "slotUnsubscribe"
      },
      []
      /* args */
    );
  }
  /**
   * Deregister a slot notification callback
   *
   * @param clientSubscriptionId client subscription id to deregister
   */
  async removeSlotChangeListener(clientSubscriptionId) {
    await this._unsubscribeClientSubscription(clientSubscriptionId, "slot change");
  }
  /**
   * @internal
   */
  _wsOnSlotUpdatesNotification(notification) {
    const {
      result,
      subscription
    } = create(notification, SlotUpdateNotificationResult);
    this._handleServerNotification(subscription, [result]);
  }
  /**
   * Register a callback to be invoked upon slot updates. {@link SlotUpdate}'s
   * may be useful to track live progress of a cluster.
   *
   * @param callback Function to invoke whenever the slot updates
   * @return subscription id
   */
  onSlotUpdate(callback) {
    return this._makeSubscription(
      {
        callback,
        method: "slotsUpdatesSubscribe",
        unsubscribeMethod: "slotsUpdatesUnsubscribe"
      },
      []
      /* args */
    );
  }
  /**
   * Deregister a slot update notification callback
   *
   * @param clientSubscriptionId client subscription id to deregister
   */
  async removeSlotUpdateListener(clientSubscriptionId) {
    await this._unsubscribeClientSubscription(clientSubscriptionId, "slot update");
  }
  /**
   * @internal
   */
  async _unsubscribeClientSubscription(clientSubscriptionId, subscriptionName) {
    const dispose = this._subscriptionDisposeFunctionsByClientSubscriptionId[clientSubscriptionId];
    if (dispose) {
      await dispose();
    } else {
      console.warn(`Ignored unsubscribe request because an active subscription with id \`${clientSubscriptionId}\` for '${subscriptionName}' events could not be found.`);
    }
  }
  _buildArgs(args, override, encoding, extra) {
    const commitment = override || this._commitment;
    if (commitment || encoding || extra) {
      let options = {};
      if (encoding) {
        options.encoding = encoding;
      }
      if (commitment) {
        options.commitment = commitment;
      }
      if (extra) {
        options = Object.assign(options, extra);
      }
      args.push(options);
    }
    return args;
  }
  /**
   * @internal
   */
  _buildArgsAtLeastConfirmed(args, override, encoding, extra) {
    const commitment = override || this._commitment;
    if (commitment && !["confirmed", "finalized"].includes(commitment)) {
      throw new Error("Using Connection with default commitment: `" + this._commitment + "`, but method requires at least `confirmed`");
    }
    return this._buildArgs(args, override, encoding, extra);
  }
  /**
   * @internal
   */
  _wsOnSignatureNotification(notification) {
    const {
      result,
      subscription
    } = create(notification, SignatureNotificationResult);
    if (result.value !== "receivedSignature") {
      this._subscriptionsAutoDisposedByRpc.add(subscription);
    }
    this._handleServerNotification(subscription, result.value === "receivedSignature" ? [{
      type: "received"
    }, result.context] : [{
      type: "status",
      result: result.value
    }, result.context]);
  }
  /**
   * Register a callback to be invoked upon signature updates
   *
   * @param signature Transaction signature string in base 58
   * @param callback Function to invoke on signature notifications
   * @param commitment Specify the commitment level signature must reach before notification
   * @return subscription id
   */
  onSignature(signature2, callback, commitment) {
    const args = this._buildArgs(
      [signature2],
      commitment || this._commitment || "finalized"
      // Apply connection/server default.
    );
    const clientSubscriptionId = this._makeSubscription({
      callback: (notification, context) => {
        if (notification.type === "status") {
          callback(notification.result, context);
          try {
            this.removeSignatureListener(clientSubscriptionId);
          } catch (_err) {
          }
        }
      },
      method: "signatureSubscribe",
      unsubscribeMethod: "signatureUnsubscribe"
    }, args);
    return clientSubscriptionId;
  }
  /**
   * Register a callback to be invoked when a transaction is
   * received and/or processed.
   *
   * @param signature Transaction signature string in base 58
   * @param callback Function to invoke on signature notifications
   * @param options Enable received notifications and set the commitment
   *   level that signature must reach before notification
   * @return subscription id
   */
  onSignatureWithOptions(signature2, callback, options) {
    const {
      commitment,
      ...extra
    } = {
      ...options,
      commitment: options && options.commitment || this._commitment || "finalized"
      // Apply connection/server default.
    };
    const args = this._buildArgs([signature2], commitment, void 0, extra);
    const clientSubscriptionId = this._makeSubscription({
      callback: (notification, context) => {
        callback(notification, context);
        try {
          this.removeSignatureListener(clientSubscriptionId);
        } catch (_err) {
        }
      },
      method: "signatureSubscribe",
      unsubscribeMethod: "signatureUnsubscribe"
    }, args);
    return clientSubscriptionId;
  }
  /**
   * Deregister a signature notification callback
   *
   * @param clientSubscriptionId client subscription id to deregister
   */
  async removeSignatureListener(clientSubscriptionId) {
    await this._unsubscribeClientSubscription(clientSubscriptionId, "signature result");
  }
  /**
   * @internal
   */
  _wsOnRootNotification(notification) {
    const {
      result,
      subscription
    } = create(notification, RootNotificationResult);
    this._handleServerNotification(subscription, [result]);
  }
  /**
   * Register a callback to be invoked upon root changes
   *
   * @param callback Function to invoke whenever the root changes
   * @return subscription id
   */
  onRootChange(callback) {
    return this._makeSubscription(
      {
        callback,
        method: "rootSubscribe",
        unsubscribeMethod: "rootUnsubscribe"
      },
      []
      /* args */
    );
  }
  /**
   * Deregister a root notification callback
   *
   * @param clientSubscriptionId client subscription id to deregister
   */
  async removeRootChangeListener(clientSubscriptionId) {
    await this._unsubscribeClientSubscription(clientSubscriptionId, "root change");
  }
}
Object.freeze({
  CreateLookupTable: {
    index: 0,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), u64("recentSlot"), LayoutExports.u8("bumpSeed")])
  },
  FreezeLookupTable: {
    index: 1,
    layout: LayoutExports.struct([LayoutExports.u32("instruction")])
  },
  ExtendLookupTable: {
    index: 2,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), u64(), LayoutExports.seq(publicKey(), LayoutExports.offset(LayoutExports.u32(), -8), "addresses")])
  },
  DeactivateLookupTable: {
    index: 3,
    layout: LayoutExports.struct([LayoutExports.u32("instruction")])
  },
  CloseLookupTable: {
    index: 4,
    layout: LayoutExports.struct([LayoutExports.u32("instruction")])
  }
});
new PublicKey("AddressLookupTab1e1111111111111111111111111");
Object.freeze({
  RequestUnits: {
    index: 0,
    layout: LayoutExports.struct([LayoutExports.u8("instruction"), LayoutExports.u32("units"), LayoutExports.u32("additionalFee")])
  },
  RequestHeapFrame: {
    index: 1,
    layout: LayoutExports.struct([LayoutExports.u8("instruction"), LayoutExports.u32("bytes")])
  },
  SetComputeUnitLimit: {
    index: 2,
    layout: LayoutExports.struct([LayoutExports.u8("instruction"), LayoutExports.u32("units")])
  },
  SetComputeUnitPrice: {
    index: 3,
    layout: LayoutExports.struct([LayoutExports.u8("instruction"), u64("microLamports")])
  }
});
new PublicKey("ComputeBudget111111111111111111111111111111");
LayoutExports.struct([LayoutExports.u8("numSignatures"), LayoutExports.u8("padding"), LayoutExports.u16("signatureOffset"), LayoutExports.u16("signatureInstructionIndex"), LayoutExports.u16("publicKeyOffset"), LayoutExports.u16("publicKeyInstructionIndex"), LayoutExports.u16("messageDataOffset"), LayoutExports.u16("messageDataSize"), LayoutExports.u16("messageInstructionIndex")]);
new PublicKey("Ed25519SigVerify111111111111111111111111111");
secp256k1.utils.isValidPrivateKey;
LayoutExports.struct([LayoutExports.u8("numSignatures"), LayoutExports.u16("signatureOffset"), LayoutExports.u8("signatureInstructionIndex"), LayoutExports.u16("ethAddressOffset"), LayoutExports.u8("ethAddressInstructionIndex"), LayoutExports.u16("messageDataOffset"), LayoutExports.u16("messageDataSize"), LayoutExports.u8("messageInstructionIndex"), LayoutExports.blob(20, "ethAddress"), LayoutExports.blob(64, "signature"), LayoutExports.u8("recoveryId")]);
new PublicKey("KeccakSecp256k11111111111111111111111111111");
var _Lockup;
new PublicKey("StakeConfig11111111111111111111111111111111");
class Lockup {
  /**
   * Create a new Lockup object
   */
  constructor(unixTimestamp, epoch, custodian) {
    this.unixTimestamp = void 0;
    this.epoch = void 0;
    this.custodian = void 0;
    this.unixTimestamp = unixTimestamp;
    this.epoch = epoch;
    this.custodian = custodian;
  }
  /**
   * Default, inactive Lockup value
   */
}
_Lockup = Lockup;
Lockup.default = new _Lockup(0, 0, PublicKey.default);
Object.freeze({
  Initialize: {
    index: 0,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), authorized(), lockup()])
  },
  Authorize: {
    index: 1,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), publicKey("newAuthorized"), LayoutExports.u32("stakeAuthorizationType")])
  },
  Delegate: {
    index: 2,
    layout: LayoutExports.struct([LayoutExports.u32("instruction")])
  },
  Split: {
    index: 3,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), LayoutExports.ns64("lamports")])
  },
  Withdraw: {
    index: 4,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), LayoutExports.ns64("lamports")])
  },
  Deactivate: {
    index: 5,
    layout: LayoutExports.struct([LayoutExports.u32("instruction")])
  },
  Merge: {
    index: 7,
    layout: LayoutExports.struct([LayoutExports.u32("instruction")])
  },
  AuthorizeWithSeed: {
    index: 8,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), publicKey("newAuthorized"), LayoutExports.u32("stakeAuthorizationType"), rustString("authoritySeed"), publicKey("authorityOwner")])
  }
});
new PublicKey("Stake11111111111111111111111111111111111111");
Object.freeze({
  InitializeAccount: {
    index: 0,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), voteInit()])
  },
  Authorize: {
    index: 1,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), publicKey("newAuthorized"), LayoutExports.u32("voteAuthorizationType")])
  },
  Withdraw: {
    index: 3,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), LayoutExports.ns64("lamports")])
  },
  UpdateValidatorIdentity: {
    index: 4,
    layout: LayoutExports.struct([LayoutExports.u32("instruction")])
  },
  AuthorizeWithSeed: {
    index: 10,
    layout: LayoutExports.struct([LayoutExports.u32("instruction"), voteAuthorizeWithSeedArgs()])
  }
});
new PublicKey("Vote111111111111111111111111111111111111111");
new PublicKey("Va1idator1nfo111111111111111111111111111111");
type({
  name: string(),
  website: optional(string()),
  details: optional(string()),
  iconUrl: optional(string()),
  keybaseUsername: optional(string())
});
new PublicKey("Vote111111111111111111111111111111111111111");
LayoutExports.struct([
  publicKey("nodePubkey"),
  publicKey("authorizedWithdrawer"),
  LayoutExports.u8("commission"),
  LayoutExports.nu64(),
  // votes.length
  LayoutExports.seq(LayoutExports.struct([LayoutExports.nu64("slot"), LayoutExports.u32("confirmationCount")]), LayoutExports.offset(LayoutExports.u32(), -8), "votes"),
  LayoutExports.u8("rootSlotValid"),
  LayoutExports.nu64("rootSlot"),
  LayoutExports.nu64(),
  // authorizedVoters.length
  LayoutExports.seq(LayoutExports.struct([LayoutExports.nu64("epoch"), publicKey("authorizedVoter")]), LayoutExports.offset(LayoutExports.u32(), -8), "authorizedVoters"),
  LayoutExports.struct([LayoutExports.seq(LayoutExports.struct([publicKey("authorizedPubkey"), LayoutExports.nu64("epochOfLastAuthorizedSwitch"), LayoutExports.nu64("targetEpoch")]), 32, "buf"), LayoutExports.nu64("idx"), LayoutExports.u8("isEmpty")], "priorVoters"),
  LayoutExports.nu64(),
  // epochCredits.length
  LayoutExports.seq(LayoutExports.struct([LayoutExports.nu64("epoch"), LayoutExports.nu64("credits"), LayoutExports.nu64("prevCredits")]), LayoutExports.offset(LayoutExports.u32(), -8), "epochCredits"),
  LayoutExports.struct([LayoutExports.nu64("slot"), LayoutExports.nu64("timestamp")], "lastTimestamp")
]);
export {
  Connection as C,
  PublicKey as P,
  Transaction as T,
  VersionedMessage as V,
  VersionedTransaction as a
};
