(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return b64.length * 3 / 4 - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],2:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('Invalid typed array length')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (value instanceof ArrayBuffer) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return fromObject(value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj) {
    if (ArrayBuffer.isView(obj) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(0)
      }
      return fromArrayLike(obj)
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || string instanceof ArrayBuffer) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : new Buffer(val, encoding)
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

},{"base64-js":1,"ieee754":3}],3:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],5:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var Geographic = require('./src/lib/Geographic');
var Cartesian = require('./src/lib/Cartesian');
var Transform = require('./src/Transform');

module.exports = { Geographic: Geographic, Cartesian: Cartesian, Transform: Transform };

if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object') {
  window.rdnaptrans = module.exports;
}

},{"./src/Transform":6,"./src/lib/Cartesian":8,"./src/lib/Geographic":10}],6:[function(require,module,exports){
/**
 * Created by veerr on 10-2-2017.
 */

'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Helpers = require('./lib/Helpers');
var Constants = require('./lib/Constants');
var Cartesian = require('./lib/Cartesian');
var Geographic = require('./lib/Geographic');
var GrdFile = require('./lib/GrdFile');

var grdFileZ = GrdFile.GRID_FILE_GEOID();

var constants = new Constants();

/**
 * <p>Transform class.</p>
 *
 * @author raymond
 * @version $Id: $Id
 */

var Transform = function () {
  function Transform() {
    _classCallCheck(this, Transform);
  }

  _createClass(Transform, null, [{
    key: 'etrs2rd',

    /** JAVASCRIPT PORT
     **--------------------------------------------------------------
     **    RDNAPTRANS(TM)2008
     **
     **    Authors: Jochem Lesparre, Joop van Buren, Marc Crombaghs, Frank Dentz,
     **    Arnoud Pol, Sander Oude Elberink
     **             http://www.rdnap.nl
     **    Based on RDNAPTRANS2004
     **    Main changes:
     **    - 7 similarity transformation parameters
     **    - 0.0088 offset in the transformation between ellipsoidal height (h)
     **    and orthometric heights (NAP)
     **    - coordinates are computed also outside the validity regions of the
     **    grid files x2c.grd, y2c.grd and nlgeo04.grd
     **--------------------------------------------------------------
     */

    /**
     **--------------------------------------------------------------
     **    Function name: etrs2rd
     **    Description:   convert ETRS89 coordinates to RD coordinates
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    phi_etrs       double      in     req     none
     **    lambda_etrs    double      in     req     none
     **    h_etrs         double      in     req     none
     **    x_rd           double      out    -       none
     **    y_rd           double      out    -       none
     **
     **    Additional explanation of the meaning of parameters
     **    phi_etrs, lambda_etrs, h_etrs  input ETRS89 coordinates
     **    x_rd, y_rd                     output RD coordinates
     **
     **    Return value: (besides the standard return values)
     **    none
     **--------------------------------------------------------------
     */
    /**
     * <p>etrs2rd.</p>
     *
     * @param etrs a {@link rdnaptrans.value.Geographic} object.
     * @return a {@link rdnaptrans.value.Cartesian} object.
     * @throws java.io.IOException if any.
     */
    value: function etrs2rd(etrs) {
      /**
       **--------------------------------------------------------------
       **    Calculate the cartesian ETRS89 coordinates of the pivot point Amersfoort
       **--------------------------------------------------------------
       */
      var amersfoortBessel = Helpers.geographic2cartesian(new Geographic(constants.PHI_AMERSFOORT_BESSEL, constants.LAMBDA_AMERSFOORT_BESSEL, constants.H_AMERSFOORT_BESSEL), constants.A_BESSEL, constants.INV_F_BESSEL);
      var xAmersfoortETRS = amersfoortBessel.X + constants.TX_BESSEL_ETRS;
      var yAmersfoortETRS = amersfoortBessel.Y + constants.TY_BESSEL_ETRS;
      var zAmersfoortETRS = amersfoortBessel.Z + constants.TZ_BESSEL_ETRS;

      /**
       **--------------------------------------------------------------
       **    Convert ETRS89 coordinates to RD coordinates
       **    (To convert from degrees, minutes and seconds use the function
       **    deg_min_sec2decimal() here)
       **--------------------------------------------------------------
       */
      var cartesianETRS = Helpers.geographic2cartesian(etrs, constants.A_ETRS, constants.INV_F_ETRS);

      var cartesianBessel = Helpers.simTrans(cartesianETRS, new Cartesian(constants.TX_ETRS_BESSEL, constants.TY_ETRS_BESSEL, constants.TZ_ETRS_BESSEL), constants.ALPHA_ETRS_BESSEL, constants.BETA_ETRS_BESSEL, constants.GAMMA_ETRS_BESSEL, constants.DELTA_ETRS_BESSEL, new Cartesian(xAmersfoortETRS, yAmersfoortETRS, zAmersfoortETRS));

      var geographicBessel = Helpers.cartesian2geographic(cartesianBessel, constants.A_BESSEL, constants.INV_F_BESSEL);

      var pseudoRD = Helpers.rdProjection(geographicBessel);
      var corrected = Helpers.rdCorrection(pseudoRD);
      return corrected.withZ(geographicBessel.h);
    }

    /**
     **--------------------------------------------------------------
     **    Function name: rd2etrs
     **    Description:   convert RD coordinates to ETRS89 coordinates
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    x_rd           double      in     req     none
     **    y_rd           double      in     req     none
     **    nap            double      in     req     none
     **    phi_etrs       double      out    -       none
     **    lambda_etrs    double      out    -       none
     **
     **    Additional explanation of the meaning of parameters
     **    x_rd, y_rd, nap        input RD and NAP coordinates
     **    phi_etrs, lambda_etrs  output ETRS89 coordinates
     **
     **    Return value: (besides the standard return values)
     **    none
     **--------------------------------------------------------------
     */
    /**
     * <p>rd2etrs.</p>
     *
     * @param rd a {Cartesian} object.
     * @return a {Geographic} object.
     * @throws java.io.IOException if any.
     */

  }, {
    key: 'rd2etrs',
    value: function rd2etrs(rd) {
      /**
       **--------------------------------------------------------------
       **    Calculate the cartesian Bessel coordinates of the pivot point Amersfoort
       **--------------------------------------------------------------
       */
      var amersfoortBessel = Helpers.geographic2cartesian(new Geographic(constants.PHI_AMERSFOORT_BESSEL, constants.LAMBDA_AMERSFOORT_BESSEL, constants.H_AMERSFOORT_BESSEL), constants.A_BESSEL, constants.INV_F_BESSEL);

      /**
       **--------------------------------------------------------------
       **    Calculate appoximated value of ellipsoidal Bessel height
       **    The error made by using a constant for de Bessel geoid height is max.
       **    circa 1 meter in the ellipsoidal height (for the NLGEO2004 geoid model).
       **    This intoduces an error in the phi, lambda position too, this error is
       **    nevertheless certainly smaller than 0.0001 m.
       **--------------------------------------------------------------
       */
      var hBessel = rd.Z + constants.MEAN_GEOID_HEIGHT_BESSEL;

      /**
       **--------------------------------------------------------------
       **    Convert RD coordinates to ETRS89 coordinates
       **--------------------------------------------------------------
       */
      var pseudoRD = Helpers.invRdCorrection(rd);
      var etrsBessel = Helpers.invRdProjection(pseudoRD);
      var cartesianBessel = Helpers.geographic2cartesian(etrsBessel.withH(hBessel), constants.A_BESSEL, constants.INV_F_BESSEL);

      var cartesianETRS = Helpers.simTrans(cartesianBessel, new Cartesian(constants.TX_BESSEL_ETRS, constants.TY_BESSEL_ETRS, constants.TZ_BESSEL_ETRS), constants.ALPHA_BESSEL_ETRS, constants.BETA_BESSEL_ETRS, constants.GAMMA_BESSEL_ETRS, constants.DELTA_BESSEL_ETRS, amersfoortBessel);

      return Helpers.cartesian2geographic(cartesianETRS, constants.A_ETRS, constants.INV_F_ETRS);

      /**
       **--------------------------------------------------------------
       **    To convert to degrees, minutes and seconds use the function decimal2deg_min_sec() here
       **--------------------------------------------------------------
       */
    }

    /**
     **--------------------------------------------------------------
     **    Function name: etrs2nap
     **    Description:   convert ellipsoidal ETRS89 height to NAP height
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    phi            double      in     req     none
     **    lambda         double      in     req     none
     **    h              double      in     req     none
     **    nap            double      out    -       none
     **
     **    Additional explanation of the meaning of parameters
     **    phi, lambda, h  input ETRS89 coordinates
     **    nap             output NAP height
     **
     **    Return value: (besides the standard return values) none
     **    on error (outside geoid grid) nap is not compted here
     **    instead in etrs2rdnap nap=h_bessel
     **--------------------------------------------------------------
     */
    /**
     * <p>etrs2nap.</p>
     *
     * @param etrs a {@link rdnaptrans.value.Geographic} object.
     * @return a {@link rdnaptrans.value.OptionalDouble} object.
     * @throws java.io.IOException if any.
     */

  }, {
    key: 'etrs2nap',
    value: function etrs2nap(etrs) {
      /**
       **--------------------------------------------------------------
       **    Explanation of the meaning of variables:
       **        n  geoid height
       **    on error (outside geoid grid) nap is not compted
       **    instead in etrs2rdnap nap=h_bessel
       **--------------------------------------------------------------
       */
      var n = grdFileZ.gridInterpolation(etrs.lambda, etrs.phi);
      return n ? etrs.h - n + 0.0088 : null;
    }

    /**
     **--------------------------------------------------------------
     **    Function name: nap2etrs
     **    Description:   convert NAP height to ellipsoidal ETRS89 height
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    phi            double      in     req     none
     **    lambda         double      in     req     none
     **    nap            double      in     req     none
     **    h              double      out    -       none
     **
     **    Additional explanation of the meaning of parameters
     **    phi, lambda  input ETRS89 position
     **    nap          input NAP height at position phi, lambda
     **    h            output ellipsoidal ETRS89 height
     **
     **    Return value: (besides the standard return values)
     **    none
     **    on error (outside geoid grid) h is not compted here
     **    instead in rdnap2etrs h=h_etrs_sim (from similarity transformation)
     **--------------------------------------------------------------
     */
    /**
     * <p>nap2etrs.</p>
     *
     * @param phi a double.
     * @param lambda a double.
     * @param nap a double.
     * @return a {@link rdnaptrans.value.OptionalDouble} object.
     * @throws java.io.IOException if any.
     */

  }, {
    key: 'nap2etrs',
    value: function nap2etrs(phi, lambda, nap) {
      /**
       **--------------------------------------------------------------
       **    Explanation of the meaning of variables:
       **        n  geoid height
       **--------------------------------------------------------------
       */
      var n = grdFileZ.gridInterpolation(lambda, phi);
      return n ? nap + n - 0.0088 : null;
    }

    /**
     **--------------------------------------------------------------
     **    Function name: etrs2rdnap
     **    Description:   convert ETRS89 coordinates to RD and NAP coordinates
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    phi            double      in     req     none
     **    lambda         double      in     req     none
     **    h              double      in     req     none
     **    x_rd           double      out    -       none
     **    y_rd           double      out    -       none
     **    nap            double      out    -       none
     **
     **    Additional explanation of the meaning of parameters
     **    phi, lambda, h   input ETRS89 coordinates
     **    x_rd, y_rd, nap  output RD and NAP coordinates
     **
     **    Return value: (besides the standard return values)
     **    none
     **--------------------------------------------------------------
     */
    /**
     * <p>etrs2rdnap.</p>
     *
     * @param etrs a {@link rdnaptrans.value.Geographic} object.
     * @return a {@link rdnaptrans.value.Cartesian} object.
     * @throws java.io.IOException if any.
     */

  }, {
    key: 'etrs2rdnap',
    value: function etrs2rdnap(etrs) {
      var rd = Transform.etrs2rd(etrs);
      var betterH = Transform.etrs2nap(etrs);
      return betterH ? rd.withZ(betterH) : rd;
    }

    /**
     **--------------------------------------------------------------
     **    Function name: rdnap2etrs
     **    Description:   convert RD and NAP coordinates to ETRS89 coordinates
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    x_rd           double      in     req     none
     **    y_rd           double      in     req     none
     **    nap            double      in     req     none
     **    phi            double      out    -       none
     **    lambda         double      out    -       none
     **    h              double      out    -       none
     **
     **    Additional explanation of the meaning of parameters
     **    x_rd, y_rd, nap  input RD and NAP coordinates
     **    phi, lambda, h   output ETRS89 coordinates
     **
     **    Return value: (besides the standard return values)
     **    none
     **--------------------------------------------------------------
     */
    /**
     * <p>rdnap2etrs.</p>
     *
     * @param rdnap a {@link rdnaptrans.value.Cartesian} object.
     * @return a {@link rdnaptrans.value.Geographic} object.
     * @throws java.io.IOException if any.
     */

  }, {
    key: 'rdnap2etrs',
    value: function rdnap2etrs(rdnap) {
      var etrs = Transform.rd2etrs(rdnap);
      var betterH = Transform.nap2etrs(etrs.phi, etrs.lambda, rdnap.Z);
      return betterH ? etrs.withH(betterH) : etrs;
    }

    /**
     **--------------------------------------------------------------
     **    End of RDNAPTRANS(TM)2008
     **--------------------------------------------------------------
     */

  }]);

  return Transform;
}();

module.exports = Transform;

},{"./lib/Cartesian":8,"./lib/Constants":9,"./lib/Geographic":10,"./lib/GrdFile":11,"./lib/Helpers":12}],7:[function(require,module,exports){
/**
 * Created by veerr on 8-2-2017.
 */

'use strict';

/**
 * <p>Angle class.</p>
 *
 * @author raymond
 * @version $Id: $Id
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Angle =
/**
 * <p>Constructor for Angle.</p>
 *
 * @param Degrees a double.
 * @param Minutes a double.
 * @param Seconds a double.
 */
function Angle(Degrees, Minutes, Seconds) {
  _classCallCheck(this, Angle);

  this.Degrees = Degrees;
  this.Minutes = Minutes;
  this.Seconds = Seconds;
};

module.exports = Angle;

},{}],8:[function(require,module,exports){
/**
 * Created by veerr on 8-2-2017.
 */

'use strict';

/**
 * <p>Cartesian class.</p>
 *
 * @author raymond
 * @version $Id: $Id
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Cartesian = function () {
  /**
   * <p>Constructor for Cartesian.</p>
   *
   * @param X a double.
   * @param Y a double.
   * @param Z a double.
   */
  function Cartesian(X, Y, Z) {
    _classCallCheck(this, Cartesian);

    if (Z === undefined) Z = 0;
    this.X = X;
    this.Y = Y;
    this.Z = Z;
  }

  /**
   * <p>withZ.</p>
   *
   * @param z a double.
   * @return a {@link rdnaptrans.value.Cartesian} object.
   */


  _createClass(Cartesian, [{
    key: 'withZ',
    value: function withZ(z) {
      return new Cartesian(this.X, this.Y, z);
    }
  }]);

  return Cartesian;
}();

module.exports = Cartesian;

},{}],9:[function(require,module,exports){
/**
 * Created by veerr on 25-1-2017.
 */

'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Constants =
/**
 **--------------------------------------------------------------
 **    Static data declarations
 **    Mathematical constant pi = 3.14...
 **--------------------------------------------------------------
 */
function Constants() {
  _classCallCheck(this, Constants);

  // this.PI = Math.PI;
  /**
   ** --------------------------------------------------------------
   **    Continuation of static data declarations
   **    Geographic NL-Bessel coordinates of Amersfoort (pivot point and projection base point)
   **        phi     latitude in decimal degrees
   **        lambda  longitude in decimal degrees
   **        h       ellipsoidal height in meters
   **    Source of constants:
   **        Hk.J. Heuvelink, "De stereografische kaartprojectie in
   **        hare toepassing bij de Rijksdriehoeksmeting".
   **        Delft: Rijkscommissie voor Graadmeting en Waterpassing, 1918.
   **        HTW, "Handleiding voor de Technische Werkzaamheden van het Kadaster".
   **        Apeldoorn: Kadaster, 1996.
   **--------------------------------------------------------------
   */
  this.PHI_AMERSFOORT_BESSEL = 52.0 + 9.0 / 60.0 + 22.178 / 3600.0;
  this.LAMBDA_AMERSFOORT_BESSEL = 5.0 + 23.0 / 60.0 + 15.500 / 3600.0;
  this.H_AMERSFOORT_BESSEL = 0.0;
  /**
   **--------------------------------------------------------------
   **    Continuation of static data declarations
   **    Parameters of ellipsoids Bessel1841 and GRS80
   **        a      half major axis in meters
   **        inv_f  inverse flattening
   **    Source of constants: HTW, "Handleiding voor de Technische
    *  Werkzaamheden van het Kadaster". Apeldoorn: Kadaster, 1996.
   **--------------------------------------------------------------
   */

  this.A_BESSEL = 6377397.155;
  this.INV_F_BESSEL = 299.1528128;
  this.A_ETRS = 6378137;
  this.INV_F_ETRS = 298.257222101;

  /**
   **--------------------------------------------------------------
   **    Continuation of static data declarations
   **    Transformation parameters relative to pivot point Amersfoort.
   *     Note: Do NOT confuse with parameters for the center of the ellipsoid!
   **        tx     translation in direction of x axis in meters
   **        ty     translation in direction of y axis in meters
   **        tz     translation in direction of z axis in meters
   **        alpha  rotation around x axis in radials
   **        beta   rotation around y axis in radials
   **        gamma  rotation around z axis in radials
   **        delta  scale parameter (scale = 1 + delta)
   **    Source of constants: A. de Bruijne, J. van Buren, A. K\u0148sters and
   *     H. van der Marel, "De geodetische referentiestelsels van Nederland;
   *     Definitie en vastlegging van ETRS89, RD en NAP en hun onderlinge relatie".
   *     Delft: Nederlandse Commissie voor Geodesie (NCG), to be published in 2005.
   **--------------------------------------------------------------
   */
  this.TX_BESSEL_ETRS = 593.0248;
  this.TY_BESSEL_ETRS = 25.9984;
  this.TZ_BESSEL_ETRS = 478.7459;
  this.ALPHA_BESSEL_ETRS = 1.9342e-6;
  this.BETA_BESSEL_ETRS = -1.6677e-6;
  this.GAMMA_BESSEL_ETRS = 9.1019e-6;
  this.DELTA_BESSEL_ETRS = 4.0725e-6;

  this.TX_ETRS_BESSEL = -593.0248;
  this.TY_ETRS_BESSEL = -25.9984;
  this.TZ_ETRS_BESSEL = -478.7459;
  this.ALPHA_ETRS_BESSEL = -1.9342e-6;
  this.BETA_ETRS_BESSEL = 1.6677e-6;
  this.GAMMA_ETRS_BESSEL = -9.1019e-6;
  this.DELTA_ETRS_BESSEL = -4.0725e-6;

  /**
   **--------------------------------------------------------------
   **    Continuation of static data declarations
   **    Parameters of RD projection
   **        scale         scale factor (k in some notations)
   **                      this factor was first defined by Hk.J. Heuvelink as
   *                       pow(10,-400e-7), nowadays we define it as exactly 0.9999079
   **        x_amersfoort  false Easting
   **        y_amersfoort  false Northing
   **    Source of constants:
   **        G. Bakker, J.C. de Munck and G.L. Strang van Hees,
   *         "Radio Positioning at Sea". Delft University of Technology, 1995.
   **        G. Strang van Hees, "Globale en lokale geodetische systemen".
   *         Delft: Nederlandse Commissie voor Geodesie (NCG), 1997.
   **--------------------------------------------------------------
   */
  this.SCALE_RD = 0.9999079;
  this.X_AMERSFOORT_RD = 155000;
  this.Y_AMERSFOORT_RD = 463000;

  /**
   **--------------------------------------------------------------
   **    Continuation of static data declarations
   **    Precision parameters for iterations (respectively in meters and degrees)
   **--------------------------------------------------------------
   */
  this.PRECISION = 0.0001;
  this.DEG_PRECISION = this.PRECISION / (40e6 * 360);

  /**
   **--------------------------------------------------------------
   **    Continuation of static data declarations
   **    Mean difference between NAP and ellipsoidal Bessel height.
   *     This is only used for getting from x, y in RD to phi, lambda in ETRS89.
   **--------------------------------------------------------------
   */
  this.MEAN_GEOID_HEIGHT_BESSEL = 0.0;
};

module.exports = Constants;

},{}],10:[function(require,module,exports){
/**
 * Created by veerr on 8-2-2017.
 */

'use strict';

/**
 * <p>Geographic class.</p>
 *
 * @author raymond
 * @version $Id: $Id
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Geographic = function () {

  /**
   **    phi      latitude in degrees
   **    lambda   longitude in degrees
   **    h        ellipsoidal height
   */

  /**
   * <p>Constructor for Geographic.</p>
   *
   * @param phi a double.
   * @param lambda a double.
   * @param h a double.
   */
  function Geographic(phi, lambda, h) {
    _classCallCheck(this, Geographic);

    if (h === undefined) h = 0;
    this.phi = phi;
    this.lambda = lambda;
    this.h = h;
  }

  /**
   * <p>withH.</p>
   *
   * @param h a double.
   * @return a {Geographic} object.
   */


  _createClass(Geographic, [{
    key: 'withH',
    value: function withH(h) {
      return new Geographic(this.phi, this.lambda, h);
    }
  }]);

  return Geographic;
}();

module.exports = Geographic;

},{}],11:[function(require,module,exports){
/**
 * Created by veerr on 8-2-2017.
 */

/* eslint no-mixed-operators: 0 */

'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Reader = require('./Reader');

var xtend = require('xtend');
var Constants = require('./Constants');

var constants = new Constants();
var floor = Math.floor;
/**
 * <p>GrdFile class.</p>
 *
 * @author raymond
 * @version $Id: $Id
 */

var GrdFile = function () {
  _createClass(GrdFile, null, [{
    key: 'GRID_FILE_DX',

    /**
     **--------------------------------------------------------------
     **    Continuation of static data declarations
     **    Names of grd files
     **
     **    Grd files are binary grid files in the format of the program Surfer(R)
     **    The header contains information on the number of grid points,
     **    bounding box and extreme values.
     **
     **    RD-corrections in x and y
     **
     **          -8000 meters < RD Easting  (stepsize 1 km) < 301000 meters
     **         288000 meters < RD Northing (stepsize 1 km) < 630000 meters
     **
     **    Geoid model NLGEO2004
     **
     **        50.525   degrees < ETRS89 latitude  (stepsize 0.050000 degrees) < 53.675 degrees
     **         3.20833 degrees < ETRS89 longitude (stepsize 0.083333 degrees) <  7.45833 degrees
     **
     **        Alternative notation:
     **        50\u0248 31' 30" < ETRS89_latitude  (stepsize 0\u0248 3' 0") < 53\u0248 40' 30"
     **         3\u0248 12' 30" < ETRS89_longitude (stepsize 0\u0248 5' 0") <  7\u0248 27' 30"
     **
     **        The stepsizes correspond to about 5,5 km x 5,5 km in the Netherlands.
     **--------------------------------------------------------------
     */
    /** Constant <code>GRID_FILE_DX</code> */

    value: function GRID_FILE_DX() {
      return new GrdFile('x2c.grd');
    }

    /** Constant <code>GRID_FILE_DY</code> */

  }, {
    key: 'GRID_FILE_DY',
    value: function GRID_FILE_DY() {
      return new GrdFile('y2c.grd');
    }

    /** Constant <code>GRID_FILE_GEOID</code> */

  }, {
    key: 'GRID_FILE_GEOID',
    value: function GRID_FILE_GEOID() {
      return new GrdFile('nlgeo04.grd');
    }

    /**
     * <p>Constructor for GrdFile.</p>
     *
     * @param grdFileName a {@link java.net.URL} object.
     */

  }]);

  function GrdFile(grdFileName) {
    _classCallCheck(this, GrdFile);

    /**
     **--------------------------------------------------------------
     **    Grd files are binary grid files in the format of the program Surfer(R)
     **--------------------------------------------------------------
     */
    var cursor = 0;

    var data = Reader.read(grdFileName);
    if (!data) throw new Error('Unable to read empty source ' + grdFileName);

    // Read file id
    var idString = data.slice(cursor, cursor + 4);
    cursor += 4;

    /**
     **--------------------------------------------------------------
     **    Checks
     **--------------------------------------------------------------
     */

    if (idString.toString() !== 'DSBB') {
      throw new Error(grdFileName + ' is not a valid grd file.\n      \n Expected first four chars of file to be \'DSBB\', but found ' + idString);
    }

    this.grdInner = data;
    this.header = GrdFile.readGrdFileHeader(data, cursor);
    this.header = xtend(this.header, {
      stepSizeX: (this.header.maxX - this.header.minX) / (this.header.sizeX - 1),
      stepSizeY: (this.header.maxY - this.header.minY) / (this.header.sizeY - 1)
    });
    this.header = xtend(this.header, {
      safeMinX: this.header.minX + this.header.stepSizeX,
      safeMaxX: this.header.maxX - this.header.stepSizeX,
      safeMinY: this.header.minY + this.header.stepSizeY,
      safeMaxY: this.header.maxY - this.header.stepSizeY
    });

    return this;
  }

  /**
   **--------------------------------------------------------------
   **    Function name: grid_interpolation
   **    Description:   grid interpolation using Overhauser splines
   **
   **    Parameter      Type        In/Out Req/Opt Default
   **    x              double      in     req     none
   **    y              double      in     req     none
   **    grd_file       string      in     req     none
   **    value          double      out    -       none
   **
   **    Additional explanation of the meaning of parameters
   **    x, y           coordinates of the point for which a interpolated value is desired
   **    grd_file       name of the grd file to be read
   **    record_value   output of the interpolated value
   **
   **    Return value: (besides the standard return values)
   **    none
   **--------------------------------------------------------------
   */

  /**
   * <p>gridInterpolation.</p>
   *
   * @param x a double.
   * @param y a double.
   * @return a {@link rdnaptrans.value.OptionalDouble} object.
   * @throws java.io.IOException if any.
   */


  _createClass(GrdFile, [{
    key: 'gridInterpolation',
    value: function gridInterpolation(x, y) {
      /**
       **--------------------------------------------------------------
       **    Explanation of the meaning of variables:
       **    size_x     number of grid values in x direction (row)
       **    size_y     number of grid values in y direction (col)
       **    min_x      minimum of x
       **    max_x      maximum of x
       **    min_y      minimum of y
       **    max_y      maximum of x
       **    min_value  minimum value in grid (besides the error values)
       **    max_value  maximum value in grid (besides the error values)
       **--------------------------------------------------------------
       */

      /**
       **--------------------------------------------------------------
       **    Check for location safely inside the bounding box of grid
       **--------------------------------------------------------------
       */
      var header = this.header;
      if (x <= header.safeMinX || x >= header.safeMaxX || y <= header.safeMinY || y >= header.safeMaxY) {
        return null;
      }

      /**
       **--------------------------------------------------------------
       **    The selected grid points are situated around point X like this:
       **
       **        12  13  14  15
       **
       **         8   9  10  11
       **               X
       **         4   5   6   7
       **
       **         0   1   2   3
       **
       **    ddx and ddy (in parts of the grid interval) are defined relative
       **    to grid point 9, respectively to the right and down.
       **--------------------------------------------------------------
       */
      var ddx = (x - header.minX) / header.stepSizeX - floor((x - header.minX) / header.stepSizeX);
      var ddy = 1 - ((y - header.minY) / header.stepSizeY - floor((y - header.minY) / header.stepSizeY));

      /**
       **--------------------------------------------------------------
       **    Calculate the record numbers of the selected grid points
       **    The records are numbered from lower left corner to the uper right corner starting with 0:
       **
       **    size_x*(size_y-1) . . size_x*size_y-1
       **                   .                    .
       **                   .                    .
       **                   0 . . . . . . size_x-1
       **--------------------------------------------------------------
       */
      var recordNumber = [];
      recordNumber[5] = parseInt((x - header.minX) / header.stepSizeX + floor((y - header.minY) / header.stepSizeY) * header.sizeX, 10);
      recordNumber[0] = recordNumber[5] - header.sizeX - 1;
      recordNumber[1] = recordNumber[5] - header.sizeX;
      recordNumber[2] = recordNumber[5] - header.sizeX + 1;
      recordNumber[3] = recordNumber[5] - header.sizeX + 2;
      recordNumber[4] = recordNumber[5] - 1;
      recordNumber[6] = recordNumber[5] + 1;
      recordNumber[7] = recordNumber[5] + 2;
      recordNumber[8] = recordNumber[5] + header.sizeX - 1;
      recordNumber[9] = recordNumber[5] + header.sizeX;
      recordNumber[10] = recordNumber[5] + header.sizeX + 1;
      recordNumber[11] = recordNumber[5] + header.sizeX + 2;
      recordNumber[12] = recordNumber[5] + 2 * header.sizeX - 1;
      recordNumber[13] = recordNumber[5] + 2 * header.sizeX;
      recordNumber[14] = recordNumber[5] + 2 * header.sizeX + 1;
      recordNumber[15] = recordNumber[5] + 2 * header.sizeX + 2;

      /**
       **--------------------------------------------------------------
       **    Read the record values of the selected grid point
       **    Outside the validity area the records have a very large value (circa 1.7e38).
       **--------------------------------------------------------------
       */
      var recordValue = [];

      for (var i = 0; i < 16; i += 1) {
        recordValue[i] = this.readGrdFileBody(recordNumber[i]);
        if (recordValue[i] > header.maxValue + constants.PRECISION || recordValue[i] < header.minValue - constants.PRECISION) {
          return null;
        }
      }

      /**
       **--------------------------------------------------------------
       **    Calculation of the multiplication factors
       **--------------------------------------------------------------
       */
      var f = [];
      var g = [];
      var gfac = [];
      f[0] = -0.5 * ddx + ddx * ddx - 0.5 * ddx * ddx * ddx;
      f[1] = 1.0 - 2.5 * ddx * ddx + 1.5 * ddx * ddx * ddx;
      f[2] = 0.5 * ddx + 2.0 * ddx * ddx - 1.5 * ddx * ddx * ddx;
      f[3] = -0.5 * ddx * ddx + 0.5 * ddx * ddx * ddx;
      g[0] = -0.5 * ddy + ddy * ddy - 0.5 * ddy * ddy * ddy;
      g[1] = 1.0 - 2.5 * ddy * ddy + 1.5 * ddy * ddy * ddy;
      g[2] = 0.5 * ddy + 2.0 * ddy * ddy - 1.5 * ddy * ddy * ddy;
      g[3] = -0.5 * ddy * ddy + 0.5 * ddy * ddy * ddy;

      gfac[12] = f[0] * g[0];
      gfac[8] = f[0] * g[1];
      gfac[4] = f[0] * g[2];
      gfac[0] = f[0] * g[3];
      gfac[13] = f[1] * g[0];
      gfac[9] = f[1] * g[1];
      gfac[5] = f[1] * g[2];
      gfac[1] = f[1] * g[3];
      gfac[14] = f[2] * g[0];
      gfac[10] = f[2] * g[1];
      gfac[6] = f[2] * g[2];
      gfac[2] = f[2] * g[3];
      gfac[15] = f[3] * g[0];
      gfac[11] = f[3] * g[1];
      gfac[7] = f[3] * g[2];
      gfac[3] = f[3] * g[3];

      /*
       **--------------------------------------------------------------
       **    Calculation of the interpolated value
       **    Applying the multiplication factors on the selected grid values
       **--------------------------------------------------------------
       */
      var value = 0.0;
      for (var _i = 0; _i < 16; _i += 1) {
        value += gfac[_i] * recordValue[_i];
      }

      return value;
    }

    /**
     **--------------------------------------------------------------
     **    Function name: read_grd_file_header
     **    Description:   reads the header of a grd file
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    filename       string      in     req     none
     **    size_x         short int   out    -       none
     **    size_y         short int   out    -       none
     **    min_x          double      out    -       none
     **    max_x          double      out    -       none
     **    min_y          double      out    -       none
     **    max_y          double      out    -       none
     **    min_value      double      out    -       none
     **    max_value      double      out    -       none
     **
     **    Additional explanation of the meaning of parameters
     **    filename   name of the to be read binary file
     **    size_x     number of grid values in x direction (row)
     **    size_y     number of grid values in y direction (col)
     **    min_x      minimum of x
     **    max_x      maximum of x
     **    min_y      minimum of y
     **    max_y      maximum of x
     **    min_value  minimum value in grid (besides the error values)
     **    max_value  maximum value in grid (besides the error values)
     **
     **    Return value: (besides the standard return values)
     **    none
     **--------------------------------------------------------------
     */

  }, {
    key: 'readGrdFileBody',


    /**
     **--------------------------------------------------------------
     **    Function name: read_grd_file_body
     **    Description:   reads a value from a grd file
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    filename       string      in     req     none
     **    number         long int    in     req     none
     **    value          float       out    -       none
     **
     **    Additional explanation of the meaning of parameters
     **    filename       name of the grd file to be read
     **    recordNumber  number defining the position in the file
     **    record_value   output of the read value
     **
     **    Return value: (besides the standard return values)
     **    none
     **--------------------------------------------------------------
     */
    value: function readGrdFileBody(recordNumber) {
      var recordLength = 4;
      var headerLength = 56;

      /**
       **--------------------------------------------------------------
       **    Read
       **    Grd files are binary grid files in the format of the program Surfer(R)
       **    The first "headerLength" bytes are the header of the file
       **    The body of the file consists of records of "recordLength" bytes
       **    The records have a "recordNumber", starting with 0,1,2,...
       **--------------------------------------------------------------
       */

      var start = headerLength + recordNumber * recordLength;
      var end = headerLength + recordNumber * (recordLength + 1);

      var b = this.grdInner.slice(start, end);

      return b.readFloatLE();
    }
  }], [{
    key: 'readGrdFileHeader',
    value: function readGrdFileHeader(input, cursor) {
      /**
       **--------------------------------------------------------------
       **    Read output parameters
       **--------------------------------------------------------------
       */

      var sizeX = Reader.readShort(input, cursor);
      cursor += 2;
      var sizeY = Reader.readShort(input, cursor);
      cursor += 2;
      var minX = Reader.readDouble(input, cursor);
      cursor += 8;
      var maxX = Reader.readDouble(input, cursor);
      cursor += 8;
      var minY = Reader.readDouble(input, cursor);
      cursor += 8;
      var maxY = Reader.readDouble(input, cursor);
      cursor += 8;
      var minValue = Reader.readDouble(input, cursor);
      cursor += 8;
      var maxValue = Reader.readDouble(input, cursor);

      return { sizeX: sizeX, sizeY: sizeY, minX: minX, maxX: maxX, minY: minY, maxY: maxY, minValue: minValue, maxValue: maxValue };
    }
  }]);

  return GrdFile;
}();

module.exports = GrdFile;

},{"./Constants":9,"./Reader":13,"xtend":4}],12:[function(require,module,exports){
/**
 * Created by veerr on 26-1-2017.
 */

/* eslint no-mixed-operators: 0 */

'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Angle = require('./Angle');
var Cartesian = require('./Cartesian');
var Geographic = require('./Geographic');
var GrdFile = require('./GrdFile');
var Constants = require('./Constants');

var cos = Math.cos;
var sin = Math.sin;
var asin = Math.asin;
var tan = Math.tan;
var atan = Math.atan;
/* eslint no-restricted-properties: 0 */
// Allow Math.pow as exponential operator (**) is not supported in ES6 yet
var pow = Math.pow;
var exp = Math.exp;
var sqrt = Math.sqrt;
var PI = Math.PI;
var abs = Math.abs;
var log = Math.log;

var constants = new Constants();

var gridDX = GrdFile.GRID_FILE_DX();
var gridDY = GrdFile.GRID_FILE_DY();

/**
 * <p>Helpers class.</p>
 *
 * @author reinvantveer
 * @version $Id: $Id
 */

var Helpers = function () {
  function Helpers() {
    _classCallCheck(this, Helpers);
  }

  _createClass(Helpers, null, [{
    key: 'degSin',

    /**
     **--------------------------------------------------------------
     **    Functions
     **--------------------------------------------------------------
     */

    /**
     **--------------------------------------------------------------
     **    Function name: deg_sin
     **    Description:   sine for angles in degrees
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    alpha          const      in     req     none
     **
     **    Additional explanation of the meaning of parameters
     **    none
     **
     **    Return value: (besides the standard return values)
     **    sin(alpha)
     **--------------------------------------------------------------
     */
    value: function degSin(alpha) {
      return sin(alpha / 180.0 * PI);
    }

    /**
     **--------------------------------------------------------------
     **    Function name: deg_cos
     **    Description:   cosine for angles in degrees
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    alpha          const      in     req     none
     **
     **    Additional explanation of the meaning of parameters
     **    none
     **
     **    Return value: (besides the standard return values)
     **    cos(alpha)
     **--------------------------------------------------------------
     */

  }, {
    key: 'degCos',
    value: function degCos(alpha) {
      return cos(alpha / 180.0 * PI);
    }

    /**
     **--------------------------------------------------------------
     **    Function name: deg_tan
     **    Description:   tangent for angles in degrees
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    alpha          const      in     req     none
     **
     **    Additional explanation of the meaning of parameters
     **    none
     **
     **    Return value: (besides the standard return values)
     **    tan(alpha)
     **--------------------------------------------------------------
     */

  }, {
    key: 'degTan',
    value: function degTan(alpha) {
      return tan(alpha / 180.0 * PI);
    }

    /**
     **--------------------------------------------------------------
     **    Function name: deg_asin
     **    Description:   inverse sine for angles in degrees
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    a              const      in     req     none
     **
     **    Additional explanation of the meaning of parameters
     **    none
     **
     **    Return value: (besides the standard return values)
     **    asin(a)
     **--------------------------------------------------------------
     */

  }, {
    key: 'degAsin',
    value: function degAsin(a) {
      return asin(a) * 180.0 / PI;
    }

    /**
     **--------------------------------------------------------------
     **    Function name: deg_atan
     **    Description:   inverse tangent for angles in degrees
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    a              const in     req     none
     **
     **    Additional explanation of the meaning of parameters
     **    none
     **
     **    Return value: (besides the standard return values)
     **    atan(a)
     **--------------------------------------------------------------
     */

  }, {
    key: 'degAtan',
    value: function degAtan(a) {
      return atan(a) * 180.0 / PI;
    }

    /**
     **--------------------------------------------------------------
     **    Function name: atanh
     **    Description:   inverse hyperbolic tangent
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    a              const      in     req     none
     **
     **    Additional explanation of the meaning of parameters
     **    none
     **
     **    Return value: (besides the standard return values)
     **    atanh(a)
     **--------------------------------------------------------------
     */

  }, {
    key: 'atanh',
    value: function atanh(a) {
      return 0.5 * log((1.0 + a) / (1.0 - a));
    }

    /**
     **--------------------------------------------------------------
     **    Function name: geographic2cartesian
     **    Description:   from geographic coordinates to cartesian coordinates
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    phi            const      in     req     none
     **    lambda         const      in     req     none
     **    h              const      in     req     none
     **    a              const      in     req     none
     **    inv_f          const      in     req     none
     **    x              const      out    -       none
     **    y              const      out    -       none
     **    z              const      out    -       none
     **
     **    Additional explanation of the meaning of parameters
     **    phi      latitude in degrees
     **    lambda   longitude in degrees
     **    h        ellipsoidal height
     **    a        half major axis of the ellisoid
     **    inv_f    inverse flattening of the ellipsoid
     **    x, y, z  output of cartesian coordinates
     **
     **    Return value: (besides the standard return values)
     **    none
     **--------------------------------------------------------------
     */

  }, {
    key: 'geographic2cartesian',
    value: function geographic2cartesian(geographic, a, inverseF) {
      /**
       **--------------------------------------------------------------
       **    Source: G. Bakker, J.C. de Munck and G.L. Strang van Hees,
       **        "Radio Positioning at Sea". Delft University of Technology, 1995.
       **--------------------------------------------------------------
       */

      /**
       **--------------------------------------------------------------
       **    Explanation of the meaning of variables:
       **        f    flattening of the ellipsoid
       **        ee   first eccentricity squared (e squared in some notations)
       **        n    second (East West) principal radius of curvature (N in some notations)
       **--------------------------------------------------------------
       */
      var f = 1.0 / inverseF;
      var ee = f * (2.0 - f);
      var n = a / sqrt(1.0 - ee * pow(Helpers.degSin(geographic.phi), 2));

      var x = (n + geographic.h) * Helpers.degCos(geographic.phi) * Helpers.degCos(geographic.lambda);
      var y = (n + geographic.h) * Helpers.degCos(geographic.phi) * Helpers.degSin(geographic.lambda);
      var z = (n * (1.0 - ee) + geographic.h) * Helpers.degSin(geographic.phi);

      return new Cartesian(x, y, z);
    }

    /**
     **--------------------------------------------------------------
     **    Function name: cartesian2geographic
     **    Description:   from cartesian coordinates to geographic coordinates
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    x              const      in     req     none
     **    y              const      in     req     none
     **    z              const      in     req     none
     **    a              const      in     req     none
     **    inverseF          const      in     req     none
     **    phi            const      out    -       none
     **    lambda         const      out    -       none
     **    h              const      out    -       none
     **
     **    Additional explanation of the meaning of parameters
     **    x, y, z  input of cartesian coordinates
     **    a        half major axis of the ellisoid
     **    inverseF    inverse flattening of the ellipsoid
     **    phi      output latitude in degrees
     **    lambda   output longitude in degrees
     **    h        output ellipsoidal height
     **
     **    Return value: (besides the standard return values)
     **    none
     **--------------------------------------------------------------
     */

  }, {
    key: 'cartesian2geographic',
    value: function cartesian2geographic(c, a, inverseF) {
      /**
       **--------------------------------------------------------------
       **    Source: G. Bakker, J.C. de Munck and G.L. Strang van Hees, "Radio Positioning at Sea".
       **    Delft University of Technology, 1995.
       **--------------------------------------------------------------
       */

      /**
       **--------------------------------------------------------------
       **    Explanation of the meaning of variables:
       **        f    flattening of the ellipsoid
       **        ee   first eccentricity squared (e squared in some notations)
       **        rho  distance to minor axis
       **        n    second (East West) principal radius of curvature (N in some notations)
       **--------------------------------------------------------------
       */
      var f = 1.0 / inverseF;
      var ee = f * (2.0 - f);
      var rho = sqrt(c.X * c.X + c.Y * c.Y);
      var n = 0;

      /**
       **--------------------------------------------------------------
       **    Iterative calculation of phi
       **--------------------------------------------------------------
       */
      var phi = 0;
      var previous = void 0;
      var diff = 90;

      while (diff > constants.DEG_PRECISION) {
        previous = phi;
        n = a / sqrt(1.0 - ee * pow(Helpers.degSin(phi), 2));
        phi = Helpers.degAtan(c.Z / rho + n * ee * (Helpers.degSin(phi) / rho));
        diff = abs(phi - previous);
      }

      /**
       **--------------------------------------------------------------
       **     Calculation of lambda and h
       **--------------------------------------------------------------
       */
      var lambda = Helpers.degAtan(c.Y / c.X);
      var h = rho * Helpers.degCos(phi) + c.Z * Helpers.degSin(phi) - n * (1.0 - ee * pow(Helpers.degSin(phi), 2));

      return new Geographic(phi, lambda, h);
    }

    /**
     **--------------------------------------------------------------
     **    Function name: sim_trans
     **    Description:   3 dimensional similarity transformation (7 parameters)
     **    around another pivot point "a" than the origin
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    x_in           const      in     req     none
     **    y_in           const      in     req     none
     **    z_in           const      in     req     none
     **    tx             const      in     req     none
     **    ty             const      in     req     none
     **    tz             const      in     req     none
     **    alpha          const      in     req     none
     **    beta           const      in     req     none
     **    gamma          const      in     req     none
     **    delta          const      in     req     none
     **    xa             const      in     req     none
     **    ya             const      in     req     none
     **    za             const      in     req     none
     **    xOut          const      out    -       none
     **    yOut          const      out    -       none
     **    zOut          const      out    -       none
     **
     **    Additional explanation of the meaning of parameters
     **    x_in, y_in, z_in     input coordinates
     **    tx                   translation in direction of x axis
     **    ty                   translation in direction of y axis
     **    tz                   translation in direction of z axis
     **    alpha                rotation around x axis in radials
     **    beta                 rotation around y axis in radials
     **    gamma                rotation around z axis in radials
     **    delta                scale parameter (scale = 1 + delta)
     **    xa, ya, za           coordinates of pivot point a (in case
     **                         of rotation around the center of the
     **                         ellipsoid these parameters are zero)
     **    xOut, yOut, zOut  output coordinates
     **
     **    Return value: (besides the standard return values)
     **    none
     **--------------------------------------------------------------
     */

  }, {
    key: 'simTrans',
    value: function simTrans(input, translate, alpha, beta, gamma, delta, pivot) {
      /**
       **--------------------------------------------------------------
       **    Source: HTW, "Handleiding voor de Technische Werkzaamheden van het Kadaster".
       **    Apeldoorn: Kadaster, 1996.
       **--------------------------------------------------------------
       */

      /**
       **--------------------------------------------------------------
       **    Calculate the elements of the rotation_matrix:
       **
       **    a b c
       **    d e f
       **    g h i
       **
       **--------------------------------------------------------------
       */
      var a = cos(gamma) * cos(beta);
      var b = cos(gamma) * sin(beta) * sin(alpha) + sin(gamma) * cos(alpha);
      var c = -cos(gamma) * sin(beta) * cos(alpha) + sin(gamma) * sin(alpha);
      var d = -sin(gamma) * cos(beta);
      var e = -sin(gamma) * sin(beta) * sin(alpha) + cos(gamma) * cos(alpha);
      var f = sin(gamma) * sin(beta) * cos(alpha) + cos(gamma) * sin(alpha);
      var g = sin(beta);
      var h = -cos(beta) * sin(alpha);
      var i = cos(beta) * cos(alpha);

      /**
       **--------------------------------------------------------------
       **    Calculate the elements of the vector input_point:
       **    point_2 = input_point - pivot_point
       **--------------------------------------------------------------
       */
      var x = input.X - pivot.X;
      var y = input.Y - pivot.Y;
      var z = input.Z - pivot.Z;

      /**
       **--------------------------------------------------------------
       **    Calculate the elements of the output vector:
       **    output_point = scale * rotation_matrix * point_2 + translation_vector + pivot_point
       **--------------------------------------------------------------
       */
      var xOut = (1.0 + delta) * (a * x + b * y + c * z) + translate.X + pivot.X;
      var yOut = (1.0 + delta) * (d * x + e * y + f * z) + translate.Y + pivot.Y;
      var zOut = (1.0 + delta) * (g * x + h * y + i * z) + translate.Z + pivot.Z;

      return new Cartesian(xOut, yOut, zOut);
    }

    /**
     **--------------------------------------------------------------
     **    Function name: rdProjection
     **    Description:   stereographic const projection
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    phi            const      in     req     none
     **    lambda         const      in     req     none
     **    xRD           const      out    -       none
     **    yRD           const      out    -       none
     **
     **    Additional explanation of the meaning of parameters
     **    phi         input Bessel latitude in degrees
     **    lambda      input Bessel longitude in degrees
     **    xRD, rd_y  output RD coordinates
     **
     **    Return value: (besides the standard return values)
     **    none
     **--------------------------------------------------------------
     */

  }, {
    key: 'rdProjection',
    value: function rdProjection(input) {
      /**
       **--------------------------------------------------------------
       **    Source: G. Bakker, J.C. de Munck and G.L. Strang van Hees,
       **    "Radio Positioning at Sea". Delft University of Technology, 1995.
       **            G. Strang van Hees, "Globale en lokale geodetische systemen".
       **    Delft: Nederlandse Commissie voor Geodesie (NCG), 1997.
       **--------------------------------------------------------------
       */

      /**
       **--------------------------------------------------------------
       **    Explanation of the meaning of constants:
       **        f                         flattening of the ellipsoid
       **        ee                        first eccentricity squared (e squared in some notations)
       **        e                         first eccentricity
       **        eea                       second eccentricity squared (e' squared in some notations)
       **
       **        phiAmersfoortSphere     latitude of projection base point Amersfoort
       **                                  on sphere in degrees
       **        lambdaAmersfoortSphere  longitude of projection base point Amersfoort
       **                                  on sphere in degrees
       **
       **        r1                        first (North South) principal radius of curvature
       **                                  in Amersfoort (M in some notations)
       **        r2                        second (East West) principal radius of curvature in
       **                                  Amersfoort (N in some notations)
       **        rSphere                  radius of sphere
       **
       **        n                         constant of Gaussian projection n = 1.000475...
       **        qAmersfoort              isometric latitude of Amersfoort on ellipsiod
       **        wAmersfoort              isometric latitude of Amersfoort on sphere
       **        m                         constant of Gaussian projection m = 0.003773...
       **                                 (also named c in some notations)
       **--------------------------------------------------------------
       */
      var f = 1 / constants.INV_F_BESSEL;
      var ee = f * (2 - f);
      var e = sqrt(ee);
      var eea = ee / (1.0 - ee);

      var phiAmersfoortSphere = Helpers.degAtan(Helpers.degTan(constants.PHI_AMERSFOORT_BESSEL) / sqrt(1 + eea * pow(Helpers.degCos(constants.PHI_AMERSFOORT_BESSEL), 2)));
      var lambdaAmersfoortSphere = constants.LAMBDA_AMERSFOORT_BESSEL;

      var r1 = constants.A_BESSEL * (1 - ee) / pow(sqrt(1 - ee * pow(Helpers.degSin(constants.PHI_AMERSFOORT_BESSEL), 2)), 3);
      var r2 = constants.A_BESSEL / sqrt(1.0 - ee * pow(Helpers.degSin(constants.PHI_AMERSFOORT_BESSEL), 2));
      var rSphere = sqrt(r1 * r2);

      var n = sqrt(1 + eea * pow(Helpers.degCos(constants.PHI_AMERSFOORT_BESSEL), 4));
      var qAmersfoort = Helpers.atanh(Helpers.degSin(constants.PHI_AMERSFOORT_BESSEL)) - e * Helpers.atanh(e * Helpers.degSin(constants.PHI_AMERSFOORT_BESSEL));
      var wAmersfoort = log(Helpers.degTan(45 + 0.5 * phiAmersfoortSphere));
      var m = wAmersfoort - n * qAmersfoort;

      /**
       **--------------------------------------------------------------
       **    Explanation of the meaning of variables:
       **        q                    isometric latitude on ellipsoid
       **        w                    isometric latitude on sphere
       **        phiSphere           latitude on sphere in degrees
       **        deltaLambdaSphere  difference in longitude on sphere with Amersfoort in degrees
       **        psi                  distance angle from Amersfoort on sphere
       **        alpha                azimuth from Amersfoort
       **        r                    distance from Amersfoort in projection plane
       **--------------------------------------------------------------
       */
      var q = Helpers.atanh(Helpers.degSin(input.phi)) - e * Helpers.atanh(e * Helpers.degSin(input.phi));
      var w = n * q + m;
      var phiSphere = 2 * Helpers.degAtan(exp(w)) - 90;
      var deltaLambdaSphere = n * (input.lambda - lambdaAmersfoortSphere);
      var sinHalfPsiSquared = pow(Helpers.degSin(0.5 * (phiSphere - phiAmersfoortSphere)), 2) + pow(Helpers.degSin(0.5 * deltaLambdaSphere), 2) * Helpers.degCos(phiSphere) * Helpers.degCos(phiAmersfoortSphere);
      var sinHalfPsi = sqrt(sinHalfPsiSquared);
      var cosHalfPsi = sqrt(1 - sinHalfPsiSquared);
      var tanHalfPsi = sinHalfPsi / cosHalfPsi;
      var sinPsi = 2 * sinHalfPsi * cosHalfPsi;
      var cosPsi = 1 - 2 * sinHalfPsiSquared;
      var sinAlpha = Helpers.degSin(deltaLambdaSphere) * (Helpers.degCos(phiSphere) / sinPsi);
      var cosAlpha = (Helpers.degSin(phiSphere) - Helpers.degSin(phiAmersfoortSphere) * cosPsi) / (Helpers.degCos(phiAmersfoortSphere) * sinPsi);
      var r = 2 * constants.SCALE_RD * rSphere * tanHalfPsi;

      var xRD = r * sinAlpha + constants.X_AMERSFOORT_RD;
      var yRD = r * cosAlpha + constants.Y_AMERSFOORT_RD;

      return new Cartesian(xRD, yRD);
    }

    /**
     **--------------------------------------------------------------
     **    Function name: inv_rd_projection
     **    Description:   inverse stereographic const projection
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    x_rd           const      in     req     none
     **    y_rd           const      in     req     none
     **    phi            const      out    -       none
     **    lambda         const      out    -       none
     **
     **    Additional explanation of the meaning of parameters
     **    x_rd, rd_y  input RD coordinates
     **    phi         output Bessel latitude in degrees
     **    lambda      output Bessel longitude in degrees
     **
     **    Return value: (besides the standard return values)
     **    none
     **--------------------------------------------------------------
     */

  }, {
    key: 'invRdProjection',
    value: function invRdProjection(input) {
      /**
       **--------------------------------------------------------------
       **    Source: G. Bakker, J.C. de Munck and G.L. Strang van Hees,
       **            "Radio Positioning at Sea". Delft University of Technology, 1995.
       **            G. Strang van Hees, "Globale en lokale geodetische systemen".
       **            Delft: Nederlandse Commissie voor Geodesie (NCG), 1997.
       **--------------------------------------------------------------
       */

      /**
       **--------------------------------------------------------------
       **    Explanation of the meaning of constants:
       **        f                         flattening of the ellipsoid
       **        ee                        first eccentricity squared (e squared in some notations)
       **        e                         first eccentricity
       **        eea                       second eccentricity squared (e' squared in some notations)
       **
       **        phiAmersfoortSphere     latitude of projection base point Amersfoort
       **                                  on sphere in degrees
       **
       **        r1                        first (North South) principal radius of curvature
       **                                  in Amersfoort (M in some notations)
       **        r2                        second (East West) principal radius of curvature
       **                                  in Amersfoort (N in some notations)
       **        rSphere                  radius of sphere
       **
       **        n                         constant of Gaussian projection n = 1.000475...
       **        qAmersfoort              isometric latitude of Amersfoort on ellipsiod
       **        wAmersfoort              isometric latitude of Amersfoort on sphere
       **        m                         constant of Gaussian projection m = 0.003773...
       **                                  (also named c in some notations)
       **--------------------------------------------------------------
       */
      var f = 1 / constants.INV_F_BESSEL;
      var ee = f * (2 - f);
      var e = sqrt(ee);
      var eea = ee / (1.0 - ee);

      var phiAmersfoortSphere = this.degAtan(this.degTan(constants.PHI_AMERSFOORT_BESSEL) / sqrt(1 + eea * pow(this.degCos(constants.PHI_AMERSFOORT_BESSEL), 2)));

      var r1 = constants.A_BESSEL * (1 - ee) / pow(sqrt(1 - ee * pow(this.degSin(constants.PHI_AMERSFOORT_BESSEL), 2)), 3);
      var r2 = constants.A_BESSEL / sqrt(1.0 - ee * pow(this.degSin(constants.PHI_AMERSFOORT_BESSEL), 2));
      var rSphere = sqrt(r1 * r2);

      var n = sqrt(1 + eea * pow(this.degCos(constants.PHI_AMERSFOORT_BESSEL), 4));
      var qAmersfoort = this.atanh(this.degSin(constants.PHI_AMERSFOORT_BESSEL)) - e * this.atanh(e * this.degSin(constants.PHI_AMERSFOORT_BESSEL));
      var wAmersfoort = log(this.degTan(45 + 0.5 * phiAmersfoortSphere));
      var m = wAmersfoort - n * qAmersfoort;

      /**
       **--------------------------------------------------------------
       **    Explanation of the meaning of variables:
       **        r                    distance from Amersfoort in projection plane
       **        alpha                azimuth from Amersfoort
       **        psi                  distance angle from Amersfoort on sphere in degrees
       **        phiSphere           latitide on sphere in degrees
       **        deltaLambdaSphere  difference in longitude on sphere with Amersfoort in degrees
       **        w                    isometric latitude on sphere
       **        q                    isometric latitude on ellipsiod
       **--------------------------------------------------------------
       */
      var r = sqrt(pow(input.X - constants.X_AMERSFOORT_RD, 2) + pow(input.Y - constants.Y_AMERSFOORT_RD, 2));

      var sinAlpha = (input.X - constants.X_AMERSFOORT_RD) / r;
      if (r < constants.PRECISION) sinAlpha = 0;

      var cosAlpha = (input.Y - constants.Y_AMERSFOORT_RD) / r;
      if (r < constants.PRECISION) cosAlpha = 1;

      var psi = 2 * this.degAtan(r / (2 * constants.SCALE_RD * rSphere));
      var phiSphere = this.degAsin(cosAlpha * this.degCos(phiAmersfoortSphere) * this.degSin(psi) + this.degSin(phiAmersfoortSphere) * this.degCos(psi));
      var deltaLambdaSphere = this.degAsin(sinAlpha * this.degSin(psi) / this.degCos(phiSphere));

      var lambda = deltaLambdaSphere / n + constants.LAMBDA_AMERSFOORT_BESSEL;

      var w = this.atanh(this.degSin(phiSphere));
      var q = (w - m) / n;

      /**
       **--------------------------------------------------------------
       **    Iterative calculation of phi
       **--------------------------------------------------------------
       */
      var phi = 0;
      var previous = void 0;
      var diff = 90;
      while (diff > constants.DEG_PRECISION) {
        previous = phi;
        phi = 2 * this.degAtan(exp(q + 0.5 * e * log((1 + e * this.degSin(phi)) / (1 - e * this.degSin(phi))))) - 90;
        diff = abs(phi - previous);
      }

      return new Geographic(phi, lambda);
    }
  }, {
    key: 'rdCorrection',
    value: function rdCorrection(pseudo) {
      var dx = gridDX.gridInterpolation(pseudo.X, pseudo.Y);
      var dy = gridDY.gridInterpolation(pseudo.X, pseudo.Y);
      return new Cartesian(pseudo.X - dx, pseudo.Y - dy, pseudo.Z);
    }

    /**
     **--------------------------------------------------------------
     **    Function name: inv_rd_correction
     **    Description:   remove the modelled distortions in the RD coordinate system
     **
     **    Parameter      Type        In/Out Req/Opt Default
     **    x_rd           const      in     req     none
     **    y_rd           const      in     req     none
     **    x_pseudo_rd    const      out    -       none
     **    x_pseudo_rd    const      out    -       none
     **
     **    Additional explanation of the meaning of parameters
     **    x_rd, y_rd                input coordinates in real RD
     **    x_pseudo_rd, y_pseudo_rd  output coordinates in undistorted pseudo RD
     **
     **    Return value: (besides the standard return values)
     **    none
     **--------------------------------------------------------------
     */

  }, {
    key: 'invRdCorrection',
    value: function invRdCorrection(rd) {
      /**
       **--------------------------------------------------------------
       **    The grid values are formally in pseudo RD. For the interpolation
       *     below the RD values are used.
       **    The intoduced error is certainly smaller than 0.0001 m for the X2c.grd and Y2c.grd.
       **--------------------------------------------------------------
       */
      var dx = gridDX.gridInterpolation(rd.X, rd.Y);
      var dy = gridDY.gridInterpolation(rd.X, rd.Y);
      return new Cartesian(rd.X + dx, rd.Y + dy, rd.Z);
    }
  }]);

  return Helpers;
}();

module.exports = Helpers;

},{"./Angle":7,"./Cartesian":8,"./Constants":9,"./Geographic":10,"./GrdFile":11}],13:[function(require,module,exports){
(function (Buffer){
/**
 * Created by veerr on 25-1-2017.
 */'use strict';// There's a good reason not to include the path module in the dependencies:
// It would create another hurdle to overcome in browserifying the package.
   * Constructor
   * The read() function on the reader class is instantiated as a polymorphic Promise,
   * able to read either from a local file system (Node.js)
   * or from a location served over http (browser). This
   * allows the rdnaptrans module to be used in either environment,
   * as it requires the grid files under ./resources to be
   * available.
   * @param src a file or url path string
   */value:function read(grdFile){var buffer=void 0;try{buffer=gridFiles[grdFile];if(!buffer)throw new Error(grdFile+' is not a valid grd file.');return buffer;}catch(err){throw err;}}},{key:'readShort',value:function readShort(buffer,offset){return buffer.readUInt16LE(offset);}},{key:'readDouble',value:function readDouble(buffer,offset){return buffer.readDoubleLE(offset);}}]);return Reader;}();module.exports=Reader;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[5]);