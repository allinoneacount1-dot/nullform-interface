import require$$0 from "buffer";
var Layout = {};
var hasRequiredLayout;
function requireLayout() {
  if (hasRequiredLayout) return Layout;
  hasRequiredLayout = 1;
  Object.defineProperty(Layout, "__esModule", { value: true });
  Layout.s16 = Layout.s8 = Layout.nu64be = Layout.u48be = Layout.u40be = Layout.u32be = Layout.u24be = Layout.u16be = Layout.nu64 = Layout.u48 = Layout.u40 = Layout.u32 = Layout.u24 = Layout.u16 = Layout.u8 = Layout.offset = Layout.greedy = Layout.Constant = Layout.UTF8 = Layout.CString = Layout.Blob = Layout.Boolean = Layout.BitField = Layout.BitStructure = Layout.VariantLayout = Layout.Union = Layout.UnionLayoutDiscriminator = Layout.UnionDiscriminator = Layout.Structure = Layout.Sequence = Layout.DoubleBE = Layout.Double = Layout.FloatBE = Layout.Float = Layout.NearInt64BE = Layout.NearInt64 = Layout.NearUInt64BE = Layout.NearUInt64 = Layout.IntBE = Layout.Int = Layout.UIntBE = Layout.UInt = Layout.OffsetLayout = Layout.GreedyCount = Layout.ExternalLayout = Layout.bindConstructorLayout = Layout.nameWithProperty = Layout.Layout = Layout.uint8ArrayToBuffer = Layout.checkUint8Array = void 0;
  Layout.constant = Layout.utf8 = Layout.cstr = Layout.blob = Layout.unionLayoutDiscriminator = Layout.union = Layout.seq = Layout.bits = Layout.struct = Layout.f64be = Layout.f64 = Layout.f32be = Layout.f32 = Layout.ns64be = Layout.s48be = Layout.s40be = Layout.s32be = Layout.s24be = Layout.s16be = Layout.ns64 = Layout.s48 = Layout.s40 = Layout.s32 = Layout.s24 = void 0;
  const buffer_1 = require$$0;
  function checkUint8Array(b) {
    if (!(b instanceof Uint8Array)) {
      throw new TypeError("b must be a Uint8Array");
    }
  }
  Layout.checkUint8Array = checkUint8Array;
  function uint8ArrayToBuffer(b) {
    checkUint8Array(b);
    return buffer_1.Buffer.from(b.buffer, b.byteOffset, b.length);
  }
  Layout.uint8ArrayToBuffer = uint8ArrayToBuffer;
  let Layout$1 = class Layout {
    constructor(span, property) {
      if (!Number.isInteger(span)) {
        throw new TypeError("span must be an integer");
      }
      this.span = span;
      this.property = property;
    }
    /** Function to create an Object into which decoded properties will
     * be written.
     *
     * Used only for layouts that {@link Layout#decode|decode} to Object
     * instances, which means:
     * * {@link Structure}
     * * {@link Union}
     * * {@link VariantLayout}
     * * {@link BitStructure}
     *
     * If left undefined the JavaScript representation of these layouts
     * will be Object instances.
     *
     * See {@link bindConstructorLayout}.
     */
    makeDestinationObject() {
      return {};
    }
    /**
     * Calculate the span of a specific instance of a layout.
     *
     * @param {Uint8Array} b - the buffer that contains an encoded instance.
     *
     * @param {Number} [offset] - the offset at which the encoded instance
     * starts.  If absent a zero offset is inferred.
     *
     * @return {Number} - the number of bytes covered by the layout
     * instance.  If this method is not overridden in a subclass the
     * definition-time constant {@link Layout#span|span} will be
     * returned.
     *
     * @throws {RangeError} - if the length of the value cannot be
     * determined.
     */
    getSpan(b, offset) {
      if (0 > this.span) {
        throw new RangeError("indeterminate span");
      }
      return this.span;
    }
    /**
     * Replicate the layout using a new property.
     *
     * This function must be used to get a structurally-equivalent layout
     * with a different name since all {@link Layout} instances are
     * immutable.
     *
     * **NOTE** This is a shallow copy.  All fields except {@link
     * Layout#property|property} are strictly equal to the origin layout.
     *
     * @param {String} property - the value for {@link
     * Layout#property|property} in the replica.
     *
     * @returns {Layout} - the copy with {@link Layout#property|property}
     * set to `property`.
     */
    replicate(property) {
      const rv = Object.create(this.constructor.prototype);
      Object.assign(rv, this);
      rv.property = property;
      return rv;
    }
    /**
     * Create an object from layout properties and an array of values.
     *
     * **NOTE** This function returns `undefined` if invoked on a layout
     * that does not return its value as an Object.  Objects are
     * returned for things that are a {@link Structure}, which includes
     * {@link VariantLayout|variant layouts} if they are structures, and
     * excludes {@link Union}s.  If you want this feature for a union
     * you must use {@link Union.getVariant|getVariant} to select the
     * desired layout.
     *
     * @param {Array} values - an array of values that correspond to the
     * default order for properties.  As with {@link Layout#decode|decode}
     * layout elements that have no property name are skipped when
     * iterating over the array values.  Only the top-level properties are
     * assigned; arguments are not assigned to properties of contained
     * layouts.  Any unused values are ignored.
     *
     * @return {(Object|undefined)}
     */
    fromArray(values) {
      return void 0;
    }
  };
  Layout.Layout = Layout$1;
  function nameWithProperty(name, lo) {
    if (lo.property) {
      return name + "[" + lo.property + "]";
    }
    return name;
  }
  Layout.nameWithProperty = nameWithProperty;
  function bindConstructorLayout(Class, layout) {
    if ("function" !== typeof Class) {
      throw new TypeError("Class must be constructor");
    }
    if (Object.prototype.hasOwnProperty.call(Class, "layout_")) {
      throw new Error("Class is already bound to a layout");
    }
    if (!(layout && layout instanceof Layout$1)) {
      throw new TypeError("layout must be a Layout");
    }
    if (Object.prototype.hasOwnProperty.call(layout, "boundConstructor_")) {
      throw new Error("layout is already bound to a constructor");
    }
    Class.layout_ = layout;
    layout.boundConstructor_ = Class;
    layout.makeDestinationObject = (() => new Class());
    Object.defineProperty(Class.prototype, "encode", {
      value(b, offset) {
        return layout.encode(this, b, offset);
      },
      writable: true
    });
    Object.defineProperty(Class, "decode", {
      value(b, offset) {
        return layout.decode(b, offset);
      },
      writable: true
    });
  }
  Layout.bindConstructorLayout = bindConstructorLayout;
  class ExternalLayout extends Layout$1 {
    /**
     * Return `true` iff the external layout decodes to an unsigned
     * integer layout.
     *
     * In that case it can be used as the source of {@link
     * Sequence#count|Sequence counts}, {@link Blob#length|Blob lengths},
     * or as {@link UnionLayoutDiscriminator#layout|external union
     * discriminators}.
     *
     * @abstract
     */
    isCount() {
      throw new Error("ExternalLayout is abstract");
    }
  }
  Layout.ExternalLayout = ExternalLayout;
  class GreedyCount extends ExternalLayout {
    constructor(elementSpan = 1, property) {
      if (!Number.isInteger(elementSpan) || 0 >= elementSpan) {
        throw new TypeError("elementSpan must be a (positive) integer");
      }
      super(-1, property);
      this.elementSpan = elementSpan;
    }
    /** @override */
    isCount() {
      return true;
    }
    /** @override */
    decode(b, offset = 0) {
      checkUint8Array(b);
      const rem = b.length - offset;
      return Math.floor(rem / this.elementSpan);
    }
    /** @override */
    encode(src, b, offset) {
      return 0;
    }
  }
  Layout.GreedyCount = GreedyCount;
  class OffsetLayout extends ExternalLayout {
    constructor(layout, offset = 0, property) {
      if (!(layout instanceof Layout$1)) {
        throw new TypeError("layout must be a Layout");
      }
      if (!Number.isInteger(offset)) {
        throw new TypeError("offset must be integer or undefined");
      }
      super(layout.span, property || layout.property);
      this.layout = layout;
      this.offset = offset;
    }
    /** @override */
    isCount() {
      return this.layout instanceof UInt || this.layout instanceof UIntBE;
    }
    /** @override */
    decode(b, offset = 0) {
      return this.layout.decode(b, offset + this.offset);
    }
    /** @override */
    encode(src, b, offset = 0) {
      return this.layout.encode(src, b, offset + this.offset);
    }
  }
  Layout.OffsetLayout = OffsetLayout;
  class UInt extends Layout$1 {
    constructor(span, property) {
      super(span, property);
      if (6 < this.span) {
        throw new RangeError("span must not exceed 6 bytes");
      }
    }
    /** @override */
    decode(b, offset = 0) {
      return uint8ArrayToBuffer(b).readUIntLE(offset, this.span);
    }
    /** @override */
    encode(src, b, offset = 0) {
      uint8ArrayToBuffer(b).writeUIntLE(src, offset, this.span);
      return this.span;
    }
  }
  Layout.UInt = UInt;
  class UIntBE extends Layout$1 {
    constructor(span, property) {
      super(span, property);
      if (6 < this.span) {
        throw new RangeError("span must not exceed 6 bytes");
      }
    }
    /** @override */
    decode(b, offset = 0) {
      return uint8ArrayToBuffer(b).readUIntBE(offset, this.span);
    }
    /** @override */
    encode(src, b, offset = 0) {
      uint8ArrayToBuffer(b).writeUIntBE(src, offset, this.span);
      return this.span;
    }
  }
  Layout.UIntBE = UIntBE;
  class Int extends Layout$1 {
    constructor(span, property) {
      super(span, property);
      if (6 < this.span) {
        throw new RangeError("span must not exceed 6 bytes");
      }
    }
    /** @override */
    decode(b, offset = 0) {
      return uint8ArrayToBuffer(b).readIntLE(offset, this.span);
    }
    /** @override */
    encode(src, b, offset = 0) {
      uint8ArrayToBuffer(b).writeIntLE(src, offset, this.span);
      return this.span;
    }
  }
  Layout.Int = Int;
  class IntBE extends Layout$1 {
    constructor(span, property) {
      super(span, property);
      if (6 < this.span) {
        throw new RangeError("span must not exceed 6 bytes");
      }
    }
    /** @override */
    decode(b, offset = 0) {
      return uint8ArrayToBuffer(b).readIntBE(offset, this.span);
    }
    /** @override */
    encode(src, b, offset = 0) {
      uint8ArrayToBuffer(b).writeIntBE(src, offset, this.span);
      return this.span;
    }
  }
  Layout.IntBE = IntBE;
  const V2E32 = Math.pow(2, 32);
  function divmodInt64(src) {
    const hi32 = Math.floor(src / V2E32);
    const lo32 = src - hi32 * V2E32;
    return { hi32, lo32 };
  }
  function roundedInt64(hi32, lo32) {
    return hi32 * V2E32 + lo32;
  }
  class NearUInt64 extends Layout$1 {
    constructor(property) {
      super(8, property);
    }
    /** @override */
    decode(b, offset = 0) {
      const buffer = uint8ArrayToBuffer(b);
      const lo32 = buffer.readUInt32LE(offset);
      const hi32 = buffer.readUInt32LE(offset + 4);
      return roundedInt64(hi32, lo32);
    }
    /** @override */
    encode(src, b, offset = 0) {
      const split = divmodInt64(src);
      const buffer = uint8ArrayToBuffer(b);
      buffer.writeUInt32LE(split.lo32, offset);
      buffer.writeUInt32LE(split.hi32, offset + 4);
      return 8;
    }
  }
  Layout.NearUInt64 = NearUInt64;
  class NearUInt64BE extends Layout$1 {
    constructor(property) {
      super(8, property);
    }
    /** @override */
    decode(b, offset = 0) {
      const buffer = uint8ArrayToBuffer(b);
      const hi32 = buffer.readUInt32BE(offset);
      const lo32 = buffer.readUInt32BE(offset + 4);
      return roundedInt64(hi32, lo32);
    }
    /** @override */
    encode(src, b, offset = 0) {
      const split = divmodInt64(src);
      const buffer = uint8ArrayToBuffer(b);
      buffer.writeUInt32BE(split.hi32, offset);
      buffer.writeUInt32BE(split.lo32, offset + 4);
      return 8;
    }
  }
  Layout.NearUInt64BE = NearUInt64BE;
  class NearInt64 extends Layout$1 {
    constructor(property) {
      super(8, property);
    }
    /** @override */
    decode(b, offset = 0) {
      const buffer = uint8ArrayToBuffer(b);
      const lo32 = buffer.readUInt32LE(offset);
      const hi32 = buffer.readInt32LE(offset + 4);
      return roundedInt64(hi32, lo32);
    }
    /** @override */
    encode(src, b, offset = 0) {
      const split = divmodInt64(src);
      const buffer = uint8ArrayToBuffer(b);
      buffer.writeUInt32LE(split.lo32, offset);
      buffer.writeInt32LE(split.hi32, offset + 4);
      return 8;
    }
  }
  Layout.NearInt64 = NearInt64;
  class NearInt64BE extends Layout$1 {
    constructor(property) {
      super(8, property);
    }
    /** @override */
    decode(b, offset = 0) {
      const buffer = uint8ArrayToBuffer(b);
      const hi32 = buffer.readInt32BE(offset);
      const lo32 = buffer.readUInt32BE(offset + 4);
      return roundedInt64(hi32, lo32);
    }
    /** @override */
    encode(src, b, offset = 0) {
      const split = divmodInt64(src);
      const buffer = uint8ArrayToBuffer(b);
      buffer.writeInt32BE(split.hi32, offset);
      buffer.writeUInt32BE(split.lo32, offset + 4);
      return 8;
    }
  }
  Layout.NearInt64BE = NearInt64BE;
  class Float extends Layout$1 {
    constructor(property) {
      super(4, property);
    }
    /** @override */
    decode(b, offset = 0) {
      return uint8ArrayToBuffer(b).readFloatLE(offset);
    }
    /** @override */
    encode(src, b, offset = 0) {
      uint8ArrayToBuffer(b).writeFloatLE(src, offset);
      return 4;
    }
  }
  Layout.Float = Float;
  class FloatBE extends Layout$1 {
    constructor(property) {
      super(4, property);
    }
    /** @override */
    decode(b, offset = 0) {
      return uint8ArrayToBuffer(b).readFloatBE(offset);
    }
    /** @override */
    encode(src, b, offset = 0) {
      uint8ArrayToBuffer(b).writeFloatBE(src, offset);
      return 4;
    }
  }
  Layout.FloatBE = FloatBE;
  class Double extends Layout$1 {
    constructor(property) {
      super(8, property);
    }
    /** @override */
    decode(b, offset = 0) {
      return uint8ArrayToBuffer(b).readDoubleLE(offset);
    }
    /** @override */
    encode(src, b, offset = 0) {
      uint8ArrayToBuffer(b).writeDoubleLE(src, offset);
      return 8;
    }
  }
  Layout.Double = Double;
  class DoubleBE extends Layout$1 {
    constructor(property) {
      super(8, property);
    }
    /** @override */
    decode(b, offset = 0) {
      return uint8ArrayToBuffer(b).readDoubleBE(offset);
    }
    /** @override */
    encode(src, b, offset = 0) {
      uint8ArrayToBuffer(b).writeDoubleBE(src, offset);
      return 8;
    }
  }
  Layout.DoubleBE = DoubleBE;
  class Sequence extends Layout$1 {
    constructor(elementLayout, count, property) {
      if (!(elementLayout instanceof Layout$1)) {
        throw new TypeError("elementLayout must be a Layout");
      }
      if (!(count instanceof ExternalLayout && count.isCount() || Number.isInteger(count) && 0 <= count)) {
        throw new TypeError("count must be non-negative integer or an unsigned integer ExternalLayout");
      }
      let span = -1;
      if (!(count instanceof ExternalLayout) && 0 < elementLayout.span) {
        span = count * elementLayout.span;
      }
      super(span, property);
      this.elementLayout = elementLayout;
      this.count = count;
    }
    /** @override */
    getSpan(b, offset = 0) {
      if (0 <= this.span) {
        return this.span;
      }
      let span = 0;
      let count = this.count;
      if (count instanceof ExternalLayout) {
        count = count.decode(b, offset);
      }
      if (0 < this.elementLayout.span) {
        span = count * this.elementLayout.span;
      } else {
        let idx = 0;
        while (idx < count) {
          span += this.elementLayout.getSpan(b, offset + span);
          ++idx;
        }
      }
      return span;
    }
    /** @override */
    decode(b, offset = 0) {
      const rv = [];
      let i = 0;
      let count = this.count;
      if (count instanceof ExternalLayout) {
        count = count.decode(b, offset);
      }
      while (i < count) {
        rv.push(this.elementLayout.decode(b, offset));
        offset += this.elementLayout.getSpan(b, offset);
        i += 1;
      }
      return rv;
    }
    /** Implement {@link Layout#encode|encode} for {@link Sequence}.
     *
     * **NOTE** If `src` is shorter than {@link Sequence#count|count} then
     * the unused space in the buffer is left unchanged.  If `src` is
     * longer than {@link Sequence#count|count} the unneeded elements are
     * ignored.
     *
     * **NOTE** If {@link Layout#count|count} is an instance of {@link
     * ExternalLayout} then the length of `src` will be encoded as the
     * count after `src` is encoded. */
    encode(src, b, offset = 0) {
      const elo = this.elementLayout;
      const span = src.reduce((span2, v) => {
        return span2 + elo.encode(v, b, offset + span2);
      }, 0);
      if (this.count instanceof ExternalLayout) {
        this.count.encode(src.length, b, offset);
      }
      return span;
    }
  }
  Layout.Sequence = Sequence;
  class Structure extends Layout$1 {
    constructor(fields, property, decodePrefixes) {
      if (!(Array.isArray(fields) && fields.reduce((acc, v) => acc && v instanceof Layout$1, true))) {
        throw new TypeError("fields must be array of Layout instances");
      }
      if ("boolean" === typeof property && void 0 === decodePrefixes) {
        decodePrefixes = property;
        property = void 0;
      }
      for (const fd of fields) {
        if (0 > fd.span && void 0 === fd.property) {
          throw new Error("fields cannot contain unnamed variable-length layout");
        }
      }
      let span = -1;
      try {
        span = fields.reduce((span2, fd) => span2 + fd.getSpan(), 0);
      } catch (e) {
      }
      super(span, property);
      this.fields = fields;
      this.decodePrefixes = !!decodePrefixes;
    }
    /** @override */
    getSpan(b, offset = 0) {
      if (0 <= this.span) {
        return this.span;
      }
      let span = 0;
      try {
        span = this.fields.reduce((span2, fd) => {
          const fsp = fd.getSpan(b, offset);
          offset += fsp;
          return span2 + fsp;
        }, 0);
      } catch (e) {
        throw new RangeError("indeterminate span");
      }
      return span;
    }
    /** @override */
    decode(b, offset = 0) {
      checkUint8Array(b);
      const dest = this.makeDestinationObject();
      for (const fd of this.fields) {
        if (void 0 !== fd.property) {
          dest[fd.property] = fd.decode(b, offset);
        }
        offset += fd.getSpan(b, offset);
        if (this.decodePrefixes && b.length === offset) {
          break;
        }
      }
      return dest;
    }
    /** Implement {@link Layout#encode|encode} for {@link Structure}.
     *
     * If `src` is missing a property for a member with a defined {@link
     * Layout#property|property} the corresponding region of the buffer is
     * left unmodified. */
    encode(src, b, offset = 0) {
      const firstOffset = offset;
      let lastOffset = 0;
      let lastWrote = 0;
      for (const fd of this.fields) {
        let span = fd.span;
        lastWrote = 0 < span ? span : 0;
        if (void 0 !== fd.property) {
          const fv = src[fd.property];
          if (void 0 !== fv) {
            lastWrote = fd.encode(fv, b, offset);
            if (0 > span) {
              span = fd.getSpan(b, offset);
            }
          }
        }
        lastOffset = offset;
        offset += span;
      }
      return lastOffset + lastWrote - firstOffset;
    }
    /** @override */
    fromArray(values) {
      const dest = this.makeDestinationObject();
      for (const fd of this.fields) {
        if (void 0 !== fd.property && 0 < values.length) {
          dest[fd.property] = values.shift();
        }
      }
      return dest;
    }
    /**
     * Get access to the layout of a given property.
     *
     * @param {String} property - the structure member of interest.
     *
     * @return {Layout} - the layout associated with `property`, or
     * undefined if there is no such property.
     */
    layoutFor(property) {
      if ("string" !== typeof property) {
        throw new TypeError("property must be string");
      }
      for (const fd of this.fields) {
        if (fd.property === property) {
          return fd;
        }
      }
      return void 0;
    }
    /**
     * Get the offset of a structure member.
     *
     * @param {String} property - the structure member of interest.
     *
     * @return {Number} - the offset in bytes to the start of `property`
     * within the structure, or undefined if `property` is not a field
     * within the structure.  If the property is a member but follows a
     * variable-length structure member a negative number will be
     * returned.
     */
    offsetOf(property) {
      if ("string" !== typeof property) {
        throw new TypeError("property must be string");
      }
      let offset = 0;
      for (const fd of this.fields) {
        if (fd.property === property) {
          return offset;
        }
        if (0 > fd.span) {
          offset = -1;
        } else if (0 <= offset) {
          offset += fd.span;
        }
      }
      return void 0;
    }
  }
  Layout.Structure = Structure;
  class UnionDiscriminator {
    constructor(property) {
      this.property = property;
    }
    /** Analog to {@link Layout#decode|Layout decode} for union discriminators.
     *
     * The implementation of this method need not reference the buffer if
     * variant information is available through other means. */
    decode(b, offset) {
      throw new Error("UnionDiscriminator is abstract");
    }
    /** Analog to {@link Layout#decode|Layout encode} for union discriminators.
     *
     * The implementation of this method need not store the value if
     * variant information is maintained through other means. */
    encode(src, b, offset) {
      throw new Error("UnionDiscriminator is abstract");
    }
  }
  Layout.UnionDiscriminator = UnionDiscriminator;
  class UnionLayoutDiscriminator extends UnionDiscriminator {
    constructor(layout, property) {
      if (!(layout instanceof ExternalLayout && layout.isCount())) {
        throw new TypeError("layout must be an unsigned integer ExternalLayout");
      }
      super(property || layout.property || "variant");
      this.layout = layout;
    }
    /** Delegate decoding to {@link UnionLayoutDiscriminator#layout|layout}. */
    decode(b, offset) {
      return this.layout.decode(b, offset);
    }
    /** Delegate encoding to {@link UnionLayoutDiscriminator#layout|layout}. */
    encode(src, b, offset) {
      return this.layout.encode(src, b, offset);
    }
  }
  Layout.UnionLayoutDiscriminator = UnionLayoutDiscriminator;
  class Union extends Layout$1 {
    constructor(discr, defaultLayout, property) {
      let discriminator;
      if (discr instanceof UInt || discr instanceof UIntBE) {
        discriminator = new UnionLayoutDiscriminator(new OffsetLayout(discr));
      } else if (discr instanceof ExternalLayout && discr.isCount()) {
        discriminator = new UnionLayoutDiscriminator(discr);
      } else if (!(discr instanceof UnionDiscriminator)) {
        throw new TypeError("discr must be a UnionDiscriminator or an unsigned integer layout");
      } else {
        discriminator = discr;
      }
      if (void 0 === defaultLayout) {
        defaultLayout = null;
      }
      if (!(null === defaultLayout || defaultLayout instanceof Layout$1)) {
        throw new TypeError("defaultLayout must be null or a Layout");
      }
      if (null !== defaultLayout) {
        if (0 > defaultLayout.span) {
          throw new Error("defaultLayout must have constant span");
        }
        if (void 0 === defaultLayout.property) {
          defaultLayout = defaultLayout.replicate("content");
        }
      }
      let span = -1;
      if (defaultLayout) {
        span = defaultLayout.span;
        if (0 <= span && (discr instanceof UInt || discr instanceof UIntBE)) {
          span += discriminator.layout.span;
        }
      }
      super(span, property);
      this.discriminator = discriminator;
      this.usesPrefixDiscriminator = discr instanceof UInt || discr instanceof UIntBE;
      this.defaultLayout = defaultLayout;
      this.registry = {};
      let boundGetSourceVariant = this.defaultGetSourceVariant.bind(this);
      this.getSourceVariant = function(src) {
        return boundGetSourceVariant(src);
      };
      this.configGetSourceVariant = function(gsv) {
        boundGetSourceVariant = gsv.bind(this);
      };
    }
    /** @override */
    getSpan(b, offset = 0) {
      if (0 <= this.span) {
        return this.span;
      }
      const vlo = this.getVariant(b, offset);
      if (!vlo) {
        throw new Error("unable to determine span for unrecognized variant");
      }
      return vlo.getSpan(b, offset);
    }
    /**
     * Method to infer a registered Union variant compatible with `src`.
     *
     * The first satisfied rule in the following sequence defines the
     * return value:
     * * If `src` has properties matching the Union discriminator and
     *   the default layout, `undefined` is returned regardless of the
     *   value of the discriminator property (this ensures the default
     *   layout will be used);
     * * If `src` has a property matching the Union discriminator, the
     *   value of the discriminator identifies a registered variant, and
     *   either (a) the variant has no layout, or (b) `src` has the
     *   variant's property, then the variant is returned (because the
     *   source satisfies the constraints of the variant it identifies);
     * * If `src` does not have a property matching the Union
     *   discriminator, but does have a property matching a registered
     *   variant, then the variant is returned (because the source
     *   matches a variant without an explicit conflict);
     * * An error is thrown (because we either can't identify a variant,
     *   or we were explicitly told the variant but can't satisfy it).
     *
     * @param {Object} src - an object presumed to be compatible with
     * the content of the Union.
     *
     * @return {(undefined|VariantLayout)} - as described above.
     *
     * @throws {Error} - if `src` cannot be associated with a default or
     * registered variant.
     */
    defaultGetSourceVariant(src) {
      if (Object.prototype.hasOwnProperty.call(src, this.discriminator.property)) {
        if (this.defaultLayout && this.defaultLayout.property && Object.prototype.hasOwnProperty.call(src, this.defaultLayout.property)) {
          return void 0;
        }
        const vlo = this.registry[src[this.discriminator.property]];
        if (vlo && (!vlo.layout || vlo.property && Object.prototype.hasOwnProperty.call(src, vlo.property))) {
          return vlo;
        }
      } else {
        for (const tag in this.registry) {
          const vlo = this.registry[tag];
          if (vlo.property && Object.prototype.hasOwnProperty.call(src, vlo.property)) {
            return vlo;
          }
        }
      }
      throw new Error("unable to infer src variant");
    }
    /** Implement {@link Layout#decode|decode} for {@link Union}.
     *
     * If the variant is {@link Union#addVariant|registered} the return
     * value is an instance of that variant, with no explicit
     * discriminator.  Otherwise the {@link Union#defaultLayout|default
     * layout} is used to decode the content. */
    decode(b, offset = 0) {
      let dest;
      const dlo = this.discriminator;
      const discr = dlo.decode(b, offset);
      const clo = this.registry[discr];
      if (void 0 === clo) {
        const defaultLayout = this.defaultLayout;
        let contentOffset = 0;
        if (this.usesPrefixDiscriminator) {
          contentOffset = dlo.layout.span;
        }
        dest = this.makeDestinationObject();
        dest[dlo.property] = discr;
        dest[defaultLayout.property] = defaultLayout.decode(b, offset + contentOffset);
      } else {
        dest = clo.decode(b, offset);
      }
      return dest;
    }
    /** Implement {@link Layout#encode|encode} for {@link Union}.
     *
     * This API assumes the `src` object is consistent with the union's
     * {@link Union#defaultLayout|default layout}.  To encode variants
     * use the appropriate variant-specific {@link VariantLayout#encode}
     * method. */
    encode(src, b, offset = 0) {
      const vlo = this.getSourceVariant(src);
      if (void 0 === vlo) {
        const dlo = this.discriminator;
        const clo = this.defaultLayout;
        let contentOffset = 0;
        if (this.usesPrefixDiscriminator) {
          contentOffset = dlo.layout.span;
        }
        dlo.encode(src[dlo.property], b, offset);
        return contentOffset + clo.encode(src[clo.property], b, offset + contentOffset);
      }
      return vlo.encode(src, b, offset);
    }
    /** Register a new variant structure within a union.  The newly
     * created variant is returned.
     *
     * @param {Number} variant - initializer for {@link
     * VariantLayout#variant|variant}.
     *
     * @param {Layout} layout - initializer for {@link
     * VariantLayout#layout|layout}.
     *
     * @param {String} property - initializer for {@link
     * Layout#property|property}.
     *
     * @return {VariantLayout} */
    addVariant(variant, layout, property) {
      const rv = new VariantLayout(this, variant, layout, property);
      this.registry[variant] = rv;
      return rv;
    }
    /**
     * Get the layout associated with a registered variant.
     *
     * If `vb` does not produce a registered variant the function returns
     * `undefined`.
     *
     * @param {(Number|Uint8Array)} vb - either the variant number, or a
     * buffer from which the discriminator is to be read.
     *
     * @param {Number} offset - offset into `vb` for the start of the
     * union.  Used only when `vb` is an instance of {Uint8Array}.
     *
     * @return {({VariantLayout}|undefined)}
     */
    getVariant(vb, offset = 0) {
      let variant;
      if (vb instanceof Uint8Array) {
        variant = this.discriminator.decode(vb, offset);
      } else {
        variant = vb;
      }
      return this.registry[variant];
    }
  }
  Layout.Union = Union;
  class VariantLayout extends Layout$1 {
    constructor(union, variant, layout, property) {
      if (!(union instanceof Union)) {
        throw new TypeError("union must be a Union");
      }
      if (!Number.isInteger(variant) || 0 > variant) {
        throw new TypeError("variant must be a (non-negative) integer");
      }
      if ("string" === typeof layout && void 0 === property) {
        property = layout;
        layout = null;
      }
      if (layout) {
        if (!(layout instanceof Layout$1)) {
          throw new TypeError("layout must be a Layout");
        }
        if (null !== union.defaultLayout && 0 <= layout.span && layout.span > union.defaultLayout.span) {
          throw new Error("variant span exceeds span of containing union");
        }
        if ("string" !== typeof property) {
          throw new TypeError("variant must have a String property");
        }
      }
      let span = union.span;
      if (0 > union.span) {
        span = layout ? layout.span : 0;
        if (0 <= span && union.usesPrefixDiscriminator) {
          span += union.discriminator.layout.span;
        }
      }
      super(span, property);
      this.union = union;
      this.variant = variant;
      this.layout = layout || null;
    }
    /** @override */
    getSpan(b, offset = 0) {
      if (0 <= this.span) {
        return this.span;
      }
      let contentOffset = 0;
      if (this.union.usesPrefixDiscriminator) {
        contentOffset = this.union.discriminator.layout.span;
      }
      let span = 0;
      if (this.layout) {
        span = this.layout.getSpan(b, offset + contentOffset);
      }
      return contentOffset + span;
    }
    /** @override */
    decode(b, offset = 0) {
      const dest = this.makeDestinationObject();
      if (this !== this.union.getVariant(b, offset)) {
        throw new Error("variant mismatch");
      }
      let contentOffset = 0;
      if (this.union.usesPrefixDiscriminator) {
        contentOffset = this.union.discriminator.layout.span;
      }
      if (this.layout) {
        dest[this.property] = this.layout.decode(b, offset + contentOffset);
      } else if (this.property) {
        dest[this.property] = true;
      } else if (this.union.usesPrefixDiscriminator) {
        dest[this.union.discriminator.property] = this.variant;
      }
      return dest;
    }
    /** @override */
    encode(src, b, offset = 0) {
      let contentOffset = 0;
      if (this.union.usesPrefixDiscriminator) {
        contentOffset = this.union.discriminator.layout.span;
      }
      if (this.layout && !Object.prototype.hasOwnProperty.call(src, this.property)) {
        throw new TypeError("variant lacks property " + this.property);
      }
      this.union.discriminator.encode(this.variant, b, offset);
      let span = contentOffset;
      if (this.layout) {
        this.layout.encode(src[this.property], b, offset + contentOffset);
        span += this.layout.getSpan(b, offset + contentOffset);
        if (0 <= this.union.span && span > this.union.span) {
          throw new Error("encoded variant overruns containing union");
        }
      }
      return span;
    }
    /** Delegate {@link Layout#fromArray|fromArray} to {@link
     * VariantLayout#layout|layout}. */
    fromArray(values) {
      if (this.layout) {
        return this.layout.fromArray(values);
      }
      return void 0;
    }
  }
  Layout.VariantLayout = VariantLayout;
  function fixBitwiseResult(v) {
    if (0 > v) {
      v += 4294967296;
    }
    return v;
  }
  class BitStructure extends Layout$1 {
    constructor(word, msb, property) {
      if (!(word instanceof UInt || word instanceof UIntBE)) {
        throw new TypeError("word must be a UInt or UIntBE layout");
      }
      if ("string" === typeof msb && void 0 === property) {
        property = msb;
        msb = false;
      }
      if (4 < word.span) {
        throw new RangeError("word cannot exceed 32 bits");
      }
      super(word.span, property);
      this.word = word;
      this.msb = !!msb;
      this.fields = [];
      let value = 0;
      this._packedSetValue = function(v) {
        value = fixBitwiseResult(v);
        return this;
      };
      this._packedGetValue = function() {
        return value;
      };
    }
    /** @override */
    decode(b, offset = 0) {
      const dest = this.makeDestinationObject();
      const value = this.word.decode(b, offset);
      this._packedSetValue(value);
      for (const fd of this.fields) {
        if (void 0 !== fd.property) {
          dest[fd.property] = fd.decode(b);
        }
      }
      return dest;
    }
    /** Implement {@link Layout#encode|encode} for {@link BitStructure}.
     *
     * If `src` is missing a property for a member with a defined {@link
     * Layout#property|property} the corresponding region of the packed
     * value is left unmodified.  Unused bits are also left unmodified. */
    encode(src, b, offset = 0) {
      const value = this.word.decode(b, offset);
      this._packedSetValue(value);
      for (const fd of this.fields) {
        if (void 0 !== fd.property) {
          const fv = src[fd.property];
          if (void 0 !== fv) {
            fd.encode(fv);
          }
        }
      }
      return this.word.encode(this._packedGetValue(), b, offset);
    }
    /** Register a new bitfield with a containing bit structure.  The
     * resulting bitfield is returned.
     *
     * @param {Number} bits - initializer for {@link BitField#bits|bits}.
     *
     * @param {string} property - initializer for {@link
     * Layout#property|property}.
     *
     * @return {BitField} */
    addField(bits, property) {
      const bf = new BitField(this, bits, property);
      this.fields.push(bf);
      return bf;
    }
    /** As with {@link BitStructure#addField|addField} for single-bit
     * fields with `boolean` value representation.
     *
     * @param {string} property - initializer for {@link
     * Layout#property|property}.
     *
     * @return {Boolean} */
    // `Boolean` conflicts with the native primitive type
    // eslint-disable-next-line @typescript-eslint/ban-types
    addBoolean(property) {
      const bf = new Boolean(this, property);
      this.fields.push(bf);
      return bf;
    }
    /**
     * Get access to the bit field for a given property.
     *
     * @param {String} property - the bit field of interest.
     *
     * @return {BitField} - the field associated with `property`, or
     * undefined if there is no such property.
     */
    fieldFor(property) {
      if ("string" !== typeof property) {
        throw new TypeError("property must be string");
      }
      for (const fd of this.fields) {
        if (fd.property === property) {
          return fd;
        }
      }
      return void 0;
    }
  }
  Layout.BitStructure = BitStructure;
  class BitField {
    constructor(container, bits, property) {
      if (!(container instanceof BitStructure)) {
        throw new TypeError("container must be a BitStructure");
      }
      if (!Number.isInteger(bits) || 0 >= bits) {
        throw new TypeError("bits must be positive integer");
      }
      const totalBits = 8 * container.span;
      const usedBits = container.fields.reduce((sum, fd) => sum + fd.bits, 0);
      if (bits + usedBits > totalBits) {
        throw new Error("bits too long for span remainder (" + (totalBits - usedBits) + " of " + totalBits + " remain)");
      }
      this.container = container;
      this.bits = bits;
      this.valueMask = (1 << bits) - 1;
      if (32 === bits) {
        this.valueMask = 4294967295;
      }
      this.start = usedBits;
      if (this.container.msb) {
        this.start = totalBits - usedBits - bits;
      }
      this.wordMask = fixBitwiseResult(this.valueMask << this.start);
      this.property = property;
    }
    /** Store a value into the corresponding subsequence of the containing
     * bit field. */
    decode(b, offset) {
      const word = this.container._packedGetValue();
      const wordValue = fixBitwiseResult(word & this.wordMask);
      const value = wordValue >>> this.start;
      return value;
    }
    /** Store a value into the corresponding subsequence of the containing
     * bit field.
     *
     * **NOTE** This is not a specialization of {@link
     * Layout#encode|Layout.encode} and there is no return value. */
    encode(value) {
      if ("number" !== typeof value || !Number.isInteger(value) || value !== fixBitwiseResult(value & this.valueMask)) {
        throw new TypeError(nameWithProperty("BitField.encode", this) + " value must be integer not exceeding " + this.valueMask);
      }
      const word = this.container._packedGetValue();
      const wordValue = fixBitwiseResult(value << this.start);
      this.container._packedSetValue(fixBitwiseResult(word & ~this.wordMask) | wordValue);
    }
  }
  Layout.BitField = BitField;
  class Boolean extends BitField {
    constructor(container, property) {
      super(container, 1, property);
    }
    /** Override {@link BitField#decode|decode} for {@link Boolean|Boolean}.
     *
     * @returns {boolean} */
    decode(b, offset) {
      return !!super.decode(b, offset);
    }
    /** @override */
    encode(value) {
      if ("boolean" === typeof value) {
        value = +value;
      }
      super.encode(value);
    }
  }
  Layout.Boolean = Boolean;
  class Blob extends Layout$1 {
    constructor(length, property) {
      if (!(length instanceof ExternalLayout && length.isCount() || Number.isInteger(length) && 0 <= length)) {
        throw new TypeError("length must be positive integer or an unsigned integer ExternalLayout");
      }
      let span = -1;
      if (!(length instanceof ExternalLayout)) {
        span = length;
      }
      super(span, property);
      this.length = length;
    }
    /** @override */
    getSpan(b, offset) {
      let span = this.span;
      if (0 > span) {
        span = this.length.decode(b, offset);
      }
      return span;
    }
    /** @override */
    decode(b, offset = 0) {
      let span = this.span;
      if (0 > span) {
        span = this.length.decode(b, offset);
      }
      return uint8ArrayToBuffer(b).slice(offset, offset + span);
    }
    /** Implement {@link Layout#encode|encode} for {@link Blob}.
     *
     * **NOTE** If {@link Layout#count|count} is an instance of {@link
     * ExternalLayout} then the length of `src` will be encoded as the
     * count after `src` is encoded. */
    encode(src, b, offset) {
      let span = this.length;
      if (this.length instanceof ExternalLayout) {
        span = src.length;
      }
      if (!(src instanceof Uint8Array && span === src.length)) {
        throw new TypeError(nameWithProperty("Blob.encode", this) + " requires (length " + span + ") Uint8Array as src");
      }
      if (offset + span > b.length) {
        throw new RangeError("encoding overruns Uint8Array");
      }
      const srcBuffer = uint8ArrayToBuffer(src);
      uint8ArrayToBuffer(b).write(srcBuffer.toString("hex"), offset, span, "hex");
      if (this.length instanceof ExternalLayout) {
        this.length.encode(span, b, offset);
      }
      return span;
    }
  }
  Layout.Blob = Blob;
  class CString extends Layout$1 {
    constructor(property) {
      super(-1, property);
    }
    /** @override */
    getSpan(b, offset = 0) {
      checkUint8Array(b);
      let idx = offset;
      while (idx < b.length && 0 !== b[idx]) {
        idx += 1;
      }
      return 1 + idx - offset;
    }
    /** @override */
    decode(b, offset = 0) {
      const span = this.getSpan(b, offset);
      return uint8ArrayToBuffer(b).slice(offset, offset + span - 1).toString("utf-8");
    }
    /** @override */
    encode(src, b, offset = 0) {
      if ("string" !== typeof src) {
        src = String(src);
      }
      const srcb = buffer_1.Buffer.from(src, "utf8");
      const span = srcb.length;
      if (offset + span > b.length) {
        throw new RangeError("encoding overruns Buffer");
      }
      const buffer = uint8ArrayToBuffer(b);
      srcb.copy(buffer, offset);
      buffer[offset + span] = 0;
      return span + 1;
    }
  }
  Layout.CString = CString;
  class UTF8 extends Layout$1 {
    constructor(maxSpan, property) {
      if ("string" === typeof maxSpan && void 0 === property) {
        property = maxSpan;
        maxSpan = void 0;
      }
      if (void 0 === maxSpan) {
        maxSpan = -1;
      } else if (!Number.isInteger(maxSpan)) {
        throw new TypeError("maxSpan must be an integer");
      }
      super(-1, property);
      this.maxSpan = maxSpan;
    }
    /** @override */
    getSpan(b, offset = 0) {
      checkUint8Array(b);
      return b.length - offset;
    }
    /** @override */
    decode(b, offset = 0) {
      const span = this.getSpan(b, offset);
      if (0 <= this.maxSpan && this.maxSpan < span) {
        throw new RangeError("text length exceeds maxSpan");
      }
      return uint8ArrayToBuffer(b).slice(offset, offset + span).toString("utf-8");
    }
    /** @override */
    encode(src, b, offset = 0) {
      if ("string" !== typeof src) {
        src = String(src);
      }
      const srcb = buffer_1.Buffer.from(src, "utf8");
      const span = srcb.length;
      if (0 <= this.maxSpan && this.maxSpan < span) {
        throw new RangeError("text length exceeds maxSpan");
      }
      if (offset + span > b.length) {
        throw new RangeError("encoding overruns Buffer");
      }
      srcb.copy(uint8ArrayToBuffer(b), offset);
      return span;
    }
  }
  Layout.UTF8 = UTF8;
  class Constant extends Layout$1 {
    constructor(value, property) {
      super(0, property);
      this.value = value;
    }
    /** @override */
    decode(b, offset) {
      return this.value;
    }
    /** @override */
    encode(src, b, offset) {
      return 0;
    }
  }
  Layout.Constant = Constant;
  Layout.greedy = ((elementSpan, property) => new GreedyCount(elementSpan, property));
  Layout.offset = ((layout, offset, property) => new OffsetLayout(layout, offset, property));
  Layout.u8 = ((property) => new UInt(1, property));
  Layout.u16 = ((property) => new UInt(2, property));
  Layout.u24 = ((property) => new UInt(3, property));
  Layout.u32 = ((property) => new UInt(4, property));
  Layout.u40 = ((property) => new UInt(5, property));
  Layout.u48 = ((property) => new UInt(6, property));
  Layout.nu64 = ((property) => new NearUInt64(property));
  Layout.u16be = ((property) => new UIntBE(2, property));
  Layout.u24be = ((property) => new UIntBE(3, property));
  Layout.u32be = ((property) => new UIntBE(4, property));
  Layout.u40be = ((property) => new UIntBE(5, property));
  Layout.u48be = ((property) => new UIntBE(6, property));
  Layout.nu64be = ((property) => new NearUInt64BE(property));
  Layout.s8 = ((property) => new Int(1, property));
  Layout.s16 = ((property) => new Int(2, property));
  Layout.s24 = ((property) => new Int(3, property));
  Layout.s32 = ((property) => new Int(4, property));
  Layout.s40 = ((property) => new Int(5, property));
  Layout.s48 = ((property) => new Int(6, property));
  Layout.ns64 = ((property) => new NearInt64(property));
  Layout.s16be = ((property) => new IntBE(2, property));
  Layout.s24be = ((property) => new IntBE(3, property));
  Layout.s32be = ((property) => new IntBE(4, property));
  Layout.s40be = ((property) => new IntBE(5, property));
  Layout.s48be = ((property) => new IntBE(6, property));
  Layout.ns64be = ((property) => new NearInt64BE(property));
  Layout.f32 = ((property) => new Float(property));
  Layout.f32be = ((property) => new FloatBE(property));
  Layout.f64 = ((property) => new Double(property));
  Layout.f64be = ((property) => new DoubleBE(property));
  Layout.struct = ((fields, property, decodePrefixes) => new Structure(fields, property, decodePrefixes));
  Layout.bits = ((word, msb, property) => new BitStructure(word, msb, property));
  Layout.seq = ((elementLayout, count, property) => new Sequence(elementLayout, count, property));
  Layout.union = ((discr, defaultLayout, property) => new Union(discr, defaultLayout, property));
  Layout.unionLayoutDiscriminator = ((layout, property) => new UnionLayoutDiscriminator(layout, property));
  Layout.blob = ((length, property) => new Blob(length, property));
  Layout.cstr = ((property) => new CString(property));
  Layout.utf8 = ((maxSpan, property) => new UTF8(maxSpan, property));
  Layout.constant = ((value, property) => new Constant(value, property));
  return Layout;
}
var LayoutExports = requireLayout();
export {
  LayoutExports as L
};
