var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// node_modules/jszip/dist/jszip.min.js
var require_jszip_min = __commonJS({
  "node_modules/jszip/dist/jszip.min.js"(exports, module) {
    !(function(e) {
      if ("object" == typeof exports && "undefined" != typeof module) module.exports = e();
      else if ("function" == typeof define && define.amd) define([], e);
      else {
        ("undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this).JSZip = e();
      }
    })(function() {
      return (function s(a, o, h) {
        function u(r, e2) {
          if (!o[r]) {
            if (!a[r]) {
              var t = "function" == typeof __require && __require;
              if (!e2 && t) return t(r, true);
              if (l) return l(r, true);
              var n = new Error("Cannot find module '" + r + "'");
              throw n.code = "MODULE_NOT_FOUND", n;
            }
            var i = o[r] = { exports: {} };
            a[r][0].call(i.exports, function(e3) {
              var t2 = a[r][1][e3];
              return u(t2 || e3);
            }, i, i.exports, s, a, o, h);
          }
          return o[r].exports;
        }
        for (var l = "function" == typeof __require && __require, e = 0; e < h.length; e++) u(h[e]);
        return u;
      })({ 1: [function(e, t, r) {
        "use strict";
        var d = e("./utils"), c = e("./support"), p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        r.encode = function(e2) {
          for (var t2, r2, n, i, s, a, o, h = [], u = 0, l = e2.length, f = l, c2 = "string" !== d.getTypeOf(e2); u < e2.length; ) f = l - u, n = c2 ? (t2 = e2[u++], r2 = u < l ? e2[u++] : 0, u < l ? e2[u++] : 0) : (t2 = e2.charCodeAt(u++), r2 = u < l ? e2.charCodeAt(u++) : 0, u < l ? e2.charCodeAt(u++) : 0), i = t2 >> 2, s = (3 & t2) << 4 | r2 >> 4, a = 1 < f ? (15 & r2) << 2 | n >> 6 : 64, o = 2 < f ? 63 & n : 64, h.push(p.charAt(i) + p.charAt(s) + p.charAt(a) + p.charAt(o));
          return h.join("");
        }, r.decode = function(e2) {
          var t2, r2, n, i, s, a, o = 0, h = 0, u = "data:";
          if (e2.substr(0, u.length) === u) throw new Error("Invalid base64 input, it looks like a data url.");
          var l, f = 3 * (e2 = e2.replace(/[^A-Za-z0-9+/=]/g, "")).length / 4;
          if (e2.charAt(e2.length - 1) === p.charAt(64) && f--, e2.charAt(e2.length - 2) === p.charAt(64) && f--, f % 1 != 0) throw new Error("Invalid base64 input, bad content length.");
          for (l = c.uint8array ? new Uint8Array(0 | f) : new Array(0 | f); o < e2.length; ) t2 = p.indexOf(e2.charAt(o++)) << 2 | (i = p.indexOf(e2.charAt(o++))) >> 4, r2 = (15 & i) << 4 | (s = p.indexOf(e2.charAt(o++))) >> 2, n = (3 & s) << 6 | (a = p.indexOf(e2.charAt(o++))), l[h++] = t2, 64 !== s && (l[h++] = r2), 64 !== a && (l[h++] = n);
          return l;
        };
      }, { "./support": 30, "./utils": 32 }], 2: [function(e, t, r) {
        "use strict";
        var n = e("./external"), i = e("./stream/DataWorker"), s = e("./stream/Crc32Probe"), a = e("./stream/DataLengthProbe");
        function o(e2, t2, r2, n2, i2) {
          this.compressedSize = e2, this.uncompressedSize = t2, this.crc32 = r2, this.compression = n2, this.compressedContent = i2;
        }
        o.prototype = { getContentWorker: function() {
          var e2 = new i(n.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new a("data_length")), t2 = this;
          return e2.on("end", function() {
            if (this.streamInfo.data_length !== t2.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
          }), e2;
        }, getCompressedWorker: function() {
          return new i(n.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
        } }, o.createWorkerFrom = function(e2, t2, r2) {
          return e2.pipe(new s()).pipe(new a("uncompressedSize")).pipe(t2.compressWorker(r2)).pipe(new a("compressedSize")).withStreamInfo("compression", t2);
        }, t.exports = o;
      }, { "./external": 6, "./stream/Crc32Probe": 25, "./stream/DataLengthProbe": 26, "./stream/DataWorker": 27 }], 3: [function(e, t, r) {
        "use strict";
        var n = e("./stream/GenericWorker");
        r.STORE = { magic: "\0\0", compressWorker: function() {
          return new n("STORE compression");
        }, uncompressWorker: function() {
          return new n("STORE decompression");
        } }, r.DEFLATE = e("./flate");
      }, { "./flate": 7, "./stream/GenericWorker": 28 }], 4: [function(e, t, r) {
        "use strict";
        var n = e("./utils");
        var o = (function() {
          for (var e2, t2 = [], r2 = 0; r2 < 256; r2++) {
            e2 = r2;
            for (var n2 = 0; n2 < 8; n2++) e2 = 1 & e2 ? 3988292384 ^ e2 >>> 1 : e2 >>> 1;
            t2[r2] = e2;
          }
          return t2;
        })();
        t.exports = function(e2, t2) {
          return void 0 !== e2 && e2.length ? "string" !== n.getTypeOf(e2) ? (function(e3, t3, r2, n2) {
            var i = o, s = n2 + r2;
            e3 ^= -1;
            for (var a = n2; a < s; a++) e3 = e3 >>> 8 ^ i[255 & (e3 ^ t3[a])];
            return -1 ^ e3;
          })(0 | t2, e2, e2.length, 0) : (function(e3, t3, r2, n2) {
            var i = o, s = n2 + r2;
            e3 ^= -1;
            for (var a = n2; a < s; a++) e3 = e3 >>> 8 ^ i[255 & (e3 ^ t3.charCodeAt(a))];
            return -1 ^ e3;
          })(0 | t2, e2, e2.length, 0) : 0;
        };
      }, { "./utils": 32 }], 5: [function(e, t, r) {
        "use strict";
        r.base64 = false, r.binary = false, r.dir = false, r.createFolders = true, r.date = null, r.compression = null, r.compressionOptions = null, r.comment = null, r.unixPermissions = null, r.dosPermissions = null;
      }, {}], 6: [function(e, t, r) {
        "use strict";
        var n = null;
        n = "undefined" != typeof Promise ? Promise : e("lie"), t.exports = { Promise: n };
      }, { lie: 37 }], 7: [function(e, t, r) {
        "use strict";
        var n = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Uint32Array, i = e("pako"), s = e("./utils"), a = e("./stream/GenericWorker"), o = n ? "uint8array" : "array";
        function h(e2, t2) {
          a.call(this, "FlateWorker/" + e2), this._pako = null, this._pakoAction = e2, this._pakoOptions = t2, this.meta = {};
        }
        r.magic = "\b\0", s.inherits(h, a), h.prototype.processChunk = function(e2) {
          this.meta = e2.meta, null === this._pako && this._createPako(), this._pako.push(s.transformTo(o, e2.data), false);
        }, h.prototype.flush = function() {
          a.prototype.flush.call(this), null === this._pako && this._createPako(), this._pako.push([], true);
        }, h.prototype.cleanUp = function() {
          a.prototype.cleanUp.call(this), this._pako = null;
        }, h.prototype._createPako = function() {
          this._pako = new i[this._pakoAction]({ raw: true, level: this._pakoOptions.level || -1 });
          var t2 = this;
          this._pako.onData = function(e2) {
            t2.push({ data: e2, meta: t2.meta });
          };
        }, r.compressWorker = function(e2) {
          return new h("Deflate", e2);
        }, r.uncompressWorker = function() {
          return new h("Inflate", {});
        };
      }, { "./stream/GenericWorker": 28, "./utils": 32, pako: 38 }], 8: [function(e, t, r) {
        "use strict";
        function A(e2, t2) {
          var r2, n2 = "";
          for (r2 = 0; r2 < t2; r2++) n2 += String.fromCharCode(255 & e2), e2 >>>= 8;
          return n2;
        }
        function n(e2, t2, r2, n2, i2, s2) {
          var a, o, h = e2.file, u = e2.compression, l = s2 !== O.utf8encode, f = I.transformTo("string", s2(h.name)), c = I.transformTo("string", O.utf8encode(h.name)), d = h.comment, p = I.transformTo("string", s2(d)), m = I.transformTo("string", O.utf8encode(d)), _ = c.length !== h.name.length, g = m.length !== d.length, b = "", v = "", y = "", w = h.dir, k = h.date, x = { crc32: 0, compressedSize: 0, uncompressedSize: 0 };
          t2 && !r2 || (x.crc32 = e2.crc32, x.compressedSize = e2.compressedSize, x.uncompressedSize = e2.uncompressedSize);
          var S2 = 0;
          t2 && (S2 |= 8), l || !_ && !g || (S2 |= 2048);
          var z = 0, C = 0;
          w && (z |= 16), "UNIX" === i2 ? (C = 798, z |= (function(e3, t3) {
            var r3 = e3;
            return e3 || (r3 = t3 ? 16893 : 33204), (65535 & r3) << 16;
          })(h.unixPermissions, w)) : (C = 20, z |= (function(e3) {
            return 63 & (e3 || 0);
          })(h.dosPermissions)), a = k.getUTCHours(), a <<= 6, a |= k.getUTCMinutes(), a <<= 5, a |= k.getUTCSeconds() / 2, o = k.getUTCFullYear() - 1980, o <<= 4, o |= k.getUTCMonth() + 1, o <<= 5, o |= k.getUTCDate(), _ && (v = A(1, 1) + A(B(f), 4) + c, b += "up" + A(v.length, 2) + v), g && (y = A(1, 1) + A(B(p), 4) + m, b += "uc" + A(y.length, 2) + y);
          var E = "";
          return E += "\n\0", E += A(S2, 2), E += u.magic, E += A(a, 2), E += A(o, 2), E += A(x.crc32, 4), E += A(x.compressedSize, 4), E += A(x.uncompressedSize, 4), E += A(f.length, 2), E += A(b.length, 2), { fileRecord: R.LOCAL_FILE_HEADER + E + f + b, dirRecord: R.CENTRAL_FILE_HEADER + A(C, 2) + E + A(p.length, 2) + "\0\0\0\0" + A(z, 4) + A(n2, 4) + f + b + p };
        }
        var I = e("../utils"), i = e("../stream/GenericWorker"), O = e("../utf8"), B = e("../crc32"), R = e("../signature");
        function s(e2, t2, r2, n2) {
          i.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = t2, this.zipPlatform = r2, this.encodeFileName = n2, this.streamFiles = e2, this.accumulate = false, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
        }
        I.inherits(s, i), s.prototype.push = function(e2) {
          var t2 = e2.meta.percent || 0, r2 = this.entriesCount, n2 = this._sources.length;
          this.accumulate ? this.contentBuffer.push(e2) : (this.bytesWritten += e2.data.length, i.prototype.push.call(this, { data: e2.data, meta: { currentFile: this.currentFile, percent: r2 ? (t2 + 100 * (r2 - n2 - 1)) / r2 : 100 } }));
        }, s.prototype.openedSource = function(e2) {
          this.currentSourceOffset = this.bytesWritten, this.currentFile = e2.file.name;
          var t2 = this.streamFiles && !e2.file.dir;
          if (t2) {
            var r2 = n(e2, t2, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
            this.push({ data: r2.fileRecord, meta: { percent: 0 } });
          } else this.accumulate = true;
        }, s.prototype.closedSource = function(e2) {
          this.accumulate = false;
          var t2 = this.streamFiles && !e2.file.dir, r2 = n(e2, t2, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
          if (this.dirRecords.push(r2.dirRecord), t2) this.push({ data: (function(e3) {
            return R.DATA_DESCRIPTOR + A(e3.crc32, 4) + A(e3.compressedSize, 4) + A(e3.uncompressedSize, 4);
          })(e2), meta: { percent: 100 } });
          else for (this.push({ data: r2.fileRecord, meta: { percent: 0 } }); this.contentBuffer.length; ) this.push(this.contentBuffer.shift());
          this.currentFile = null;
        }, s.prototype.flush = function() {
          for (var e2 = this.bytesWritten, t2 = 0; t2 < this.dirRecords.length; t2++) this.push({ data: this.dirRecords[t2], meta: { percent: 100 } });
          var r2 = this.bytesWritten - e2, n2 = (function(e3, t3, r3, n3, i2) {
            var s2 = I.transformTo("string", i2(n3));
            return R.CENTRAL_DIRECTORY_END + "\0\0\0\0" + A(e3, 2) + A(e3, 2) + A(t3, 4) + A(r3, 4) + A(s2.length, 2) + s2;
          })(this.dirRecords.length, r2, e2, this.zipComment, this.encodeFileName);
          this.push({ data: n2, meta: { percent: 100 } });
        }, s.prototype.prepareNextSource = function() {
          this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume();
        }, s.prototype.registerPrevious = function(e2) {
          this._sources.push(e2);
          var t2 = this;
          return e2.on("data", function(e3) {
            t2.processChunk(e3);
          }), e2.on("end", function() {
            t2.closedSource(t2.previous.streamInfo), t2._sources.length ? t2.prepareNextSource() : t2.end();
          }), e2.on("error", function(e3) {
            t2.error(e3);
          }), this;
        }, s.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), true) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), true));
        }, s.prototype.error = function(e2) {
          var t2 = this._sources;
          if (!i.prototype.error.call(this, e2)) return false;
          for (var r2 = 0; r2 < t2.length; r2++) try {
            t2[r2].error(e2);
          } catch (e3) {
          }
          return true;
        }, s.prototype.lock = function() {
          i.prototype.lock.call(this);
          for (var e2 = this._sources, t2 = 0; t2 < e2.length; t2++) e2[t2].lock();
        }, t.exports = s;
      }, { "../crc32": 4, "../signature": 23, "../stream/GenericWorker": 28, "../utf8": 31, "../utils": 32 }], 9: [function(e, t, r) {
        "use strict";
        var u = e("../compressions"), n = e("./ZipFileWorker");
        r.generateWorker = function(e2, a, t2) {
          var o = new n(a.streamFiles, t2, a.platform, a.encodeFileName), h = 0;
          try {
            e2.forEach(function(e3, t3) {
              h++;
              var r2 = (function(e4, t4) {
                var r3 = e4 || t4, n3 = u[r3];
                if (!n3) throw new Error(r3 + " is not a valid compression method !");
                return n3;
              })(t3.options.compression, a.compression), n2 = t3.options.compressionOptions || a.compressionOptions || {}, i = t3.dir, s = t3.date;
              t3._compressWorker(r2, n2).withStreamInfo("file", { name: e3, dir: i, date: s, comment: t3.comment || "", unixPermissions: t3.unixPermissions, dosPermissions: t3.dosPermissions }).pipe(o);
            }), o.entriesCount = h;
          } catch (e3) {
            o.error(e3);
          }
          return o;
        };
      }, { "../compressions": 3, "./ZipFileWorker": 8 }], 10: [function(e, t, r) {
        "use strict";
        function n() {
          if (!(this instanceof n)) return new n();
          if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
          this.files = /* @__PURE__ */ Object.create(null), this.comment = null, this.root = "", this.clone = function() {
            var e2 = new n();
            for (var t2 in this) "function" != typeof this[t2] && (e2[t2] = this[t2]);
            return e2;
          };
        }
        (n.prototype = e("./object")).loadAsync = e("./load"), n.support = e("./support"), n.defaults = e("./defaults"), n.version = "3.10.1", n.loadAsync = function(e2, t2) {
          return new n().loadAsync(e2, t2);
        }, n.external = e("./external"), t.exports = n;
      }, { "./defaults": 5, "./external": 6, "./load": 11, "./object": 15, "./support": 30 }], 11: [function(e, t, r) {
        "use strict";
        var u = e("./utils"), i = e("./external"), n = e("./utf8"), s = e("./zipEntries"), a = e("./stream/Crc32Probe"), l = e("./nodejsUtils");
        function f(n2) {
          return new i.Promise(function(e2, t2) {
            var r2 = n2.decompressed.getContentWorker().pipe(new a());
            r2.on("error", function(e3) {
              t2(e3);
            }).on("end", function() {
              r2.streamInfo.crc32 !== n2.decompressed.crc32 ? t2(new Error("Corrupted zip : CRC32 mismatch")) : e2();
            }).resume();
          });
        }
        t.exports = function(e2, o) {
          var h = this;
          return o = u.extend(o || {}, { base64: false, checkCRC32: false, optimizedBinaryString: false, createFolders: false, decodeFileName: n.utf8decode }), l.isNode && l.isStream(e2) ? i.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")) : u.prepareContent("the loaded zip file", e2, true, o.optimizedBinaryString, o.base64).then(function(e3) {
            var t2 = new s(o);
            return t2.load(e3), t2;
          }).then(function(e3) {
            var t2 = [i.Promise.resolve(e3)], r2 = e3.files;
            if (o.checkCRC32) for (var n2 = 0; n2 < r2.length; n2++) t2.push(f(r2[n2]));
            return i.Promise.all(t2);
          }).then(function(e3) {
            for (var t2 = e3.shift(), r2 = t2.files, n2 = 0; n2 < r2.length; n2++) {
              var i2 = r2[n2], s2 = i2.fileNameStr, a2 = u.resolve(i2.fileNameStr);
              h.file(a2, i2.decompressed, { binary: true, optimizedBinaryString: true, date: i2.date, dir: i2.dir, comment: i2.fileCommentStr.length ? i2.fileCommentStr : null, unixPermissions: i2.unixPermissions, dosPermissions: i2.dosPermissions, createFolders: o.createFolders }), i2.dir || (h.file(a2).unsafeOriginalName = s2);
            }
            return t2.zipComment.length && (h.comment = t2.zipComment), h;
          });
        };
      }, { "./external": 6, "./nodejsUtils": 14, "./stream/Crc32Probe": 25, "./utf8": 31, "./utils": 32, "./zipEntries": 33 }], 12: [function(e, t, r) {
        "use strict";
        var n = e("../utils"), i = e("../stream/GenericWorker");
        function s(e2, t2) {
          i.call(this, "Nodejs stream input adapter for " + e2), this._upstreamEnded = false, this._bindStream(t2);
        }
        n.inherits(s, i), s.prototype._bindStream = function(e2) {
          var t2 = this;
          (this._stream = e2).pause(), e2.on("data", function(e3) {
            t2.push({ data: e3, meta: { percent: 0 } });
          }).on("error", function(e3) {
            t2.isPaused ? this.generatedError = e3 : t2.error(e3);
          }).on("end", function() {
            t2.isPaused ? t2._upstreamEnded = true : t2.end();
          });
        }, s.prototype.pause = function() {
          return !!i.prototype.pause.call(this) && (this._stream.pause(), true);
        }, s.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), true);
        }, t.exports = s;
      }, { "../stream/GenericWorker": 28, "../utils": 32 }], 13: [function(e, t, r) {
        "use strict";
        var i = e("readable-stream").Readable;
        function n(e2, t2, r2) {
          i.call(this, t2), this._helper = e2;
          var n2 = this;
          e2.on("data", function(e3, t3) {
            n2.push(e3) || n2._helper.pause(), r2 && r2(t3);
          }).on("error", function(e3) {
            n2.emit("error", e3);
          }).on("end", function() {
            n2.push(null);
          });
        }
        e("../utils").inherits(n, i), n.prototype._read = function() {
          this._helper.resume();
        }, t.exports = n;
      }, { "../utils": 32, "readable-stream": 16 }], 14: [function(e, t, r) {
        "use strict";
        t.exports = { isNode: "undefined" != typeof Buffer, newBufferFrom: function(e2, t2) {
          if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(e2, t2);
          if ("number" == typeof e2) throw new Error('The "data" argument must not be a number');
          return new Buffer(e2, t2);
        }, allocBuffer: function(e2) {
          if (Buffer.alloc) return Buffer.alloc(e2);
          var t2 = new Buffer(e2);
          return t2.fill(0), t2;
        }, isBuffer: function(e2) {
          return Buffer.isBuffer(e2);
        }, isStream: function(e2) {
          return e2 && "function" == typeof e2.on && "function" == typeof e2.pause && "function" == typeof e2.resume;
        } };
      }, {}], 15: [function(e, t, r) {
        "use strict";
        function s(e2, t2, r2) {
          var n2, i2 = u.getTypeOf(t2), s2 = u.extend(r2 || {}, f);
          s2.date = s2.date || /* @__PURE__ */ new Date(), null !== s2.compression && (s2.compression = s2.compression.toUpperCase()), "string" == typeof s2.unixPermissions && (s2.unixPermissions = parseInt(s2.unixPermissions, 8)), s2.unixPermissions && 16384 & s2.unixPermissions && (s2.dir = true), s2.dosPermissions && 16 & s2.dosPermissions && (s2.dir = true), s2.dir && (e2 = g(e2)), s2.createFolders && (n2 = _(e2)) && b.call(this, n2, true);
          var a2 = "string" === i2 && false === s2.binary && false === s2.base64;
          r2 && void 0 !== r2.binary || (s2.binary = !a2), (t2 instanceof c && 0 === t2.uncompressedSize || s2.dir || !t2 || 0 === t2.length) && (s2.base64 = false, s2.binary = true, t2 = "", s2.compression = "STORE", i2 = "string");
          var o2 = null;
          o2 = t2 instanceof c || t2 instanceof l ? t2 : p.isNode && p.isStream(t2) ? new m(e2, t2) : u.prepareContent(e2, t2, s2.binary, s2.optimizedBinaryString, s2.base64);
          var h2 = new d(e2, o2, s2);
          this.files[e2] = h2;
        }
        var i = e("./utf8"), u = e("./utils"), l = e("./stream/GenericWorker"), a = e("./stream/StreamHelper"), f = e("./defaults"), c = e("./compressedObject"), d = e("./zipObject"), o = e("./generate"), p = e("./nodejsUtils"), m = e("./nodejs/NodejsStreamInputAdapter"), _ = function(e2) {
          "/" === e2.slice(-1) && (e2 = e2.substring(0, e2.length - 1));
          var t2 = e2.lastIndexOf("/");
          return 0 < t2 ? e2.substring(0, t2) : "";
        }, g = function(e2) {
          return "/" !== e2.slice(-1) && (e2 += "/"), e2;
        }, b = function(e2, t2) {
          return t2 = void 0 !== t2 ? t2 : f.createFolders, e2 = g(e2), this.files[e2] || s.call(this, e2, null, { dir: true, createFolders: t2 }), this.files[e2];
        };
        function h(e2) {
          return "[object RegExp]" === Object.prototype.toString.call(e2);
        }
        var n = { load: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, forEach: function(e2) {
          var t2, r2, n2;
          for (t2 in this.files) n2 = this.files[t2], (r2 = t2.slice(this.root.length, t2.length)) && t2.slice(0, this.root.length) === this.root && e2(r2, n2);
        }, filter: function(r2) {
          var n2 = [];
          return this.forEach(function(e2, t2) {
            r2(e2, t2) && n2.push(t2);
          }), n2;
        }, file: function(e2, t2, r2) {
          if (1 !== arguments.length) return e2 = this.root + e2, s.call(this, e2, t2, r2), this;
          if (h(e2)) {
            var n2 = e2;
            return this.filter(function(e3, t3) {
              return !t3.dir && n2.test(e3);
            });
          }
          var i2 = this.files[this.root + e2];
          return i2 && !i2.dir ? i2 : null;
        }, folder: function(r2) {
          if (!r2) return this;
          if (h(r2)) return this.filter(function(e3, t3) {
            return t3.dir && r2.test(e3);
          });
          var e2 = this.root + r2, t2 = b.call(this, e2), n2 = this.clone();
          return n2.root = t2.name, n2;
        }, remove: function(r2) {
          r2 = this.root + r2;
          var e2 = this.files[r2];
          if (e2 || ("/" !== r2.slice(-1) && (r2 += "/"), e2 = this.files[r2]), e2 && !e2.dir) delete this.files[r2];
          else for (var t2 = this.filter(function(e3, t3) {
            return t3.name.slice(0, r2.length) === r2;
          }), n2 = 0; n2 < t2.length; n2++) delete this.files[t2[n2].name];
          return this;
        }, generate: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, generateInternalStream: function(e2) {
          var t2, r2 = {};
          try {
            if ((r2 = u.extend(e2 || {}, { streamFiles: false, compression: "STORE", compressionOptions: null, type: "", platform: "DOS", comment: null, mimeType: "application/zip", encodeFileName: i.utf8encode })).type = r2.type.toLowerCase(), r2.compression = r2.compression.toUpperCase(), "binarystring" === r2.type && (r2.type = "string"), !r2.type) throw new Error("No output type specified.");
            u.checkSupport(r2.type), "darwin" !== r2.platform && "freebsd" !== r2.platform && "linux" !== r2.platform && "sunos" !== r2.platform || (r2.platform = "UNIX"), "win32" === r2.platform && (r2.platform = "DOS");
            var n2 = r2.comment || this.comment || "";
            t2 = o.generateWorker(this, r2, n2);
          } catch (e3) {
            (t2 = new l("error")).error(e3);
          }
          return new a(t2, r2.type || "string", r2.mimeType);
        }, generateAsync: function(e2, t2) {
          return this.generateInternalStream(e2).accumulate(t2);
        }, generateNodeStream: function(e2, t2) {
          return (e2 = e2 || {}).type || (e2.type = "nodebuffer"), this.generateInternalStream(e2).toNodejsStream(t2);
        } };
        t.exports = n;
      }, { "./compressedObject": 2, "./defaults": 5, "./generate": 9, "./nodejs/NodejsStreamInputAdapter": 12, "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31, "./utils": 32, "./zipObject": 35 }], 16: [function(e, t, r) {
        "use strict";
        t.exports = e("stream");
      }, { stream: void 0 }], 17: [function(e, t, r) {
        "use strict";
        var n = e("./DataReader");
        function i(e2) {
          n.call(this, e2);
          for (var t2 = 0; t2 < this.data.length; t2++) e2[t2] = 255 & e2[t2];
        }
        e("../utils").inherits(i, n), i.prototype.byteAt = function(e2) {
          return this.data[this.zero + e2];
        }, i.prototype.lastIndexOfSignature = function(e2) {
          for (var t2 = e2.charCodeAt(0), r2 = e2.charCodeAt(1), n2 = e2.charCodeAt(2), i2 = e2.charCodeAt(3), s = this.length - 4; 0 <= s; --s) if (this.data[s] === t2 && this.data[s + 1] === r2 && this.data[s + 2] === n2 && this.data[s + 3] === i2) return s - this.zero;
          return -1;
        }, i.prototype.readAndCheckSignature = function(e2) {
          var t2 = e2.charCodeAt(0), r2 = e2.charCodeAt(1), n2 = e2.charCodeAt(2), i2 = e2.charCodeAt(3), s = this.readData(4);
          return t2 === s[0] && r2 === s[1] && n2 === s[2] && i2 === s[3];
        }, i.prototype.readData = function(e2) {
          if (this.checkOffset(e2), 0 === e2) return [];
          var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./DataReader": 18 }], 18: [function(e, t, r) {
        "use strict";
        var n = e("../utils");
        function i(e2) {
          this.data = e2, this.length = e2.length, this.index = 0, this.zero = 0;
        }
        i.prototype = { checkOffset: function(e2) {
          this.checkIndex(this.index + e2);
        }, checkIndex: function(e2) {
          if (this.length < this.zero + e2 || e2 < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + e2 + "). Corrupted zip ?");
        }, setIndex: function(e2) {
          this.checkIndex(e2), this.index = e2;
        }, skip: function(e2) {
          this.setIndex(this.index + e2);
        }, byteAt: function() {
        }, readInt: function(e2) {
          var t2, r2 = 0;
          for (this.checkOffset(e2), t2 = this.index + e2 - 1; t2 >= this.index; t2--) r2 = (r2 << 8) + this.byteAt(t2);
          return this.index += e2, r2;
        }, readString: function(e2) {
          return n.transformTo("string", this.readData(e2));
        }, readData: function() {
        }, lastIndexOfSignature: function() {
        }, readAndCheckSignature: function() {
        }, readDate: function() {
          var e2 = this.readInt(4);
          return new Date(Date.UTC(1980 + (e2 >> 25 & 127), (e2 >> 21 & 15) - 1, e2 >> 16 & 31, e2 >> 11 & 31, e2 >> 5 & 63, (31 & e2) << 1));
        } }, t.exports = i;
      }, { "../utils": 32 }], 19: [function(e, t, r) {
        "use strict";
        var n = e("./Uint8ArrayReader");
        function i(e2) {
          n.call(this, e2);
        }
        e("../utils").inherits(i, n), i.prototype.readData = function(e2) {
          this.checkOffset(e2);
          var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./Uint8ArrayReader": 21 }], 20: [function(e, t, r) {
        "use strict";
        var n = e("./DataReader");
        function i(e2) {
          n.call(this, e2);
        }
        e("../utils").inherits(i, n), i.prototype.byteAt = function(e2) {
          return this.data.charCodeAt(this.zero + e2);
        }, i.prototype.lastIndexOfSignature = function(e2) {
          return this.data.lastIndexOf(e2) - this.zero;
        }, i.prototype.readAndCheckSignature = function(e2) {
          return e2 === this.readData(4);
        }, i.prototype.readData = function(e2) {
          this.checkOffset(e2);
          var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./DataReader": 18 }], 21: [function(e, t, r) {
        "use strict";
        var n = e("./ArrayReader");
        function i(e2) {
          n.call(this, e2);
        }
        e("../utils").inherits(i, n), i.prototype.readData = function(e2) {
          if (this.checkOffset(e2), 0 === e2) return new Uint8Array(0);
          var t2 = this.data.subarray(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./ArrayReader": 17 }], 22: [function(e, t, r) {
        "use strict";
        var n = e("../utils"), i = e("../support"), s = e("./ArrayReader"), a = e("./StringReader"), o = e("./NodeBufferReader"), h = e("./Uint8ArrayReader");
        t.exports = function(e2) {
          var t2 = n.getTypeOf(e2);
          return n.checkSupport(t2), "string" !== t2 || i.uint8array ? "nodebuffer" === t2 ? new o(e2) : i.uint8array ? new h(n.transformTo("uint8array", e2)) : new s(n.transformTo("array", e2)) : new a(e2);
        };
      }, { "../support": 30, "../utils": 32, "./ArrayReader": 17, "./NodeBufferReader": 19, "./StringReader": 20, "./Uint8ArrayReader": 21 }], 23: [function(e, t, r) {
        "use strict";
        r.LOCAL_FILE_HEADER = "PK", r.CENTRAL_FILE_HEADER = "PK", r.CENTRAL_DIRECTORY_END = "PK", r.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", r.ZIP64_CENTRAL_DIRECTORY_END = "PK", r.DATA_DESCRIPTOR = "PK\x07\b";
      }, {}], 24: [function(e, t, r) {
        "use strict";
        var n = e("./GenericWorker"), i = e("../utils");
        function s(e2) {
          n.call(this, "ConvertWorker to " + e2), this.destType = e2;
        }
        i.inherits(s, n), s.prototype.processChunk = function(e2) {
          this.push({ data: i.transformTo(this.destType, e2.data), meta: e2.meta });
        }, t.exports = s;
      }, { "../utils": 32, "./GenericWorker": 28 }], 25: [function(e, t, r) {
        "use strict";
        var n = e("./GenericWorker"), i = e("../crc32");
        function s() {
          n.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
        }
        e("../utils").inherits(s, n), s.prototype.processChunk = function(e2) {
          this.streamInfo.crc32 = i(e2.data, this.streamInfo.crc32 || 0), this.push(e2);
        }, t.exports = s;
      }, { "../crc32": 4, "../utils": 32, "./GenericWorker": 28 }], 26: [function(e, t, r) {
        "use strict";
        var n = e("../utils"), i = e("./GenericWorker");
        function s(e2) {
          i.call(this, "DataLengthProbe for " + e2), this.propName = e2, this.withStreamInfo(e2, 0);
        }
        n.inherits(s, i), s.prototype.processChunk = function(e2) {
          if (e2) {
            var t2 = this.streamInfo[this.propName] || 0;
            this.streamInfo[this.propName] = t2 + e2.data.length;
          }
          i.prototype.processChunk.call(this, e2);
        }, t.exports = s;
      }, { "../utils": 32, "./GenericWorker": 28 }], 27: [function(e, t, r) {
        "use strict";
        var n = e("../utils"), i = e("./GenericWorker");
        function s(e2) {
          i.call(this, "DataWorker");
          var t2 = this;
          this.dataIsReady = false, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = false, e2.then(function(e3) {
            t2.dataIsReady = true, t2.data = e3, t2.max = e3 && e3.length || 0, t2.type = n.getTypeOf(e3), t2.isPaused || t2._tickAndRepeat();
          }, function(e3) {
            t2.error(e3);
          });
        }
        n.inherits(s, i), s.prototype.cleanUp = function() {
          i.prototype.cleanUp.call(this), this.data = null;
        }, s.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = true, n.delay(this._tickAndRepeat, [], this)), true);
        }, s.prototype._tickAndRepeat = function() {
          this._tickScheduled = false, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (n.delay(this._tickAndRepeat, [], this), this._tickScheduled = true));
        }, s.prototype._tick = function() {
          if (this.isPaused || this.isFinished) return false;
          var e2 = null, t2 = Math.min(this.max, this.index + 16384);
          if (this.index >= this.max) return this.end();
          switch (this.type) {
            case "string":
              e2 = this.data.substring(this.index, t2);
              break;
            case "uint8array":
              e2 = this.data.subarray(this.index, t2);
              break;
            case "array":
            case "nodebuffer":
              e2 = this.data.slice(this.index, t2);
          }
          return this.index = t2, this.push({ data: e2, meta: { percent: this.max ? this.index / this.max * 100 : 0 } });
        }, t.exports = s;
      }, { "../utils": 32, "./GenericWorker": 28 }], 28: [function(e, t, r) {
        "use strict";
        function n(e2) {
          this.name = e2 || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = true, this.isFinished = false, this.isLocked = false, this._listeners = { data: [], end: [], error: [] }, this.previous = null;
        }
        n.prototype = { push: function(e2) {
          this.emit("data", e2);
        }, end: function() {
          if (this.isFinished) return false;
          this.flush();
          try {
            this.emit("end"), this.cleanUp(), this.isFinished = true;
          } catch (e2) {
            this.emit("error", e2);
          }
          return true;
        }, error: function(e2) {
          return !this.isFinished && (this.isPaused ? this.generatedError = e2 : (this.isFinished = true, this.emit("error", e2), this.previous && this.previous.error(e2), this.cleanUp()), true);
        }, on: function(e2, t2) {
          return this._listeners[e2].push(t2), this;
        }, cleanUp: function() {
          this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
        }, emit: function(e2, t2) {
          if (this._listeners[e2]) for (var r2 = 0; r2 < this._listeners[e2].length; r2++) this._listeners[e2][r2].call(this, t2);
        }, pipe: function(e2) {
          return e2.registerPrevious(this);
        }, registerPrevious: function(e2) {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.streamInfo = e2.streamInfo, this.mergeStreamInfo(), this.previous = e2;
          var t2 = this;
          return e2.on("data", function(e3) {
            t2.processChunk(e3);
          }), e2.on("end", function() {
            t2.end();
          }), e2.on("error", function(e3) {
            t2.error(e3);
          }), this;
        }, pause: function() {
          return !this.isPaused && !this.isFinished && (this.isPaused = true, this.previous && this.previous.pause(), true);
        }, resume: function() {
          if (!this.isPaused || this.isFinished) return false;
          var e2 = this.isPaused = false;
          return this.generatedError && (this.error(this.generatedError), e2 = true), this.previous && this.previous.resume(), !e2;
        }, flush: function() {
        }, processChunk: function(e2) {
          this.push(e2);
        }, withStreamInfo: function(e2, t2) {
          return this.extraStreamInfo[e2] = t2, this.mergeStreamInfo(), this;
        }, mergeStreamInfo: function() {
          for (var e2 in this.extraStreamInfo) Object.prototype.hasOwnProperty.call(this.extraStreamInfo, e2) && (this.streamInfo[e2] = this.extraStreamInfo[e2]);
        }, lock: function() {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.isLocked = true, this.previous && this.previous.lock();
        }, toString: function() {
          var e2 = "Worker " + this.name;
          return this.previous ? this.previous + " -> " + e2 : e2;
        } }, t.exports = n;
      }, {}], 29: [function(e, t, r) {
        "use strict";
        var h = e("../utils"), i = e("./ConvertWorker"), s = e("./GenericWorker"), u = e("../base64"), n = e("../support"), a = e("../external"), o = null;
        if (n.nodestream) try {
          o = e("../nodejs/NodejsStreamOutputAdapter");
        } catch (e2) {
        }
        function l(e2, o2) {
          return new a.Promise(function(t2, r2) {
            var n2 = [], i2 = e2._internalType, s2 = e2._outputType, a2 = e2._mimeType;
            e2.on("data", function(e3, t3) {
              n2.push(e3), o2 && o2(t3);
            }).on("error", function(e3) {
              n2 = [], r2(e3);
            }).on("end", function() {
              try {
                var e3 = (function(e4, t3, r3) {
                  switch (e4) {
                    case "blob":
                      return h.newBlob(h.transformTo("arraybuffer", t3), r3);
                    case "base64":
                      return u.encode(t3);
                    default:
                      return h.transformTo(e4, t3);
                  }
                })(s2, (function(e4, t3) {
                  var r3, n3 = 0, i3 = null, s3 = 0;
                  for (r3 = 0; r3 < t3.length; r3++) s3 += t3[r3].length;
                  switch (e4) {
                    case "string":
                      return t3.join("");
                    case "array":
                      return Array.prototype.concat.apply([], t3);
                    case "uint8array":
                      for (i3 = new Uint8Array(s3), r3 = 0; r3 < t3.length; r3++) i3.set(t3[r3], n3), n3 += t3[r3].length;
                      return i3;
                    case "nodebuffer":
                      return Buffer.concat(t3);
                    default:
                      throw new Error("concat : unsupported type '" + e4 + "'");
                  }
                })(i2, n2), a2);
                t2(e3);
              } catch (e4) {
                r2(e4);
              }
              n2 = [];
            }).resume();
          });
        }
        function f(e2, t2, r2) {
          var n2 = t2;
          switch (t2) {
            case "blob":
            case "arraybuffer":
              n2 = "uint8array";
              break;
            case "base64":
              n2 = "string";
          }
          try {
            this._internalType = n2, this._outputType = t2, this._mimeType = r2, h.checkSupport(n2), this._worker = e2.pipe(new i(n2)), e2.lock();
          } catch (e3) {
            this._worker = new s("error"), this._worker.error(e3);
          }
        }
        f.prototype = { accumulate: function(e2) {
          return l(this, e2);
        }, on: function(e2, t2) {
          var r2 = this;
          return "data" === e2 ? this._worker.on(e2, function(e3) {
            t2.call(r2, e3.data, e3.meta);
          }) : this._worker.on(e2, function() {
            h.delay(t2, arguments, r2);
          }), this;
        }, resume: function() {
          return h.delay(this._worker.resume, [], this._worker), this;
        }, pause: function() {
          return this._worker.pause(), this;
        }, toNodejsStream: function(e2) {
          if (h.checkSupport("nodestream"), "nodebuffer" !== this._outputType) throw new Error(this._outputType + " is not supported by this method");
          return new o(this, { objectMode: "nodebuffer" !== this._outputType }, e2);
        } }, t.exports = f;
      }, { "../base64": 1, "../external": 6, "../nodejs/NodejsStreamOutputAdapter": 13, "../support": 30, "../utils": 32, "./ConvertWorker": 24, "./GenericWorker": 28 }], 30: [function(e, t, r) {
        "use strict";
        if (r.base64 = true, r.array = true, r.string = true, r.arraybuffer = "undefined" != typeof ArrayBuffer && "undefined" != typeof Uint8Array, r.nodebuffer = "undefined" != typeof Buffer, r.uint8array = "undefined" != typeof Uint8Array, "undefined" == typeof ArrayBuffer) r.blob = false;
        else {
          var n = new ArrayBuffer(0);
          try {
            r.blob = 0 === new Blob([n], { type: "application/zip" }).size;
          } catch (e2) {
            try {
              var i = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              i.append(n), r.blob = 0 === i.getBlob("application/zip").size;
            } catch (e3) {
              r.blob = false;
            }
          }
        }
        try {
          r.nodestream = !!e("readable-stream").Readable;
        } catch (e2) {
          r.nodestream = false;
        }
      }, { "readable-stream": 16 }], 31: [function(e, t, s) {
        "use strict";
        for (var o = e("./utils"), h = e("./support"), r = e("./nodejsUtils"), n = e("./stream/GenericWorker"), u = new Array(256), i = 0; i < 256; i++) u[i] = 252 <= i ? 6 : 248 <= i ? 5 : 240 <= i ? 4 : 224 <= i ? 3 : 192 <= i ? 2 : 1;
        u[254] = u[254] = 1;
        function a() {
          n.call(this, "utf-8 decode"), this.leftOver = null;
        }
        function l() {
          n.call(this, "utf-8 encode");
        }
        s.utf8encode = function(e2) {
          return h.nodebuffer ? r.newBufferFrom(e2, "utf-8") : (function(e3) {
            var t2, r2, n2, i2, s2, a2 = e3.length, o2 = 0;
            for (i2 = 0; i2 < a2; i2++) 55296 == (64512 & (r2 = e3.charCodeAt(i2))) && i2 + 1 < a2 && 56320 == (64512 & (n2 = e3.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), o2 += r2 < 128 ? 1 : r2 < 2048 ? 2 : r2 < 65536 ? 3 : 4;
            for (t2 = h.uint8array ? new Uint8Array(o2) : new Array(o2), i2 = s2 = 0; s2 < o2; i2++) 55296 == (64512 & (r2 = e3.charCodeAt(i2))) && i2 + 1 < a2 && 56320 == (64512 & (n2 = e3.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), r2 < 128 ? t2[s2++] = r2 : (r2 < 2048 ? t2[s2++] = 192 | r2 >>> 6 : (r2 < 65536 ? t2[s2++] = 224 | r2 >>> 12 : (t2[s2++] = 240 | r2 >>> 18, t2[s2++] = 128 | r2 >>> 12 & 63), t2[s2++] = 128 | r2 >>> 6 & 63), t2[s2++] = 128 | 63 & r2);
            return t2;
          })(e2);
        }, s.utf8decode = function(e2) {
          return h.nodebuffer ? o.transformTo("nodebuffer", e2).toString("utf-8") : (function(e3) {
            var t2, r2, n2, i2, s2 = e3.length, a2 = new Array(2 * s2);
            for (t2 = r2 = 0; t2 < s2; ) if ((n2 = e3[t2++]) < 128) a2[r2++] = n2;
            else if (4 < (i2 = u[n2])) a2[r2++] = 65533, t2 += i2 - 1;
            else {
              for (n2 &= 2 === i2 ? 31 : 3 === i2 ? 15 : 7; 1 < i2 && t2 < s2; ) n2 = n2 << 6 | 63 & e3[t2++], i2--;
              1 < i2 ? a2[r2++] = 65533 : n2 < 65536 ? a2[r2++] = n2 : (n2 -= 65536, a2[r2++] = 55296 | n2 >> 10 & 1023, a2[r2++] = 56320 | 1023 & n2);
            }
            return a2.length !== r2 && (a2.subarray ? a2 = a2.subarray(0, r2) : a2.length = r2), o.applyFromCharCode(a2);
          })(e2 = o.transformTo(h.uint8array ? "uint8array" : "array", e2));
        }, o.inherits(a, n), a.prototype.processChunk = function(e2) {
          var t2 = o.transformTo(h.uint8array ? "uint8array" : "array", e2.data);
          if (this.leftOver && this.leftOver.length) {
            if (h.uint8array) {
              var r2 = t2;
              (t2 = new Uint8Array(r2.length + this.leftOver.length)).set(this.leftOver, 0), t2.set(r2, this.leftOver.length);
            } else t2 = this.leftOver.concat(t2);
            this.leftOver = null;
          }
          var n2 = (function(e3, t3) {
            var r3;
            for ((t3 = t3 || e3.length) > e3.length && (t3 = e3.length), r3 = t3 - 1; 0 <= r3 && 128 == (192 & e3[r3]); ) r3--;
            return r3 < 0 ? t3 : 0 === r3 ? t3 : r3 + u[e3[r3]] > t3 ? r3 : t3;
          })(t2), i2 = t2;
          n2 !== t2.length && (h.uint8array ? (i2 = t2.subarray(0, n2), this.leftOver = t2.subarray(n2, t2.length)) : (i2 = t2.slice(0, n2), this.leftOver = t2.slice(n2, t2.length))), this.push({ data: s.utf8decode(i2), meta: e2.meta });
        }, a.prototype.flush = function() {
          this.leftOver && this.leftOver.length && (this.push({ data: s.utf8decode(this.leftOver), meta: {} }), this.leftOver = null);
        }, s.Utf8DecodeWorker = a, o.inherits(l, n), l.prototype.processChunk = function(e2) {
          this.push({ data: s.utf8encode(e2.data), meta: e2.meta });
        }, s.Utf8EncodeWorker = l;
      }, { "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./support": 30, "./utils": 32 }], 32: [function(e, t, a) {
        "use strict";
        var o = e("./support"), h = e("./base64"), r = e("./nodejsUtils"), u = e("./external");
        function n(e2) {
          return e2;
        }
        function l(e2, t2) {
          for (var r2 = 0; r2 < e2.length; ++r2) t2[r2] = 255 & e2.charCodeAt(r2);
          return t2;
        }
        e("setimmediate"), a.newBlob = function(t2, r2) {
          a.checkSupport("blob");
          try {
            return new Blob([t2], { type: r2 });
          } catch (e2) {
            try {
              var n2 = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              return n2.append(t2), n2.getBlob(r2);
            } catch (e3) {
              throw new Error("Bug : can't construct the Blob.");
            }
          }
        };
        var i = { stringifyByChunk: function(e2, t2, r2) {
          var n2 = [], i2 = 0, s2 = e2.length;
          if (s2 <= r2) return String.fromCharCode.apply(null, e2);
          for (; i2 < s2; ) "array" === t2 || "nodebuffer" === t2 ? n2.push(String.fromCharCode.apply(null, e2.slice(i2, Math.min(i2 + r2, s2)))) : n2.push(String.fromCharCode.apply(null, e2.subarray(i2, Math.min(i2 + r2, s2)))), i2 += r2;
          return n2.join("");
        }, stringifyByChar: function(e2) {
          for (var t2 = "", r2 = 0; r2 < e2.length; r2++) t2 += String.fromCharCode(e2[r2]);
          return t2;
        }, applyCanBeUsed: { uint8array: (function() {
          try {
            return o.uint8array && 1 === String.fromCharCode.apply(null, new Uint8Array(1)).length;
          } catch (e2) {
            return false;
          }
        })(), nodebuffer: (function() {
          try {
            return o.nodebuffer && 1 === String.fromCharCode.apply(null, r.allocBuffer(1)).length;
          } catch (e2) {
            return false;
          }
        })() } };
        function s(e2) {
          var t2 = 65536, r2 = a.getTypeOf(e2), n2 = true;
          if ("uint8array" === r2 ? n2 = i.applyCanBeUsed.uint8array : "nodebuffer" === r2 && (n2 = i.applyCanBeUsed.nodebuffer), n2) for (; 1 < t2; ) try {
            return i.stringifyByChunk(e2, r2, t2);
          } catch (e3) {
            t2 = Math.floor(t2 / 2);
          }
          return i.stringifyByChar(e2);
        }
        function f(e2, t2) {
          for (var r2 = 0; r2 < e2.length; r2++) t2[r2] = e2[r2];
          return t2;
        }
        a.applyFromCharCode = s;
        var c = {};
        c.string = { string: n, array: function(e2) {
          return l(e2, new Array(e2.length));
        }, arraybuffer: function(e2) {
          return c.string.uint8array(e2).buffer;
        }, uint8array: function(e2) {
          return l(e2, new Uint8Array(e2.length));
        }, nodebuffer: function(e2) {
          return l(e2, r.allocBuffer(e2.length));
        } }, c.array = { string: s, array: n, arraybuffer: function(e2) {
          return new Uint8Array(e2).buffer;
        }, uint8array: function(e2) {
          return new Uint8Array(e2);
        }, nodebuffer: function(e2) {
          return r.newBufferFrom(e2);
        } }, c.arraybuffer = { string: function(e2) {
          return s(new Uint8Array(e2));
        }, array: function(e2) {
          return f(new Uint8Array(e2), new Array(e2.byteLength));
        }, arraybuffer: n, uint8array: function(e2) {
          return new Uint8Array(e2);
        }, nodebuffer: function(e2) {
          return r.newBufferFrom(new Uint8Array(e2));
        } }, c.uint8array = { string: s, array: function(e2) {
          return f(e2, new Array(e2.length));
        }, arraybuffer: function(e2) {
          return e2.buffer;
        }, uint8array: n, nodebuffer: function(e2) {
          return r.newBufferFrom(e2);
        } }, c.nodebuffer = { string: s, array: function(e2) {
          return f(e2, new Array(e2.length));
        }, arraybuffer: function(e2) {
          return c.nodebuffer.uint8array(e2).buffer;
        }, uint8array: function(e2) {
          return f(e2, new Uint8Array(e2.length));
        }, nodebuffer: n }, a.transformTo = function(e2, t2) {
          if (t2 = t2 || "", !e2) return t2;
          a.checkSupport(e2);
          var r2 = a.getTypeOf(t2);
          return c[r2][e2](t2);
        }, a.resolve = function(e2) {
          for (var t2 = e2.split("/"), r2 = [], n2 = 0; n2 < t2.length; n2++) {
            var i2 = t2[n2];
            "." === i2 || "" === i2 && 0 !== n2 && n2 !== t2.length - 1 || (".." === i2 ? r2.pop() : r2.push(i2));
          }
          return r2.join("/");
        }, a.getTypeOf = function(e2) {
          return "string" == typeof e2 ? "string" : "[object Array]" === Object.prototype.toString.call(e2) ? "array" : o.nodebuffer && r.isBuffer(e2) ? "nodebuffer" : o.uint8array && e2 instanceof Uint8Array ? "uint8array" : o.arraybuffer && e2 instanceof ArrayBuffer ? "arraybuffer" : void 0;
        }, a.checkSupport = function(e2) {
          if (!o[e2.toLowerCase()]) throw new Error(e2 + " is not supported by this platform");
        }, a.MAX_VALUE_16BITS = 65535, a.MAX_VALUE_32BITS = -1, a.pretty = function(e2) {
          var t2, r2, n2 = "";
          for (r2 = 0; r2 < (e2 || "").length; r2++) n2 += "\\x" + ((t2 = e2.charCodeAt(r2)) < 16 ? "0" : "") + t2.toString(16).toUpperCase();
          return n2;
        }, a.delay = function(e2, t2, r2) {
          setImmediate(function() {
            e2.apply(r2 || null, t2 || []);
          });
        }, a.inherits = function(e2, t2) {
          function r2() {
          }
          r2.prototype = t2.prototype, e2.prototype = new r2();
        }, a.extend = function() {
          var e2, t2, r2 = {};
          for (e2 = 0; e2 < arguments.length; e2++) for (t2 in arguments[e2]) Object.prototype.hasOwnProperty.call(arguments[e2], t2) && void 0 === r2[t2] && (r2[t2] = arguments[e2][t2]);
          return r2;
        }, a.prepareContent = function(r2, e2, n2, i2, s2) {
          return u.Promise.resolve(e2).then(function(n3) {
            return o.blob && (n3 instanceof Blob || -1 !== ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(n3))) && "undefined" != typeof FileReader ? new u.Promise(function(t2, r3) {
              var e3 = new FileReader();
              e3.onload = function(e4) {
                t2(e4.target.result);
              }, e3.onerror = function(e4) {
                r3(e4.target.error);
              }, e3.readAsArrayBuffer(n3);
            }) : n3;
          }).then(function(e3) {
            var t2 = a.getTypeOf(e3);
            return t2 ? ("arraybuffer" === t2 ? e3 = a.transformTo("uint8array", e3) : "string" === t2 && (s2 ? e3 = h.decode(e3) : n2 && true !== i2 && (e3 = (function(e4) {
              return l(e4, o.uint8array ? new Uint8Array(e4.length) : new Array(e4.length));
            })(e3))), e3) : u.Promise.reject(new Error("Can't read the data of '" + r2 + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
          });
        };
      }, { "./base64": 1, "./external": 6, "./nodejsUtils": 14, "./support": 30, setimmediate: 54 }], 33: [function(e, t, r) {
        "use strict";
        var n = e("./reader/readerFor"), i = e("./utils"), s = e("./signature"), a = e("./zipEntry"), o = e("./support");
        function h(e2) {
          this.files = [], this.loadOptions = e2;
        }
        h.prototype = { checkSignature: function(e2) {
          if (!this.reader.readAndCheckSignature(e2)) {
            this.reader.index -= 4;
            var t2 = this.reader.readString(4);
            throw new Error("Corrupted zip or bug: unexpected signature (" + i.pretty(t2) + ", expected " + i.pretty(e2) + ")");
          }
        }, isSignature: function(e2, t2) {
          var r2 = this.reader.index;
          this.reader.setIndex(e2);
          var n2 = this.reader.readString(4) === t2;
          return this.reader.setIndex(r2), n2;
        }, readBlockEndOfCentral: function() {
          this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
          var e2 = this.reader.readData(this.zipCommentLength), t2 = o.uint8array ? "uint8array" : "array", r2 = i.transformTo(t2, e2);
          this.zipComment = this.loadOptions.decodeFileName(r2);
        }, readBlockZip64EndOfCentral: function() {
          this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
          for (var e2, t2, r2, n2 = this.zip64EndOfCentralSize - 44; 0 < n2; ) e2 = this.reader.readInt(2), t2 = this.reader.readInt(4), r2 = this.reader.readData(t2), this.zip64ExtensibleData[e2] = { id: e2, length: t2, value: r2 };
        }, readBlockZip64EndOfCentralLocator: function() {
          if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount) throw new Error("Multi-volumes zip are not supported");
        }, readLocalFiles: function() {
          var e2, t2;
          for (e2 = 0; e2 < this.files.length; e2++) t2 = this.files[e2], this.reader.setIndex(t2.localHeaderOffset), this.checkSignature(s.LOCAL_FILE_HEADER), t2.readLocalPart(this.reader), t2.handleUTF8(), t2.processAttributes();
        }, readCentralDir: function() {
          var e2;
          for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER); ) (e2 = new a({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(e2);
          if (this.centralDirRecords !== this.files.length && 0 !== this.centralDirRecords && 0 === this.files.length) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
        }, readEndOfCentral: function() {
          var e2 = this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);
          if (e2 < 0) throw !this.isSignature(0, s.LOCAL_FILE_HEADER) ? new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html") : new Error("Corrupted zip: can't find end of central directory");
          this.reader.setIndex(e2);
          var t2 = e2;
          if (this.checkSignature(s.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === i.MAX_VALUE_16BITS || this.diskWithCentralDirStart === i.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === i.MAX_VALUE_16BITS || this.centralDirRecords === i.MAX_VALUE_16BITS || this.centralDirSize === i.MAX_VALUE_32BITS || this.centralDirOffset === i.MAX_VALUE_32BITS) {
            if (this.zip64 = true, (e2 = this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
            if (this.reader.setIndex(e2), this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, s.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
            this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
          }
          var r2 = this.centralDirOffset + this.centralDirSize;
          this.zip64 && (r2 += 20, r2 += 12 + this.zip64EndOfCentralSize);
          var n2 = t2 - r2;
          if (0 < n2) this.isSignature(t2, s.CENTRAL_FILE_HEADER) || (this.reader.zero = n2);
          else if (n2 < 0) throw new Error("Corrupted zip: missing " + Math.abs(n2) + " bytes.");
        }, prepareReader: function(e2) {
          this.reader = n(e2);
        }, load: function(e2) {
          this.prepareReader(e2), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
        } }, t.exports = h;
      }, { "./reader/readerFor": 22, "./signature": 23, "./support": 30, "./utils": 32, "./zipEntry": 34 }], 34: [function(e, t, r) {
        "use strict";
        var n = e("./reader/readerFor"), s = e("./utils"), i = e("./compressedObject"), a = e("./crc32"), o = e("./utf8"), h = e("./compressions"), u = e("./support");
        function l(e2, t2) {
          this.options = e2, this.loadOptions = t2;
        }
        l.prototype = { isEncrypted: function() {
          return 1 == (1 & this.bitFlag);
        }, useUTF8: function() {
          return 2048 == (2048 & this.bitFlag);
        }, readLocalPart: function(e2) {
          var t2, r2;
          if (e2.skip(22), this.fileNameLength = e2.readInt(2), r2 = e2.readInt(2), this.fileName = e2.readData(this.fileNameLength), e2.skip(r2), -1 === this.compressedSize || -1 === this.uncompressedSize) throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
          if (null === (t2 = (function(e3) {
            for (var t3 in h) if (Object.prototype.hasOwnProperty.call(h, t3) && h[t3].magic === e3) return h[t3];
            return null;
          })(this.compressionMethod))) throw new Error("Corrupted zip : compression " + s.pretty(this.compressionMethod) + " unknown (inner file : " + s.transformTo("string", this.fileName) + ")");
          this.decompressed = new i(this.compressedSize, this.uncompressedSize, this.crc32, t2, e2.readData(this.compressedSize));
        }, readCentralPart: function(e2) {
          this.versionMadeBy = e2.readInt(2), e2.skip(2), this.bitFlag = e2.readInt(2), this.compressionMethod = e2.readString(2), this.date = e2.readDate(), this.crc32 = e2.readInt(4), this.compressedSize = e2.readInt(4), this.uncompressedSize = e2.readInt(4);
          var t2 = e2.readInt(2);
          if (this.extraFieldsLength = e2.readInt(2), this.fileCommentLength = e2.readInt(2), this.diskNumberStart = e2.readInt(2), this.internalFileAttributes = e2.readInt(2), this.externalFileAttributes = e2.readInt(4), this.localHeaderOffset = e2.readInt(4), this.isEncrypted()) throw new Error("Encrypted zip are not supported");
          e2.skip(t2), this.readExtraFields(e2), this.parseZIP64ExtraField(e2), this.fileComment = e2.readData(this.fileCommentLength);
        }, processAttributes: function() {
          this.unixPermissions = null, this.dosPermissions = null;
          var e2 = this.versionMadeBy >> 8;
          this.dir = !!(16 & this.externalFileAttributes), 0 == e2 && (this.dosPermissions = 63 & this.externalFileAttributes), 3 == e2 && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || "/" !== this.fileNameStr.slice(-1) || (this.dir = true);
        }, parseZIP64ExtraField: function() {
          if (this.extraFields[1]) {
            var e2 = n(this.extraFields[1].value);
            this.uncompressedSize === s.MAX_VALUE_32BITS && (this.uncompressedSize = e2.readInt(8)), this.compressedSize === s.MAX_VALUE_32BITS && (this.compressedSize = e2.readInt(8)), this.localHeaderOffset === s.MAX_VALUE_32BITS && (this.localHeaderOffset = e2.readInt(8)), this.diskNumberStart === s.MAX_VALUE_32BITS && (this.diskNumberStart = e2.readInt(4));
          }
        }, readExtraFields: function(e2) {
          var t2, r2, n2, i2 = e2.index + this.extraFieldsLength;
          for (this.extraFields || (this.extraFields = {}); e2.index + 4 < i2; ) t2 = e2.readInt(2), r2 = e2.readInt(2), n2 = e2.readData(r2), this.extraFields[t2] = { id: t2, length: r2, value: n2 };
          e2.setIndex(i2);
        }, handleUTF8: function() {
          var e2 = u.uint8array ? "uint8array" : "array";
          if (this.useUTF8()) this.fileNameStr = o.utf8decode(this.fileName), this.fileCommentStr = o.utf8decode(this.fileComment);
          else {
            var t2 = this.findExtraFieldUnicodePath();
            if (null !== t2) this.fileNameStr = t2;
            else {
              var r2 = s.transformTo(e2, this.fileName);
              this.fileNameStr = this.loadOptions.decodeFileName(r2);
            }
            var n2 = this.findExtraFieldUnicodeComment();
            if (null !== n2) this.fileCommentStr = n2;
            else {
              var i2 = s.transformTo(e2, this.fileComment);
              this.fileCommentStr = this.loadOptions.decodeFileName(i2);
            }
          }
        }, findExtraFieldUnicodePath: function() {
          var e2 = this.extraFields[28789];
          if (e2) {
            var t2 = n(e2.value);
            return 1 !== t2.readInt(1) ? null : a(this.fileName) !== t2.readInt(4) ? null : o.utf8decode(t2.readData(e2.length - 5));
          }
          return null;
        }, findExtraFieldUnicodeComment: function() {
          var e2 = this.extraFields[25461];
          if (e2) {
            var t2 = n(e2.value);
            return 1 !== t2.readInt(1) ? null : a(this.fileComment) !== t2.readInt(4) ? null : o.utf8decode(t2.readData(e2.length - 5));
          }
          return null;
        } }, t.exports = l;
      }, { "./compressedObject": 2, "./compressions": 3, "./crc32": 4, "./reader/readerFor": 22, "./support": 30, "./utf8": 31, "./utils": 32 }], 35: [function(e, t, r) {
        "use strict";
        function n(e2, t2, r2) {
          this.name = e2, this.dir = r2.dir, this.date = r2.date, this.comment = r2.comment, this.unixPermissions = r2.unixPermissions, this.dosPermissions = r2.dosPermissions, this._data = t2, this._dataBinary = r2.binary, this.options = { compression: r2.compression, compressionOptions: r2.compressionOptions };
        }
        var s = e("./stream/StreamHelper"), i = e("./stream/DataWorker"), a = e("./utf8"), o = e("./compressedObject"), h = e("./stream/GenericWorker");
        n.prototype = { internalStream: function(e2) {
          var t2 = null, r2 = "string";
          try {
            if (!e2) throw new Error("No output type specified.");
            var n2 = "string" === (r2 = e2.toLowerCase()) || "text" === r2;
            "binarystring" !== r2 && "text" !== r2 || (r2 = "string"), t2 = this._decompressWorker();
            var i2 = !this._dataBinary;
            i2 && !n2 && (t2 = t2.pipe(new a.Utf8EncodeWorker())), !i2 && n2 && (t2 = t2.pipe(new a.Utf8DecodeWorker()));
          } catch (e3) {
            (t2 = new h("error")).error(e3);
          }
          return new s(t2, r2, "");
        }, async: function(e2, t2) {
          return this.internalStream(e2).accumulate(t2);
        }, nodeStream: function(e2, t2) {
          return this.internalStream(e2 || "nodebuffer").toNodejsStream(t2);
        }, _compressWorker: function(e2, t2) {
          if (this._data instanceof o && this._data.compression.magic === e2.magic) return this._data.getCompressedWorker();
          var r2 = this._decompressWorker();
          return this._dataBinary || (r2 = r2.pipe(new a.Utf8EncodeWorker())), o.createWorkerFrom(r2, e2, t2);
        }, _decompressWorker: function() {
          return this._data instanceof o ? this._data.getContentWorker() : this._data instanceof h ? this._data : new i(this._data);
        } };
        for (var u = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"], l = function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, f = 0; f < u.length; f++) n.prototype[u[f]] = l;
        t.exports = n;
      }, { "./compressedObject": 2, "./stream/DataWorker": 27, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31 }], 36: [function(e, l, t) {
        (function(t2) {
          "use strict";
          var r, n, e2 = t2.MutationObserver || t2.WebKitMutationObserver;
          if (e2) {
            var i = 0, s = new e2(u), a = t2.document.createTextNode("");
            s.observe(a, { characterData: true }), r = function() {
              a.data = i = ++i % 2;
            };
          } else if (t2.setImmediate || void 0 === t2.MessageChannel) r = "document" in t2 && "onreadystatechange" in t2.document.createElement("script") ? function() {
            var e3 = t2.document.createElement("script");
            e3.onreadystatechange = function() {
              u(), e3.onreadystatechange = null, e3.parentNode.removeChild(e3), e3 = null;
            }, t2.document.documentElement.appendChild(e3);
          } : function() {
            setTimeout(u, 0);
          };
          else {
            var o = new t2.MessageChannel();
            o.port1.onmessage = u, r = function() {
              o.port2.postMessage(0);
            };
          }
          var h = [];
          function u() {
            var e3, t3;
            n = true;
            for (var r2 = h.length; r2; ) {
              for (t3 = h, h = [], e3 = -1; ++e3 < r2; ) t3[e3]();
              r2 = h.length;
            }
            n = false;
          }
          l.exports = function(e3) {
            1 !== h.push(e3) || n || r();
          };
        }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
      }, {}], 37: [function(e, t, r) {
        "use strict";
        var i = e("immediate");
        function u() {
        }
        var l = {}, s = ["REJECTED"], a = ["FULFILLED"], n = ["PENDING"];
        function o(e2) {
          if ("function" != typeof e2) throw new TypeError("resolver must be a function");
          this.state = n, this.queue = [], this.outcome = void 0, e2 !== u && d(this, e2);
        }
        function h(e2, t2, r2) {
          this.promise = e2, "function" == typeof t2 && (this.onFulfilled = t2, this.callFulfilled = this.otherCallFulfilled), "function" == typeof r2 && (this.onRejected = r2, this.callRejected = this.otherCallRejected);
        }
        function f(t2, r2, n2) {
          i(function() {
            var e2;
            try {
              e2 = r2(n2);
            } catch (e3) {
              return l.reject(t2, e3);
            }
            e2 === t2 ? l.reject(t2, new TypeError("Cannot resolve promise with itself")) : l.resolve(t2, e2);
          });
        }
        function c(e2) {
          var t2 = e2 && e2.then;
          if (e2 && ("object" == typeof e2 || "function" == typeof e2) && "function" == typeof t2) return function() {
            t2.apply(e2, arguments);
          };
        }
        function d(t2, e2) {
          var r2 = false;
          function n2(e3) {
            r2 || (r2 = true, l.reject(t2, e3));
          }
          function i2(e3) {
            r2 || (r2 = true, l.resolve(t2, e3));
          }
          var s2 = p(function() {
            e2(i2, n2);
          });
          "error" === s2.status && n2(s2.value);
        }
        function p(e2, t2) {
          var r2 = {};
          try {
            r2.value = e2(t2), r2.status = "success";
          } catch (e3) {
            r2.status = "error", r2.value = e3;
          }
          return r2;
        }
        (t.exports = o).prototype.finally = function(t2) {
          if ("function" != typeof t2) return this;
          var r2 = this.constructor;
          return this.then(function(e2) {
            return r2.resolve(t2()).then(function() {
              return e2;
            });
          }, function(e2) {
            return r2.resolve(t2()).then(function() {
              throw e2;
            });
          });
        }, o.prototype.catch = function(e2) {
          return this.then(null, e2);
        }, o.prototype.then = function(e2, t2) {
          if ("function" != typeof e2 && this.state === a || "function" != typeof t2 && this.state === s) return this;
          var r2 = new this.constructor(u);
          this.state !== n ? f(r2, this.state === a ? e2 : t2, this.outcome) : this.queue.push(new h(r2, e2, t2));
          return r2;
        }, h.prototype.callFulfilled = function(e2) {
          l.resolve(this.promise, e2);
        }, h.prototype.otherCallFulfilled = function(e2) {
          f(this.promise, this.onFulfilled, e2);
        }, h.prototype.callRejected = function(e2) {
          l.reject(this.promise, e2);
        }, h.prototype.otherCallRejected = function(e2) {
          f(this.promise, this.onRejected, e2);
        }, l.resolve = function(e2, t2) {
          var r2 = p(c, t2);
          if ("error" === r2.status) return l.reject(e2, r2.value);
          var n2 = r2.value;
          if (n2) d(e2, n2);
          else {
            e2.state = a, e2.outcome = t2;
            for (var i2 = -1, s2 = e2.queue.length; ++i2 < s2; ) e2.queue[i2].callFulfilled(t2);
          }
          return e2;
        }, l.reject = function(e2, t2) {
          e2.state = s, e2.outcome = t2;
          for (var r2 = -1, n2 = e2.queue.length; ++r2 < n2; ) e2.queue[r2].callRejected(t2);
          return e2;
        }, o.resolve = function(e2) {
          if (e2 instanceof this) return e2;
          return l.resolve(new this(u), e2);
        }, o.reject = function(e2) {
          var t2 = new this(u);
          return l.reject(t2, e2);
        }, o.all = function(e2) {
          var r2 = this;
          if ("[object Array]" !== Object.prototype.toString.call(e2)) return this.reject(new TypeError("must be an array"));
          var n2 = e2.length, i2 = false;
          if (!n2) return this.resolve([]);
          var s2 = new Array(n2), a2 = 0, t2 = -1, o2 = new this(u);
          for (; ++t2 < n2; ) h2(e2[t2], t2);
          return o2;
          function h2(e3, t3) {
            r2.resolve(e3).then(function(e4) {
              s2[t3] = e4, ++a2 !== n2 || i2 || (i2 = true, l.resolve(o2, s2));
            }, function(e4) {
              i2 || (i2 = true, l.reject(o2, e4));
            });
          }
        }, o.race = function(e2) {
          var t2 = this;
          if ("[object Array]" !== Object.prototype.toString.call(e2)) return this.reject(new TypeError("must be an array"));
          var r2 = e2.length, n2 = false;
          if (!r2) return this.resolve([]);
          var i2 = -1, s2 = new this(u);
          for (; ++i2 < r2; ) a2 = e2[i2], t2.resolve(a2).then(function(e3) {
            n2 || (n2 = true, l.resolve(s2, e3));
          }, function(e3) {
            n2 || (n2 = true, l.reject(s2, e3));
          });
          var a2;
          return s2;
        };
      }, { immediate: 36 }], 38: [function(e, t, r) {
        "use strict";
        var n = {};
        (0, e("./lib/utils/common").assign)(n, e("./lib/deflate"), e("./lib/inflate"), e("./lib/zlib/constants")), t.exports = n;
      }, { "./lib/deflate": 39, "./lib/inflate": 40, "./lib/utils/common": 41, "./lib/zlib/constants": 44 }], 39: [function(e, t, r) {
        "use strict";
        var a = e("./zlib/deflate"), o = e("./utils/common"), h = e("./utils/strings"), i = e("./zlib/messages"), s = e("./zlib/zstream"), u = Object.prototype.toString, l = 0, f = -1, c = 0, d = 8;
        function p(e2) {
          if (!(this instanceof p)) return new p(e2);
          this.options = o.assign({ level: f, method: d, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: c, to: "" }, e2 || {});
          var t2 = this.options;
          t2.raw && 0 < t2.windowBits ? t2.windowBits = -t2.windowBits : t2.gzip && 0 < t2.windowBits && t2.windowBits < 16 && (t2.windowBits += 16), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new s(), this.strm.avail_out = 0;
          var r2 = a.deflateInit2(this.strm, t2.level, t2.method, t2.windowBits, t2.memLevel, t2.strategy);
          if (r2 !== l) throw new Error(i[r2]);
          if (t2.header && a.deflateSetHeader(this.strm, t2.header), t2.dictionary) {
            var n2;
            if (n2 = "string" == typeof t2.dictionary ? h.string2buf(t2.dictionary) : "[object ArrayBuffer]" === u.call(t2.dictionary) ? new Uint8Array(t2.dictionary) : t2.dictionary, (r2 = a.deflateSetDictionary(this.strm, n2)) !== l) throw new Error(i[r2]);
            this._dict_set = true;
          }
        }
        function n(e2, t2) {
          var r2 = new p(t2);
          if (r2.push(e2, true), r2.err) throw r2.msg || i[r2.err];
          return r2.result;
        }
        p.prototype.push = function(e2, t2) {
          var r2, n2, i2 = this.strm, s2 = this.options.chunkSize;
          if (this.ended) return false;
          n2 = t2 === ~~t2 ? t2 : true === t2 ? 4 : 0, "string" == typeof e2 ? i2.input = h.string2buf(e2) : "[object ArrayBuffer]" === u.call(e2) ? i2.input = new Uint8Array(e2) : i2.input = e2, i2.next_in = 0, i2.avail_in = i2.input.length;
          do {
            if (0 === i2.avail_out && (i2.output = new o.Buf8(s2), i2.next_out = 0, i2.avail_out = s2), 1 !== (r2 = a.deflate(i2, n2)) && r2 !== l) return this.onEnd(r2), !(this.ended = true);
            0 !== i2.avail_out && (0 !== i2.avail_in || 4 !== n2 && 2 !== n2) || ("string" === this.options.to ? this.onData(h.buf2binstring(o.shrinkBuf(i2.output, i2.next_out))) : this.onData(o.shrinkBuf(i2.output, i2.next_out)));
          } while ((0 < i2.avail_in || 0 === i2.avail_out) && 1 !== r2);
          return 4 === n2 ? (r2 = a.deflateEnd(this.strm), this.onEnd(r2), this.ended = true, r2 === l) : 2 !== n2 || (this.onEnd(l), !(i2.avail_out = 0));
        }, p.prototype.onData = function(e2) {
          this.chunks.push(e2);
        }, p.prototype.onEnd = function(e2) {
          e2 === l && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = o.flattenChunks(this.chunks)), this.chunks = [], this.err = e2, this.msg = this.strm.msg;
        }, r.Deflate = p, r.deflate = n, r.deflateRaw = function(e2, t2) {
          return (t2 = t2 || {}).raw = true, n(e2, t2);
        }, r.gzip = function(e2, t2) {
          return (t2 = t2 || {}).gzip = true, n(e2, t2);
        };
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/deflate": 46, "./zlib/messages": 51, "./zlib/zstream": 53 }], 40: [function(e, t, r) {
        "use strict";
        var c = e("./zlib/inflate"), d = e("./utils/common"), p = e("./utils/strings"), m = e("./zlib/constants"), n = e("./zlib/messages"), i = e("./zlib/zstream"), s = e("./zlib/gzheader"), _ = Object.prototype.toString;
        function a(e2) {
          if (!(this instanceof a)) return new a(e2);
          this.options = d.assign({ chunkSize: 16384, windowBits: 0, to: "" }, e2 || {});
          var t2 = this.options;
          t2.raw && 0 <= t2.windowBits && t2.windowBits < 16 && (t2.windowBits = -t2.windowBits, 0 === t2.windowBits && (t2.windowBits = -15)), !(0 <= t2.windowBits && t2.windowBits < 16) || e2 && e2.windowBits || (t2.windowBits += 32), 15 < t2.windowBits && t2.windowBits < 48 && 0 == (15 & t2.windowBits) && (t2.windowBits |= 15), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new i(), this.strm.avail_out = 0;
          var r2 = c.inflateInit2(this.strm, t2.windowBits);
          if (r2 !== m.Z_OK) throw new Error(n[r2]);
          this.header = new s(), c.inflateGetHeader(this.strm, this.header);
        }
        function o(e2, t2) {
          var r2 = new a(t2);
          if (r2.push(e2, true), r2.err) throw r2.msg || n[r2.err];
          return r2.result;
        }
        a.prototype.push = function(e2, t2) {
          var r2, n2, i2, s2, a2, o2, h = this.strm, u = this.options.chunkSize, l = this.options.dictionary, f = false;
          if (this.ended) return false;
          n2 = t2 === ~~t2 ? t2 : true === t2 ? m.Z_FINISH : m.Z_NO_FLUSH, "string" == typeof e2 ? h.input = p.binstring2buf(e2) : "[object ArrayBuffer]" === _.call(e2) ? h.input = new Uint8Array(e2) : h.input = e2, h.next_in = 0, h.avail_in = h.input.length;
          do {
            if (0 === h.avail_out && (h.output = new d.Buf8(u), h.next_out = 0, h.avail_out = u), (r2 = c.inflate(h, m.Z_NO_FLUSH)) === m.Z_NEED_DICT && l && (o2 = "string" == typeof l ? p.string2buf(l) : "[object ArrayBuffer]" === _.call(l) ? new Uint8Array(l) : l, r2 = c.inflateSetDictionary(this.strm, o2)), r2 === m.Z_BUF_ERROR && true === f && (r2 = m.Z_OK, f = false), r2 !== m.Z_STREAM_END && r2 !== m.Z_OK) return this.onEnd(r2), !(this.ended = true);
            h.next_out && (0 !== h.avail_out && r2 !== m.Z_STREAM_END && (0 !== h.avail_in || n2 !== m.Z_FINISH && n2 !== m.Z_SYNC_FLUSH) || ("string" === this.options.to ? (i2 = p.utf8border(h.output, h.next_out), s2 = h.next_out - i2, a2 = p.buf2string(h.output, i2), h.next_out = s2, h.avail_out = u - s2, s2 && d.arraySet(h.output, h.output, i2, s2, 0), this.onData(a2)) : this.onData(d.shrinkBuf(h.output, h.next_out)))), 0 === h.avail_in && 0 === h.avail_out && (f = true);
          } while ((0 < h.avail_in || 0 === h.avail_out) && r2 !== m.Z_STREAM_END);
          return r2 === m.Z_STREAM_END && (n2 = m.Z_FINISH), n2 === m.Z_FINISH ? (r2 = c.inflateEnd(this.strm), this.onEnd(r2), this.ended = true, r2 === m.Z_OK) : n2 !== m.Z_SYNC_FLUSH || (this.onEnd(m.Z_OK), !(h.avail_out = 0));
        }, a.prototype.onData = function(e2) {
          this.chunks.push(e2);
        }, a.prototype.onEnd = function(e2) {
          e2 === m.Z_OK && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = d.flattenChunks(this.chunks)), this.chunks = [], this.err = e2, this.msg = this.strm.msg;
        }, r.Inflate = a, r.inflate = o, r.inflateRaw = function(e2, t2) {
          return (t2 = t2 || {}).raw = true, o(e2, t2);
        }, r.ungzip = o;
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/constants": 44, "./zlib/gzheader": 47, "./zlib/inflate": 49, "./zlib/messages": 51, "./zlib/zstream": 53 }], 41: [function(e, t, r) {
        "use strict";
        var n = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Int32Array;
        r.assign = function(e2) {
          for (var t2 = Array.prototype.slice.call(arguments, 1); t2.length; ) {
            var r2 = t2.shift();
            if (r2) {
              if ("object" != typeof r2) throw new TypeError(r2 + "must be non-object");
              for (var n2 in r2) r2.hasOwnProperty(n2) && (e2[n2] = r2[n2]);
            }
          }
          return e2;
        }, r.shrinkBuf = function(e2, t2) {
          return e2.length === t2 ? e2 : e2.subarray ? e2.subarray(0, t2) : (e2.length = t2, e2);
        };
        var i = { arraySet: function(e2, t2, r2, n2, i2) {
          if (t2.subarray && e2.subarray) e2.set(t2.subarray(r2, r2 + n2), i2);
          else for (var s2 = 0; s2 < n2; s2++) e2[i2 + s2] = t2[r2 + s2];
        }, flattenChunks: function(e2) {
          var t2, r2, n2, i2, s2, a;
          for (t2 = n2 = 0, r2 = e2.length; t2 < r2; t2++) n2 += e2[t2].length;
          for (a = new Uint8Array(n2), t2 = i2 = 0, r2 = e2.length; t2 < r2; t2++) s2 = e2[t2], a.set(s2, i2), i2 += s2.length;
          return a;
        } }, s = { arraySet: function(e2, t2, r2, n2, i2) {
          for (var s2 = 0; s2 < n2; s2++) e2[i2 + s2] = t2[r2 + s2];
        }, flattenChunks: function(e2) {
          return [].concat.apply([], e2);
        } };
        r.setTyped = function(e2) {
          e2 ? (r.Buf8 = Uint8Array, r.Buf16 = Uint16Array, r.Buf32 = Int32Array, r.assign(r, i)) : (r.Buf8 = Array, r.Buf16 = Array, r.Buf32 = Array, r.assign(r, s));
        }, r.setTyped(n);
      }, {}], 42: [function(e, t, r) {
        "use strict";
        var h = e("./common"), i = true, s = true;
        try {
          String.fromCharCode.apply(null, [0]);
        } catch (e2) {
          i = false;
        }
        try {
          String.fromCharCode.apply(null, new Uint8Array(1));
        } catch (e2) {
          s = false;
        }
        for (var u = new h.Buf8(256), n = 0; n < 256; n++) u[n] = 252 <= n ? 6 : 248 <= n ? 5 : 240 <= n ? 4 : 224 <= n ? 3 : 192 <= n ? 2 : 1;
        function l(e2, t2) {
          if (t2 < 65537 && (e2.subarray && s || !e2.subarray && i)) return String.fromCharCode.apply(null, h.shrinkBuf(e2, t2));
          for (var r2 = "", n2 = 0; n2 < t2; n2++) r2 += String.fromCharCode(e2[n2]);
          return r2;
        }
        u[254] = u[254] = 1, r.string2buf = function(e2) {
          var t2, r2, n2, i2, s2, a = e2.length, o = 0;
          for (i2 = 0; i2 < a; i2++) 55296 == (64512 & (r2 = e2.charCodeAt(i2))) && i2 + 1 < a && 56320 == (64512 & (n2 = e2.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), o += r2 < 128 ? 1 : r2 < 2048 ? 2 : r2 < 65536 ? 3 : 4;
          for (t2 = new h.Buf8(o), i2 = s2 = 0; s2 < o; i2++) 55296 == (64512 & (r2 = e2.charCodeAt(i2))) && i2 + 1 < a && 56320 == (64512 & (n2 = e2.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), r2 < 128 ? t2[s2++] = r2 : (r2 < 2048 ? t2[s2++] = 192 | r2 >>> 6 : (r2 < 65536 ? t2[s2++] = 224 | r2 >>> 12 : (t2[s2++] = 240 | r2 >>> 18, t2[s2++] = 128 | r2 >>> 12 & 63), t2[s2++] = 128 | r2 >>> 6 & 63), t2[s2++] = 128 | 63 & r2);
          return t2;
        }, r.buf2binstring = function(e2) {
          return l(e2, e2.length);
        }, r.binstring2buf = function(e2) {
          for (var t2 = new h.Buf8(e2.length), r2 = 0, n2 = t2.length; r2 < n2; r2++) t2[r2] = e2.charCodeAt(r2);
          return t2;
        }, r.buf2string = function(e2, t2) {
          var r2, n2, i2, s2, a = t2 || e2.length, o = new Array(2 * a);
          for (r2 = n2 = 0; r2 < a; ) if ((i2 = e2[r2++]) < 128) o[n2++] = i2;
          else if (4 < (s2 = u[i2])) o[n2++] = 65533, r2 += s2 - 1;
          else {
            for (i2 &= 2 === s2 ? 31 : 3 === s2 ? 15 : 7; 1 < s2 && r2 < a; ) i2 = i2 << 6 | 63 & e2[r2++], s2--;
            1 < s2 ? o[n2++] = 65533 : i2 < 65536 ? o[n2++] = i2 : (i2 -= 65536, o[n2++] = 55296 | i2 >> 10 & 1023, o[n2++] = 56320 | 1023 & i2);
          }
          return l(o, n2);
        }, r.utf8border = function(e2, t2) {
          var r2;
          for ((t2 = t2 || e2.length) > e2.length && (t2 = e2.length), r2 = t2 - 1; 0 <= r2 && 128 == (192 & e2[r2]); ) r2--;
          return r2 < 0 ? t2 : 0 === r2 ? t2 : r2 + u[e2[r2]] > t2 ? r2 : t2;
        };
      }, { "./common": 41 }], 43: [function(e, t, r) {
        "use strict";
        t.exports = function(e2, t2, r2, n) {
          for (var i = 65535 & e2 | 0, s = e2 >>> 16 & 65535 | 0, a = 0; 0 !== r2; ) {
            for (r2 -= a = 2e3 < r2 ? 2e3 : r2; s = s + (i = i + t2[n++] | 0) | 0, --a; ) ;
            i %= 65521, s %= 65521;
          }
          return i | s << 16 | 0;
        };
      }, {}], 44: [function(e, t, r) {
        "use strict";
        t.exports = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_BUF_ERROR: -5, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
      }, {}], 45: [function(e, t, r) {
        "use strict";
        var o = (function() {
          for (var e2, t2 = [], r2 = 0; r2 < 256; r2++) {
            e2 = r2;
            for (var n = 0; n < 8; n++) e2 = 1 & e2 ? 3988292384 ^ e2 >>> 1 : e2 >>> 1;
            t2[r2] = e2;
          }
          return t2;
        })();
        t.exports = function(e2, t2, r2, n) {
          var i = o, s = n + r2;
          e2 ^= -1;
          for (var a = n; a < s; a++) e2 = e2 >>> 8 ^ i[255 & (e2 ^ t2[a])];
          return -1 ^ e2;
        };
      }, {}], 46: [function(e, t, r) {
        "use strict";
        var h, c = e("../utils/common"), u = e("./trees"), d = e("./adler32"), p = e("./crc32"), n = e("./messages"), l = 0, f = 4, m = 0, _ = -2, g = -1, b = 4, i = 2, v = 8, y = 9, s = 286, a = 30, o = 19, w = 2 * s + 1, k = 15, x = 3, S2 = 258, z = S2 + x + 1, C = 42, E = 113, A = 1, I = 2, O = 3, B = 4;
        function R(e2, t2) {
          return e2.msg = n[t2], t2;
        }
        function T(e2) {
          return (e2 << 1) - (4 < e2 ? 9 : 0);
        }
        function D(e2) {
          for (var t2 = e2.length; 0 <= --t2; ) e2[t2] = 0;
        }
        function F(e2) {
          var t2 = e2.state, r2 = t2.pending;
          r2 > e2.avail_out && (r2 = e2.avail_out), 0 !== r2 && (c.arraySet(e2.output, t2.pending_buf, t2.pending_out, r2, e2.next_out), e2.next_out += r2, t2.pending_out += r2, e2.total_out += r2, e2.avail_out -= r2, t2.pending -= r2, 0 === t2.pending && (t2.pending_out = 0));
        }
        function N(e2, t2) {
          u._tr_flush_block(e2, 0 <= e2.block_start ? e2.block_start : -1, e2.strstart - e2.block_start, t2), e2.block_start = e2.strstart, F(e2.strm);
        }
        function U(e2, t2) {
          e2.pending_buf[e2.pending++] = t2;
        }
        function P(e2, t2) {
          e2.pending_buf[e2.pending++] = t2 >>> 8 & 255, e2.pending_buf[e2.pending++] = 255 & t2;
        }
        function L(e2, t2) {
          var r2, n2, i2 = e2.max_chain_length, s2 = e2.strstart, a2 = e2.prev_length, o2 = e2.nice_match, h2 = e2.strstart > e2.w_size - z ? e2.strstart - (e2.w_size - z) : 0, u2 = e2.window, l2 = e2.w_mask, f2 = e2.prev, c2 = e2.strstart + S2, d2 = u2[s2 + a2 - 1], p2 = u2[s2 + a2];
          e2.prev_length >= e2.good_match && (i2 >>= 2), o2 > e2.lookahead && (o2 = e2.lookahead);
          do {
            if (u2[(r2 = t2) + a2] === p2 && u2[r2 + a2 - 1] === d2 && u2[r2] === u2[s2] && u2[++r2] === u2[s2 + 1]) {
              s2 += 2, r2++;
              do {
              } while (u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && s2 < c2);
              if (n2 = S2 - (c2 - s2), s2 = c2 - S2, a2 < n2) {
                if (e2.match_start = t2, o2 <= (a2 = n2)) break;
                d2 = u2[s2 + a2 - 1], p2 = u2[s2 + a2];
              }
            }
          } while ((t2 = f2[t2 & l2]) > h2 && 0 != --i2);
          return a2 <= e2.lookahead ? a2 : e2.lookahead;
        }
        function j(e2) {
          var t2, r2, n2, i2, s2, a2, o2, h2, u2, l2, f2 = e2.w_size;
          do {
            if (i2 = e2.window_size - e2.lookahead - e2.strstart, e2.strstart >= f2 + (f2 - z)) {
              for (c.arraySet(e2.window, e2.window, f2, f2, 0), e2.match_start -= f2, e2.strstart -= f2, e2.block_start -= f2, t2 = r2 = e2.hash_size; n2 = e2.head[--t2], e2.head[t2] = f2 <= n2 ? n2 - f2 : 0, --r2; ) ;
              for (t2 = r2 = f2; n2 = e2.prev[--t2], e2.prev[t2] = f2 <= n2 ? n2 - f2 : 0, --r2; ) ;
              i2 += f2;
            }
            if (0 === e2.strm.avail_in) break;
            if (a2 = e2.strm, o2 = e2.window, h2 = e2.strstart + e2.lookahead, u2 = i2, l2 = void 0, l2 = a2.avail_in, u2 < l2 && (l2 = u2), r2 = 0 === l2 ? 0 : (a2.avail_in -= l2, c.arraySet(o2, a2.input, a2.next_in, l2, h2), 1 === a2.state.wrap ? a2.adler = d(a2.adler, o2, l2, h2) : 2 === a2.state.wrap && (a2.adler = p(a2.adler, o2, l2, h2)), a2.next_in += l2, a2.total_in += l2, l2), e2.lookahead += r2, e2.lookahead + e2.insert >= x) for (s2 = e2.strstart - e2.insert, e2.ins_h = e2.window[s2], e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[s2 + 1]) & e2.hash_mask; e2.insert && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[s2 + x - 1]) & e2.hash_mask, e2.prev[s2 & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = s2, s2++, e2.insert--, !(e2.lookahead + e2.insert < x)); ) ;
          } while (e2.lookahead < z && 0 !== e2.strm.avail_in);
        }
        function Z(e2, t2) {
          for (var r2, n2; ; ) {
            if (e2.lookahead < z) {
              if (j(e2), e2.lookahead < z && t2 === l) return A;
              if (0 === e2.lookahead) break;
            }
            if (r2 = 0, e2.lookahead >= x && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), 0 !== r2 && e2.strstart - r2 <= e2.w_size - z && (e2.match_length = L(e2, r2)), e2.match_length >= x) if (n2 = u._tr_tally(e2, e2.strstart - e2.match_start, e2.match_length - x), e2.lookahead -= e2.match_length, e2.match_length <= e2.max_lazy_match && e2.lookahead >= x) {
              for (e2.match_length--; e2.strstart++, e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart, 0 != --e2.match_length; ) ;
              e2.strstart++;
            } else e2.strstart += e2.match_length, e2.match_length = 0, e2.ins_h = e2.window[e2.strstart], e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + 1]) & e2.hash_mask;
            else n2 = u._tr_tally(e2, 0, e2.window[e2.strstart]), e2.lookahead--, e2.strstart++;
            if (n2 && (N(e2, false), 0 === e2.strm.avail_out)) return A;
          }
          return e2.insert = e2.strstart < x - 1 ? e2.strstart : x - 1, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : e2.last_lit && (N(e2, false), 0 === e2.strm.avail_out) ? A : I;
        }
        function W(e2, t2) {
          for (var r2, n2, i2; ; ) {
            if (e2.lookahead < z) {
              if (j(e2), e2.lookahead < z && t2 === l) return A;
              if (0 === e2.lookahead) break;
            }
            if (r2 = 0, e2.lookahead >= x && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), e2.prev_length = e2.match_length, e2.prev_match = e2.match_start, e2.match_length = x - 1, 0 !== r2 && e2.prev_length < e2.max_lazy_match && e2.strstart - r2 <= e2.w_size - z && (e2.match_length = L(e2, r2), e2.match_length <= 5 && (1 === e2.strategy || e2.match_length === x && 4096 < e2.strstart - e2.match_start) && (e2.match_length = x - 1)), e2.prev_length >= x && e2.match_length <= e2.prev_length) {
              for (i2 = e2.strstart + e2.lookahead - x, n2 = u._tr_tally(e2, e2.strstart - 1 - e2.prev_match, e2.prev_length - x), e2.lookahead -= e2.prev_length - 1, e2.prev_length -= 2; ++e2.strstart <= i2 && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), 0 != --e2.prev_length; ) ;
              if (e2.match_available = 0, e2.match_length = x - 1, e2.strstart++, n2 && (N(e2, false), 0 === e2.strm.avail_out)) return A;
            } else if (e2.match_available) {
              if ((n2 = u._tr_tally(e2, 0, e2.window[e2.strstart - 1])) && N(e2, false), e2.strstart++, e2.lookahead--, 0 === e2.strm.avail_out) return A;
            } else e2.match_available = 1, e2.strstart++, e2.lookahead--;
          }
          return e2.match_available && (n2 = u._tr_tally(e2, 0, e2.window[e2.strstart - 1]), e2.match_available = 0), e2.insert = e2.strstart < x - 1 ? e2.strstart : x - 1, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : e2.last_lit && (N(e2, false), 0 === e2.strm.avail_out) ? A : I;
        }
        function M(e2, t2, r2, n2, i2) {
          this.good_length = e2, this.max_lazy = t2, this.nice_length = r2, this.max_chain = n2, this.func = i2;
        }
        function H() {
          this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = v, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new c.Buf16(2 * w), this.dyn_dtree = new c.Buf16(2 * (2 * a + 1)), this.bl_tree = new c.Buf16(2 * (2 * o + 1)), D(this.dyn_ltree), D(this.dyn_dtree), D(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new c.Buf16(k + 1), this.heap = new c.Buf16(2 * s + 1), D(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new c.Buf16(2 * s + 1), D(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
        }
        function G(e2) {
          var t2;
          return e2 && e2.state ? (e2.total_in = e2.total_out = 0, e2.data_type = i, (t2 = e2.state).pending = 0, t2.pending_out = 0, t2.wrap < 0 && (t2.wrap = -t2.wrap), t2.status = t2.wrap ? C : E, e2.adler = 2 === t2.wrap ? 0 : 1, t2.last_flush = l, u._tr_init(t2), m) : R(e2, _);
        }
        function K(e2) {
          var t2 = G(e2);
          return t2 === m && (function(e3) {
            e3.window_size = 2 * e3.w_size, D(e3.head), e3.max_lazy_match = h[e3.level].max_lazy, e3.good_match = h[e3.level].good_length, e3.nice_match = h[e3.level].nice_length, e3.max_chain_length = h[e3.level].max_chain, e3.strstart = 0, e3.block_start = 0, e3.lookahead = 0, e3.insert = 0, e3.match_length = e3.prev_length = x - 1, e3.match_available = 0, e3.ins_h = 0;
          })(e2.state), t2;
        }
        function Y(e2, t2, r2, n2, i2, s2) {
          if (!e2) return _;
          var a2 = 1;
          if (t2 === g && (t2 = 6), n2 < 0 ? (a2 = 0, n2 = -n2) : 15 < n2 && (a2 = 2, n2 -= 16), i2 < 1 || y < i2 || r2 !== v || n2 < 8 || 15 < n2 || t2 < 0 || 9 < t2 || s2 < 0 || b < s2) return R(e2, _);
          8 === n2 && (n2 = 9);
          var o2 = new H();
          return (e2.state = o2).strm = e2, o2.wrap = a2, o2.gzhead = null, o2.w_bits = n2, o2.w_size = 1 << o2.w_bits, o2.w_mask = o2.w_size - 1, o2.hash_bits = i2 + 7, o2.hash_size = 1 << o2.hash_bits, o2.hash_mask = o2.hash_size - 1, o2.hash_shift = ~~((o2.hash_bits + x - 1) / x), o2.window = new c.Buf8(2 * o2.w_size), o2.head = new c.Buf16(o2.hash_size), o2.prev = new c.Buf16(o2.w_size), o2.lit_bufsize = 1 << i2 + 6, o2.pending_buf_size = 4 * o2.lit_bufsize, o2.pending_buf = new c.Buf8(o2.pending_buf_size), o2.d_buf = 1 * o2.lit_bufsize, o2.l_buf = 3 * o2.lit_bufsize, o2.level = t2, o2.strategy = s2, o2.method = r2, K(e2);
        }
        h = [new M(0, 0, 0, 0, function(e2, t2) {
          var r2 = 65535;
          for (r2 > e2.pending_buf_size - 5 && (r2 = e2.pending_buf_size - 5); ; ) {
            if (e2.lookahead <= 1) {
              if (j(e2), 0 === e2.lookahead && t2 === l) return A;
              if (0 === e2.lookahead) break;
            }
            e2.strstart += e2.lookahead, e2.lookahead = 0;
            var n2 = e2.block_start + r2;
            if ((0 === e2.strstart || e2.strstart >= n2) && (e2.lookahead = e2.strstart - n2, e2.strstart = n2, N(e2, false), 0 === e2.strm.avail_out)) return A;
            if (e2.strstart - e2.block_start >= e2.w_size - z && (N(e2, false), 0 === e2.strm.avail_out)) return A;
          }
          return e2.insert = 0, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : (e2.strstart > e2.block_start && (N(e2, false), e2.strm.avail_out), A);
        }), new M(4, 4, 8, 4, Z), new M(4, 5, 16, 8, Z), new M(4, 6, 32, 32, Z), new M(4, 4, 16, 16, W), new M(8, 16, 32, 32, W), new M(8, 16, 128, 128, W), new M(8, 32, 128, 256, W), new M(32, 128, 258, 1024, W), new M(32, 258, 258, 4096, W)], r.deflateInit = function(e2, t2) {
          return Y(e2, t2, v, 15, 8, 0);
        }, r.deflateInit2 = Y, r.deflateReset = K, r.deflateResetKeep = G, r.deflateSetHeader = function(e2, t2) {
          return e2 && e2.state ? 2 !== e2.state.wrap ? _ : (e2.state.gzhead = t2, m) : _;
        }, r.deflate = function(e2, t2) {
          var r2, n2, i2, s2;
          if (!e2 || !e2.state || 5 < t2 || t2 < 0) return e2 ? R(e2, _) : _;
          if (n2 = e2.state, !e2.output || !e2.input && 0 !== e2.avail_in || 666 === n2.status && t2 !== f) return R(e2, 0 === e2.avail_out ? -5 : _);
          if (n2.strm = e2, r2 = n2.last_flush, n2.last_flush = t2, n2.status === C) if (2 === n2.wrap) e2.adler = 0, U(n2, 31), U(n2, 139), U(n2, 8), n2.gzhead ? (U(n2, (n2.gzhead.text ? 1 : 0) + (n2.gzhead.hcrc ? 2 : 0) + (n2.gzhead.extra ? 4 : 0) + (n2.gzhead.name ? 8 : 0) + (n2.gzhead.comment ? 16 : 0)), U(n2, 255 & n2.gzhead.time), U(n2, n2.gzhead.time >> 8 & 255), U(n2, n2.gzhead.time >> 16 & 255), U(n2, n2.gzhead.time >> 24 & 255), U(n2, 9 === n2.level ? 2 : 2 <= n2.strategy || n2.level < 2 ? 4 : 0), U(n2, 255 & n2.gzhead.os), n2.gzhead.extra && n2.gzhead.extra.length && (U(n2, 255 & n2.gzhead.extra.length), U(n2, n2.gzhead.extra.length >> 8 & 255)), n2.gzhead.hcrc && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending, 0)), n2.gzindex = 0, n2.status = 69) : (U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 9 === n2.level ? 2 : 2 <= n2.strategy || n2.level < 2 ? 4 : 0), U(n2, 3), n2.status = E);
          else {
            var a2 = v + (n2.w_bits - 8 << 4) << 8;
            a2 |= (2 <= n2.strategy || n2.level < 2 ? 0 : n2.level < 6 ? 1 : 6 === n2.level ? 2 : 3) << 6, 0 !== n2.strstart && (a2 |= 32), a2 += 31 - a2 % 31, n2.status = E, P(n2, a2), 0 !== n2.strstart && (P(n2, e2.adler >>> 16), P(n2, 65535 & e2.adler)), e2.adler = 1;
          }
          if (69 === n2.status) if (n2.gzhead.extra) {
            for (i2 = n2.pending; n2.gzindex < (65535 & n2.gzhead.extra.length) && (n2.pending !== n2.pending_buf_size || (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending !== n2.pending_buf_size)); ) U(n2, 255 & n2.gzhead.extra[n2.gzindex]), n2.gzindex++;
            n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), n2.gzindex === n2.gzhead.extra.length && (n2.gzindex = 0, n2.status = 73);
          } else n2.status = 73;
          if (73 === n2.status) if (n2.gzhead.name) {
            i2 = n2.pending;
            do {
              if (n2.pending === n2.pending_buf_size && (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending === n2.pending_buf_size)) {
                s2 = 1;
                break;
              }
              s2 = n2.gzindex < n2.gzhead.name.length ? 255 & n2.gzhead.name.charCodeAt(n2.gzindex++) : 0, U(n2, s2);
            } while (0 !== s2);
            n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), 0 === s2 && (n2.gzindex = 0, n2.status = 91);
          } else n2.status = 91;
          if (91 === n2.status) if (n2.gzhead.comment) {
            i2 = n2.pending;
            do {
              if (n2.pending === n2.pending_buf_size && (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending === n2.pending_buf_size)) {
                s2 = 1;
                break;
              }
              s2 = n2.gzindex < n2.gzhead.comment.length ? 255 & n2.gzhead.comment.charCodeAt(n2.gzindex++) : 0, U(n2, s2);
            } while (0 !== s2);
            n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), 0 === s2 && (n2.status = 103);
          } else n2.status = 103;
          if (103 === n2.status && (n2.gzhead.hcrc ? (n2.pending + 2 > n2.pending_buf_size && F(e2), n2.pending + 2 <= n2.pending_buf_size && (U(n2, 255 & e2.adler), U(n2, e2.adler >> 8 & 255), e2.adler = 0, n2.status = E)) : n2.status = E), 0 !== n2.pending) {
            if (F(e2), 0 === e2.avail_out) return n2.last_flush = -1, m;
          } else if (0 === e2.avail_in && T(t2) <= T(r2) && t2 !== f) return R(e2, -5);
          if (666 === n2.status && 0 !== e2.avail_in) return R(e2, -5);
          if (0 !== e2.avail_in || 0 !== n2.lookahead || t2 !== l && 666 !== n2.status) {
            var o2 = 2 === n2.strategy ? (function(e3, t3) {
              for (var r3; ; ) {
                if (0 === e3.lookahead && (j(e3), 0 === e3.lookahead)) {
                  if (t3 === l) return A;
                  break;
                }
                if (e3.match_length = 0, r3 = u._tr_tally(e3, 0, e3.window[e3.strstart]), e3.lookahead--, e3.strstart++, r3 && (N(e3, false), 0 === e3.strm.avail_out)) return A;
              }
              return e3.insert = 0, t3 === f ? (N(e3, true), 0 === e3.strm.avail_out ? O : B) : e3.last_lit && (N(e3, false), 0 === e3.strm.avail_out) ? A : I;
            })(n2, t2) : 3 === n2.strategy ? (function(e3, t3) {
              for (var r3, n3, i3, s3, a3 = e3.window; ; ) {
                if (e3.lookahead <= S2) {
                  if (j(e3), e3.lookahead <= S2 && t3 === l) return A;
                  if (0 === e3.lookahead) break;
                }
                if (e3.match_length = 0, e3.lookahead >= x && 0 < e3.strstart && (n3 = a3[i3 = e3.strstart - 1]) === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3]) {
                  s3 = e3.strstart + S2;
                  do {
                  } while (n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && i3 < s3);
                  e3.match_length = S2 - (s3 - i3), e3.match_length > e3.lookahead && (e3.match_length = e3.lookahead);
                }
                if (e3.match_length >= x ? (r3 = u._tr_tally(e3, 1, e3.match_length - x), e3.lookahead -= e3.match_length, e3.strstart += e3.match_length, e3.match_length = 0) : (r3 = u._tr_tally(e3, 0, e3.window[e3.strstart]), e3.lookahead--, e3.strstart++), r3 && (N(e3, false), 0 === e3.strm.avail_out)) return A;
              }
              return e3.insert = 0, t3 === f ? (N(e3, true), 0 === e3.strm.avail_out ? O : B) : e3.last_lit && (N(e3, false), 0 === e3.strm.avail_out) ? A : I;
            })(n2, t2) : h[n2.level].func(n2, t2);
            if (o2 !== O && o2 !== B || (n2.status = 666), o2 === A || o2 === O) return 0 === e2.avail_out && (n2.last_flush = -1), m;
            if (o2 === I && (1 === t2 ? u._tr_align(n2) : 5 !== t2 && (u._tr_stored_block(n2, 0, 0, false), 3 === t2 && (D(n2.head), 0 === n2.lookahead && (n2.strstart = 0, n2.block_start = 0, n2.insert = 0))), F(e2), 0 === e2.avail_out)) return n2.last_flush = -1, m;
          }
          return t2 !== f ? m : n2.wrap <= 0 ? 1 : (2 === n2.wrap ? (U(n2, 255 & e2.adler), U(n2, e2.adler >> 8 & 255), U(n2, e2.adler >> 16 & 255), U(n2, e2.adler >> 24 & 255), U(n2, 255 & e2.total_in), U(n2, e2.total_in >> 8 & 255), U(n2, e2.total_in >> 16 & 255), U(n2, e2.total_in >> 24 & 255)) : (P(n2, e2.adler >>> 16), P(n2, 65535 & e2.adler)), F(e2), 0 < n2.wrap && (n2.wrap = -n2.wrap), 0 !== n2.pending ? m : 1);
        }, r.deflateEnd = function(e2) {
          var t2;
          return e2 && e2.state ? (t2 = e2.state.status) !== C && 69 !== t2 && 73 !== t2 && 91 !== t2 && 103 !== t2 && t2 !== E && 666 !== t2 ? R(e2, _) : (e2.state = null, t2 === E ? R(e2, -3) : m) : _;
        }, r.deflateSetDictionary = function(e2, t2) {
          var r2, n2, i2, s2, a2, o2, h2, u2, l2 = t2.length;
          if (!e2 || !e2.state) return _;
          if (2 === (s2 = (r2 = e2.state).wrap) || 1 === s2 && r2.status !== C || r2.lookahead) return _;
          for (1 === s2 && (e2.adler = d(e2.adler, t2, l2, 0)), r2.wrap = 0, l2 >= r2.w_size && (0 === s2 && (D(r2.head), r2.strstart = 0, r2.block_start = 0, r2.insert = 0), u2 = new c.Buf8(r2.w_size), c.arraySet(u2, t2, l2 - r2.w_size, r2.w_size, 0), t2 = u2, l2 = r2.w_size), a2 = e2.avail_in, o2 = e2.next_in, h2 = e2.input, e2.avail_in = l2, e2.next_in = 0, e2.input = t2, j(r2); r2.lookahead >= x; ) {
            for (n2 = r2.strstart, i2 = r2.lookahead - (x - 1); r2.ins_h = (r2.ins_h << r2.hash_shift ^ r2.window[n2 + x - 1]) & r2.hash_mask, r2.prev[n2 & r2.w_mask] = r2.head[r2.ins_h], r2.head[r2.ins_h] = n2, n2++, --i2; ) ;
            r2.strstart = n2, r2.lookahead = x - 1, j(r2);
          }
          return r2.strstart += r2.lookahead, r2.block_start = r2.strstart, r2.insert = r2.lookahead, r2.lookahead = 0, r2.match_length = r2.prev_length = x - 1, r2.match_available = 0, e2.next_in = o2, e2.input = h2, e2.avail_in = a2, r2.wrap = s2, m;
        }, r.deflateInfo = "pako deflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./messages": 51, "./trees": 52 }], 47: [function(e, t, r) {
        "use strict";
        t.exports = function() {
          this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = false;
        };
      }, {}], 48: [function(e, t, r) {
        "use strict";
        t.exports = function(e2, t2) {
          var r2, n, i, s, a, o, h, u, l, f, c, d, p, m, _, g, b, v, y, w, k, x, S2, z, C;
          r2 = e2.state, n = e2.next_in, z = e2.input, i = n + (e2.avail_in - 5), s = e2.next_out, C = e2.output, a = s - (t2 - e2.avail_out), o = s + (e2.avail_out - 257), h = r2.dmax, u = r2.wsize, l = r2.whave, f = r2.wnext, c = r2.window, d = r2.hold, p = r2.bits, m = r2.lencode, _ = r2.distcode, g = (1 << r2.lenbits) - 1, b = (1 << r2.distbits) - 1;
          e: do {
            p < 15 && (d += z[n++] << p, p += 8, d += z[n++] << p, p += 8), v = m[d & g];
            t: for (; ; ) {
              if (d >>>= y = v >>> 24, p -= y, 0 === (y = v >>> 16 & 255)) C[s++] = 65535 & v;
              else {
                if (!(16 & y)) {
                  if (0 == (64 & y)) {
                    v = m[(65535 & v) + (d & (1 << y) - 1)];
                    continue t;
                  }
                  if (32 & y) {
                    r2.mode = 12;
                    break e;
                  }
                  e2.msg = "invalid literal/length code", r2.mode = 30;
                  break e;
                }
                w = 65535 & v, (y &= 15) && (p < y && (d += z[n++] << p, p += 8), w += d & (1 << y) - 1, d >>>= y, p -= y), p < 15 && (d += z[n++] << p, p += 8, d += z[n++] << p, p += 8), v = _[d & b];
                r: for (; ; ) {
                  if (d >>>= y = v >>> 24, p -= y, !(16 & (y = v >>> 16 & 255))) {
                    if (0 == (64 & y)) {
                      v = _[(65535 & v) + (d & (1 << y) - 1)];
                      continue r;
                    }
                    e2.msg = "invalid distance code", r2.mode = 30;
                    break e;
                  }
                  if (k = 65535 & v, p < (y &= 15) && (d += z[n++] << p, (p += 8) < y && (d += z[n++] << p, p += 8)), h < (k += d & (1 << y) - 1)) {
                    e2.msg = "invalid distance too far back", r2.mode = 30;
                    break e;
                  }
                  if (d >>>= y, p -= y, (y = s - a) < k) {
                    if (l < (y = k - y) && r2.sane) {
                      e2.msg = "invalid distance too far back", r2.mode = 30;
                      break e;
                    }
                    if (S2 = c, (x = 0) === f) {
                      if (x += u - y, y < w) {
                        for (w -= y; C[s++] = c[x++], --y; ) ;
                        x = s - k, S2 = C;
                      }
                    } else if (f < y) {
                      if (x += u + f - y, (y -= f) < w) {
                        for (w -= y; C[s++] = c[x++], --y; ) ;
                        if (x = 0, f < w) {
                          for (w -= y = f; C[s++] = c[x++], --y; ) ;
                          x = s - k, S2 = C;
                        }
                      }
                    } else if (x += f - y, y < w) {
                      for (w -= y; C[s++] = c[x++], --y; ) ;
                      x = s - k, S2 = C;
                    }
                    for (; 2 < w; ) C[s++] = S2[x++], C[s++] = S2[x++], C[s++] = S2[x++], w -= 3;
                    w && (C[s++] = S2[x++], 1 < w && (C[s++] = S2[x++]));
                  } else {
                    for (x = s - k; C[s++] = C[x++], C[s++] = C[x++], C[s++] = C[x++], 2 < (w -= 3); ) ;
                    w && (C[s++] = C[x++], 1 < w && (C[s++] = C[x++]));
                  }
                  break;
                }
              }
              break;
            }
          } while (n < i && s < o);
          n -= w = p >> 3, d &= (1 << (p -= w << 3)) - 1, e2.next_in = n, e2.next_out = s, e2.avail_in = n < i ? i - n + 5 : 5 - (n - i), e2.avail_out = s < o ? o - s + 257 : 257 - (s - o), r2.hold = d, r2.bits = p;
        };
      }, {}], 49: [function(e, t, r) {
        "use strict";
        var I = e("../utils/common"), O = e("./adler32"), B = e("./crc32"), R = e("./inffast"), T = e("./inftrees"), D = 1, F = 2, N = 0, U = -2, P = 1, n = 852, i = 592;
        function L(e2) {
          return (e2 >>> 24 & 255) + (e2 >>> 8 & 65280) + ((65280 & e2) << 8) + ((255 & e2) << 24);
        }
        function s() {
          this.mode = 0, this.last = false, this.wrap = 0, this.havedict = false, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new I.Buf16(320), this.work = new I.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
        }
        function a(e2) {
          var t2;
          return e2 && e2.state ? (t2 = e2.state, e2.total_in = e2.total_out = t2.total = 0, e2.msg = "", t2.wrap && (e2.adler = 1 & t2.wrap), t2.mode = P, t2.last = 0, t2.havedict = 0, t2.dmax = 32768, t2.head = null, t2.hold = 0, t2.bits = 0, t2.lencode = t2.lendyn = new I.Buf32(n), t2.distcode = t2.distdyn = new I.Buf32(i), t2.sane = 1, t2.back = -1, N) : U;
        }
        function o(e2) {
          var t2;
          return e2 && e2.state ? ((t2 = e2.state).wsize = 0, t2.whave = 0, t2.wnext = 0, a(e2)) : U;
        }
        function h(e2, t2) {
          var r2, n2;
          return e2 && e2.state ? (n2 = e2.state, t2 < 0 ? (r2 = 0, t2 = -t2) : (r2 = 1 + (t2 >> 4), t2 < 48 && (t2 &= 15)), t2 && (t2 < 8 || 15 < t2) ? U : (null !== n2.window && n2.wbits !== t2 && (n2.window = null), n2.wrap = r2, n2.wbits = t2, o(e2))) : U;
        }
        function u(e2, t2) {
          var r2, n2;
          return e2 ? (n2 = new s(), (e2.state = n2).window = null, (r2 = h(e2, t2)) !== N && (e2.state = null), r2) : U;
        }
        var l, f, c = true;
        function j(e2) {
          if (c) {
            var t2;
            for (l = new I.Buf32(512), f = new I.Buf32(32), t2 = 0; t2 < 144; ) e2.lens[t2++] = 8;
            for (; t2 < 256; ) e2.lens[t2++] = 9;
            for (; t2 < 280; ) e2.lens[t2++] = 7;
            for (; t2 < 288; ) e2.lens[t2++] = 8;
            for (T(D, e2.lens, 0, 288, l, 0, e2.work, { bits: 9 }), t2 = 0; t2 < 32; ) e2.lens[t2++] = 5;
            T(F, e2.lens, 0, 32, f, 0, e2.work, { bits: 5 }), c = false;
          }
          e2.lencode = l, e2.lenbits = 9, e2.distcode = f, e2.distbits = 5;
        }
        function Z(e2, t2, r2, n2) {
          var i2, s2 = e2.state;
          return null === s2.window && (s2.wsize = 1 << s2.wbits, s2.wnext = 0, s2.whave = 0, s2.window = new I.Buf8(s2.wsize)), n2 >= s2.wsize ? (I.arraySet(s2.window, t2, r2 - s2.wsize, s2.wsize, 0), s2.wnext = 0, s2.whave = s2.wsize) : (n2 < (i2 = s2.wsize - s2.wnext) && (i2 = n2), I.arraySet(s2.window, t2, r2 - n2, i2, s2.wnext), (n2 -= i2) ? (I.arraySet(s2.window, t2, r2 - n2, n2, 0), s2.wnext = n2, s2.whave = s2.wsize) : (s2.wnext += i2, s2.wnext === s2.wsize && (s2.wnext = 0), s2.whave < s2.wsize && (s2.whave += i2))), 0;
        }
        r.inflateReset = o, r.inflateReset2 = h, r.inflateResetKeep = a, r.inflateInit = function(e2) {
          return u(e2, 15);
        }, r.inflateInit2 = u, r.inflate = function(e2, t2) {
          var r2, n2, i2, s2, a2, o2, h2, u2, l2, f2, c2, d, p, m, _, g, b, v, y, w, k, x, S2, z, C = 0, E = new I.Buf8(4), A = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
          if (!e2 || !e2.state || !e2.output || !e2.input && 0 !== e2.avail_in) return U;
          12 === (r2 = e2.state).mode && (r2.mode = 13), a2 = e2.next_out, i2 = e2.output, h2 = e2.avail_out, s2 = e2.next_in, n2 = e2.input, o2 = e2.avail_in, u2 = r2.hold, l2 = r2.bits, f2 = o2, c2 = h2, x = N;
          e: for (; ; ) switch (r2.mode) {
            case P:
              if (0 === r2.wrap) {
                r2.mode = 13;
                break;
              }
              for (; l2 < 16; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (2 & r2.wrap && 35615 === u2) {
                E[r2.check = 0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0), l2 = u2 = 0, r2.mode = 2;
                break;
              }
              if (r2.flags = 0, r2.head && (r2.head.done = false), !(1 & r2.wrap) || (((255 & u2) << 8) + (u2 >> 8)) % 31) {
                e2.msg = "incorrect header check", r2.mode = 30;
                break;
              }
              if (8 != (15 & u2)) {
                e2.msg = "unknown compression method", r2.mode = 30;
                break;
              }
              if (l2 -= 4, k = 8 + (15 & (u2 >>>= 4)), 0 === r2.wbits) r2.wbits = k;
              else if (k > r2.wbits) {
                e2.msg = "invalid window size", r2.mode = 30;
                break;
              }
              r2.dmax = 1 << k, e2.adler = r2.check = 1, r2.mode = 512 & u2 ? 10 : 12, l2 = u2 = 0;
              break;
            case 2:
              for (; l2 < 16; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (r2.flags = u2, 8 != (255 & r2.flags)) {
                e2.msg = "unknown compression method", r2.mode = 30;
                break;
              }
              if (57344 & r2.flags) {
                e2.msg = "unknown header flags set", r2.mode = 30;
                break;
              }
              r2.head && (r2.head.text = u2 >> 8 & 1), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0, r2.mode = 3;
            case 3:
              for (; l2 < 32; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              r2.head && (r2.head.time = u2), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, E[2] = u2 >>> 16 & 255, E[3] = u2 >>> 24 & 255, r2.check = B(r2.check, E, 4, 0)), l2 = u2 = 0, r2.mode = 4;
            case 4:
              for (; l2 < 16; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              r2.head && (r2.head.xflags = 255 & u2, r2.head.os = u2 >> 8), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0, r2.mode = 5;
            case 5:
              if (1024 & r2.flags) {
                for (; l2 < 16; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.length = u2, r2.head && (r2.head.extra_len = u2), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0;
              } else r2.head && (r2.head.extra = null);
              r2.mode = 6;
            case 6:
              if (1024 & r2.flags && (o2 < (d = r2.length) && (d = o2), d && (r2.head && (k = r2.head.extra_len - r2.length, r2.head.extra || (r2.head.extra = new Array(r2.head.extra_len)), I.arraySet(r2.head.extra, n2, s2, d, k)), 512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, r2.length -= d), r2.length)) break e;
              r2.length = 0, r2.mode = 7;
            case 7:
              if (2048 & r2.flags) {
                if (0 === o2) break e;
                for (d = 0; k = n2[s2 + d++], r2.head && k && r2.length < 65536 && (r2.head.name += String.fromCharCode(k)), k && d < o2; ) ;
                if (512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, k) break e;
              } else r2.head && (r2.head.name = null);
              r2.length = 0, r2.mode = 8;
            case 8:
              if (4096 & r2.flags) {
                if (0 === o2) break e;
                for (d = 0; k = n2[s2 + d++], r2.head && k && r2.length < 65536 && (r2.head.comment += String.fromCharCode(k)), k && d < o2; ) ;
                if (512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, k) break e;
              } else r2.head && (r2.head.comment = null);
              r2.mode = 9;
            case 9:
              if (512 & r2.flags) {
                for (; l2 < 16; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (u2 !== (65535 & r2.check)) {
                  e2.msg = "header crc mismatch", r2.mode = 30;
                  break;
                }
                l2 = u2 = 0;
              }
              r2.head && (r2.head.hcrc = r2.flags >> 9 & 1, r2.head.done = true), e2.adler = r2.check = 0, r2.mode = 12;
              break;
            case 10:
              for (; l2 < 32; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              e2.adler = r2.check = L(u2), l2 = u2 = 0, r2.mode = 11;
            case 11:
              if (0 === r2.havedict) return e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, 2;
              e2.adler = r2.check = 1, r2.mode = 12;
            case 12:
              if (5 === t2 || 6 === t2) break e;
            case 13:
              if (r2.last) {
                u2 >>>= 7 & l2, l2 -= 7 & l2, r2.mode = 27;
                break;
              }
              for (; l2 < 3; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              switch (r2.last = 1 & u2, l2 -= 1, 3 & (u2 >>>= 1)) {
                case 0:
                  r2.mode = 14;
                  break;
                case 1:
                  if (j(r2), r2.mode = 20, 6 !== t2) break;
                  u2 >>>= 2, l2 -= 2;
                  break e;
                case 2:
                  r2.mode = 17;
                  break;
                case 3:
                  e2.msg = "invalid block type", r2.mode = 30;
              }
              u2 >>>= 2, l2 -= 2;
              break;
            case 14:
              for (u2 >>>= 7 & l2, l2 -= 7 & l2; l2 < 32; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if ((65535 & u2) != (u2 >>> 16 ^ 65535)) {
                e2.msg = "invalid stored block lengths", r2.mode = 30;
                break;
              }
              if (r2.length = 65535 & u2, l2 = u2 = 0, r2.mode = 15, 6 === t2) break e;
            case 15:
              r2.mode = 16;
            case 16:
              if (d = r2.length) {
                if (o2 < d && (d = o2), h2 < d && (d = h2), 0 === d) break e;
                I.arraySet(i2, n2, s2, d, a2), o2 -= d, s2 += d, h2 -= d, a2 += d, r2.length -= d;
                break;
              }
              r2.mode = 12;
              break;
            case 17:
              for (; l2 < 14; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (r2.nlen = 257 + (31 & u2), u2 >>>= 5, l2 -= 5, r2.ndist = 1 + (31 & u2), u2 >>>= 5, l2 -= 5, r2.ncode = 4 + (15 & u2), u2 >>>= 4, l2 -= 4, 286 < r2.nlen || 30 < r2.ndist) {
                e2.msg = "too many length or distance symbols", r2.mode = 30;
                break;
              }
              r2.have = 0, r2.mode = 18;
            case 18:
              for (; r2.have < r2.ncode; ) {
                for (; l2 < 3; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.lens[A[r2.have++]] = 7 & u2, u2 >>>= 3, l2 -= 3;
              }
              for (; r2.have < 19; ) r2.lens[A[r2.have++]] = 0;
              if (r2.lencode = r2.lendyn, r2.lenbits = 7, S2 = { bits: r2.lenbits }, x = T(0, r2.lens, 0, 19, r2.lencode, 0, r2.work, S2), r2.lenbits = S2.bits, x) {
                e2.msg = "invalid code lengths set", r2.mode = 30;
                break;
              }
              r2.have = 0, r2.mode = 19;
            case 19:
              for (; r2.have < r2.nlen + r2.ndist; ) {
                for (; g = (C = r2.lencode[u2 & (1 << r2.lenbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_ = C >>> 24) <= l2); ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (b < 16) u2 >>>= _, l2 -= _, r2.lens[r2.have++] = b;
                else {
                  if (16 === b) {
                    for (z = _ + 2; l2 < z; ) {
                      if (0 === o2) break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    if (u2 >>>= _, l2 -= _, 0 === r2.have) {
                      e2.msg = "invalid bit length repeat", r2.mode = 30;
                      break;
                    }
                    k = r2.lens[r2.have - 1], d = 3 + (3 & u2), u2 >>>= 2, l2 -= 2;
                  } else if (17 === b) {
                    for (z = _ + 3; l2 < z; ) {
                      if (0 === o2) break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    l2 -= _, k = 0, d = 3 + (7 & (u2 >>>= _)), u2 >>>= 3, l2 -= 3;
                  } else {
                    for (z = _ + 7; l2 < z; ) {
                      if (0 === o2) break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    l2 -= _, k = 0, d = 11 + (127 & (u2 >>>= _)), u2 >>>= 7, l2 -= 7;
                  }
                  if (r2.have + d > r2.nlen + r2.ndist) {
                    e2.msg = "invalid bit length repeat", r2.mode = 30;
                    break;
                  }
                  for (; d--; ) r2.lens[r2.have++] = k;
                }
              }
              if (30 === r2.mode) break;
              if (0 === r2.lens[256]) {
                e2.msg = "invalid code -- missing end-of-block", r2.mode = 30;
                break;
              }
              if (r2.lenbits = 9, S2 = { bits: r2.lenbits }, x = T(D, r2.lens, 0, r2.nlen, r2.lencode, 0, r2.work, S2), r2.lenbits = S2.bits, x) {
                e2.msg = "invalid literal/lengths set", r2.mode = 30;
                break;
              }
              if (r2.distbits = 6, r2.distcode = r2.distdyn, S2 = { bits: r2.distbits }, x = T(F, r2.lens, r2.nlen, r2.ndist, r2.distcode, 0, r2.work, S2), r2.distbits = S2.bits, x) {
                e2.msg = "invalid distances set", r2.mode = 30;
                break;
              }
              if (r2.mode = 20, 6 === t2) break e;
            case 20:
              r2.mode = 21;
            case 21:
              if (6 <= o2 && 258 <= h2) {
                e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, R(e2, c2), a2 = e2.next_out, i2 = e2.output, h2 = e2.avail_out, s2 = e2.next_in, n2 = e2.input, o2 = e2.avail_in, u2 = r2.hold, l2 = r2.bits, 12 === r2.mode && (r2.back = -1);
                break;
              }
              for (r2.back = 0; g = (C = r2.lencode[u2 & (1 << r2.lenbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_ = C >>> 24) <= l2); ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (g && 0 == (240 & g)) {
                for (v = _, y = g, w = b; g = (C = r2.lencode[w + ((u2 & (1 << v + y) - 1) >> v)]) >>> 16 & 255, b = 65535 & C, !(v + (_ = C >>> 24) <= l2); ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                u2 >>>= v, l2 -= v, r2.back += v;
              }
              if (u2 >>>= _, l2 -= _, r2.back += _, r2.length = b, 0 === g) {
                r2.mode = 26;
                break;
              }
              if (32 & g) {
                r2.back = -1, r2.mode = 12;
                break;
              }
              if (64 & g) {
                e2.msg = "invalid literal/length code", r2.mode = 30;
                break;
              }
              r2.extra = 15 & g, r2.mode = 22;
            case 22:
              if (r2.extra) {
                for (z = r2.extra; l2 < z; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.length += u2 & (1 << r2.extra) - 1, u2 >>>= r2.extra, l2 -= r2.extra, r2.back += r2.extra;
              }
              r2.was = r2.length, r2.mode = 23;
            case 23:
              for (; g = (C = r2.distcode[u2 & (1 << r2.distbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_ = C >>> 24) <= l2); ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (0 == (240 & g)) {
                for (v = _, y = g, w = b; g = (C = r2.distcode[w + ((u2 & (1 << v + y) - 1) >> v)]) >>> 16 & 255, b = 65535 & C, !(v + (_ = C >>> 24) <= l2); ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                u2 >>>= v, l2 -= v, r2.back += v;
              }
              if (u2 >>>= _, l2 -= _, r2.back += _, 64 & g) {
                e2.msg = "invalid distance code", r2.mode = 30;
                break;
              }
              r2.offset = b, r2.extra = 15 & g, r2.mode = 24;
            case 24:
              if (r2.extra) {
                for (z = r2.extra; l2 < z; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.offset += u2 & (1 << r2.extra) - 1, u2 >>>= r2.extra, l2 -= r2.extra, r2.back += r2.extra;
              }
              if (r2.offset > r2.dmax) {
                e2.msg = "invalid distance too far back", r2.mode = 30;
                break;
              }
              r2.mode = 25;
            case 25:
              if (0 === h2) break e;
              if (d = c2 - h2, r2.offset > d) {
                if ((d = r2.offset - d) > r2.whave && r2.sane) {
                  e2.msg = "invalid distance too far back", r2.mode = 30;
                  break;
                }
                p = d > r2.wnext ? (d -= r2.wnext, r2.wsize - d) : r2.wnext - d, d > r2.length && (d = r2.length), m = r2.window;
              } else m = i2, p = a2 - r2.offset, d = r2.length;
              for (h2 < d && (d = h2), h2 -= d, r2.length -= d; i2[a2++] = m[p++], --d; ) ;
              0 === r2.length && (r2.mode = 21);
              break;
            case 26:
              if (0 === h2) break e;
              i2[a2++] = r2.length, h2--, r2.mode = 21;
              break;
            case 27:
              if (r2.wrap) {
                for (; l2 < 32; ) {
                  if (0 === o2) break e;
                  o2--, u2 |= n2[s2++] << l2, l2 += 8;
                }
                if (c2 -= h2, e2.total_out += c2, r2.total += c2, c2 && (e2.adler = r2.check = r2.flags ? B(r2.check, i2, c2, a2 - c2) : O(r2.check, i2, c2, a2 - c2)), c2 = h2, (r2.flags ? u2 : L(u2)) !== r2.check) {
                  e2.msg = "incorrect data check", r2.mode = 30;
                  break;
                }
                l2 = u2 = 0;
              }
              r2.mode = 28;
            case 28:
              if (r2.wrap && r2.flags) {
                for (; l2 < 32; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (u2 !== (4294967295 & r2.total)) {
                  e2.msg = "incorrect length check", r2.mode = 30;
                  break;
                }
                l2 = u2 = 0;
              }
              r2.mode = 29;
            case 29:
              x = 1;
              break e;
            case 30:
              x = -3;
              break e;
            case 31:
              return -4;
            case 32:
            default:
              return U;
          }
          return e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, (r2.wsize || c2 !== e2.avail_out && r2.mode < 30 && (r2.mode < 27 || 4 !== t2)) && Z(e2, e2.output, e2.next_out, c2 - e2.avail_out) ? (r2.mode = 31, -4) : (f2 -= e2.avail_in, c2 -= e2.avail_out, e2.total_in += f2, e2.total_out += c2, r2.total += c2, r2.wrap && c2 && (e2.adler = r2.check = r2.flags ? B(r2.check, i2, c2, e2.next_out - c2) : O(r2.check, i2, c2, e2.next_out - c2)), e2.data_type = r2.bits + (r2.last ? 64 : 0) + (12 === r2.mode ? 128 : 0) + (20 === r2.mode || 15 === r2.mode ? 256 : 0), (0 == f2 && 0 === c2 || 4 === t2) && x === N && (x = -5), x);
        }, r.inflateEnd = function(e2) {
          if (!e2 || !e2.state) return U;
          var t2 = e2.state;
          return t2.window && (t2.window = null), e2.state = null, N;
        }, r.inflateGetHeader = function(e2, t2) {
          var r2;
          return e2 && e2.state ? 0 == (2 & (r2 = e2.state).wrap) ? U : ((r2.head = t2).done = false, N) : U;
        }, r.inflateSetDictionary = function(e2, t2) {
          var r2, n2 = t2.length;
          return e2 && e2.state ? 0 !== (r2 = e2.state).wrap && 11 !== r2.mode ? U : 11 === r2.mode && O(1, t2, n2, 0) !== r2.check ? -3 : Z(e2, t2, n2, n2) ? (r2.mode = 31, -4) : (r2.havedict = 1, N) : U;
        }, r.inflateInfo = "pako inflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./inffast": 48, "./inftrees": 50 }], 50: [function(e, t, r) {
        "use strict";
        var D = e("../utils/common"), F = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0], N = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78], U = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0], P = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
        t.exports = function(e2, t2, r2, n, i, s, a, o) {
          var h, u, l, f, c, d, p, m, _, g = o.bits, b = 0, v = 0, y = 0, w = 0, k = 0, x = 0, S2 = 0, z = 0, C = 0, E = 0, A = null, I = 0, O = new D.Buf16(16), B = new D.Buf16(16), R = null, T = 0;
          for (b = 0; b <= 15; b++) O[b] = 0;
          for (v = 0; v < n; v++) O[t2[r2 + v]]++;
          for (k = g, w = 15; 1 <= w && 0 === O[w]; w--) ;
          if (w < k && (k = w), 0 === w) return i[s++] = 20971520, i[s++] = 20971520, o.bits = 1, 0;
          for (y = 1; y < w && 0 === O[y]; y++) ;
          for (k < y && (k = y), b = z = 1; b <= 15; b++) if (z <<= 1, (z -= O[b]) < 0) return -1;
          if (0 < z && (0 === e2 || 1 !== w)) return -1;
          for (B[1] = 0, b = 1; b < 15; b++) B[b + 1] = B[b] + O[b];
          for (v = 0; v < n; v++) 0 !== t2[r2 + v] && (a[B[t2[r2 + v]]++] = v);
          if (d = 0 === e2 ? (A = R = a, 19) : 1 === e2 ? (A = F, I -= 257, R = N, T -= 257, 256) : (A = U, R = P, -1), b = y, c = s, S2 = v = E = 0, l = -1, f = (C = 1 << (x = k)) - 1, 1 === e2 && 852 < C || 2 === e2 && 592 < C) return 1;
          for (; ; ) {
            for (p = b - S2, _ = a[v] < d ? (m = 0, a[v]) : a[v] > d ? (m = R[T + a[v]], A[I + a[v]]) : (m = 96, 0), h = 1 << b - S2, y = u = 1 << x; i[c + (E >> S2) + (u -= h)] = p << 24 | m << 16 | _ | 0, 0 !== u; ) ;
            for (h = 1 << b - 1; E & h; ) h >>= 1;
            if (0 !== h ? (E &= h - 1, E += h) : E = 0, v++, 0 == --O[b]) {
              if (b === w) break;
              b = t2[r2 + a[v]];
            }
            if (k < b && (E & f) !== l) {
              for (0 === S2 && (S2 = k), c += y, z = 1 << (x = b - S2); x + S2 < w && !((z -= O[x + S2]) <= 0); ) x++, z <<= 1;
              if (C += 1 << x, 1 === e2 && 852 < C || 2 === e2 && 592 < C) return 1;
              i[l = E & f] = k << 24 | x << 16 | c - s | 0;
            }
          }
          return 0 !== E && (i[c + E] = b - S2 << 24 | 64 << 16 | 0), o.bits = k, 0;
        };
      }, { "../utils/common": 41 }], 51: [function(e, t, r) {
        "use strict";
        t.exports = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" };
      }, {}], 52: [function(e, t, r) {
        "use strict";
        var i = e("../utils/common"), o = 0, h = 1;
        function n(e2) {
          for (var t2 = e2.length; 0 <= --t2; ) e2[t2] = 0;
        }
        var s = 0, a = 29, u = 256, l = u + 1 + a, f = 30, c = 19, _ = 2 * l + 1, g = 15, d = 16, p = 7, m = 256, b = 16, v = 17, y = 18, w = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], k = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], x = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7], S2 = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], z = new Array(2 * (l + 2));
        n(z);
        var C = new Array(2 * f);
        n(C);
        var E = new Array(512);
        n(E);
        var A = new Array(256);
        n(A);
        var I = new Array(a);
        n(I);
        var O, B, R, T = new Array(f);
        function D(e2, t2, r2, n2, i2) {
          this.static_tree = e2, this.extra_bits = t2, this.extra_base = r2, this.elems = n2, this.max_length = i2, this.has_stree = e2 && e2.length;
        }
        function F(e2, t2) {
          this.dyn_tree = e2, this.max_code = 0, this.stat_desc = t2;
        }
        function N(e2) {
          return e2 < 256 ? E[e2] : E[256 + (e2 >>> 7)];
        }
        function U(e2, t2) {
          e2.pending_buf[e2.pending++] = 255 & t2, e2.pending_buf[e2.pending++] = t2 >>> 8 & 255;
        }
        function P(e2, t2, r2) {
          e2.bi_valid > d - r2 ? (e2.bi_buf |= t2 << e2.bi_valid & 65535, U(e2, e2.bi_buf), e2.bi_buf = t2 >> d - e2.bi_valid, e2.bi_valid += r2 - d) : (e2.bi_buf |= t2 << e2.bi_valid & 65535, e2.bi_valid += r2);
        }
        function L(e2, t2, r2) {
          P(e2, r2[2 * t2], r2[2 * t2 + 1]);
        }
        function j(e2, t2) {
          for (var r2 = 0; r2 |= 1 & e2, e2 >>>= 1, r2 <<= 1, 0 < --t2; ) ;
          return r2 >>> 1;
        }
        function Z(e2, t2, r2) {
          var n2, i2, s2 = new Array(g + 1), a2 = 0;
          for (n2 = 1; n2 <= g; n2++) s2[n2] = a2 = a2 + r2[n2 - 1] << 1;
          for (i2 = 0; i2 <= t2; i2++) {
            var o2 = e2[2 * i2 + 1];
            0 !== o2 && (e2[2 * i2] = j(s2[o2]++, o2));
          }
        }
        function W(e2) {
          var t2;
          for (t2 = 0; t2 < l; t2++) e2.dyn_ltree[2 * t2] = 0;
          for (t2 = 0; t2 < f; t2++) e2.dyn_dtree[2 * t2] = 0;
          for (t2 = 0; t2 < c; t2++) e2.bl_tree[2 * t2] = 0;
          e2.dyn_ltree[2 * m] = 1, e2.opt_len = e2.static_len = 0, e2.last_lit = e2.matches = 0;
        }
        function M(e2) {
          8 < e2.bi_valid ? U(e2, e2.bi_buf) : 0 < e2.bi_valid && (e2.pending_buf[e2.pending++] = e2.bi_buf), e2.bi_buf = 0, e2.bi_valid = 0;
        }
        function H(e2, t2, r2, n2) {
          var i2 = 2 * t2, s2 = 2 * r2;
          return e2[i2] < e2[s2] || e2[i2] === e2[s2] && n2[t2] <= n2[r2];
        }
        function G(e2, t2, r2) {
          for (var n2 = e2.heap[r2], i2 = r2 << 1; i2 <= e2.heap_len && (i2 < e2.heap_len && H(t2, e2.heap[i2 + 1], e2.heap[i2], e2.depth) && i2++, !H(t2, n2, e2.heap[i2], e2.depth)); ) e2.heap[r2] = e2.heap[i2], r2 = i2, i2 <<= 1;
          e2.heap[r2] = n2;
        }
        function K(e2, t2, r2) {
          var n2, i2, s2, a2, o2 = 0;
          if (0 !== e2.last_lit) for (; n2 = e2.pending_buf[e2.d_buf + 2 * o2] << 8 | e2.pending_buf[e2.d_buf + 2 * o2 + 1], i2 = e2.pending_buf[e2.l_buf + o2], o2++, 0 === n2 ? L(e2, i2, t2) : (L(e2, (s2 = A[i2]) + u + 1, t2), 0 !== (a2 = w[s2]) && P(e2, i2 -= I[s2], a2), L(e2, s2 = N(--n2), r2), 0 !== (a2 = k[s2]) && P(e2, n2 -= T[s2], a2)), o2 < e2.last_lit; ) ;
          L(e2, m, t2);
        }
        function Y(e2, t2) {
          var r2, n2, i2, s2 = t2.dyn_tree, a2 = t2.stat_desc.static_tree, o2 = t2.stat_desc.has_stree, h2 = t2.stat_desc.elems, u2 = -1;
          for (e2.heap_len = 0, e2.heap_max = _, r2 = 0; r2 < h2; r2++) 0 !== s2[2 * r2] ? (e2.heap[++e2.heap_len] = u2 = r2, e2.depth[r2] = 0) : s2[2 * r2 + 1] = 0;
          for (; e2.heap_len < 2; ) s2[2 * (i2 = e2.heap[++e2.heap_len] = u2 < 2 ? ++u2 : 0)] = 1, e2.depth[i2] = 0, e2.opt_len--, o2 && (e2.static_len -= a2[2 * i2 + 1]);
          for (t2.max_code = u2, r2 = e2.heap_len >> 1; 1 <= r2; r2--) G(e2, s2, r2);
          for (i2 = h2; r2 = e2.heap[1], e2.heap[1] = e2.heap[e2.heap_len--], G(e2, s2, 1), n2 = e2.heap[1], e2.heap[--e2.heap_max] = r2, e2.heap[--e2.heap_max] = n2, s2[2 * i2] = s2[2 * r2] + s2[2 * n2], e2.depth[i2] = (e2.depth[r2] >= e2.depth[n2] ? e2.depth[r2] : e2.depth[n2]) + 1, s2[2 * r2 + 1] = s2[2 * n2 + 1] = i2, e2.heap[1] = i2++, G(e2, s2, 1), 2 <= e2.heap_len; ) ;
          e2.heap[--e2.heap_max] = e2.heap[1], (function(e3, t3) {
            var r3, n3, i3, s3, a3, o3, h3 = t3.dyn_tree, u3 = t3.max_code, l2 = t3.stat_desc.static_tree, f2 = t3.stat_desc.has_stree, c2 = t3.stat_desc.extra_bits, d2 = t3.stat_desc.extra_base, p2 = t3.stat_desc.max_length, m2 = 0;
            for (s3 = 0; s3 <= g; s3++) e3.bl_count[s3] = 0;
            for (h3[2 * e3.heap[e3.heap_max] + 1] = 0, r3 = e3.heap_max + 1; r3 < _; r3++) p2 < (s3 = h3[2 * h3[2 * (n3 = e3.heap[r3]) + 1] + 1] + 1) && (s3 = p2, m2++), h3[2 * n3 + 1] = s3, u3 < n3 || (e3.bl_count[s3]++, a3 = 0, d2 <= n3 && (a3 = c2[n3 - d2]), o3 = h3[2 * n3], e3.opt_len += o3 * (s3 + a3), f2 && (e3.static_len += o3 * (l2[2 * n3 + 1] + a3)));
            if (0 !== m2) {
              do {
                for (s3 = p2 - 1; 0 === e3.bl_count[s3]; ) s3--;
                e3.bl_count[s3]--, e3.bl_count[s3 + 1] += 2, e3.bl_count[p2]--, m2 -= 2;
              } while (0 < m2);
              for (s3 = p2; 0 !== s3; s3--) for (n3 = e3.bl_count[s3]; 0 !== n3; ) u3 < (i3 = e3.heap[--r3]) || (h3[2 * i3 + 1] !== s3 && (e3.opt_len += (s3 - h3[2 * i3 + 1]) * h3[2 * i3], h3[2 * i3 + 1] = s3), n3--);
            }
          })(e2, t2), Z(s2, u2, e2.bl_count);
        }
        function X(e2, t2, r2) {
          var n2, i2, s2 = -1, a2 = t2[1], o2 = 0, h2 = 7, u2 = 4;
          for (0 === a2 && (h2 = 138, u2 = 3), t2[2 * (r2 + 1) + 1] = 65535, n2 = 0; n2 <= r2; n2++) i2 = a2, a2 = t2[2 * (n2 + 1) + 1], ++o2 < h2 && i2 === a2 || (o2 < u2 ? e2.bl_tree[2 * i2] += o2 : 0 !== i2 ? (i2 !== s2 && e2.bl_tree[2 * i2]++, e2.bl_tree[2 * b]++) : o2 <= 10 ? e2.bl_tree[2 * v]++ : e2.bl_tree[2 * y]++, s2 = i2, u2 = (o2 = 0) === a2 ? (h2 = 138, 3) : i2 === a2 ? (h2 = 6, 3) : (h2 = 7, 4));
        }
        function V(e2, t2, r2) {
          var n2, i2, s2 = -1, a2 = t2[1], o2 = 0, h2 = 7, u2 = 4;
          for (0 === a2 && (h2 = 138, u2 = 3), n2 = 0; n2 <= r2; n2++) if (i2 = a2, a2 = t2[2 * (n2 + 1) + 1], !(++o2 < h2 && i2 === a2)) {
            if (o2 < u2) for (; L(e2, i2, e2.bl_tree), 0 != --o2; ) ;
            else 0 !== i2 ? (i2 !== s2 && (L(e2, i2, e2.bl_tree), o2--), L(e2, b, e2.bl_tree), P(e2, o2 - 3, 2)) : o2 <= 10 ? (L(e2, v, e2.bl_tree), P(e2, o2 - 3, 3)) : (L(e2, y, e2.bl_tree), P(e2, o2 - 11, 7));
            s2 = i2, u2 = (o2 = 0) === a2 ? (h2 = 138, 3) : i2 === a2 ? (h2 = 6, 3) : (h2 = 7, 4);
          }
        }
        n(T);
        var q = false;
        function J(e2, t2, r2, n2) {
          P(e2, (s << 1) + (n2 ? 1 : 0), 3), (function(e3, t3, r3, n3) {
            M(e3), n3 && (U(e3, r3), U(e3, ~r3)), i.arraySet(e3.pending_buf, e3.window, t3, r3, e3.pending), e3.pending += r3;
          })(e2, t2, r2, true);
        }
        r._tr_init = function(e2) {
          q || ((function() {
            var e3, t2, r2, n2, i2, s2 = new Array(g + 1);
            for (n2 = r2 = 0; n2 < a - 1; n2++) for (I[n2] = r2, e3 = 0; e3 < 1 << w[n2]; e3++) A[r2++] = n2;
            for (A[r2 - 1] = n2, n2 = i2 = 0; n2 < 16; n2++) for (T[n2] = i2, e3 = 0; e3 < 1 << k[n2]; e3++) E[i2++] = n2;
            for (i2 >>= 7; n2 < f; n2++) for (T[n2] = i2 << 7, e3 = 0; e3 < 1 << k[n2] - 7; e3++) E[256 + i2++] = n2;
            for (t2 = 0; t2 <= g; t2++) s2[t2] = 0;
            for (e3 = 0; e3 <= 143; ) z[2 * e3 + 1] = 8, e3++, s2[8]++;
            for (; e3 <= 255; ) z[2 * e3 + 1] = 9, e3++, s2[9]++;
            for (; e3 <= 279; ) z[2 * e3 + 1] = 7, e3++, s2[7]++;
            for (; e3 <= 287; ) z[2 * e3 + 1] = 8, e3++, s2[8]++;
            for (Z(z, l + 1, s2), e3 = 0; e3 < f; e3++) C[2 * e3 + 1] = 5, C[2 * e3] = j(e3, 5);
            O = new D(z, w, u + 1, l, g), B = new D(C, k, 0, f, g), R = new D(new Array(0), x, 0, c, p);
          })(), q = true), e2.l_desc = new F(e2.dyn_ltree, O), e2.d_desc = new F(e2.dyn_dtree, B), e2.bl_desc = new F(e2.bl_tree, R), e2.bi_buf = 0, e2.bi_valid = 0, W(e2);
        }, r._tr_stored_block = J, r._tr_flush_block = function(e2, t2, r2, n2) {
          var i2, s2, a2 = 0;
          0 < e2.level ? (2 === e2.strm.data_type && (e2.strm.data_type = (function(e3) {
            var t3, r3 = 4093624447;
            for (t3 = 0; t3 <= 31; t3++, r3 >>>= 1) if (1 & r3 && 0 !== e3.dyn_ltree[2 * t3]) return o;
            if (0 !== e3.dyn_ltree[18] || 0 !== e3.dyn_ltree[20] || 0 !== e3.dyn_ltree[26]) return h;
            for (t3 = 32; t3 < u; t3++) if (0 !== e3.dyn_ltree[2 * t3]) return h;
            return o;
          })(e2)), Y(e2, e2.l_desc), Y(e2, e2.d_desc), a2 = (function(e3) {
            var t3;
            for (X(e3, e3.dyn_ltree, e3.l_desc.max_code), X(e3, e3.dyn_dtree, e3.d_desc.max_code), Y(e3, e3.bl_desc), t3 = c - 1; 3 <= t3 && 0 === e3.bl_tree[2 * S2[t3] + 1]; t3--) ;
            return e3.opt_len += 3 * (t3 + 1) + 5 + 5 + 4, t3;
          })(e2), i2 = e2.opt_len + 3 + 7 >>> 3, (s2 = e2.static_len + 3 + 7 >>> 3) <= i2 && (i2 = s2)) : i2 = s2 = r2 + 5, r2 + 4 <= i2 && -1 !== t2 ? J(e2, t2, r2, n2) : 4 === e2.strategy || s2 === i2 ? (P(e2, 2 + (n2 ? 1 : 0), 3), K(e2, z, C)) : (P(e2, 4 + (n2 ? 1 : 0), 3), (function(e3, t3, r3, n3) {
            var i3;
            for (P(e3, t3 - 257, 5), P(e3, r3 - 1, 5), P(e3, n3 - 4, 4), i3 = 0; i3 < n3; i3++) P(e3, e3.bl_tree[2 * S2[i3] + 1], 3);
            V(e3, e3.dyn_ltree, t3 - 1), V(e3, e3.dyn_dtree, r3 - 1);
          })(e2, e2.l_desc.max_code + 1, e2.d_desc.max_code + 1, a2 + 1), K(e2, e2.dyn_ltree, e2.dyn_dtree)), W(e2), n2 && M(e2);
        }, r._tr_tally = function(e2, t2, r2) {
          return e2.pending_buf[e2.d_buf + 2 * e2.last_lit] = t2 >>> 8 & 255, e2.pending_buf[e2.d_buf + 2 * e2.last_lit + 1] = 255 & t2, e2.pending_buf[e2.l_buf + e2.last_lit] = 255 & r2, e2.last_lit++, 0 === t2 ? e2.dyn_ltree[2 * r2]++ : (e2.matches++, t2--, e2.dyn_ltree[2 * (A[r2] + u + 1)]++, e2.dyn_dtree[2 * N(t2)]++), e2.last_lit === e2.lit_bufsize - 1;
        }, r._tr_align = function(e2) {
          P(e2, 2, 3), L(e2, m, z), (function(e3) {
            16 === e3.bi_valid ? (U(e3, e3.bi_buf), e3.bi_buf = 0, e3.bi_valid = 0) : 8 <= e3.bi_valid && (e3.pending_buf[e3.pending++] = 255 & e3.bi_buf, e3.bi_buf >>= 8, e3.bi_valid -= 8);
          })(e2);
        };
      }, { "../utils/common": 41 }], 53: [function(e, t, r) {
        "use strict";
        t.exports = function() {
          this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
        };
      }, {}], 54: [function(e, t, r) {
        (function(e2) {
          !(function(r2, n) {
            "use strict";
            if (!r2.setImmediate) {
              var i, s, t2, a, o = 1, h = {}, u = false, l = r2.document, e3 = Object.getPrototypeOf && Object.getPrototypeOf(r2);
              e3 = e3 && e3.setTimeout ? e3 : r2, i = "[object process]" === {}.toString.call(r2.process) ? function(e4) {
                process.nextTick(function() {
                  c(e4);
                });
              } : (function() {
                if (r2.postMessage && !r2.importScripts) {
                  var e4 = true, t3 = r2.onmessage;
                  return r2.onmessage = function() {
                    e4 = false;
                  }, r2.postMessage("", "*"), r2.onmessage = t3, e4;
                }
              })() ? (a = "setImmediate$" + Math.random() + "$", r2.addEventListener ? r2.addEventListener("message", d, false) : r2.attachEvent("onmessage", d), function(e4) {
                r2.postMessage(a + e4, "*");
              }) : r2.MessageChannel ? ((t2 = new MessageChannel()).port1.onmessage = function(e4) {
                c(e4.data);
              }, function(e4) {
                t2.port2.postMessage(e4);
              }) : l && "onreadystatechange" in l.createElement("script") ? (s = l.documentElement, function(e4) {
                var t3 = l.createElement("script");
                t3.onreadystatechange = function() {
                  c(e4), t3.onreadystatechange = null, s.removeChild(t3), t3 = null;
                }, s.appendChild(t3);
              }) : function(e4) {
                setTimeout(c, 0, e4);
              }, e3.setImmediate = function(e4) {
                "function" != typeof e4 && (e4 = new Function("" + e4));
                for (var t3 = new Array(arguments.length - 1), r3 = 0; r3 < t3.length; r3++) t3[r3] = arguments[r3 + 1];
                var n2 = { callback: e4, args: t3 };
                return h[o] = n2, i(o), o++;
              }, e3.clearImmediate = f;
            }
            function f(e4) {
              delete h[e4];
            }
            function c(e4) {
              if (u) setTimeout(c, 0, e4);
              else {
                var t3 = h[e4];
                if (t3) {
                  u = true;
                  try {
                    !(function(e5) {
                      var t4 = e5.callback, r3 = e5.args;
                      switch (r3.length) {
                        case 0:
                          t4();
                          break;
                        case 1:
                          t4(r3[0]);
                          break;
                        case 2:
                          t4(r3[0], r3[1]);
                          break;
                        case 3:
                          t4(r3[0], r3[1], r3[2]);
                          break;
                        default:
                          t4.apply(n, r3);
                      }
                    })(t3);
                  } finally {
                    f(e4), u = false;
                  }
                }
              }
            }
            function d(e4) {
              e4.source === r2 && "string" == typeof e4.data && 0 === e4.data.indexOf(a) && c(+e4.data.slice(a.length));
            }
          })("undefined" == typeof self ? void 0 === e2 ? this : e2 : self);
        }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
      }, {}] }, {}, [10])(10);
    });
  }
});

// src/compiler-build/browser-shims.patched.js
var import_jszip = __toESM(require_jszip_min(), 1);
var utf8enc = new TextEncoder();
var utf8dec = new TextDecoder("utf-8");
function _bytesToStr2(buf) {
  if (typeof buf === "string") return buf;
  const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return utf8dec.decode(u);
}
function _strToBytes2(str) {
  return utf8enc.encode(str);
}
function _bytesToU82(data) {
  return data instanceof Uint8Array ? data : _strToBytes2(String(data));
}
function _u8ToArrayBuffer2(u8) {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
}
function _md5HexStr2(str) {
  const bytes = utf8enc.encode(str);
  const n = bytes.length;
  const nbits = n * 8;
  const padded = new Uint8Array((n + 8 >> 6 << 6) + 64);
  padded.set(bytes);
  padded[n] = 128;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, nbits, true);
  const S2 = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  const K = [];
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
  let a0 = 1732584193 | 0, b0 = 4023233417 | 0, c0 = 2562383102 | 0, d0 = 271733878 | 0;
  const hex = (x) => ("00000000" + (x >>> 0).toString(16)).slice(-8);
  for (let i = 0; i < padded.length; i += 64) {
    const M = [];
    for (let j = 0; j < 16; j++) M[j] = dv.getUint32(i + j * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let j = 0; j < 64; j++) {
      let F, g;
      if (j < 16) {
        F = B & C | ~B & D;
        g = j;
      } else if (j < 32) {
        F = D & B | ~D & C;
        g = (5 * j + 1) % 16;
      } else if (j < 48) {
        F = B ^ C ^ D;
        g = (3 * j + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = 7 * j % 16;
      }
      F = F + A + K[j] + M[g] | 0;
      A = D;
      D = C;
      C = B;
      B = B + rol(F, S2[(j >> 4) * 4 + j % 4]) | 0;
    }
    a0 = a0 + A | 0;
    b0 = b0 + B | 0;
    c0 = c0 + C | 0;
    d0 = d0 + D | 0;
  }
  return hex(a0) + hex(b0) + hex(c0) + hex(d0);
}
function rol(n, c) {
  return n << c | n >>> 32 - c;
}
var _BROWSER_ASSETS2 = {
  "cd21514d0531fdffb22204e0ec5ed84a.svg": '"<svg version="1.1" width="2" height="2" viewBox="-1 -1 2 2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n  <!-- Exported by Scratch - http://scratch.mit.edu/ -->\n</svg>"',
  "dango-cat.svg": '"<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="61.49876" height="117.72954" viewBox="0,0,61.49876,117.72954"><g transform="translate(-209.25062,-121.13523)"><g data-paper-data="{&quot;isPaintingLayer&quot;:true}" fill-rule="nonzero" stroke="#000000" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" style="mix-blend-mode: normal"><path d="M212.45298,121.45117c4.27378,-1.68745 3.99111,1.73524 23.39137,52.09733c11.02954,29.4711 19.76067,53.61865 16.55011,54.62697c-4.68511,1.80854 -12.36182,-22.62622 -23.39136,-52.09733c-16.89172,-48.16374 -21.64214,-52.78237 -16.55012,-54.62697z" data-paper-data="{&quot;index&quot;:null}" fill="#d99e82" stroke-width="0"/><path d="M231.66366,188.60508c-9.14277,0 -16.55443,-7.24756 -16.55443,-16.18792c0,-0.78587 -6.31352,-9.26285 -5.83245,-12.90786c0.40452,-2.76293 9.55433,-0.3003 11.53093,-0.54877c4.86102,-1.00187 5.4542,-2.73129 10.85596,-2.73129c1.57876,0 3.53694,-7.03389 6.07355,-5.48884c4.69159,2.85764 10.48089,15.87384 10.48089,21.67674c0,8.94036 -7.41168,16.18792 -16.55443,16.18792z" data-paper-data="{&quot;index&quot;:null}" fill="#fcb1e3" stroke-width="0"/><path d="M254.49773,207.54343c-3.95019,2.74614 -8.14073,4.33933 -12.55592,4.76162c-4.55084,0.43525 -8.46053,0.76116 -12.24363,-2.3874c-7.45344,-6.20327 -8.34307,-19.21037 -2.19171,-24.55014c1.44594,-1.25547 3.26814,-2.45373 4.53075,-3.07615c1.76698,-0.87105 1.91986,-1.00055 5.71606,-1.94996c6.04389,-0.9383 9.92917,-0.90806 14.55274,2.94c7.45344,6.20327 8.43469,16.90662 2.19171,24.26203z" data-paper-data="{&quot;index&quot;:null}" fill="#ffd983" stroke-width="0"/><path d="M232.32721,232.90573c-2.56114,-5.68425 -1.68892,-8.14742 -0.86406,-12.66379c1.34684,-6.26958 3.91259,-8.71043 9.84623,-10.86565c2.22542,-0.80831 7.74255,-2.38249 10.8511,-2.73285c3.62404,-0.35301 6.7831,0.58103 9.40006,2.45432c2.34915,1.68157 3.03827,2.18205 6.332,6.90816c2.62231,4.47889 4.4898,11.43587 0.7492,16.90554c-3.6011,5.26566 -11.02377,5.95331 -18.58348,5.95331c-8.33056,0 -15.04386,-0.62903 -17.73105,-5.95905z" data-paper-data="{&quot;index&quot;:null}" fill="#a6d388" stroke-width="0"/><path d="M231.87007,170.77208c-1.41148,0 -2.55572,-1.14423 -2.55572,-2.55573c0,-1.41149 1.14423,-2.55572 2.55572,-2.55572c1.4115,0 2.55572,1.14422 2.55572,2.55572c0,1.4115 -1.14422,2.55573 -2.55572,2.55573z" data-paper-data="{&quot;index&quot;:null}" fill="#000000" stroke-width="1.5"/><path d="M243.83381,164.03088z" data-paper-data="{&quot;index&quot;:null}" fill="#000000" stroke-width="0"/><path d="M245.61169,164.9569c0,1.37058 -0.22211,1.74084 -1.59269,1.74084c-0.68528,0 -0.93531,-0.35186 -1.3844,-0.80094c-0.44908,-0.44908 -0.80093,-0.99542 -0.80093,-1.68071c0,-1.37058 -0.07421,-1.74085 1.29638,-1.74085c1.37058,0 2.48163,1.11107 2.48163,2.48165z" data-paper-data="{&quot;index&quot;:null}" fill="#000000" stroke-width="1.5"/></g></g></svg>"'
};

// ../backend-js/src/lexer.js
var TokenType = {
  // Preprocessor directives
  Define: "Define",
  Undef: "Undef",
  // Whitespace / line-continuation
  Newline: "Newline",
  Backslash: "Backslash",
  // Top-level declaration keywords
  Costumes: "Costumes",
  Sounds: "Sounds",
  Local: "Local",
  Proc: "Proc",
  Func: "Func",
  Return: "Return",
  NoWarp: "NoWarp",
  // Event keywords
  On: "On",
  OnFlag: "OnFlag",
  OnKey: "OnKey",
  OnClick: "OnClick",
  OnBackdrop: "OnBackdrop",
  OnLoudness: "OnLoudness",
  OnTimer: "OnTimer",
  OnClone: "OnClone",
  // Control-flow keywords
  If: "If",
  Else: "Else",
  Elif: "Elif",
  Until: "Until",
  While: "While",
  WaitUntil: "WaitUntil",
  Forever: "Forever",
  Repeat: "Repeat",
  // Multi-target section directive (InstanceScratch extension)
  Target: "Target",
  // Logical / membership keywords
  Not: "Not",
  And: "And",
  Or: "Or",
  In: "In",
  // Math built-in keywords
  Length: "Length",
  Round: "Round",
  Abs: "Abs",
  Floor: "Floor",
  Ceil: "Ceil",
  Sqrt: "Sqrt",
  Sin: "Sin",
  Cos: "Cos",
  Tan: "Tan",
  Asin: "Asin",
  Acos: "Acos",
  Atan: "Atan",
  Ln: "Ln",
  Log: "Log",
  Antiln: "Antiln",
  Antilog: "Antilog",
  // Visibility keywords
  Show: "Show",
  Hide: "Hide",
  // List keywords
  Add: "Add",
  To: "To",
  Delete: "Delete",
  Insert: "Insert",
  At: "At",
  As: "As",
  // Type / aggregate keywords
  Enum: "Enum",
  Struct: "Struct",
  True_: "True_",
  False_: "False_",
  List: "List",
  Cloud: "Cloud",
  Var: "Var",
  Orphan: "Orphan",
  // Built-in block keywords (snake_case)
  set_x: "set_x",
  set_y: "set_y",
  set_size: "set_size",
  point_in_direction: "point_in_direction",
  set_volume: "set_volume",
  set_rotation_style_left_right: "set_rotation_style_left_right",
  set_rotation_style_all_around: "set_rotation_style_all_around",
  set_rotation_style_do_not_rotate: "set_rotation_style_do_not_rotate",
  // Punctuation
  Comma: "Comma",
  LParen: "LParen",
  RParen: "RParen",
  LBrace: "LBrace",
  RBrace: "RBrace",
  Assign: "Assign",
  Eq: "Eq",
  Increment: "Increment",
  Decrement: "Decrement",
  AssignAdd: "AssignAdd",
  AssignSubtract: "AssignSubtract",
  AssignMultiply: "AssignMultiply",
  AssignDivide: "AssignDivide",
  AssignFloorDiv: "AssignFloorDiv",
  AssignModulo: "AssignModulo",
  AssignJoin: "AssignJoin",
  LBracket: "LBracket",
  RBracket: "RBracket",
  Dot: "Dot",
  Ne: "Ne",
  Lt: "Lt",
  Gt: "Gt",
  Le: "Le",
  Ge: "Ge",
  Amp: "Amp",
  Plus: "Plus",
  Minus: "Minus",
  Star: "Star",
  Slash: "Slash",
  FloorDiv: "FloorDiv",
  Percent: "Percent",
  Semicolon: "Semicolon",
  Colon: "Colon",
  Pipe: "Pipe",
  Question: "Question",
  Caret: "Caret",
  // Value-bearing tokens
  Name: "Name",
  Arg: "Arg",
  Bin: "Bin",
  Oct: "Oct",
  Int: "Int",
  Hex: "Hex",
  Float: "Float",
  Str: "Str"
};
var KEYWORDS = Object.assign(/* @__PURE__ */ Object.create(null), {
  "define": TokenType.Define,
  "undef": TokenType.Undef,
  "costumes": TokenType.Costumes,
  "sounds": TokenType.Sounds,
  "local": TokenType.Local,
  "proc": TokenType.Proc,
  "func": TokenType.Func,
  "return": TokenType.Return,
  "nowarp": TokenType.NoWarp,
  "on": TokenType.On,
  "onflag": TokenType.OnFlag,
  "onkey": TokenType.OnKey,
  "onclick": TokenType.OnClick,
  "onbackdrop": TokenType.OnBackdrop,
  "onloudness": TokenType.OnLoudness,
  "ontimer": TokenType.OnTimer,
  "onclone": TokenType.OnClone,
  "orphan": TokenType.Orphan,
  "if": TokenType.If,
  "else": TokenType.Else,
  "elif": TokenType.Elif,
  "until": TokenType.Until,
  "wait_until": TokenType.WaitUntil,
  "while": TokenType.While,
  "target": TokenType.Target,
  "forever": TokenType.Forever,
  "repeat": TokenType.Repeat,
  "not": TokenType.Not,
  "and": TokenType.And,
  "or": TokenType.Or,
  "in": TokenType.In,
  "length": TokenType.Length,
  "round": TokenType.Round,
  "abs": TokenType.Abs,
  "floor": TokenType.Floor,
  "ceil": TokenType.Ceil,
  "sqrt": TokenType.Sqrt,
  "sin": TokenType.Sin,
  "cos": TokenType.Cos,
  "tan": TokenType.Tan,
  "asin": TokenType.Asin,
  "acos": TokenType.Acos,
  "atan": TokenType.Atan,
  "ln": TokenType.Ln,
  "log": TokenType.Log,
  "antiln": TokenType.Antiln,
  "antilog": TokenType.Antilog,
  "show": TokenType.Show,
  "hide": TokenType.Hide,
  "add": TokenType.Add,
  "to": TokenType.To,
  "delete": TokenType.Delete,
  "insert": TokenType.Insert,
  "at": TokenType.At,
  "as": TokenType.As,
  "enum": TokenType.Enum,
  "struct": TokenType.Struct,
  "true": TokenType.True_,
  "false": TokenType.False_,
  "list": TokenType.List,
  "cloud": TokenType.Cloud,
  "var": TokenType.Var,
  "set_x": TokenType.set_x,
  "set_y": TokenType.set_y,
  "set_size": TokenType.set_size,
  "point_in_direction": TokenType.point_in_direction,
  "set_volume": TokenType.set_volume,
  "set_rotation_style_left_right": TokenType.set_rotation_style_left_right,
  "set_rotation_style_all_around": TokenType.set_rotation_style_all_around,
  "set_rotation_style_do_not_rotate": TokenType.set_rotation_style_do_not_rotate
});
var Token = class {
  constructor(type, value = null, start = 0, end = 0) {
    this.type = type;
    this.value = value;
    this.start = start;
    this.end = end;
  }
};
var LexError = class extends Error {
  constructor(message, offset) {
    super(message);
    this.message = message;
    this.offset = offset;
  }
};
var _RE_SKIP_WS = /[ \r\t\f\uFEFF]+/;
var _RE_HASH_COMMENT = /#[^\n]*\n?/;
var _RE_SLASHSLASH_COMMENT = /\/\/[^\n]*\n?/;
var _EXPR_TAIL_TYPES = /* @__PURE__ */ new Set([
  TokenType.Name,
  TokenType.Int,
  TokenType.Float,
  TokenType.Str,
  TokenType.Hex,
  TokenType.Oct,
  TokenType.Bin,
  TokenType.Arg,
  TokenType.RBracket,
  TokenType.RParen,
  TokenType.True_,
  TokenType.False_
]);
var _RE_BLOCK_COMMENT = /\/\*[\s\S]*?\*\//;
var _RE_IDENT = /[_a-zA-Z][_a-zA-Z0-9]*/;
var _RE_ARG = /\$[_a-zA-Z0-9]+/;
var _RE_BIN = /0b[0-1][_0-1]*/;
var _RE_OCT = /0o[0-7][_0-7]*/;
var _RE_HEX = /0x[0-9a-fA-F][_0-9a-fA-F]*/;
var _RE_INT_RUN = /[0-9][_0-9]*/;
var _RE_FLOAT_FRACTION = /\.[0-9]+/;
var _RE_FLOAT_EXPONENT = /[Ee][\-+]?[0-9]+/;
var _RE_STRING = /"(?:[^"\\]|\\["\\/bfnrt]|\\u[0-9a-zA-Z]{4})*"/;
var _RE_PREPROC = /%(define|undef)\b/;
var _OPERATORS = [
  ["//=", TokenType.AssignFloorDiv],
  ["++", TokenType.Increment],
  ["--", TokenType.Decrement],
  ["+=", TokenType.AssignAdd],
  ["-=", TokenType.AssignSubtract],
  ["*=", TokenType.AssignMultiply],
  ["/=", TokenType.AssignDivide],
  ["%=", TokenType.AssignModulo],
  ["&=", TokenType.AssignJoin],
  ["&&", TokenType.And],
  ["||", TokenType.Or],
  ["==", TokenType.Eq],
  ["!=", TokenType.Ne],
  ["<=", TokenType.Le],
  [">=", TokenType.Ge],
  ["//", TokenType.FloorDiv],
  ["|>", TokenType.Pipe],
  [",", TokenType.Comma],
  ["(", TokenType.LParen],
  [")", TokenType.RParen],
  ["{", TokenType.LBrace],
  ["}", TokenType.RBrace],
  ["[", TokenType.LBracket],
  ["]", TokenType.RBracket],
  [".", TokenType.Dot],
  ["&", TokenType.Amp],
  ["+", TokenType.Plus],
  ["-", TokenType.Minus],
  ["*", TokenType.Star],
  ["/", TokenType.Slash],
  ["%", TokenType.Percent],
  [";", TokenType.Semicolon],
  [":", TokenType.Colon],
  ["?", TokenType.Question],
  ["^", TokenType.Caret],
  ["<", TokenType.Lt],
  [">", TokenType.Gt],
  ["=", TokenType.Assign],
  ["|", TokenType.Pipe],
  ["!", TokenType.Not]
];
function matchSticky(regex, str, offset) {
  const sticky = new RegExp(regex.source, "y");
  sticky.lastIndex = offset;
  const m = sticky.exec(str);
  return m;
}
var Lexer = class {
  constructor(source) {
    this.source = source;
    this._tokens = [];
    this.offset = 0;
    this.length = source.length;
  }
  lex() {
    while (this.offset < this.length) {
      let m = matchSticky(_RE_SKIP_WS, this.source, this.offset);
      if (m) {
        this.offset += m[0].length;
        continue;
      }
      if (this.source[this.offset] === "#") {
        m = matchSticky(_RE_HASH_COMMENT, this.source, this.offset);
        if (m) {
          this.offset += m[0].length;
          continue;
        }
      }
      if (this.source.startsWith("//", this.offset)) {
        const lastTok = this._tokens.length ? this._tokens[this._tokens.length - 1] : null;
        const exprContinues = !!(lastTok && _EXPR_TAIL_TYPES.has(lastTok.type));
        if (!exprContinues) {
          m = matchSticky(_RE_SLASHSLASH_COMMENT, this.source, this.offset);
          if (m) {
            this.offset += m[0].length;
            continue;
          }
        }
      }
      m = matchSticky(_RE_BLOCK_COMMENT, this.source, this.offset);
      if (m) {
        this.offset += m[0].length;
        continue;
      }
      const ch = this.source[this.offset];
      if (ch === "\n") {
        const start = this.offset;
        this.offset += 1;
        this._tokens.push(new Token(TokenType.Newline, null, start, start + 1));
        continue;
      }
      if (ch === "\\") {
        this.offset += 1;
        while (this.offset < this.length && /[ \r\t\f]/.test(this.source[this.offset])) {
          this.offset += 1;
        }
        if (this.source[this.offset] === "\n") {
          this.offset += 1;
        }
        continue;
      }
      if (ch === "%") {
        if (this.source.startsWith("%=", this.offset)) {
          this._tokens.push(new Token(TokenType.AssignModulo, null, this.offset, this.offset + 2));
          this.offset += 2;
          continue;
        }
        const start = this.offset;
        m = matchSticky(_RE_PREPROC, this.source, this.offset);
        if (m) {
          const text = m[1];
          this.offset += m[0].length;
          const tokType = text === "define" ? TokenType.Define : TokenType.Undef;
          this._tokens.push(new Token(tokType, null, start, this.offset));
          continue;
        }
        this.offset += 1;
        this._tokens.push(new Token(TokenType.Percent, null, start, start + 1));
        continue;
      }
      m = matchSticky(_RE_ARG, this.source, this.offset);
      if (m) {
        const start = this.offset;
        const raw = m[0];
        this.offset += raw.length;
        this._tokens.push(new Token(TokenType.Arg, raw.slice(1), start, this.offset));
        continue;
      }
      m = matchSticky(_RE_BIN, this.source, this.offset);
      if (m) {
        const start = this.offset;
        const raw = m[0];
        this.offset += raw.length;
        const digits = raw.slice(2).replace(/_/g, "");
        this._tokens.push(new Token(TokenType.Bin, parseInt(digits, 2), start, this.offset));
        continue;
      }
      m = matchSticky(_RE_OCT, this.source, this.offset);
      if (m) {
        const start = this.offset;
        const raw = m[0];
        this.offset += raw.length;
        const digits = raw.slice(2).replace(/_/g, "");
        this._tokens.push(new Token(TokenType.Oct, parseInt(digits, 8), start, this.offset));
        continue;
      }
      m = matchSticky(_RE_HEX, this.source, this.offset);
      if (m) {
        const start = this.offset;
        const raw = m[0];
        this.offset += raw.length;
        const digits = raw.slice(2).replace(/_/g, "");
        this._tokens.push(new Token(TokenType.Hex, parseInt(digits, 16), start, this.offset));
        continue;
      }
      const intMatch = matchSticky(_RE_INT_RUN, this.source, this.offset);
      if (intMatch) {
        const start = this.offset;
        const intEnd = start + intMatch[0].length;
        const fracMatch = matchSticky(_RE_FLOAT_FRACTION, this.source, intEnd);
        if (fracMatch) {
          const afterFrac = intEnd + fracMatch[0].length;
          const expMatch2 = matchSticky(_RE_FLOAT_EXPONENT, this.source, afterFrac);
          const end = expMatch2 ? afterFrac + expMatch2[0].length : afterFrac;
          const raw2 = this.source.slice(start, end).replace(/_/g, "");
          this.offset = end;
          this._tokens.push(new Token(TokenType.Float, parseFloat(raw2), start, end));
          continue;
        }
        const expMatch = matchSticky(_RE_FLOAT_EXPONENT, this.source, intEnd);
        if (expMatch) {
          const end = intEnd + expMatch[0].length;
          const raw2 = this.source.slice(start, end).replace(/_/g, "");
          this.offset = end;
          this._tokens.push(new Token(TokenType.Float, parseFloat(raw2), start, end));
          continue;
        }
        const raw = intMatch[0].replace(/_/g, "");
        this.offset = intEnd;
        this._tokens.push(new Token(TokenType.Int, parseInt(raw, 10), start, intEnd));
        continue;
      }
      m = matchSticky(_RE_STRING, this.source, this.offset);
      if (m) {
        const start = this.offset;
        const raw = m[0];
        this.offset += raw.length;
        let decoded;
        try {
          decoded = JSON.parse(raw);
        } catch (e) {
          throw new LexError(`invalid string literal: ${e.message}`, start);
        }
        this._tokens.push(new Token(TokenType.Str, decoded, start, this.offset));
        continue;
      }
      m = matchSticky(_RE_IDENT, this.source, this.offset);
      if (m) {
        const start = this.offset;
        const text = m[0];
        this.offset += text.length;
        const tokType = KEYWORDS[text];
        if (tokType) {
          this._tokens.push(new Token(tokType, null, start, this.offset));
        } else {
          this._tokens.push(new Token(TokenType.Name, text, start, this.offset));
        }
        continue;
      }
      let matched = false;
      for (const [opText, opType] of _OPERATORS) {
        if (this.source.startsWith(opText, this.offset)) {
          const start = this.offset;
          this.offset += opText.length;
          this._tokens.push(new Token(opType, null, start, this.offset));
          matched = true;
          break;
        }
      }
      if (matched) continue;
      throw new LexError(`unexpected character ${JSON.stringify(ch)}`, this.offset);
    }
    return this._tokens;
  }
};
function lex(source) {
  return new Lexer(source).lex();
}

// ../backend-js/src/ast_nodes.js
var Name = class {
  constructor(name, span2) {
    this.name = name;
    this.span = span2;
  }
  basename() {
    return this.name;
  }
  fieldname() {
    return null;
  }
  is_dot() {
    return false;
  }
  toString() {
    return `Name(${JSON.stringify(this.name)})`;
  }
};
var DotName = class {
  constructor(lhs, lhsSpan, rhs, rhsSpan, isGenerated = false) {
    this.lhs = lhs;
    this.lhs_span = lhsSpan;
    this.rhs = rhs;
    this.rhs_span = rhsSpan;
    this.is_generated = isGenerated;
  }
  get span() {
    return [this.lhs_span[0], this.rhs_span[1]];
  }
  basename() {
    return this.lhs;
  }
  fieldname() {
    return this.rhs;
  }
  is_dot() {
    return true;
  }
  toString() {
    return `DotName(${JSON.stringify(this.lhs)}.${JSON.stringify(this.rhs)})`;
  }
};
var TypeValue = class {
  constructor() {
  }
};
var TypeStruct = class {
  constructor(name, span2) {
    this.name = name;
    this.span = span2;
  }
};
var Value = class _Value {
  constructor(kind, data) {
    this.kind = kind;
    this.data = data;
  }
  static fromBool(b) {
    return new _Value("boolean", !!b);
  }
  static fromFloat(f) {
    return new _Value("number", Number(f));
  }
  static fromStr(s) {
    return new _Value("string", String(s));
  }
  static fromInt(i) {
    return new _Value("number", Number(i));
  }
  toNumber() {
    if (this.kind === "boolean") return this.data ? 1 : 0;
    if (this.kind === "number") return Number(this.data);
    const f = parseFloat(this.data);
    return isNaN(f) ? 0 : f;
  }
  toString() {
    if (this.kind === "boolean") return this.data ? "true" : "false";
    if (this.kind === "number") {
      const f = Number(this.data);
      if (f === Math.floor(f)) return String(Math.floor(f));
      return String(f);
    }
    return String(this.data);
  }
  toBoolean() {
    if (this.kind === "boolean") return !!this.data;
    if (this.kind === "number") return Number(this.data) !== 0;
    return !!this.data;
  }
  isInteger() {
    if (this.kind !== "number") return false;
    const f = Number(this.data);
    if (isNaN(f)) return false;
    return f === Math.floor(f);
  }
};
var ExprValue = class {
  constructor(value, span2) {
    this.value = value;
    this.span = span2;
  }
};
var ExprName = class {
  constructor(name) {
    this.name = name;
  }
};
var ExprDot = class {
  constructor(lhs, rhs, rhsSpan) {
    this.lhs = lhs;
    this.rhs = rhs;
    this.rhs_span = rhsSpan;
  }
};
var ExprArg = class {
  constructor(name) {
    this.name = name;
  }
};
var ExprRepr = class {
  constructor(repr, span2, args = []) {
    this.repr = repr;
    this.span = span2;
    this.args = args;
  }
};
var ExprFuncCall = class {
  constructor(name, span2, args = [], kwargs = {}) {
    this.name = name;
    this.span = span2;
    this.args = args;
    this.kwargs = kwargs;
  }
};
var ExprUnOp = class {
  constructor(op, span2, opr) {
    this.op = op;
    this.span = span2;
    this.opr = opr;
  }
};
var ExprBinOp = class {
  constructor(op, span2, lhs, rhs) {
    this.op = op;
    this.span = span2;
    this.lhs = lhs;
    this.rhs = rhs;
  }
};
var ExprTernary = class {
  constructor(cond, thenExpr, elseExpr, span2) {
    this.cond = cond;
    this.then = thenExpr;
    this.els = elseExpr;
    this.span = span2;
  }
};
var ExprStructLiteral = class {
  constructor(name, span2, fields = []) {
    this.name = name;
    this.span = span2;
    this.fields = fields;
  }
};
var ExprProperty = class {
  constructor(object, property, span2) {
    this.object = object;
    this.property = property;
    this.span = span2;
  }
};
var StructLiteralField = class {
  constructor(name, span2, value) {
    this.name = name;
    this.span = span2;
    this.value = value;
  }
};
var StmtRepeat = class {
  constructor(times, body) {
    this.times = times;
    this.body = body;
  }
};
var StmtForever = class {
  constructor(body, span2) {
    this.body = body;
    this.span = span2;
  }
};
var StmtBranch = class {
  // hasElse: the source explicitly wrote `else` (even with an empty body).
  // Distinguishes `if c { }` (→ control_if) from `if c { } else { }` (→ control_if_else
  // with empty SUBSTACK2), which the SB3 round-trip must preserve.
  constructor(cond, ifBody, elseBody, hasElse = false) {
    this.cond = cond;
    this.if_body = ifBody;
    this.else_body = elseBody;
    this.has_else = hasElse || !!(elseBody && elseBody.length > 0);
  }
};
var StmtUntil = class {
  constructor(cond, body) {
    this.cond = cond;
    this.body = body;
  }
};
var StmtWaitUntil = class {
  constructor(cond) {
    this.cond = cond;
  }
};
var StmtSetVar = class {
  constructor(name, value, type_, isLocal, isCloud) {
    this.name = name;
    this.value = value;
    this.type_ = type_;
    this.is_local = isLocal;
    this.is_cloud = isCloud;
  }
};
var StmtChangeVar = class {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }
};
var StmtShow = class {
  constructor(name) {
    this.name = name;
  }
};
var StmtHide = class {
  constructor(name) {
    this.name = name;
  }
};
var StmtAddToList = class {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }
};
var StmtDeleteList = class {
  constructor(name) {
    this.name = name;
  }
};
var StmtDeleteListIndex = class {
  constructor(name, index) {
    this.name = name;
    this.index = index;
  }
};
var StmtInsertAtList = class {
  constructor(name, index, value) {
    this.name = name;
    this.index = index;
    this.value = value;
  }
};
var StmtSetListIndex = class {
  constructor(name, index, value) {
    this.name = name;
    this.index = index;
    this.value = value;
  }
};
var StmtBlock = class {
  constructor(block, span2, args = [], kwargs = {}) {
    this.block = block;
    this.span = span2;
    this.args = args;
    this.kwargs = kwargs;
  }
};
var StmtProcCall = class {
  constructor(name, span2, args = [], kwargs = {}) {
    this.name = name;
    this.span = span2;
    this.args = args;
    this.kwargs = kwargs;
  }
};
var StmtFuncCall = class {
  constructor(name, span2, args = [], kwargs = {}) {
    this.name = name;
    this.span = span2;
    this.args = args;
    this.kwargs = kwargs;
  }
};
var StmtReturn = class {
  constructor(value, visited = false) {
    this.value = value;
    this.visited = visited;
  }
};
var Arg = class {
  constructor(name, span2, type_, default_, isUsed = false) {
    this.name = name;
    this.span = span2;
    this.type_ = type_;
    this.default = default_;
    this.is_used = isUsed;
  }
};
var Var = class {
  constructor(name, span2, type_, default_, isCloud, isUsed = false) {
    this.name = name;
    this.span = span2;
    this.type_ = type_;
    this.default = default_;
    this.is_cloud = isCloud;
    this.is_used = isUsed;
  }
};
var ListDefaultValues = class {
  constructor(values) {
    this.values = values;
  }
};
var ListDefaultFile = class {
  constructor(path2, span2) {
    this.path = path2;
    this.span = span2;
  }
};
var ListNode = class {
  constructor(name, span2, type_, default_, isUsed = false) {
    this.name = name;
    this.span = span2;
    this.type_ = type_;
    this.default = default_;
    this.is_used = isUsed;
  }
};
var Proc = class {
  constructor(name, span2, warp = true) {
    this.name = name;
    this.span = span2;
    this.warp = warp;
  }
};
var Func = class {
  // Functions carry a return value, so the generated custom block MUST run
  // in warp mode (运行时不刷新屏幕). scratch-vm's procedures_call with
  // warp=false spawns an async child thread — the caller reads
  // `returnedFunc:<fn>` before the body has run, yielding a stale/garbage
  // return value (the root cause of "function calls always returning 13").
  constructor(name, span2, type_ = null, warp = true) {
    this.name = name;
    this.span = span2;
    this.type_ = type_;
    this.warp = warp;
  }
};
var StructField = class {
  constructor(name, span2, default_, isUsed = false) {
    this.name = name;
    this.span = span2;
    this.default = default_;
    this.is_used = isUsed;
  }
};
var Struct = class {
  constructor(name, span2, fields = [], isUsed = false) {
    this.name = name;
    this.span = span2;
    this.fields = fields;
    this.is_used = isUsed;
  }
};
var EnumVariant = class {
  constructor(name, span2, value, isUsed = false) {
    this.name = name;
    this.span = span2;
    this.value = value;
    this.is_used = isUsed;
  }
};
var EnumNode = class {
  constructor(name, span2, variants = [], isUsed = false) {
    this.name = name;
    this.span = span2;
    this.variants = variants;
    this.is_used = isUsed;
  }
};
var EventKind = class {
  constructor(kind, opts = {}) {
    if (kind !== null && typeof kind === "object" && !Array.isArray(kind)) {
      opts = kind;
      this.kind = opts.kind;
      this.key = opts.key ?? null;
      this.key_span = opts.key_span ?? opts.keySpan ?? null;
      this.backdrop = opts.backdrop ?? null;
      this.backdrop_span = opts.backdrop_span ?? opts.backdropSpan ?? null;
      this.event = opts.event ?? null;
      this.value = opts.value ?? null;
    } else {
      this.kind = kind;
      this.key = opts.key ?? null;
      this.key_span = opts.key_span ?? opts.keySpan ?? null;
      this.backdrop = opts.backdrop ?? null;
      this.backdrop_span = opts.backdrop_span ?? opts.backdropSpan ?? null;
      this.event = opts.event ?? null;
      this.value = opts.value ?? null;
    }
  }
  opcode() {
    switch (this.kind) {
      case "OnFlag":
        return "event_whenflagclicked";
      case "OnKey":
        return "event_whenkeypressed";
      case "OnClick":
        return "event_whenthisspriteclicked";
      case "OnBackdrop":
        return "event_whenbackdropswitchesto";
      case "OnLoudnessGt":
      case "OnTimerGt":
        return "event_whengreaterthan";
      case "OnClone":
        return "control_start_as_clone";
      case "On":
        return "event_whenbroadcastreceived";
      default:
        throw new Error(`unknown event kind: ${JSON.stringify(this.kind)}`);
    }
  }
};
var Event = class {
  constructor(kind, span2, body) {
    this.kind = kind;
    this.span = span2;
    this.body = body;
  }
};
var Asset = class {
  constructor(name, path2, span2) {
    this.name = name;
    this.path = path2;
    this.span = span2;
  }
};
var RotationStyle = class {
  constructor(style = "all around") {
    this.style = style;
  }
};
var ConstExprValue = class {
  constructor(value, span2) {
    this.value = value;
    this.span = span2;
  }
};
var ConstExprEnumVariant = class {
  constructor(enumName, enumNameSpan, variantName, variantNameSpan) {
    this.enum_name = enumName;
    this.enum_name_span = enumNameSpan;
    this.variant_name = variantName;
    this.variant_name_span = variantNameSpan;
  }
};
var ConstExprStructLiteral = class {
  constructor(name, span2, fields = []) {
    this.name = name;
    this.span = span2;
    this.fields = fields;
  }
};
var Diagnostic = class {
  constructor(kind, span2) {
    this.kind = kind;
    this.span = span2;
  }
};
var Sprite = class {
  constructor() {
    this.costumes = [];
    this.sounds = [];
    this.procs = {};
    this.proc_definitions = {};
    this.proc_args = {};
    this.proc_references = {};
    this.funcs = {};
    this.func_definitions = {};
    this.func_args = {};
    this.func_references = {};
    this.enums = {};
    this.structs = {};
    this.vars = {};
    this.proc_locals = {};
    this.func_locals = {};
    this.lists = {};
    this.events = [];
    this.orphanChains = [];
    this.used_procs = /* @__PURE__ */ new Set();
    this.used_funcs = /* @__PURE__ */ new Set();
    this.volume = null;
    this.x_position = null;
    this.y_position = null;
    this.size = null;
    this.direction = null;
    this.rotation_style = new RotationStyle();
    this.hidden = false;
  }
  addVar(var_, diagnostics) {
    if (Object.prototype.hasOwnProperty.call(this.vars, var_.name) || Object.prototype.hasOwnProperty.call(this.lists, var_.name)) {
      diagnostics.push(new Diagnostic("VariableRedefinition", var_.span));
      return;
    }
    this.vars[var_.name] = var_;
  }
  addList(lst, diagnostics) {
    if (Object.prototype.hasOwnProperty.call(this.vars, lst.name) || Object.prototype.hasOwnProperty.call(this.lists, lst.name)) {
      diagnostics.push(new Diagnostic("VariableRedefinition", lst.span));
      return;
    }
    this.lists[lst.name] = lst;
  }
  addProc(proc, args, body, diagnostics) {
    if (Object.prototype.hasOwnProperty.call(this.procs, proc.name)) {
      diagnostics.push(new Diagnostic("ProcRedefinition", proc.span));
      return;
    }
    this.procs[proc.name] = proc;
    this.proc_args[proc.name] = args;
    this.proc_definitions[proc.name] = body;
  }
  addFunc(func, args, body, diagnostics) {
    if (Object.prototype.hasOwnProperty.call(this.funcs, func.name)) {
      diagnostics.push(new Diagnostic("FuncRedefinition", func.span));
      return;
    }
    this.funcs[func.name] = func;
    this.func_args[func.name] = args;
    this.func_definitions[func.name] = body;
  }
  addStruct(struct, diagnostics) {
    if (Object.prototype.hasOwnProperty.call(this.structs, struct.name)) {
      diagnostics.push(new Diagnostic("StructRedefinition", struct.span));
      return;
    }
    this.structs[struct.name] = struct;
  }
  addEnum(enum_, diagnostics) {
    if (Object.prototype.hasOwnProperty.call(this.enums, enum_.name)) {
      diagnostics.push(new Diagnostic("EnumRedefinition", enum_.span));
      return;
    }
    this.enums[enum_.name] = enum_;
  }
};
var Project = class {
  constructor(stage, sprites) {
    this.stage = stage;
    this.sprites = sprites;
  }
};

// ../backend-js/src/blocks.js
var Menu = class {
  constructor(input, opcode, defaultValue, field) {
    this.input = input;
    this.opcode = opcode;
    this.default = defaultValue;
    this.field = field;
  }
};
var UnOp = {
  Not: "Not",
  Length: "Length",
  Round: "Round",
  Abs: "Abs",
  Floor: "Floor",
  Ceil: "Ceil",
  Sqrt: "Sqrt",
  Sin: "Sin",
  Cos: "Cos",
  Tan: "Tan",
  Asin: "Asin",
  Acos: "Acos",
  Atan: "Atan",
  Ln: "Ln",
  Log: "Log",
  AntiLn: "AntiLn",
  AntiLog: "AntiLog",
  Minus: "Minus"
};
var _UNOP_MATHOP = {
  [UnOp.Abs]: "abs",
  [UnOp.Floor]: "floor",
  [UnOp.Ceil]: "ceiling",
  [UnOp.Sqrt]: "sqrt",
  [UnOp.Sin]: "sin",
  [UnOp.Cos]: "cos",
  [UnOp.Tan]: "tan",
  [UnOp.Asin]: "asin",
  [UnOp.Acos]: "acos",
  [UnOp.Atan]: "atan",
  [UnOp.Ln]: "ln",
  [UnOp.Log]: "log",
  [UnOp.AntiLn]: "e ^",
  [UnOp.AntiLog]: "10 ^"
};
function unopOpcode(self2) {
  if (self2 === UnOp.Not) return "operator_not";
  if (self2 === UnOp.Length) return "operator_length";
  if (self2 === UnOp.Round) return "operator_round";
  if (_UNOP_MATHOP[self2]) return "operator_mathop";
  throw new Error(`UnOp.${self2} has no opcode`);
}
function unopInput(self2) {
  if (self2 === UnOp.Not) return "OPERAND";
  if (self2 === UnOp.Length) return "STRING";
  if (self2 === UnOp.Round) return "NUM";
  if (_UNOP_MATHOP[self2]) return "NUM";
  throw new Error(`UnOp.${self2} has no input`);
}
function unopFields(self2) {
  const op = _UNOP_MATHOP[self2];
  if (!op) return null;
  return { OPERATOR: [op, null] };
}
var BinOp = {
  Add: "Add",
  Sub: "Sub",
  Mul: "Mul",
  Div: "Div",
  Mod: "Mod",
  Lt: "Lt",
  Gt: "Gt",
  Eq: "Eq",
  And: "And",
  Or: "Or",
  Join: "Join",
  In: "In",
  Of: "Of",
  Le: "Le",
  Ge: "Ge",
  Ne: "Ne",
  FloorDiv: "FloorDiv"
};
var _BINOP_OPCODE = {
  [BinOp.Add]: "operator_add",
  [BinOp.Sub]: "operator_subtract",
  [BinOp.Mul]: "operator_multiply",
  [BinOp.Div]: "operator_divide",
  [BinOp.Mod]: "operator_mod",
  [BinOp.Lt]: "operator_lt",
  [BinOp.Gt]: "operator_gt",
  [BinOp.Eq]: "operator_equals",
  [BinOp.And]: "operator_and",
  [BinOp.Or]: "operator_or",
  [BinOp.Join]: "operator_join",
  [BinOp.In]: "operator_contains",
  [BinOp.Of]: "operator_letter_of"
};
var _BINOP_LHS = {
  [BinOp.Add]: "NUM1",
  [BinOp.Sub]: "NUM1",
  [BinOp.Mul]: "NUM1",
  [BinOp.Div]: "NUM1",
  [BinOp.Mod]: "NUM1",
  [BinOp.Lt]: "OPERAND1",
  [BinOp.Gt]: "OPERAND1",
  [BinOp.Eq]: "OPERAND1",
  [BinOp.And]: "OPERAND1",
  [BinOp.Or]: "OPERAND1",
  [BinOp.Join]: "STRING1",
  [BinOp.In]: "STRING2",
  [BinOp.Of]: "STRING"
};
var _BINOP_RHS = {
  [BinOp.Add]: "NUM2",
  [BinOp.Sub]: "NUM2",
  [BinOp.Mul]: "NUM2",
  [BinOp.Div]: "NUM2",
  [BinOp.Mod]: "NUM2",
  [BinOp.Lt]: "OPERAND2",
  [BinOp.Gt]: "OPERAND2",
  [BinOp.Eq]: "OPERAND2",
  [BinOp.And]: "OPERAND2",
  [BinOp.Or]: "OPERAND2",
  [BinOp.Join]: "STRING2",
  [BinOp.In]: "STRING1",
  [BinOp.Of]: "LETTER"
};
function binopOpcode(self2) {
  const op = _BINOP_OPCODE[self2];
  if (!op) throw new Error(`BinOp.${self2} has no opcode`);
  return op;
}
function binopLhs(self2) {
  const lhs = _BINOP_LHS[self2];
  if (!lhs) throw new Error(`BinOp.${self2} has no lhs input`);
  return lhs;
}
function binopRhs(self2) {
  const rhs = _BINOP_RHS[self2];
  if (!rhs) throw new Error(`BinOp.${self2} has no rhs input`);
  return rhs;
}
var Block = {
  // motion
  Move: "Move",
  TurnLeft: "TurnLeft",
  TurnRight: "TurnRight",
  GotoRandomPosition: "GotoRandomPosition",
  GotoMousePointer: "GotoMousePointer",
  Goto1: "Goto1",
  Goto2: "Goto2",
  Glide3: "Glide3",
  Glide2: "Glide2",
  GlideToRandomPosition: "GlideToRandomPosition",
  GlideToMousePointer: "GlideToMousePointer",
  PointInDirection: "PointInDirection",
  PointTowardsMousePointer: "PointTowardsMousePointer",
  PointTowardsRandomDirection: "PointTowardsRandomDirection",
  PointTowards: "PointTowards",
  ChangeX: "ChangeX",
  SetX: "SetX",
  ChangeY: "ChangeY",
  SetY: "SetY",
  IfOnEdgeBounce: "IfOnEdgeBounce",
  SetRotationStyleLeftRight: "SetRotationStyleLeftRight",
  SetRotationStyleDoNotRotate: "SetRotationStyleDoNotRotate",
  SetRotationStyleAllAround: "SetRotationStyleAllAround",
  // looks
  Say2: "Say2",
  Say1: "Say1",
  Think2: "Think2",
  Think1: "Think1",
  SwitchCostume: "SwitchCostume",
  NextCostume: "NextCostume",
  SwitchBackdrop: "SwitchBackdrop",
  PreviousBackdrop: "PreviousBackdrop",
  RandomBackdrop: "RandomBackdrop",
  NextBackdrop: "NextBackdrop",
  SetSize: "SetSize",
  ChangeSize: "ChangeSize",
  ChangeColorEffect: "ChangeColorEffect",
  ChangeFisheyeEffect: "ChangeFisheyeEffect",
  ChangeWhirlEffect: "ChangeWhirlEffect",
  ChangePixelateEffect: "ChangePixelateEffect",
  ChangeMosaicEffect: "ChangeMosaicEffect",
  ChangeBrightnessEffect: "ChangeBrightnessEffect",
  ChangeGhostEffect: "ChangeGhostEffect",
  SetColorEffect: "SetColorEffect",
  SetFisheyeEffect: "SetFisheyeEffect",
  SetWhirlEffect: "SetWhirlEffect",
  SetPixelateEffect: "SetPixelateEffect",
  SetMosaicEffect: "SetMosaicEffect",
  SetBrightnessEffect: "SetBrightnessEffect",
  SetGhostEffect: "SetGhostEffect",
  ClearGraphicEffects: "ClearGraphicEffects",
  Show: "Show",
  Hide: "Hide",
  GotoFront: "GotoFront",
  GotoBack: "GotoBack",
  GoForward: "GoForward",
  GoBackward: "GoBackward",
  // sound
  PlaySoundUntilDone: "PlaySoundUntilDone",
  StartSound: "StartSound",
  StopAllSounds: "StopAllSounds",
  ChangePitchEffect: "ChangePitchEffect",
  ChangePanEffect: "ChangePanEffect",
  SetPitchEffect: "SetPitchEffect",
  SetPanEffect: "SetPanEffect",
  ChangeVolume: "ChangeVolume",
  SetVolume: "SetVolume",
  ClearSoundEffects: "ClearSoundEffects",
  // event / control
  Broadcast: "Broadcast",
  BroadcastAndWait: "BroadcastAndWait",
  Wait: "Wait",
  StopAll: "StopAll",
  StopThisScript: "StopThisScript",
  StopOtherScripts: "StopOtherScripts",
  DeleteThisClone: "DeleteThisClone",
  Clone0: "Clone0",
  Clone1: "Clone1",
  // sensing
  Ask: "Ask",
  SetDragModeDraggable: "SetDragModeDraggable",
  SetDragModeNotDraggable: "SetDragModeNotDraggable",
  ResetTimer: "ResetTimer",
  // pen
  EraseAll: "EraseAll",
  Stamp: "Stamp",
  PenDown: "PenDown",
  PenUp: "PenUp",
  SetPenColor: "SetPenColor",
  ChangePenSize: "ChangePenSize",
  SetPenSize: "SetPenSize",
  SetPenHue: "SetPenHue",
  SetPenSaturation: "SetPenSaturation",
  SetPenBrightness: "SetPenBrightness",
  SetPenTransparency: "SetPenTransparency",
  ChangePenHue: "ChangePenHue",
  ChangePenSaturation: "ChangePenSaturation",
  ChangePenBrightness: "ChangePenBrightness",
  ChangePenTransparency: "ChangePenTransparency",
  // music
  PlayDrum: "PlayDrum",
  PlayNote: "PlayNote",
  SetInstrument: "SetInstrument",
  Rest: "Rest",
  SetTempo: "SetTempo",
  ChangeTempo: "ChangeTempo"
};
function _bs(opcode, args, field, menu) {
  return { opcode, args: args || [], field: field || null, menu: menu || null };
}
var _BLOCK_SPEC = {
  // motion
  [Block.Move]: _bs("motion_movesteps", ["STEPS"]),
  [Block.TurnLeft]: _bs("motion_turnleft", ["DEGREES"]),
  [Block.TurnRight]: _bs("motion_turnright", ["DEGREES"]),
  [Block.GotoRandomPosition]: _bs("motion_goto", [], null, new Menu("TO", "motion_goto_menu", "_random_", "TO")),
  [Block.GotoMousePointer]: _bs("motion_goto", [], null, new Menu("TO", "motion_goto_menu", "_mouse_", "TO")),
  [Block.Goto1]: _bs("motion_goto", ["TO"], null, new Menu("TO", "motion_goto_menu", "_random_", "TO")),
  [Block.Goto2]: _bs("motion_gotoxy", ["X", "Y"]),
  [Block.Glide3]: _bs("motion_glidesecstoxy", ["X", "Y", "SECS"]),
  [Block.Glide2]: _bs("motion_glideto", ["TO", "SECS"], null, new Menu("TO", "motion_glideto_menu", "_random_", "TO")),
  [Block.GlideToRandomPosition]: _bs("motion_glideto", ["SECS"], null, new Menu("TO", "motion_glideto_menu", "_random_", "TO")),
  [Block.GlideToMousePointer]: _bs("motion_glideto", ["SECS"], null, new Menu("TO", "motion_glideto_menu", "_mouse_", "TO")),
  [Block.PointInDirection]: _bs("motion_pointindirection", ["DIRECTION"]),
  [Block.PointTowardsMousePointer]: _bs("motion_pointtowards", [], null, new Menu("TOWARDS", "motion_pointtowards_menu", "_mouse_", "TOWARDS")),
  [Block.PointTowardsRandomDirection]: _bs("motion_pointtowards", [], null, new Menu("TOWARDS", "motion_pointtowards_menu", "_random_", "TOWARDS")),
  [Block.PointTowards]: _bs("motion_pointtowards", ["TOWARDS"], null, new Menu("TOWARDS", "motion_pointtowards_menu", "_random_", "TOWARDS")),
  [Block.ChangeX]: _bs("motion_changexby", ["DX"]),
  [Block.SetX]: _bs("motion_setx", ["X"]),
  [Block.ChangeY]: _bs("motion_changeyby", ["DY"]),
  [Block.SetY]: _bs("motion_sety", ["Y"]),
  [Block.IfOnEdgeBounce]: _bs("motion_ifonedgebounce", []),
  [Block.SetRotationStyleLeftRight]: _bs("motion_setrotationstyle", [], ["STYLE", "left-right"]),
  [Block.SetRotationStyleDoNotRotate]: _bs("motion_setrotationstyle", [], ["STYLE", "don't rotate"]),
  [Block.SetRotationStyleAllAround]: _bs("motion_setrotationstyle", [], ["STYLE", "all around"]),
  // looks
  [Block.Say2]: _bs("looks_sayforsecs", ["MESSAGE", "SECS"]),
  [Block.Say1]: _bs("looks_say", ["MESSAGE"]),
  [Block.Think2]: _bs("looks_thinkforsecs", ["MESSAGE", "SECS"]),
  [Block.Think1]: _bs("looks_think", ["MESSAGE"]),
  [Block.SwitchCostume]: _bs("looks_switchcostumeto", ["COSTUME"], null, new Menu("COSTUME", "looks_costume", "costume1", "COSTUME")),
  [Block.NextCostume]: _bs("looks_nextcostume", []),
  [Block.SwitchBackdrop]: _bs("looks_switchbackdropto", ["BACKDROP"], null, new Menu("BACKDROP", "looks_backdrops", "backdrop1", "BACKDROP")),
  [Block.PreviousBackdrop]: _bs("looks_switchbackdropto", [], null, new Menu("BACKDROP", "looks_backdrops", "previous backdrop", "BACKDROP")),
  [Block.RandomBackdrop]: _bs("looks_switchbackdropto", [], null, new Menu("BACKDROP", "looks_backdrops", "random backdrop", "BACKDROP")),
  [Block.NextBackdrop]: _bs("looks_nextbackdrop", []),
  [Block.SetSize]: _bs("looks_setsizeto", ["SIZE"]),
  [Block.ChangeSize]: _bs("looks_changesizeby", ["CHANGE"]),
  [Block.ChangeColorEffect]: _bs("looks_changeeffectby", ["CHANGE"], ["EFFECT", "COLOR"]),
  [Block.ChangeFisheyeEffect]: _bs("looks_changeeffectby", ["CHANGE"], ["EFFECT", "FISHEYE"]),
  [Block.ChangeWhirlEffect]: _bs("looks_changeeffectby", ["CHANGE"], ["EFFECT", "WHIRL"]),
  [Block.ChangePixelateEffect]: _bs("looks_changeeffectby", ["CHANGE"], ["EFFECT", "PIXELATE"]),
  [Block.ChangeMosaicEffect]: _bs("looks_changeeffectby", ["CHANGE"], ["EFFECT", "MOSAIC"]),
  [Block.ChangeBrightnessEffect]: _bs("looks_changeeffectby", ["CHANGE"], ["EFFECT", "BRIGHTNESS"]),
  [Block.ChangeGhostEffect]: _bs("looks_changeeffectby", ["CHANGE"], ["EFFECT", "GHOST"]),
  [Block.SetColorEffect]: _bs("looks_seteffectto", ["VALUE"], ["EFFECT", "COLOR"]),
  [Block.SetFisheyeEffect]: _bs("looks_seteffectto", ["VALUE"], ["EFFECT", "FISHEYE"]),
  [Block.SetWhirlEffect]: _bs("looks_seteffectto", ["VALUE"], ["EFFECT", "WHIRL"]),
  [Block.SetPixelateEffect]: _bs("looks_seteffectto", ["VALUE"], ["EFFECT", "PIXELATE"]),
  [Block.SetMosaicEffect]: _bs("looks_seteffectto", ["VALUE"], ["EFFECT", "MOSAIC"]),
  [Block.SetBrightnessEffect]: _bs("looks_seteffectto", ["VALUE"], ["EFFECT", "BRIGHTNESS"]),
  [Block.SetGhostEffect]: _bs("looks_seteffectto", ["VALUE"], ["EFFECT", "GHOST"]),
  [Block.ClearGraphicEffects]: _bs("looks_cleargraphiceffects", []),
  [Block.Show]: _bs("looks_show", []),
  [Block.Hide]: _bs("looks_hide", []),
  [Block.GotoFront]: _bs("looks_gotofrontback", [], ["FRONT_BACK", "front"]),
  [Block.GotoBack]: _bs("looks_gotofrontback", [], ["FRONT_BACK", "back"]),
  [Block.GoForward]: _bs("looks_goforwardbackwardlayers", ["NUM"], ["FORWARD_BACKWARD", "forward"]),
  [Block.GoBackward]: _bs("looks_goforwardbackwardlayers", ["NUM"], ["FORWARD_BACKWARD", "backward"]),
  // sound
  [Block.PlaySoundUntilDone]: _bs("sound_playuntildone", ["SOUND_MENU"], null, new Menu("SOUND_MENU", "sound_sounds_menu", "meow", "SOUND_MENU")),
  [Block.StartSound]: _bs("sound_play", ["SOUND_MENU"], null, new Menu("SOUND_MENU", "sound_sounds_menu", "meow", "SOUND_MENU")),
  [Block.StopAllSounds]: _bs("sound_stopallsounds", []),
  [Block.ChangePitchEffect]: _bs("sound_changeeffectby", ["VALUE"], ["EFFECT", "PITCH"]),
  [Block.ChangePanEffect]: _bs("sound_changeeffectby", ["VALUE"], ["EFFECT", "PAN"]),
  [Block.SetPitchEffect]: _bs("sound_seteffectto", ["VALUE"], ["EFFECT", "PITCH"]),
  [Block.SetPanEffect]: _bs("sound_seteffectto", ["VALUE"], ["EFFECT", "PAN"]),
  [Block.ChangeVolume]: _bs("sound_changevolumeby", ["VOLUME"]),
  [Block.SetVolume]: _bs("sound_setvolumeto", ["VOLUME"]),
  [Block.ClearSoundEffects]: _bs("sound_cleareffects", []),
  // event / control
  [Block.Broadcast]: _bs("event_broadcast", ["BROADCAST_INPUT"]),
  [Block.BroadcastAndWait]: _bs("event_broadcastandwait", ["BROADCAST_INPUT"]),
  [Block.Wait]: _bs("control_wait", ["DURATION"]),
  [Block.StopAll]: _bs("control_stop", [], ["STOP_OPTION", "all"]),
  [Block.StopThisScript]: _bs("control_stop", [], ["STOP_OPTION", "this script"]),
  [Block.StopOtherScripts]: _bs("control_stop", [], ["STOP_OPTION", "other scripts in sprite"]),
  [Block.DeleteThisClone]: _bs("control_delete_this_clone", []),
  [Block.Clone0]: _bs("control_create_clone_of", [], null, new Menu("CLONE_OPTION", "control_create_clone_of_menu", "_myself_", "CLONE_OPTION")),
  [Block.Clone1]: _bs("control_create_clone_of", ["CLONE_OPTION"], null, new Menu("CLONE_OPTION", "control_create_clone_of_menu", "_myself_", "CLONE_OPTION")),
  // sensing
  [Block.Ask]: _bs("sensing_askandwait", ["QUESTION"]),
  [Block.SetDragModeDraggable]: _bs("sensing_setdragmode", [], ["DRAG_MODE", "draggable"]),
  [Block.SetDragModeNotDraggable]: _bs("sensing_setdragmode", [], ["DRAG_MODE", "not draggable"]),
  [Block.ResetTimer]: _bs("sensing_resettimer", []),
  // pen
  [Block.EraseAll]: _bs("pen_clear", []),
  [Block.Stamp]: _bs("pen_stamp", []),
  [Block.PenDown]: _bs("pen_penDown", []),
  [Block.PenUp]: _bs("pen_penUp", []),
  [Block.SetPenColor]: _bs("pen_setPenColorToColor", ["COLOR"]),
  [Block.ChangePenSize]: _bs("pen_changePenSizeBy", ["SIZE"]),
  [Block.SetPenSize]: _bs("pen_setPenSizeTo", ["SIZE"]),
  [Block.SetPenHue]: _bs("pen_setPenColorParamTo", ["VALUE"], null, new Menu("COLOR_PARAM", "pen_menu_colorParam", "color", "colorParam")),
  [Block.SetPenSaturation]: _bs("pen_setPenColorParamTo", ["VALUE"], null, new Menu("COLOR_PARAM", "pen_menu_colorParam", "saturation", "colorParam")),
  [Block.SetPenBrightness]: _bs("pen_setPenColorParamTo", ["VALUE"], null, new Menu("COLOR_PARAM", "pen_menu_colorParam", "brightness", "colorParam")),
  [Block.SetPenTransparency]: _bs("pen_setPenColorParamTo", ["VALUE"], null, new Menu("COLOR_PARAM", "pen_menu_colorParam", "transparency", "colorParam")),
  [Block.ChangePenHue]: _bs("pen_changePenColorParamBy", ["VALUE"], null, new Menu("COLOR_PARAM", "pen_menu_colorParam", "color", "colorParam")),
  [Block.ChangePenSaturation]: _bs("pen_changePenColorParamBy", ["VALUE"], null, new Menu("COLOR_PARAM", "pen_menu_colorParam", "saturation", "colorParam")),
  [Block.ChangePenBrightness]: _bs("pen_changePenColorParamBy", ["VALUE"], null, new Menu("COLOR_PARAM", "pen_menu_colorParam", "brightness", "colorParam")),
  [Block.ChangePenTransparency]: _bs("pen_changePenColorParamBy", ["VALUE"], null, new Menu("COLOR_PARAM", "pen_menu_colorParam", "transparency", "colorParam")),
  // music
  [Block.PlayDrum]: _bs("music_playDrumForBeats", ["DRUM", "BEATS"], null, new Menu("DRUM", "music_menu_DRUM", "1", "DRUM")),
  [Block.PlayNote]: _bs("music_playNoteForBeats", ["NOTE", "BEATS"]),
  [Block.SetInstrument]: _bs("music_setInstrument", ["INSTRUMENT"], null, new Menu("INSTRUMENT", "music_menu_INSTRUMENT", "1", "INSTRUMENT")),
  [Block.Rest]: _bs("music_restForBeats", ["BEATS"]),
  [Block.SetTempo]: _bs("music_setTempo", ["TEMPO"]),
  [Block.ChangeTempo]: _bs("music_changeTempo", ["TEMPO"])
};
var _BLOCK_FROM_SHAPE = {
  "move": Block.Move,
  "turn_left": Block.TurnLeft,
  "turn_right": Block.TurnRight,
  "goto_random_position": Block.GotoRandomPosition,
  "goto_mouse_pointer": Block.GotoMousePointer,
  "glide_to_random_position": Block.GlideToRandomPosition,
  "glide_to_mouse_pointer": Block.GlideToMousePointer,
  "point_in_direction": Block.PointInDirection,
  "point_towards_mouse_pointer": Block.PointTowardsMousePointer,
  "point_towards_random_direction": Block.PointTowardsRandomDirection,
  "point_towards": Block.PointTowards,
  "change_x": Block.ChangeX,
  "set_x": Block.SetX,
  "change_y": Block.ChangeY,
  "set_y": Block.SetY,
  "if_on_edge_bounce": Block.IfOnEdgeBounce,
  "set_rotation_style_left_right": Block.SetRotationStyleLeftRight,
  "set_rotation_style_do_not_rotate": Block.SetRotationStyleDoNotRotate,
  "set_rotation_style_all_around": Block.SetRotationStyleAllAround,
  "switch_costume": Block.SwitchCostume,
  "next_costume": Block.NextCostume,
  "switch_backdrop": Block.SwitchBackdrop,
  "previous_backdrop": Block.PreviousBackdrop,
  "random_backdrop": Block.RandomBackdrop,
  "next_backdrop": Block.NextBackdrop,
  "set_size": Block.SetSize,
  "change_size": Block.ChangeSize,
  "change_color_effect": Block.ChangeColorEffect,
  "change_fisheye_effect": Block.ChangeFisheyeEffect,
  "change_whirl_effect": Block.ChangeWhirlEffect,
  "change_pixelate_effect": Block.ChangePixelateEffect,
  "change_mosaic_effect": Block.ChangeMosaicEffect,
  "change_brightness_effect": Block.ChangeBrightnessEffect,
  "change_ghost_effect": Block.ChangeGhostEffect,
  "set_color_effect": Block.SetColorEffect,
  "set_fisheye_effect": Block.SetFisheyeEffect,
  "set_whirl_effect": Block.SetWhirlEffect,
  "set_pixelate_effect": Block.SetPixelateEffect,
  "set_mosaic_effect": Block.SetMosaicEffect,
  "set_brightness_effect": Block.SetBrightnessEffect,
  "set_ghost_effect": Block.SetGhostEffect,
  "clear_graphic_effects": Block.ClearGraphicEffects,
  "show": Block.Show,
  "hide": Block.Hide,
  "goto_front": Block.GotoFront,
  "goto_back": Block.GotoBack,
  "go_forward": Block.GoForward,
  "go_backward": Block.GoBackward,
  "play_sound_until_done": Block.PlaySoundUntilDone,
  "start_sound": Block.StartSound,
  "stop_all_sounds": Block.StopAllSounds,
  "change_pitch_effect": Block.ChangePitchEffect,
  "change_pan_effect": Block.ChangePanEffect,
  "set_pitch_effect": Block.SetPitchEffect,
  "set_pan_effect": Block.SetPanEffect,
  "change_volume": Block.ChangeVolume,
  "set_volume": Block.SetVolume,
  "clear_sound_effects": Block.ClearSoundEffects,
  "broadcast": Block.Broadcast,
  "broadcast_and_wait": Block.BroadcastAndWait,
  "wait": Block.Wait,
  "stop_all": Block.StopAll,
  "stop_this_script": Block.StopThisScript,
  "stop_other_scripts": Block.StopOtherScripts,
  "delete_this_clone": Block.DeleteThisClone,
  "ask": Block.Ask,
  "set_drag_mode_draggable": Block.SetDragModeDraggable,
  "set_drag_mode_not_draggable": Block.SetDragModeNotDraggable,
  "reset_timer": Block.ResetTimer,
  "erase_all": Block.EraseAll,
  "stamp": Block.Stamp,
  "pen_down": Block.PenDown,
  "pen_up": Block.PenUp,
  "set_pen_color": Block.SetPenColor,
  "change_pen_size": Block.ChangePenSize,
  "set_pen_size": Block.SetPenSize,
  "set_pen_hue": Block.SetPenHue,
  "set_pen_saturation": Block.SetPenSaturation,
  "set_pen_brightness": Block.SetPenBrightness,
  "set_pen_transparency": Block.SetPenTransparency,
  "change_pen_hue": Block.ChangePenHue,
  "change_pen_saturation": Block.ChangePenSaturation,
  "change_pen_brightness": Block.ChangePenBrightness,
  "change_pen_transparency": Block.ChangePenTransparency,
  "play_drum": Block.PlayDrum,
  "play_note": Block.PlayNote,
  "set_instrument": Block.SetInstrument,
  "rest": Block.Rest,
  "set_tempo": Block.SetTempo,
  "change_tempo": Block.ChangeTempo
};
var _BLOCK_OVERLOADS = {
  "goto": [Block.Goto1, Block.Goto2],
  "glide": [Block.Glide3, Block.Glide2],
  "say": [Block.Say2, Block.Say1],
  "think": [Block.Think2, Block.Think1],
  "clone": [Block.Clone0, Block.Clone1]
};
function blockOpcode(self2) {
  return _BLOCK_SPEC[self2].opcode;
}
function blockArgs(self2) {
  return [..._BLOCK_SPEC[self2].args];
}
function blockFields(self2) {
  const field = _BLOCK_SPEC[self2].field;
  if (!field) return null;
  return { [field[0]]: [field[1], null] };
}
function blockMenu(self2) {
  return _BLOCK_SPEC[self2].menu;
}
function blockMutation(self2) {
  if (self2 === Block.StopOtherScripts) {
    return { tagName: "mutation", children: [], hasnext: "true" };
  }
  return null;
}
function blockFromShape(name, argCount = 0) {
  if (name === "goto") {
    if (argCount === 1) return Block.Goto1;
    if (argCount === 2) return Block.Goto2;
    return Block.Goto1;
  }
  if (name === "glide") {
    if (argCount === 3) return Block.Glide3;
    if (argCount === 2) return Block.Glide2;
    return Block.Glide3;
  }
  if (name === "say") {
    if (argCount === 2) return Block.Say2;
    if (argCount === 1) return Block.Say1;
    return Block.Say2;
  }
  if (name === "think") {
    if (argCount === 2) return Block.Think2;
    if (argCount === 1) return Block.Think1;
    return Block.Think2;
  }
  if (name === "clone") {
    if (argCount === 0) return Block.Clone0;
    if (argCount === 1) return Block.Clone1;
    return Block.Clone0;
  }
  return _BLOCK_FROM_SHAPE[name] || null;
}
var Repr = {
  XPosition: "XPosition",
  YPosition: "YPosition",
  Direction: "Direction",
  Size: "Size",
  CostumeNumber: "CostumeNumber",
  CostumeName: "CostumeName",
  BackdropNumber: "BackdropNumber",
  BackdropName: "BackdropName",
  Volume: "Volume",
  DistanceToMousePointer: "DistanceToMousePointer",
  DistanceTo: "DistanceTo",
  TouchingMousePointer: "TouchingMousePointer",
  TouchingEdge: "TouchingEdge",
  Touching: "Touching",
  KeyPressed: "KeyPressed",
  MouseDown: "MouseDown",
  MouseX: "MouseX",
  MouseY: "MouseY",
  Loudness: "Loudness",
  Timer: "Timer",
  CurrentYear: "CurrentYear",
  CurrentMonth: "CurrentMonth",
  CurrentDate: "CurrentDate",
  CurrentDayOfWeek: "CurrentDayOfWeek",
  CurrentHour: "CurrentHour",
  CurrentMinute: "CurrentMinute",
  CurrentSecond: "CurrentSecond",
  DaysSince2000: "DaysSince2000",
  Username: "Username",
  Online: "Online",
  TouchingColor: "TouchingColor",
  ColorIsTouchingColor: "ColorIsTouchingColor",
  Answer: "Answer",
  Random: "Random",
  Contains: "Contains",
  SensingOf: "SensingOf",
  ItemNumOfList: "ItemNumOfList",
  LetterOf: "LetterOf"
};
function _rs(opcode, args, field, menu) {
  return { opcode, args: args || [], field: field || null, menu: menu || null };
}
var _REPR_SPEC = {
  [Repr.XPosition]: _rs("motion_xposition", []),
  [Repr.YPosition]: _rs("motion_yposition", []),
  [Repr.Direction]: _rs("motion_direction", []),
  [Repr.Size]: _rs("looks_size", []),
  [Repr.CostumeNumber]: _rs("looks_costumenumbername", [], ["NUMBER_NAME", "number"]),
  [Repr.CostumeName]: _rs("looks_costumenumbername", [], ["NUMBER_NAME", "name"]),
  [Repr.BackdropNumber]: _rs("looks_backdropnumbername", [], ["NUMBER_NAME", "number"]),
  [Repr.BackdropName]: _rs("looks_backdropnumbername", [], ["NUMBER_NAME", "name"]),
  [Repr.Volume]: _rs("sound_volume", []),
  [Repr.DistanceToMousePointer]: _rs("sensing_distanceto", [], null, new Menu("DISTANCETOMENU", "sensing_distancetomenu", "_mouse_", "DISTANCETOMENU")),
  [Repr.DistanceTo]: _rs("sensing_distanceto", ["DISTANCETOMENU"], null, new Menu("DISTANCETOMENU", "sensing_distancetomenu", "_mouse_", "DISTANCETOMENU")),
  [Repr.TouchingMousePointer]: _rs("sensing_touchingobject", [], null, new Menu("TOUCHINGOBJECTMENU", "sensing_touchingobjectmenu", "_mouse_", "TOUCHINGOBJECTMENU")),
  [Repr.TouchingEdge]: _rs("sensing_touchingobject", [], null, new Menu("TOUCHINGOBJECTMENU", "sensing_touchingobjectmenu", "_edge_", "TOUCHINGOBJECTMENU")),
  [Repr.Touching]: _rs("sensing_touchingobject", ["TOUCHINGOBJECTMENU"], null, new Menu("TOUCHINGOBJECTMENU", "sensing_touchingobjectmenu", "_mouse_", "TOUCHINGOBJECTMENU")),
  [Repr.KeyPressed]: _rs("sensing_keypressed", ["KEY_OPTION"], null, new Menu("KEY_OPTION", "sensing_keyoptions", "any", "KEY_OPTION")),
  [Repr.MouseDown]: _rs("sensing_mousedown", []),
  [Repr.MouseX]: _rs("sensing_mousex", []),
  [Repr.MouseY]: _rs("sensing_mousey", []),
  [Repr.Loudness]: _rs("sensing_loudness", []),
  [Repr.Timer]: _rs("sensing_timer", []),
  [Repr.CurrentYear]: _rs("sensing_current", [], ["CURRENTMENU", "YEAR"]),
  [Repr.CurrentMonth]: _rs("sensing_current", [], ["CURRENTMENU", "MONTH"]),
  [Repr.CurrentDate]: _rs("sensing_current", [], ["CURRENTMENU", "DATE"]),
  [Repr.CurrentDayOfWeek]: _rs("sensing_current", [], ["CURRENTMENU", "DAYOFWEEK"]),
  [Repr.CurrentHour]: _rs("sensing_current", [], ["CURRENTMENU", "HOUR"]),
  [Repr.CurrentMinute]: _rs("sensing_current", [], ["CURRENTMENU", "MINUTE"]),
  [Repr.CurrentSecond]: _rs("sensing_current", [], ["CURRENTMENU", "SECOND"]),
  [Repr.DaysSince2000]: _rs("sensing_dayssince2000", []),
  [Repr.Username]: _rs("sensing_username", []),
  [Repr.Online]: _rs("sensing_online", []),
  [Repr.TouchingColor]: _rs("sensing_touchingcolor", ["COLOR"]),
  [Repr.ColorIsTouchingColor]: _rs("sensing_coloristouchingcolor", ["COLOR", "COLOR2"]),
  [Repr.Answer]: _rs("sensing_answer", []),
  [Repr.Random]: _rs("operator_random", ["FROM", "TO"]),
  [Repr.Contains]: _rs("operator_contains", ["STRING1", "STRING2"]),
  // Upstream expr.rs Expr::Property (sb3 sensing_of): PROPERTY is a plain
  // FIELD (single_field, default "x"), only OBJECT is an input + dropdown.
  [Repr.SensingOf]: _rs("sensing_of", ["OBJECT"], ["PROPERTY", "x"], new Menu("OBJECT", "sensing_of_object_menu", "_stage_", "OBJECT")),
  [Repr.ItemNumOfList]: _rs("data_itemnumoflist", ["ITEM"], null, new Menu("LIST", "data_itemoflist_menu", "", "LIST")),
  [Repr.LetterOf]: _rs("operator_letter_of", ["LETTER", "STRING"])
};
var _REPR_FROM_SHAPE = {
  "x_position": Repr.XPosition,
  "y_position": Repr.YPosition,
  "direction": Repr.Direction,
  "size": Repr.Size,
  "costume_number": Repr.CostumeNumber,
  "costume_name": Repr.CostumeName,
  "backdrop_number": Repr.BackdropNumber,
  "backdrop_name": Repr.BackdropName,
  "volume": Repr.Volume,
  "distance_to_mouse_pointer": Repr.DistanceToMousePointer,
  "distance_to": Repr.DistanceTo,
  "touching_mouse_pointer": Repr.TouchingMousePointer,
  "touching_edge": Repr.TouchingEdge,
  "touching": Repr.Touching,
  "key_pressed": Repr.KeyPressed,
  "mouse_down": Repr.MouseDown,
  "mouse_x": Repr.MouseX,
  "mouse_y": Repr.MouseY,
  "loudness": Repr.Loudness,
  "timer": Repr.Timer,
  "current_year": Repr.CurrentYear,
  "current_month": Repr.CurrentMonth,
  "current_date": Repr.CurrentDate,
  "current_day_of_week": Repr.CurrentDayOfWeek,
  "current_hour": Repr.CurrentHour,
  "current_minute": Repr.CurrentMinute,
  "current_second": Repr.CurrentSecond,
  "days_since_2000": Repr.DaysSince2000,
  "username": Repr.Username,
  "online": Repr.Online,
  "touching_color": Repr.TouchingColor,
  "color_is_touching_color": Repr.ColorIsTouchingColor,
  "answer": Repr.Answer,
  "random": Repr.Random,
  "contains": Repr.Contains,
  "sensing_of": Repr.SensingOf,
  "item_num": Repr.ItemNumOfList,
  "letter_of": Repr.LetterOf
};
function reprOpcode(self2) {
  return _REPR_SPEC[self2].opcode;
}
function reprArgs(self2) {
  return [..._REPR_SPEC[self2].args];
}
function reprFields(self2) {
  const field = _REPR_SPEC[self2].field;
  if (!field) return null;
  return { [field[0]]: [field[1], null] };
}
function reprMenu(self2) {
  return _REPR_SPEC[self2].menu;
}
function reprFromShape(name) {
  return _REPR_FROM_SHAPE[name] || null;
}

// ../backend-js/src/parser.js
var EVENT_TOKENS = new Set(
  Object.values(TokenType).filter((t) => typeof t === "string" && t.startsWith("On"))
);
var _UNOP_KEYWORDS = {
  [TokenType.Not]: UnOp.Not,
  [TokenType.Length]: UnOp.Length,
  [TokenType.Round]: UnOp.Round,
  [TokenType.Abs]: UnOp.Abs,
  [TokenType.Floor]: UnOp.Floor,
  [TokenType.Ceil]: UnOp.Ceil,
  [TokenType.Sqrt]: UnOp.Sqrt,
  [TokenType.Sin]: UnOp.Sin,
  [TokenType.Cos]: UnOp.Cos,
  [TokenType.Tan]: UnOp.Tan,
  [TokenType.Asin]: UnOp.Asin,
  [TokenType.Acos]: UnOp.Acos,
  [TokenType.Atan]: UnOp.Atan,
  [TokenType.Ln]: UnOp.Ln,
  [TokenType.Log]: UnOp.Log,
  [TokenType.Antiln]: UnOp.AntiLn,
  [TokenType.Antilog]: UnOp.AntiLog
};
var _FIXED_LENGTH_LIST_MAX = 2e5;
var _COMPOUND_ASSIGN_OPS = [
  TokenType.Increment,
  TokenType.Decrement,
  TokenType.AssignAdd,
  TokenType.AssignSubtract,
  TokenType.AssignMultiply,
  TokenType.AssignDivide,
  TokenType.AssignFloorDiv,
  TokenType.AssignModulo,
  TokenType.AssignJoin
];
function _constExprToValue(ce) {
  if (ce instanceof ConstExprValue) return ce.value;
  return ce;
}
function _expandFixedLengthList(defaultExpr, lengthExpr, lengthSpan, diagnostics) {
  const lenVal = lengthExpr instanceof ConstExprValue ? lengthExpr.value : null;
  const len = lenVal ? lenVal.toNumber() : NaN;
  if (!isFinite(len) || len < 0 || len > _FIXED_LENGTH_LIST_MAX) {
    diagnostics.push(new Diagnostic("FixedLengthListInvalid", lengthSpan));
    return [];
  }
  return new Array(Math.floor(len)).fill(_constExprToValue(defaultExpr));
}
var ParseError = class extends Error {
  constructor(message, pos = 0) {
    super(message);
    this.message = message;
    this.pos = pos;
  }
};
var _Parser = class _Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    this.sprite = new Sprite();
    this.sprite.name = "Sprite1";
    this.diagnostics = [];
    this._parenDepth = 0;
    this.extraTargets = [];
  }
  _switchTarget(name, isStage) {
    let entry = this.extraTargets.find((t) => t.name === name);
    if (!entry) {
      const sp = new Sprite();
      sp.name = isStage ? "Stage" : name;
      entry = { name, isStage, sprite: sp };
      this.extraTargets.push(entry);
    }
    this.sprite = entry.sprite;
  }
  // ------------------------------------------------------------------
  // Token stream helpers
  // ------------------------------------------------------------------
  peek(offset = 0) {
    const idx = this.pos + offset;
    if (idx >= this.tokens.length) {
      return new Token(TokenType.Semicolon, null, -1, -1);
    }
    return this.tokens[idx];
  }
  advance() {
    const tok = this.peek();
    this.pos += 1;
    return tok;
  }
  isAtEnd() {
    return this.pos >= this.tokens.length;
  }
  check(ttype) {
    return this.peek().type === ttype;
  }
  match(...types) {
    if (types.includes(this.peek().type)) {
      this.pos += 1;
      return true;
    }
    return false;
  }
  expect(ttype, msg = "") {
    this.skipNewlines();
    if (this.peek().type === ttype) {
      return this.advance();
    }
    const tok = this.peek();
    throw new ParseError(
      msg || `Expected ${ttype}, got ${tok.type}`,
      tok.start
    );
  }
  skipNewlines() {
    while (this.check(TokenType.Newline) || this.check(TokenType.Backslash)) {
      this.pos += 1;
    }
  }
  skipSemicolons() {
    while (this.check(TokenType.Semicolon)) {
      this.pos += 1;
    }
  }
  skipNoise() {
    while (!this.isAtEnd() && (this.peek().type === TokenType.Newline || this.peek().type === TokenType.Backslash || this.peek().type === TokenType.Semicolon)) {
      this.pos += 1;
    }
  }
  skipToNextStatement() {
    while (!this.isAtEnd() && this.peek().type !== TokenType.Semicolon && this.peek().type !== TokenType.Newline) {
      this.pos += 1;
    }
  }
  // Documented-superset helper: within the statement span ending at the next
  // depth-0 `;` / newline, rewrite the LAST depth-0 `in` that directly
  // precedes a Name into Name('of'). AI phrasings like `insert v at 1 in L;`
  // / `replace item 2 in L with x;` need it — parseExpr would otherwise
  // swallow `N in L` as the membership operator. Parens are respected so a
  // genuine membership test inside an index expression survives untouched.
  _rewriteListTargetIn() {
    let depth = 0;
    let target = -1;
    for (let k = this.pos; k < this.tokens.length; k++) {
      const t = this.tokens[k];
      if (t.type === TokenType.LParen) {
        depth += 1;
        continue;
      }
      if (t.type === TokenType.RParen) {
        depth -= 1;
        continue;
      }
      if (depth !== 0) continue;
      if (t.type === TokenType.Semicolon || t.type === TokenType.Newline) break;
      if (t.type === TokenType.In && this.tokens[k + 1] && this.tokens[k + 1].type === TokenType.Name) {
        target = k;
      }
    }
    if (target >= 0) {
      this.tokens[target].type = TokenType.Name;
      this.tokens[target].value = "of";
    }
  }
  // Documented-superset helper: rewrite Scratch's "item N of list" REPORTER
  // into canonical indexing `list[N]` throughout the upcoming statement
  // (D14 S2: `new_dir = item 1 of dir_queue;`). Matches only the strict
  // shape `item <atomic> of|from|in Name`; a variable literally named
  // `item` used any other way is untouched.
  _rewriteItemOfReporter() {
    const head = this.tokens[this.pos];
    if (head && head.type === TokenType.Name && head.value === "replace") return;
    const sepVals = ["of", "from", "in", "item", "with", "into"];
    const isAtomic = (t) => [TokenType.Int, TokenType.Float, TokenType.Str, TokenType.Name].includes(t.type) && !(t.type === TokenType.Name && sepVals.includes(t.value));
    let k = this.pos;
    while (k + 3 < this.tokens.length) {
      const t = this.tokens[k];
      if (t.type === TokenType.Semicolon || t.type === TokenType.Newline) break;
      if (t.type === TokenType.Name && t.value === "item" && isAtomic(this.tokens[k + 1])) {
        const s2 = this.tokens[k + 2];
        const sepOk = s2.type === TokenType.In || s2.type === TokenType.Name && (s2.value === "of" || s2.value === "from");
        if (sepOk && this.tokens[k + 3] && this.tokens[k + 3].type === TokenType.Name) {
          const listTok = this.tokens[k + 3];
          const idxTok = this.tokens[k + 1];
          const repl = [
            new Token(TokenType.Name, listTok.value, listTok.start, listTok.end),
            new Token(TokenType.LBracket, null, t.start, t.start),
            idxTok,
            new Token(TokenType.RBracket, null, s2.start, s2.start)
          ];
          this.tokens.splice(k, 4, ...repl);
          k += 4;
          continue;
        }
      }
      k += 1;
    }
  }
  // Parse one C-style for-header segment (`i = 0`, `i++`, `j += 2`, …) by
  // running the regular statement parser over an isolated token slice.
  // Returns null for an empty segment.
  _parseForSegmentStmt(stopAtRParen = false) {
    let depth = 0;
    const seg = [];
    while (!this.isAtEnd()) {
      const t = this.peek();
      if (t.type === TokenType.LParen) depth += 1;
      else if (t.type === TokenType.RParen) {
        if (depth === 0) {
          if (stopAtRParen) break;
          throw new ParseError("Unexpected ')' in for header", t.start);
        }
        depth -= 1;
      } else if (depth === 0 && t.type === TokenType.Semicolon) break;
      seg.push(this.advance());
    }
    if (seg.length === 0) return null;
    seg.push(new Token(TokenType.Newline, null, -1, -1));
    const savedTokens = this.tokens;
    const savedPos = this.pos;
    try {
      this.tokens = seg;
      this.pos = 0;
      this.skipNoise();
      return this.parseStmt();
    } finally {
      this.tokens = savedTokens;
      this.pos = savedPos;
    }
  }
  // True when the upcoming parenthesised for-header has the C-style shape
  // `( init ; cond ; incr )` — exactly two depth-0 semicolons and a brace
  // body following. Distinguishes from canonical for-in / for-range forms.
  _looksLikeCStyleFor() {
    let start = this.pos;
    const t0 = this.tokens[start];
    if (t0 && t0.type === TokenType.Name && t0.value === "for") start += 1;
    if (!this.tokens[start] || this.tokens[start].type !== TokenType.LParen) return false;
    let depth = 0;
    let semis = 0;
    for (let k = start; k < this.tokens.length; k++) {
      const t = this.tokens[k];
      if (t.type === TokenType.LParen) {
        depth += 1;
      } else if (t.type === TokenType.RParen) {
        depth -= 1;
        if (depth === 0) {
          let j = k + 1;
          while (j < this.tokens.length && (this.tokens[j].type === TokenType.Newline || this.tokens[j].type === TokenType.Backslash)) j += 1;
          return semis === 2 && j < this.tokens.length && this.tokens[j].type === TokenType.LBrace;
        }
      } else if (depth === 1 && t.type === TokenType.Semicolon) semis += 1;
    }
    return false;
  }
  // ------------------------------------------------------------------
  // Entry point
  // ------------------------------------------------------------------
  parse() {
    this.skipNoise();
    while (!this.isAtEnd()) {
      try {
        this.declaration();
      } catch (e) {
        if (e instanceof ParseError) {
          if (e.inBody) throw e;
          const at = Math.max(0, e.pos ?? 0);
          const d = new Diagnostic("ParseError", [at, at + 1]);
          d.message = e.message;
          this.diagnostics.push(d);
          while (!this.isAtEnd() && this.peek().type !== TokenType.Semicolon && this.peek().type !== TokenType.Newline) {
            this.pos += 1;
          }
          this.skipNoise();
          continue;
        }
        throw e;
      }
      this.skipNoise();
    }
    this._flushTopLevelInits(this.sprite);
    for (const ext of this._extraTargets || []) {
      this._flushTopLevelInits(ext.sprite);
    }
    return this.sprite;
  }
  _flushTopLevelInits(sprite) {
    const pend = sprite._pendingTopLevelInits;
    if (!pend || pend.length === 0) return;
    delete sprite._pendingTopLevelInits;
    let flagEvent = sprite.events.find((ev) => ev.kind && ev.kind.kind === "OnFlag");
    if (!flagEvent) {
      flagEvent = new Event(new EventKind({ kind: "OnFlag" }), [0, 0], []);
      sprite.events.push(flagEvent);
    }
    flagEvent.body.unshift(...pend);
  }
  // ------------------------------------------------------------------
  // Top-level declarations
  // ------------------------------------------------------------------
  declaration() {
    const tok = this.peek();
    if (tok.type === TokenType.Semicolon) {
      this.advance();
      return;
    }
    if (tok.type === TokenType.Costumes) {
      this.advance();
      const assets = this.parseCommaSeparated(() => this.parseAsset());
      this.skipNoise();
      for (const a of assets) {
        this.sprite.costumes.push(a);
      }
      return;
    }
    if (tok.type === TokenType.Sounds) {
      this.advance();
      const assets = this.parseCommaSeparated(() => this.parseAsset());
      this.skipNoise();
      for (const a of assets) {
        this.sprite.sounds.push(a);
      }
      return;
    }
    if (tok.type === TokenType.Hide) {
      this.advance();
      this.skipNoise();
      this.sprite.hidden = true;
      return;
    }
    if (tok.type === TokenType.set_x) {
      this.advance();
      const [val] = this.parseValue();
      this.sprite.x_position = val;
      return;
    }
    if (tok.type === TokenType.set_y) {
      this.advance();
      const [val] = this.parseValue();
      this.sprite.y_position = val;
      return;
    }
    if (tok.type === TokenType.set_size) {
      this.advance();
      const [val] = this.parseValue();
      this.sprite.size = val;
      return;
    }
    if (tok.type === TokenType.set_volume) {
      this.advance();
      const [val] = this.parseValue();
      this.sprite.volume = val;
      return;
    }
    if (tok.type === TokenType.point_in_direction) {
      this.advance();
      const [val] = this.parseValue();
      this.sprite.direction = val;
      return;
    }
    if (tok.type === TokenType.set_rotation_style_left_right) {
      this.advance();
      this.skipNoise();
      this.sprite.rotation_style = new RotationStyle("left-right");
      return;
    }
    if (tok.type === TokenType.set_rotation_style_all_around) {
      this.advance();
      this.skipNoise();
      this.sprite.rotation_style = new RotationStyle("all around");
      return;
    }
    if (tok.type === TokenType.set_rotation_style_do_not_rotate) {
      this.advance();
      this.skipNoise();
      this.sprite.rotation_style = new RotationStyle("don't rotate");
      return;
    }
    if (tok.type === TokenType.NoWarp || tok.type === TokenType.Proc || tok.type === TokenType.Define && this.peek(1).type === TokenType.Name && (this.peek(2).type === TokenType.LBrace || this.peek(2).type === TokenType.LParen)) {
      let warp = true;
      if (tok.type === TokenType.NoWarp) {
        this.advance();
        warp = false;
        if (this.check(TokenType.Define)) this.advance();
        else this.expect(TokenType.Proc, "Expected 'proc'");
      } else {
        this.advance();
      }
      const nameTok = this.expect(TokenType.Name, "Expected proc name");
      let args = [];
      if (this.match(TokenType.LParen)) {
        if (this.peek().type !== TokenType.RParen) {
          args = this.parseCommaSeparated(() => this.parseArg());
        }
        this.expect(TokenType.RParen, "Expected ')' after proc args");
      } else if (this.peek().type !== TokenType.LBrace) {
        args = this.parseCommaSeparated(() => this.parseArg());
      }
      const body = this.parseStmts();
      const proc = new Proc(nameTok.value, [nameTok.start, nameTok.end], warp);
      this.sprite.addProc(proc, args, body, this.diagnostics);
      return;
    }
    if (tok.type === TokenType.Func) {
      this.advance();
      const nameTok = this.expect(TokenType.Name, "Expected func name");
      this.expect(TokenType.LParen, "Expected '(' after func name");
      const args = this.peek().type !== TokenType.RParen ? this.parseCommaSeparated(() => this.parseArg()) : [];
      this.expect(TokenType.RParen, "Expected ')' after func args");
      const type_ = this.parseType();
      const body = this.parseStmts();
      const func = new Func(nameTok.value, [nameTok.start, nameTok.end], type_);
      this.sprite.addFunc(func, args, body, this.diagnostics);
      return;
    }
    if (tok.type === TokenType.On) {
      this.advance();
      const eventTok = this.expect(TokenType.Str, "Expected broadcast name string");
      const body = this.parseStmts();
      const kind = new EventKind({ kind: "On", event: eventTok.value });
      this.sprite.events.push(new Event(kind, [tok.start, eventTok.end], body));
      return;
    }
    if (tok.type === TokenType.OnFlag) {
      this.advance();
      const body = this.parseStmts();
      const kind = new EventKind({ kind: "OnFlag" });
      this.sprite.events.push(new Event(kind, [tok.start, tok.end], body));
      return;
    }
    if (tok.type === TokenType.OnKey) {
      this.advance();
      const keyTok = this.expect(TokenType.Str, "Expected key name string");
      const body = this.parseStmts();
      const kind = new EventKind({
        kind: "OnKey",
        key: keyTok.value,
        keySpan: [keyTok.start, keyTok.end]
      });
      this.sprite.events.push(new Event(kind, [tok.start, keyTok.end], body));
      return;
    }
    if (tok.type === TokenType.OnClick) {
      this.advance();
      const body = this.parseStmts();
      const kind = new EventKind({ kind: "OnClick" });
      this.sprite.events.push(new Event(kind, [tok.start, tok.end], body));
      return;
    }
    if (tok.type === TokenType.OnBackdrop) {
      this.advance();
      const bdTok = this.expect(TokenType.Str, "Expected backdrop name string");
      const body = this.parseStmts();
      const kind = new EventKind({
        kind: "OnBackdrop",
        backdrop: bdTok.value,
        backdropSpan: [bdTok.start, bdTok.end]
      });
      this.sprite.events.push(new Event(kind, [tok.start, bdTok.end], body));
      return;
    }
    if (tok.type === TokenType.OnLoudness) {
      this.advance();
      this.expect(TokenType.Gt, "Expected '>' after onloudness");
      const value = this.parseIfExpr();
      const body = this.parseStmts();
      const kind = new EventKind({ kind: "OnLoudnessGt", value });
      this.sprite.events.push(new Event(kind, [tok.start, tok.end], body));
      return;
    }
    if (tok.type === TokenType.OnTimer) {
      this.advance();
      this.expect(TokenType.Gt, "Expected '>' after ontimer");
      const value = this.parseIfExpr();
      const body = this.parseStmts();
      const kind = new EventKind({ kind: "OnTimerGt", value });
      this.sprite.events.push(new Event(kind, [tok.start, tok.end], body));
      return;
    }
    if (tok.type === TokenType.OnClone) {
      this.advance();
      const body = this.parseStmts();
      const kind = new EventKind({ kind: "OnClone" });
      this.sprite.events.push(new Event(kind, [tok.start, tok.end], body));
      return;
    }
    if (tok.type === TokenType.Struct) {
      this.advance();
      const nameTok = this.expect(TokenType.Name, "Expected struct name");
      this.expect(TokenType.LBrace, "Expected '{' after struct name");
      this.skipNoise();
      const fields = [];
      if (this.peek().type !== TokenType.RBrace) {
        while (true) {
          const fname = this.expect(TokenType.Name, "Expected field name");
          let default_ = null;
          if (this.match(TokenType.Assign)) {
            default_ = this.parseConstExpr();
          }
          fields.push(new StructField(fname.value, [fname.start, fname.end], default_));
          this.skipNoise();
          if (!this.match(TokenType.Comma)) break;
          this.skipNoise();
        }
      }
      this.expect(TokenType.RBrace, "Expected '}' after struct fields");
      const struct = new Struct(nameTok.value, [nameTok.start, nameTok.end], fields);
      this.sprite.addStruct(struct, this.diagnostics);
      return;
    }
    if (tok.type === TokenType.Enum) {
      this.advance();
      const nameTok = this.expect(TokenType.Name, "Expected enum name");
      this.expect(TokenType.LBrace, "Expected '{' after enum name");
      this.skipNoise();
      const variants = [];
      if (this.peek().type !== TokenType.RBrace) {
        while (true) {
          const vname = this.expect(TokenType.Name, "Expected variant name");
          let value = null;
          if (this.match(TokenType.Assign)) {
            const v = this.parseValue();
            value = [v[0], v[1]];
          }
          variants.push(new EnumVariant(vname.value, [vname.start, vname.end], value));
          this.skipNoise();
          if (!this.match(TokenType.Comma)) break;
          this.skipNoise();
          if (this.peek().type === TokenType.RBrace) break;
        }
      }
      this.expect(TokenType.RBrace, "Expected '}' after enum variants");
      const enum_ = new EnumNode(nameTok.value, [nameTok.start, nameTok.end], variants);
      this.sprite.addEnum(enum_, this.diagnostics);
      return;
    }
    if (tok.type === TokenType.Var) {
      this.advance();
      const type_ = this.parseType();
      const nameTok = this.expect(TokenType.Name, "Expected variable name");
      if (this.check(TokenType.Assign) && this.peek(1).type === TokenType.LBracket) {
        this.advance();
        const lst = this._parseBracketList(nameTok, type_);
        this.sprite.addList(lst, this.diagnostics);
        return;
      }
      let default_ = null;
      if (this.match(TokenType.Assign)) {
        if (this.isAtEnd()) {
          throw new ParseError(
            `Unexpected EOF after '=' in initializer of '${nameTok.value}' (source may be truncated)`,
            nameTok.start
          );
        }
        const snap = this.pos;
        try {
          default_ = this.parseConstExpr();
          const nt = this.peek();
          if (nt.type !== TokenType.Semicolon && nt.type !== TokenType.Newline && nt.type !== TokenType.RBrace) {
            throw new ParseError("not a pure constant initializer", nt.start);
          }
        } catch (e) {
          if (!(e instanceof ParseError)) throw e;
          this.pos = snap;
          const runtimeInit = this.parseExpr();
          const name = new Name(nameTok.value, [nameTok.start, nameTok.end]);
          this.sprite.addVar(new Var(nameTok.value, name.span, type_, null, false), this.diagnostics);
          if (!this.sprite._pendingTopLevelInits) this.sprite._pendingTopLevelInits = [];
          this.sprite._pendingTopLevelInits.push(
            new StmtSetVar(name, runtimeInit, new TypeValue(), false, false)
          );
          this.skipNoise();
          return;
        }
      }
      this.skipNoise();
      const var_ = new Var(nameTok.value, [nameTok.start, nameTok.end], type_, default_, false);
      this.sprite.addVar(var_, this.diagnostics);
      return;
    }
    if (tok.type === TokenType.Cloud) {
      this.advance();
      const nameTok = this.expect(TokenType.Name, "Expected cloud variable name");
      this.skipNoise();
      const var_ = new Var(nameTok.value, [nameTok.start, nameTok.end], new TypeValue(), null, true);
      this.sprite.addVar(var_, this.diagnostics);
      return;
    }
    if (tok.type === TokenType.List) {
      this.advance();
      const type_ = this.parseType();
      const nameTok = this.expect(TokenType.Name, "Expected list name");
      const span2 = [nameTok.start, nameTok.end];
      if (this.match(TokenType.Assign)) {
        const lst2 = this._parseBracketList(nameTok, type_);
        this.sprite.addList(lst2, this.diagnostics);
        return;
      }
      if (this.peek().type === TokenType.Str) {
        const pathTok = this.advance();
        this.skipNoise();
        const lst2 = new ListNode(
          nameTok.value,
          span2,
          type_,
          new ListDefaultFile(pathTok.value, [pathTok.start, pathTok.end])
        );
        this.sprite.addList(lst2, this.diagnostics);
        return;
      }
      this.skipNoise();
      const lst = new ListNode(nameTok.value, span2, type_, null);
      this.sprite.addList(lst, this.diagnostics);
      return;
    }
    if (tok.type === TokenType.Orphan) {
      this.advance();
      const body = this.parseStmts();
      if (body.length > 0) this.sprite.orphanChains.push(body);
      return;
    }
    if (tok.type === TokenType.Add) {
      this.advance();
      const val = this.parseConstExpr();
      this.expect(TokenType.To, "Expected 'to' in add statement");
      const nameTok = this.expect(TokenType.Name, "Expected list name");
      this.skipNoise();
      const lst = this.sprite.lists[nameTok.value];
      if (!lst) {
        throw new ParseError(
          `Unknown list '${nameTok.value}' in top-level add`,
          nameTok.start
        );
      }
      if (!(lst.default instanceof ListDefaultValues) && lst.default !== null) {
        throw new ParseError(
          `Cannot top-level add to '${nameTok.value}': list has a ${lst.default.constructor.name} default`,
          nameTok.start
        );
      }
      if (!(lst.default instanceof ListDefaultValues)) {
        lst.default = new ListDefaultValues([]);
      }
      lst.default.values.push(val);
      return;
    }
    if (tok.type === TokenType.Name && tok.value === "copy" && this.peek(1).type === TokenType.List && this.peek(2).type === TokenType.Name && this.peek(3).type === TokenType.To && this.peek(4).type === TokenType.Name) {
      this.advance();
      this.advance();
      const srcTok = this.advance();
      this.advance();
      const dstTok = this.advance();
      this.skipNoise();
      if (srcTok.value !== dstTok.value) {
        const src = this.sprite.lists[srcTok.value];
        if (!src) {
          throw new ParseError(
            `Unknown list '${srcTok.value}' in top-level copy list`,
            srcTok.start
          );
        }
        const dst = this.sprite.lists[dstTok.value];
        if (!dst) {
          throw new ParseError(
            `Unknown list '${dstTok.value}' in top-level copy list`,
            dstTok.start
          );
        }
        if (!(src.default instanceof ListDefaultValues) && src.default !== null) {
          throw new ParseError(
            `Cannot top-level copy from '${srcTok.value}': list has a ${src.default.constructor.name} default`,
            srcTok.start
          );
        }
        if (dst.default !== null && !(dst.default instanceof ListDefaultValues)) {
          throw new ParseError(
            `Cannot top-level copy to '${dstTok.value}': list has a ${dst.default.constructor.name} default`,
            dstTok.start
          );
        }
        dst.default = new ListDefaultValues(
          src.default ? [...src.default.values] : []
        );
      }
      return;
    }
    if (tok.type === TokenType.Target) {
      this.advance();
      if (this.check(TokenType.Str)) {
        const nameTok = this.advance();
        this.skipNoise();
        this._switchTarget(nameTok.value, false);
        return;
      }
      const nt = this.expect(TokenType.Name, "Expected 'stage' or a quoted name after 'target'");
      if (nt.value !== "stage") {
        throw new ParseError("Expected 'stage' or a quoted name after 'target'", nt.start);
      }
      this.skipNoise();
      this._switchTarget("_stage_", true);
      return;
    }
    if (tok.type === TokenType.Name && tok.value === "sprite" && (this.peek(1).type === TokenType.Str || this.peek(1).type === TokenType.Name) && this.peek(2).type === TokenType.LBrace) {
      const nameT = this.peek(1);
      let isStage = false;
      let sname = null;
      if (nameT.type === TokenType.Str) {
        sname = nameT.value;
      } else if (nameT.value === "stage") {
        isStage = true;
      } else {
        sname = nameT.value;
      }
      this.advance();
      this.advance();
      this._parseSpriteBlockBody(sname, isStage);
      return;
    }
    if (tok.type === TokenType.Local) {
      this.advance();
      return this.parseStmt();
    }
    const loopHint = tok.type === TokenType.Forever || tok.type === TokenType.Repeat || tok.type === TokenType.Until || tok.type === TokenType.While ? " \u2014 loops must live inside a TOP-LEVEL event body (onflag / onclick / onkey \u2026), e.g. `onflag { forever { ... } }`" : "";
    throw new ParseError(
      `Unexpected token in declaration: ${tok.type}` + loopHint,
      tok.start
    );
  }
  // Scoped body parser for the block-form sprite superset above.
  _parseSpriteBlockBody(name, isStage) {
    const prev = this.sprite;
    this._switchTarget(name, isStage);
    this.skipNoise();
    this.expect(TokenType.LBrace, "Expected '{' after sprite header");
    try {
      while (this.peek().type !== TokenType.RBrace) {
        this.skipNoise();
        if (this.peek().type === TokenType.RBrace) break;
        if (this.isAtEnd()) {
          throw new ParseError("Unexpected EOF, expected '}'", this.peek().start);
        }
        this.declaration();
        this.skipNoise();
      }
      this.expect(TokenType.RBrace, "Expected '}'");
    } catch (e) {
      if (e instanceof ParseError) e.inBody = true;
      this.sprite = prev;
      throw e;
    }
    this.sprite = prev;
  }
  // ------------------------------------------------------------------
  // Statements
  // ------------------------------------------------------------------
  // Bracket initializer after '=' in list declarations (grammar.lalrpop
  // L86 values form / L92 fixed-length `[default; length]` form). Consumes
  // through the closing ']' plus trailing noise; returns the ListNode.
  _parseBracketList(nameTok, type_) {
    const span2 = [nameTok.start, nameTok.end];
    this.expect(TokenType.LBracket, "Expected '[' after '=' in list declaration");
    this.skipNoise();
    const values = [];
    if (this.peek().type !== TokenType.RBracket) {
      const first = this.parseConstExpr();
      this.skipNewlines();
      if (this.check(TokenType.Semicolon)) {
        this.advance();
        this.skipNoise();
        const lengthExpr = this.parseConstExpr();
        const lengthSpan = lengthExpr && lengthExpr.span || [this.peek().start, this.peek().end];
        this.expect(TokenType.RBracket, "Expected ']' after fixed list length");
        this.skipNoise();
        return new ListNode(
          nameTok.value,
          span2,
          type_,
          new ListDefaultValues(
            _expandFixedLengthList(first, lengthExpr, lengthSpan, this.diagnostics)
          )
        );
      }
      values.push(first);
      while (this.match(TokenType.Comma)) {
        this.skipNoise();
        if (this.peek().type === TokenType.RBracket) break;
        values.push(this.parseConstExpr());
        this.skipNewlines();
      }
    }
    this.expect(TokenType.RBracket, "Expected ']' after list values");
    this.skipNoise();
    return new ListNode(nameTok.value, span2, type_, new ListDefaultValues(values));
  }
  parseStmts() {
    this.skipNoise();
    this.expect(TokenType.LBrace, "Expected '{'");
    this.skipNoise();
    const stmts = [];
    try {
      while (this.peek().type !== TokenType.RBrace) {
        if (this.isAtEnd()) {
          throw new ParseError("Unexpected EOF, expected '}'", this.peek().start);
        }
        const stmt = this.parseStmt();
        if (Array.isArray(stmt)) stmts.push(...stmt);
        else if (stmt) stmts.push(stmt);
        this.skipNoise();
      }
      this.expect(TokenType.RBrace, "Expected '}'");
    } catch (e) {
      if (e instanceof ParseError) e.inBody = true;
      throw e;
    }
    return stmts;
  }
  // Desugar `for V in L { body }` into pointer/temp-cache statements.
  // Hidden names use the __for_ prefix so they never collide with user code
  // (identifiers starting with __ are reserved by convention here).
  _desugarForIn(varName, listName, body, span2) {
    const seq = this._forSeq = (this._forSeq || 0) + 1;
    const idx = new Name(`__for_i_${seq}`, span2);
    const one = () => new ExprValue(Value.fromFloat(1), span2);
    const setIdx = new StmtSetVar(idx, one(), new TypeValue(), false, false);
    const itemExpr = new ExprBinOp(
      BinOp.Of,
      span2,
      new ExprName(listName),
      new ExprName(idx.name)
    );
    const setVal = new StmtSetVar(
      new Name(varName, span2),
      itemExpr,
      new TypeValue(),
      false,
      false
    );
    const bump = new StmtChangeVar(idx, one());
    const times = new ExprUnOp(UnOp.Length, span2, new ExprName(listName));
    return [setIdx, new StmtRepeat(times, [setVal, ...body, bump])];
  }
  // Desugar `for V in range(A, B) { body }` (Python-style, AI-common) into
  // a pointer counted loop. Inclusive [A, B] — AI code writing range(1, 6)
  // for six plots means both endpoints; documented deviation from Python's
  // exclusive end. `range(N)` counts 1..N. Uses repeat_until so the bound
  // expressions are each evaluated from fresh nodes (no node sharing).
  _desugarRangeIn(varName, startExpr, endExpr, body, span2) {
    const seq = this._forSeq = (this._forSeq || 0) + 1;
    const idx = new Name(`__for_i_${seq}`, span2);
    const one = () => new ExprValue(Value.fromFloat(1), span2);
    const setIdx = new StmtSetVar(idx, startExpr, new TypeValue(), false, false);
    const cond = new ExprBinOp(BinOp.Gt, span2, new ExprName(idx.name), endExpr);
    const setVal = new StmtSetVar(
      new Name(varName, span2),
      new ExprName(idx.name),
      new TypeValue(),
      false,
      false
    );
    const bump = new StmtChangeVar(idx, one());
    return [setIdx, new StmtUntil(cond, [setVal, ...body, bump])];
  }
  // Desugar `copy list SRC to DST ;` into clear + element-wise copy loop.
  _desugarListCopy(srcName, dstName, span2) {
    if (srcName === dstName) return [];
    const seq = this._forSeq = (this._forSeq || 0) + 1;
    const idx = new Name(`__for_i_${seq}`, span2);
    const one = () => new ExprValue(Value.fromFloat(1), span2);
    const clear = new StmtDeleteList(new Name(dstName, span2));
    const setIdx = new StmtSetVar(idx, one(), new TypeValue(), false, false);
    const itemExpr = new ExprBinOp(
      BinOp.Of,
      span2,
      new ExprName(srcName),
      new ExprName(idx.name)
    );
    const add = new StmtAddToList(new Name(dstName, span2), itemExpr);
    const bump = new StmtChangeVar(idx, one());
    const times = new ExprUnOp(UnOp.Length, span2, new ExprName(srcName));
    return [clear, setIdx, new StmtRepeat(times, [add, bump])];
  }
  parseStmt() {
    this.skipNewlines();
    this._rewriteItemOfReporter();
    const tok = this.peek();
    if (tok.type === TokenType.Name && (tok.value === "break" || tok.value === "continue")) {
      const nt2 = this.peek(1);
      if (nt2.type === TokenType.Semicolon || nt2.type === TokenType.Newline || nt2.type === TokenType.RBrace) {
        throw new ParseError(
          `'${tok.value}' does not exist in goboscript. Exit loops through the while/until condition instead, e.g. replace a sentinel loop with a flag: local done = false; while (not done) { ... if (<cond>) { done = true; } }`,
          tok.start
        );
      }
    }
    if (tok.type === TokenType.Return) {
      this.advance();
      const nt = this.peek();
      if (nt.type === TokenType.Semicolon || nt.type === TokenType.Newline || nt.type === TokenType.RBrace || nt.type === TokenType.EOF) {
        return new StmtReturn(null, false);
      }
      const value = this.parseExpr();
      this.skipNoise();
      return new StmtReturn(value, false);
    }
    if (tok.type === TokenType.If) {
      this.advance();
      const cond = this.parseIfExpr();
      const ifBody = this.parseStmts();
      this.skipNewlines();
      if (this.match(TokenType.Else)) {
        this.skipNewlines();
        if (this.check(TokenType.If)) {
          this.advance();
          const elseBody2 = [this.parseElif()];
          return new StmtBranch(cond, ifBody, elseBody2, true);
        }
        const elseBody = this.parseStmts();
        return new StmtBranch(cond, ifBody, elseBody, true);
      } else if (this.check(TokenType.Elif)) {
        this.advance();
        const elseBody = [this.parseElif()];
        return new StmtBranch(cond, ifBody, elseBody, true);
      }
      return new StmtBranch(cond, ifBody, []);
    }
    if (tok.type === TokenType.Repeat) {
      this.advance();
      if (this.check(TokenType.Until)) {
        this.advance();
        const cond = this.parseIfExpr();
        const body2 = this.parseStmts();
        return new StmtUntil(cond, body2);
      }
      const times = this.parseIfExpr();
      const body = this.parseStmts();
      return new StmtRepeat(times, body);
    }
    if (tok.type === TokenType.Forever) {
      this.advance();
      const body = this.parseStmts();
      return new StmtForever(body, [tok.start, tok.end]);
    }
    if (tok.type === TokenType.Until) {
      this.advance();
      const cond = this.parseIfExpr();
      const body = this.parseStmts();
      return new StmtUntil(cond, body);
    }
    if (tok.type === TokenType.While) {
      this.advance();
      const cond = this.parseIfExpr();
      const body = this.parseStmts();
      const negCond = new ExprUnOp(UnOp.Not, [tok.start, tok.end], cond);
      return new StmtUntil(negCond, body);
    }
    if (tok.type === TokenType.WaitUntil) {
      this.advance();
      const cond = this.parseIfExpr();
      this.expect(TokenType.Semicolon);
      return new StmtWaitUntil(cond);
    }
    if (tok.type === TokenType.Local) {
      this.advance();
      const type_ = this.parseType();
      const nameTok = this.expect(TokenType.Name, "Expected variable name");
      if (this.check(TokenType.Assign) && this.peek(1).type === TokenType.LBracket && this._bracketInitIsWholeRhs()) {
        this.advance();
        const lst = this._parseBracketList(nameTok, type_);
        this.sprite.addList(lst, this.diagnostics);
        const resets = [new StmtDeleteList(new Name(nameTok.value, span))];
        if (lst.default instanceof ListDefaultValues) {
          for (const ce of lst.default.values || []) {
            if (!(ce instanceof ConstExprValue)) continue;
            resets.push(new StmtAddToList(
              new Name(nameTok.value, span),
              new ExprValue(ce.value, ce.span || span)
            ));
          }
        }
        return resets;
      }
      this.expect(TokenType.Assign, "Expected '=' in local var assignment");
      const value = this.parseExpr();
      this.skipNoise();
      const stLocal = new StmtSetVar(
        new Name(nameTok.value, [nameTok.start, nameTok.end]),
        value,
        type_,
        true,
        false
      );
      stLocal.__frameDecl = nameTok.value;
      if (!this.sprite._frameDeclNames) this.sprite._frameDeclNames = /* @__PURE__ */ new Set();
      this.sprite._frameDeclNames.add(nameTok.value);
      return stLocal;
    }
    if (tok.type === TokenType.Cloud) {
      this.advance();
      const nameTok = this.expect(TokenType.Name, "Expected variable name");
      this.expect(TokenType.Assign, "Expected '=' in cloud var assignment");
      const value = this.parseExpr();
      this.skipNoise();
      return new StmtSetVar(
        new Name(nameTok.value, [nameTok.start, nameTok.end]),
        value,
        new TypeValue(),
        false,
        true
      );
    }
    if (tok.type === TokenType.Show) {
      this.advance();
      if (this.peek().type === TokenType.Semicolon || this.peek().type === TokenType.Newline) {
        this.skipNoise();
        return new StmtBlock(Block.Show, [tok.start, tok.end], [], {});
      }
      const name = this.parseName();
      this.skipNoise();
      return new StmtShow(name);
    }
    if (tok.type === TokenType.Hide) {
      this.advance();
      if (this.peek().type === TokenType.Semicolon || this.peek().type === TokenType.Newline) {
        this.skipNoise();
        return new StmtBlock(Block.Hide, [tok.start, tok.end], [], {});
      }
      const name = this.parseName();
      this.skipNoise();
      return new StmtHide(name);
    }
    if (tok.type === TokenType.Add) {
      this.advance();
      const value = this.parseExpr();
      this.expect(TokenType.To, "Expected 'to' in add statement");
      const name = this.parseName();
      this.skipNoise();
      return new StmtAddToList(name, value);
    }
    if (tok.type === TokenType.Insert) {
      this.advance();
      {
        const t0 = this.peek(), t1 = this.peek(1), t2 = this.peek(2);
        const valOk = [TokenType.Int, TokenType.Float, TokenType.Str, TokenType.Name].includes(t1.type) && !(t1.type === TokenType.Name && ["of", "from", "into", "in"].includes(t1.value));
        const sepOk = t2.type === TokenType.Name && ["into", "in", "of", "from"].includes(t2.value) || t2.type === TokenType.In;
        if (t0.type === TokenType.Int && valOk && sepOk) {
          const idxTok = this.advance();
          const indexExpr = new ExprValue(
            Value.fromFloat(parseFloat(idxTok.value)),
            [idxTok.start, idxTok.end]
          );
          const valueExpr = this.parseExpr();
          const sepT = this.peek();
          if (!(sepT.type === TokenType.Name && ["into", "in", "of", "from"].includes(sepT.value) || sepT.type === TokenType.In)) {
            throw new ParseError("Expected 'into' in insert statement", sepT.start);
          }
          this.advance();
          const lname = this.parseName();
          this.skipNoise();
          return new StmtInsertAtList(lname, indexExpr, valueExpr);
        }
      }
      const value = this.parseExpr();
      this.expect(TokenType.At, "Expected 'at' in insert statement");
      if (this.peek().type === TokenType.Name && this.peek(1).type === TokenType.LBracket) {
        const name2 = this.parseName();
        this.expect(TokenType.LBracket, "Expected '[' in insert statement");
        const index2 = this.parseExpr();
        this.expect(TokenType.RBracket, "Expected ']' in insert statement");
        this.skipNoise();
        const ofTok2 = this.peek();
        if (ofTok2.type === TokenType.Name && ofTok2.value === "of") {
          this.advance();
          const target = this.parseName();
          this.skipNoise();
          return new StmtInsertAtList(target, index2, value);
        }
        return new StmtInsertAtList(name2, index2, value);
      }
      this._rewriteListTargetIn();
      const index = this.parseExpr();
      const ofTok = this.peek();
      if (ofTok.type !== TokenType.Name || ofTok.value !== "of") {
        throw new ParseError("Expected 'of' in insert statement", ofTok.start);
      }
      this.advance();
      const name = this.parseName();
      this.skipNoise();
      return new StmtInsertAtList(name, index, value);
    }
    if (tok.type === TokenType.Delete) {
      this.advance();
      if (this.peek().type === TokenType.Name && this.peek().value === "item" && ![TokenType.Semicolon, TokenType.LBracket].includes(this.peek(1).type)) {
        this.advance();
      }
      {
        const val = (k) => {
          const t = this.peek(k);
          return t.type === TokenType.Name ? t.value : null;
        };
        if (val(0) === "last" && (val(1) === "of" || val(1) === "from" || val(1) === "item" && (val(2) === "of" || val(2) === "from"))) {
          const spanTok = this.peek();
          this.advance();
          if (val(0) === "item") this.advance();
          this.advance();
          const lname = this.parseName();
          this.skipNoise();
          const lenIdx = new ExprUnOp(
            UnOp.Length,
            [spanTok.start, spanTok.end],
            new ExprName(lname)
          );
          return new StmtDeleteListIndex(lname, lenIdx);
        }
      }
      const isUpstreamForm = this.peek().type === TokenType.Name && (this.peek(1).type === TokenType.Semicolon || this.peek(1).type === TokenType.LBracket);
      if (!isUpstreamForm && this.peek().type !== TokenType.Semicolon) {
        const index = this.parseExpr();
        const ofTok = this.peek();
        if (ofTok.type !== TokenType.Name || ofTok.value !== "of" && ofTok.value !== "from") {
          throw new ParseError("Expected 'of' in delete statement", ofTok.start);
        }
        this.advance();
        const name2 = this.parseName();
        this.skipNoise();
        return new StmtDeleteListIndex(name2, index);
      }
      const name = this.parseName();
      if (this.match(TokenType.LBracket)) {
        const index = this.parseExpr();
        this.expect(TokenType.RBracket, "Expected ']' in delete statement");
        this.skipNoise();
        const ofTok = this.peek();
        if (ofTok.type === TokenType.Name && ofTok.value === "of") {
          this.advance();
          const target = this.parseName();
          this.skipNoise();
          return new StmtDeleteListIndex(target, index);
        }
        return new StmtDeleteListIndex(name, index);
      }
      this.skipNoise();
      return new StmtDeleteList(name);
    }
    if (tok.type === TokenType.Name && tok.value === "replace" && this.peek(1).type === TokenType.Name && this.peek(1).value === "item") {
      this.advance();
      this.advance();
      this._rewriteListTargetIn();
      const rindex = this.parseExpr();
      const sep = this.peek();
      const sepOk = sep.type === TokenType.In || sep.type === TokenType.Name && (sep.value === "of" || sep.value === "from" || sep.value === "in");
      if (!sepOk) {
        throw new ParseError("Expected 'of' in replace statement", sep.start);
      }
      this.advance();
      const rlist = this.parseName();
      const withTok = this.peek();
      if (withTok.type !== TokenType.Name || withTok.value !== "with") {
        throw new ParseError("Expected 'with' in replace statement", withTok.start);
      }
      this.advance();
      const rvalue = this.parseExpr();
      this.skipNoise();
      return new StmtSetListIndex(rlist, rindex, rvalue);
    }
    if (tok.type === TokenType.Name && tok.value === "clear" && this.peek(1).type === TokenType.List && this.peek(2).type === TokenType.Name) {
      this.advance();
      this.advance();
      const name = this.parseName();
      this.skipNoise();
      return new StmtDeleteList(name);
    }
    if (tok.type === TokenType.set_x) {
      this.advance();
      const arg = this.parseExpr();
      this.skipNoise();
      return new StmtBlock(Block.SetX, [tok.start, tok.end], [arg], {});
    }
    if (tok.type === TokenType.set_y) {
      this.advance();
      const arg = this.parseExpr();
      this.skipNoise();
      return new StmtBlock(Block.SetY, [tok.start, tok.end], [arg], {});
    }
    if (tok.type === TokenType.set_size) {
      this.advance();
      const arg = this.parseExpr();
      this.skipNoise();
      return new StmtBlock(Block.SetSize, [tok.start, tok.end], [arg], {});
    }
    if (tok.type === TokenType.point_in_direction) {
      this.advance();
      const arg = this.parseExpr();
      this.skipNoise();
      return new StmtBlock(Block.PointInDirection, [tok.start, tok.end], [arg], {});
    }
    if (tok.type === TokenType.set_volume) {
      this.advance();
      const arg = this.parseExpr();
      this.skipNoise();
      return new StmtBlock(Block.SetVolume, [tok.start, tok.end], [arg], {});
    }
    if (tok.type === TokenType.set_rotation_style_left_right) {
      this.advance();
      this.skipNoise();
      return new StmtBlock(Block.SetRotationStyleLeftRight, [tok.start, tok.end], [], {});
    }
    if (tok.type === TokenType.set_rotation_style_all_around) {
      this.advance();
      this.skipNoise();
      return new StmtBlock(Block.SetRotationStyleAllAround, [tok.start, tok.end], [], {});
    }
    if (tok.type === TokenType.set_rotation_style_do_not_rotate) {
      this.advance();
      this.skipNoise();
      return new StmtBlock(Block.SetRotationStyleDoNotRotate, [tok.start, tok.end], [], {});
    }
    if (tok.type === TokenType.Name) {
      return this.parseNameStmt();
    }
    if (tok.type === TokenType.Arg) {
      const argTok = this.advance();
      const name = new Name(argTok.value, [argTok.start, argTok.end]);
      this.expect(TokenType.Assign, "Expected '='");
      const value = this.parseExpr();
      this.skipNoise();
      return new StmtSetVar(name, value, new TypeValue(), false, false);
    }
    if (tok.type === TokenType.Var) {
      this.advance();
      const type_ = this.parseType();
      const nameTok = this.expect(TokenType.Name, "Expected variable name");
      const span2 = [nameTok.start, nameTok.end];
      if (this.check(TokenType.Assign) && this.peek(1).type === TokenType.LBracket && this._bracketInitIsWholeRhs()) {
        this.advance();
        const lst = this._parseBracketList(nameTok, type_);
        this.sprite.addList(lst, this.diagnostics);
        const resets = [new StmtDeleteList(new Name(nameTok.value, span2))];
        if (lst.default instanceof ListDefaultValues) {
          for (const ce of lst.default.values || []) {
            if (!(ce instanceof ConstExprValue)) continue;
            resets.push(new StmtAddToList(
              new Name(nameTok.value, span2),
              new ExprValue(ce.value, ce.span || span2)
            ));
          }
        }
        return resets;
      }
      let default_ = null;
      let runtimeInit = null;
      if (this.match(TokenType.Assign)) {
        if (this.isAtEnd()) {
          throw new ParseError(
            `Unexpected EOF after '=' in initializer of '${nameTok.value}' (source may be truncated)`,
            nameTok.start
          );
        }
        const snap = this.pos;
        try {
          default_ = this.parseConstExpr();
          const nt = this.peek();
          if (nt.type !== TokenType.Semicolon && nt.type !== TokenType.RBrace && nt.type !== TokenType.Newline) {
            throw new ParseError("not a pure constant initializer", nt.start);
          }
        } catch (e) {
          if (!(e instanceof ParseError)) throw e;
          this.pos = snap;
          runtimeInit = this.parseExpr();
        }
      }
      this.skipNoise();
      this.sprite.addVar(new Var(nameTok.value, span2, type_, default_, false), this.diagnostics);
      if (runtimeInit) {
        const st = new StmtSetVar(
          new Name(nameTok.value, span2),
          runtimeInit,
          new TypeValue(),
          false,
          false
        );
        st.__frameDecl = nameTok.value;
        if (!this.sprite._frameDeclNames) this.sprite._frameDeclNames = /* @__PURE__ */ new Set();
        this.sprite._frameDeclNames.add(nameTok.value);
        return st;
      }
      if (!this.sprite._frameDeclNames) this.sprite._frameDeclNames = /* @__PURE__ */ new Set();
      this.sprite._frameDeclNames.add(nameTok.value);
      return null;
    }
    if (tok.type === TokenType.List || tok.type === TokenType.Cloud) {
      this.declaration();
      return null;
    }
    if (tok.type === TokenType.Log) {
      this.advance();
      const value = this.parseExpr();
      this.skipNoise();
      return new StmtProcCall("log", [tok.start, tok.end], [value], {});
    }
    if (EVENT_TOKENS.has(tok.type)) {
      throw new ParseError(
        `Unexpected token in statement: ${tok.type} \u2014 events (onflag / onclick / onkey / on "msg" \u2026) are TOP-LEVEL hats; move this line OUT of every {...} to column 0, e.g. \`onclick { goto_random_position; }\``,
        tok.start
      );
    }
    if (tok.type === TokenType.Name && /^when([ _]|$)/i.test(String(tok.value || ""))) {
      throw new ParseError(
        `Unexpected token in statement: ${tok.value} \u2014 this dialect uses onflag / onclick / onkey "space" / on "msg" as TOP-LEVEL event hats; write the event at column 0 followed by { ... }, e.g. \`onflag { say("hi"); }\``,
        tok.start
      );
    }
    throw new ParseError(`Unexpected token in statement: ${tok.type}`, tok.start);
  }
  parseElif() {
    const cond = this.parseIfExpr();
    const ifBody = this.parseStmts();
    this.skipNewlines();
    if (this.match(TokenType.Else)) {
      this.skipNewlines();
      if (this.check(TokenType.If)) {
        this.advance();
        const elseBody2 = [this.parseElif()];
        return new StmtBranch(cond, ifBody, elseBody2, true);
      }
      const elseBody = this.parseStmts();
      return new StmtBranch(cond, ifBody, elseBody, true);
    } else if (this.check(TokenType.Elif)) {
      this.advance();
      const elseBody = [this.parseElif()];
      return new StmtBranch(cond, ifBody, elseBody, true);
    }
    return new StmtBranch(cond, ifBody, []);
  }
  parseNameStmt() {
    const nameTok = this.peek();
    const startPos = nameTok.start;
    const nextTok = this.peek(1);
    if (nameTok.value === "for" && nextTok.type === TokenType.LParen && this._looksLikeCStyleFor()) {
      this.advance();
      this.expect(TokenType.LParen, "Expected '(' after 'for'");
      const initStmt = this._parseForSegmentStmt(false);
      this.expect(TokenType.Semicolon, "Expected ';' in for header");
      let cond = null;
      if (!this.check(TokenType.Semicolon)) cond = this.parseIfExpr();
      this.expect(TokenType.Semicolon, "Expected ';' in for header");
      const incrStmt = this._parseForSegmentStmt(true);
      this.expect(TokenType.RParen, "Expected ')' after for clauses");
      const body = this.parseStmts();
      const prefix = [];
      if (initStmt) {
        if (Array.isArray(initStmt)) prefix.push(...initStmt);
        else prefix.push(initStmt);
      }
      const tail = incrStmt ? body.concat([incrStmt]) : body;
      if (cond === null) {
        prefix.push(new StmtForever(tail, [nameTok.start, nameTok.end]));
        return prefix;
      }
      const negCond = new ExprUnOp(UnOp.Not, [nameTok.start, nameTok.end], cond);
      prefix.push(new StmtUntil(negCond, tail));
      return prefix;
    }
    if (nameTok.value === "for" && nextTok.type === TokenType.Name && this.peek(2).type === TokenType.In && this.peek(3).type === TokenType.Name && this.peek(4).type === TokenType.LBrace) {
      this.advance();
      const varTok = this.advance();
      this.advance();
      const listTok = this.advance();
      const body = this.parseStmts();
      this.skipNoise();
      return this._desugarForIn(
        varTok.value,
        listTok.value,
        body,
        [nameTok.start, nameTok.end]
      );
    }
    if (nameTok.value === "for" && nextTok.type === TokenType.Name && this.peek(2).type === TokenType.In && this.peek(3).type === TokenType.LBracket) {
      this.advance();
      const varTok = this.advance();
      this.advance();
      this._parenDepth++;
      let hiddenName;
      try {
        hiddenName = this._parseArrayLiteralToHiddenList();
      } finally {
        this._parenDepth--;
      }
      const body = this.parseStmts();
      this.skipNoise();
      return this._desugarForIn(
        varTok.value,
        hiddenName,
        body,
        [nameTok.start, nameTok.end]
      );
    }
    if (nameTok.value === "for" && nextTok.type === TokenType.Name && this.peek(2).type === TokenType.In && this.peek(3).type === TokenType.Name && this.peek(3).value === "range" && this.peek(4).type === TokenType.LParen) {
      this.advance();
      const varTok = this.advance();
      this.advance();
      this.advance();
      this.advance();
      this._parenDepth++;
      let rangeArgs;
      try {
        rangeArgs = [this.parseExpr()];
        if (this.match(TokenType.Comma)) rangeArgs.push(this.parseExpr());
        this.expect(TokenType.RParen, "Expected ')' after range arguments");
      } finally {
        this._parenDepth--;
      }
      const body = this.parseStmts();
      this.skipNoise();
      const span3 = [nameTok.start, nameTok.end];
      const [a, b] = rangeArgs.length === 2 ? rangeArgs : [new ExprValue(Value.fromFloat(1), span3), rangeArgs[0]];
      return this._desugarRangeIn(varTok.value, a, b, body, span3);
    }
    if (nameTok.value === "copy" && nextTok.type === TokenType.List && this.peek(2).type === TokenType.Name && this.peek(3).type === TokenType.To && this.peek(4).type === TokenType.Name) {
      this.advance();
      this.advance();
      const srcTok = this.advance();
      this.advance();
      const dstTok = this.advance();
      this.skipNoise();
      return this._desugarListCopy(
        srcTok.value,
        dstTok.value,
        [nameTok.start, nameTok.end]
      );
    }
    if ((nameTok.value === "change" || nameTok.value === "set") && nextTok.type === TokenType.Name) {
      const kwTok = this.peek(2);
      const isChangeBy = nameTok.value === "change" && kwTok.type === TokenType.Name && kwTok.value === "by";
      const isSetTo = nameTok.value === "set" && kwTok.type === TokenType.To;
      if (isChangeBy || isSetTo) {
        this.advance();
        const targetTok = this.advance();
        this.advance();
        const target = new Name(targetTok.value, [targetTok.start, targetTok.end]);
        const value = this.parseExpr();
        this.skipNoise();
        if (isChangeBy) return new StmtChangeVar(target, value);
        return new StmtSetVar(target, value, new TypeValue(), false, false);
      }
    }
    if (nextTok.type === TokenType.Name && this.peek(2).type === TokenType.Assign) {
      this.advance();
      const varTok = this.advance();
      this.advance();
      const value = this.parseExpr();
      this.skipNoise();
      return new StmtSetVar(
        new Name(varTok.value, [varTok.start, varTok.end]),
        value,
        new TypeStruct(nameTok.value, [nameTok.start, nameTok.end]),
        false,
        false
      );
    }
    if (nextTok.type === TokenType.Dot) {
      this.advance();
      this.advance();
      const fieldTok = this.expect(TokenType.Name, "Expected field name");
      const lhsName = new DotName(
        nameTok.value,
        [nameTok.start, nameTok.end],
        fieldTok.value,
        [fieldTok.start, fieldTok.end]
      );
      const opTok = this.peek();
      if (opTok.type === TokenType.Assign) {
        this.advance();
        const value = this.parseExpr();
        this.skipNoise();
        return new StmtSetVar(lhsName, value, new TypeValue(), false, false);
      }
      return this._compoundFieldAssign(lhsName, opTok, startPos);
    }
    if (nextTok.type === TokenType.LBracket) {
      this.advance();
      this.advance();
      const index = this.parseExpr();
      this.expect(TokenType.RBracket, "Expected ']'");
      if (this.peek().type === TokenType.Dot) {
        this.advance();
        const fieldTok = this.expect(TokenType.Name, "Expected field name");
        const indexedName = new DotName(
          nameTok.value,
          [nameTok.start, nameTok.end],
          fieldTok.value,
          [fieldTok.start, fieldTok.end]
        );
        const opTok2 = this.peek();
        if (opTok2.type === TokenType.Assign) {
          this.advance();
          const value = this.parseExpr();
          this.skipNoise();
          return new StmtSetListIndex(indexedName, index, value);
        }
        if (_COMPOUND_ASSIGN_OPS.includes(opTok2.type)) {
          return this._compoundIndexAssign(indexedName, index, opTok2, startPos);
        }
        throw new ParseError(
          `Expected assignment after '${nameTok.value}[...].${fieldTok.value}'`,
          opTok2.start
        );
      }
      const opTok = this.peek();
      if (opTok.type === TokenType.Assign) {
        this.advance();
        const value = this.parseExpr();
        this.skipNoise();
        return new StmtSetListIndex(
          new Name(nameTok.value, [nameTok.start, nameTok.end]),
          index,
          value
        );
      }
      return this._compoundIndexAssign(
        new Name(nameTok.value, [nameTok.start, nameTok.end]),
        index,
        opTok,
        startPos
      );
    }
    if ([
      TokenType.Increment,
      TokenType.Decrement,
      TokenType.AssignAdd,
      TokenType.AssignSubtract,
      TokenType.AssignMultiply,
      TokenType.AssignDivide,
      TokenType.AssignFloorDiv,
      TokenType.AssignModulo,
      TokenType.AssignJoin
    ].includes(nextTok.type)) {
      this.advance();
      const name = new Name(nameTok.value, [nameTok.start, nameTok.end]);
      const opTok = this.advance();
      return this._compoundAssign(name, opTok, startPos);
    }
    if (nextTok.type === TokenType.Assign) {
      this.advance();
      this.advance();
      const value = this.parseExpr();
      this.skipNoise();
      return new StmtSetVar(
        new Name(nameTok.value, [nameTok.start, nameTok.end]),
        value,
        new TypeValue(),
        false,
        false
      );
    }
    let args = [], kwargs = {};
    if (nextTok.type === TokenType.LParen) {
      const savedPos = this.pos;
      this.advance();
      this.advance();
      try {
        [args, kwargs] = this.parseCallArgs();
        this.expect(TokenType.RParen, "Expected ')'");
        if (![TokenType.Semicolon, TokenType.Newline, TokenType.RBrace].includes(this.peek().type)) {
          throw new ParseError("Not a call-args form", this.peek().start);
        }
      } catch (e) {
        if (!(e instanceof ParseError)) throw e;
        this.pos = savedPos;
        this.advance();
        if (![TokenType.Semicolon, TokenType.Newline, TokenType.RBrace].includes(this.peek().type)) {
          this.skipNewlines();
          [args, kwargs] = this._parseProcCallArgs();
        } else {
          args = [];
          kwargs = {};
        }
      }
    } else {
      this.advance();
      if (![TokenType.Semicolon, TokenType.Newline, TokenType.RBrace].includes(this.peek().type)) {
        this.skipNewlines();
        [args, kwargs] = this._parseProcCallArgs();
      }
    }
    if (this.check(TokenType.Semicolon) || this.check(TokenType.Newline)) {
      this.skipNoise();
    } else if (this.isAtEnd()) {
    } else {
      throw new ParseError(
        `Expected ';' or newline after statement, got ${this.peek().type}`,
        this.peek().start
      );
    }
    const nameStr = nameTok.value;
    const span2 = [nameTok.start, nameTok.end];
    const block = blockFromShape(nameStr, args.length);
    if (block !== null) {
      return new StmtBlock(block, span2, args, kwargs);
    }
    if (nameStr === "log") {
      return new StmtProcCall(nameStr, span2, args, kwargs);
    }
    return new StmtProcCall(nameStr, span2, args, kwargs);
  }
  _parseProcCallArgs() {
    const args = [];
    const kwargs = {};
    while (true) {
      this.skipNewlines();
      if (this.peek().type === TokenType.Name && this.peek(1).type === TokenType.Colon) {
        const nameTok = this.advance();
        this.advance();
        const value = this.parseExpr();
        kwargs[nameTok.value] = [[nameTok.start, nameTok.end], value];
      } else {
        args.push(this.parseExpr());
      }
      this.skipNewlines();
      if (!this.match(TokenType.Comma)) break;
    }
    return [args, kwargs];
  }
  _compoundAssign(name, opTok, startPos) {
    const varName = new ExprName(name);
    const nameSpan = name.span;
    if (opTok.type === TokenType.Increment) {
      this.skipNoise();
      return new StmtChangeVar(name, new ExprValue(Value.fromFloat(1), nameSpan));
    }
    if (opTok.type === TokenType.Decrement) {
      this.skipNoise();
      return new StmtChangeVar(name, new ExprValue(Value.fromFloat(-1), nameSpan));
    }
    const value = this.parseExpr();
    this.skipNoise();
    if (opTok.type === TokenType.AssignAdd) {
      return new StmtChangeVar(name, value);
    }
    if (opTok.type === TokenType.AssignSubtract) {
      const negSpan = value && value.span ? value.span : nameSpan;
      const negValue = new ExprBinOp(
        BinOp.Sub,
        negSpan,
        new ExprValue(Value.fromFloat(0), negSpan),
        value
      );
      return new StmtChangeVar(name, negValue);
    }
    const binopMap = {
      [TokenType.AssignMultiply]: BinOp.Mul,
      [TokenType.AssignDivide]: BinOp.Div,
      [TokenType.AssignFloorDiv]: BinOp.FloorDiv,
      [TokenType.AssignModulo]: BinOp.Mod,
      [TokenType.AssignJoin]: BinOp.Join
    };
    const op = binopMap[opTok.type];
    const result = new ExprBinOp(op, nameSpan, varName, value);
    return new StmtSetVar(name, result, new TypeValue(), false, false);
  }
  _compoundFieldAssign(lhsName, opTok, startPos) {
    const nameSpan = lhsName.span;
    const varName = new ExprName(lhsName);
    if (opTok.type === TokenType.Increment) {
      this.advance();
      this.skipNoise();
      return new StmtChangeVar(lhsName, new ExprValue(Value.fromFloat(1), nameSpan));
    }
    if (opTok.type === TokenType.Decrement) {
      this.advance();
      this.skipNoise();
      return new StmtChangeVar(lhsName, new ExprValue(Value.fromFloat(-1), nameSpan));
    }
    this.advance();
    const value = this.parseExpr();
    this.skipNoise();
    const binopMap = {
      [TokenType.AssignAdd]: BinOp.Add,
      [TokenType.AssignSubtract]: BinOp.Sub,
      [TokenType.AssignMultiply]: BinOp.Mul,
      [TokenType.AssignDivide]: BinOp.Div,
      [TokenType.AssignFloorDiv]: BinOp.FloorDiv,
      [TokenType.AssignModulo]: BinOp.Mod,
      [TokenType.AssignJoin]: BinOp.Join
    };
    const op = binopMap[opTok.type];
    const result = new ExprBinOp(op, nameSpan, varName, value);
    return new StmtSetVar(lhsName, result, new TypeValue(), false, false);
  }
  _compoundIndexAssign(name, index, opTok, startPos) {
    const nameSpan = name.span;
    const baseName = name instanceof DotName ? new Name(name.lhs, name.lhs_span) : name;
    const listAccess = new ExprBinOp(BinOp.Of, nameSpan, new ExprName(baseName), index);
    if (opTok.type === TokenType.Increment) {
      this.advance();
      this.skipNoise();
      const result2 = new ExprBinOp(
        BinOp.Add,
        nameSpan,
        listAccess,
        new ExprValue(Value.fromFloat(1), nameSpan)
      );
      return new StmtSetListIndex(name, index, result2);
    }
    if (opTok.type === TokenType.Decrement) {
      this.advance();
      this.skipNoise();
      const result2 = new ExprBinOp(
        BinOp.Sub,
        nameSpan,
        listAccess,
        new ExprValue(Value.fromFloat(-1), nameSpan)
      );
      return new StmtSetListIndex(name, index, result2);
    }
    this.advance();
    const value = this.parseExpr();
    this.skipNoise();
    const binopMap = {
      [TokenType.AssignAdd]: BinOp.Add,
      [TokenType.AssignSubtract]: BinOp.Sub,
      [TokenType.AssignMultiply]: BinOp.Mul,
      [TokenType.AssignDivide]: BinOp.Div,
      [TokenType.AssignFloorDiv]: BinOp.FloorDiv,
      [TokenType.AssignModulo]: BinOp.Mod,
      [TokenType.AssignJoin]: BinOp.Join
    };
    const op = binopMap[opTok.type];
    const result = new ExprBinOp(op, nameSpan, listAccess, value);
    return new StmtSetListIndex(name, index, result);
  }
  // ------------------------------------------------------------------
  // Expressions (Pratt parser with precedence)
  // ------------------------------------------------------------------
  parseExpr() {
    return this._parseTernary(false);
  }
  parseIfExpr() {
    return this._parseTernary(true);
  }
  // `cond ? a : b` — AI-compat superset (C/JS ternary), right-associative,
  // binding loosest. Lowers to a hidden temp var + control_if_else in
  // visitor pass1 (scratch-vm has no if/else reporter primitive).
  _parseTernary(noStruct) {
    const cond = this._parseBinary(0, noStruct);
    if (this.peek().type !== TokenType.Question) return cond;
    const qtok = this.advance();
    this.skipNewlines();
    const thenExpr = this._parseTernary(noStruct);
    this.skipNewlines();
    this.expect(TokenType.Colon, "Expected ':' in conditional expression");
    this.skipNewlines();
    const elseExpr = this._parseTernary(noStruct);
    return new ExprTernary(cond, thenExpr, elseExpr, [qtok.start, qtok.end]);
  }
  _binaryOpInfo(tok) {
    const t = tok.type;
    if (t === TokenType.Or) return [_Parser._PREC_OR, BinOp.Or, false];
    if (t === TokenType.And) return [_Parser._PREC_AND, BinOp.And, false];
    if (t === TokenType.Eq) return [_Parser._PREC_EQ, BinOp.Eq, false];
    if (t === TokenType.Ne) return [_Parser._PREC_EQ, BinOp.Ne, false];
    if (t === TokenType.In) return [_Parser._PREC_EQ, BinOp.In, false];
    if (t === TokenType.Amp) return [_Parser._PREC_JOIN, BinOp.Join, true];
    if (t === TokenType.Lt) return [_Parser._PREC_CMP, BinOp.Lt, false];
    if (t === TokenType.Le) return [_Parser._PREC_CMP, BinOp.Le, false];
    if (t === TokenType.Gt) return [_Parser._PREC_CMP, BinOp.Gt, false];
    if (t === TokenType.Ge) return [_Parser._PREC_CMP, BinOp.Ge, false];
    if (t === TokenType.Plus) return [_Parser._PREC_ADD, BinOp.Add, false];
    if (t === TokenType.Minus) return [_Parser._PREC_ADD, BinOp.Sub, false];
    if (t === TokenType.Star) return [_Parser._PREC_MUL, BinOp.Mul, false];
    if (t === TokenType.Slash) return [_Parser._PREC_MUL, BinOp.Div, false];
    if (t === TokenType.FloorDiv) return [_Parser._PREC_MUL, BinOp.FloorDiv, false];
    if (t === TokenType.Percent) return [_Parser._PREC_MUL, BinOp.Mod, false];
    return [0, null, false];
  }
  _parseBinary(minPrec, noStruct = false) {
    this.skipNewlines();
    let left = this._parseUnary(noStruct);
    while (true) {
      if (this.peek().type === TokenType.Newline) {
        let k = 0;
        while (this.peek(k).type === TokenType.Newline) k++;
        const [np] = this._binaryOpInfo(this.peek(k));
        const nk = this.peek(k);
        const isCont = np > 0 && np >= minPrec || (nk.type === TokenType.Caret || nk.type === TokenType.Question);
        if (isCont) {
          for (let j = 0; j < k; j++) this.advance();
        }
      }
      if (this._parenDepth > 0) this.skipNewlines();
      const tok = this.peek();
      if (tok.type === TokenType.Not && this.peek(1).type === TokenType.In) {
        this.advance();
        this.advance();
        const rhs2 = this._parseBinary(_Parser._PREC_EQ + 1, noStruct);
        const inner = new ExprBinOp(BinOp.In, [tok.start, tok.end], left, rhs2);
        left = new ExprUnOp(UnOp.Not, [tok.start, tok.end], inner);
        continue;
      }
      if (tok.type === TokenType.Caret && _Parser._PREC_POW >= minPrec) {
        this.advance();
        const rhs2 = this._parseBinary(_Parser._PREC_POW, noStruct);
        left = this._desugarPow(left, rhs2, [tok.start, tok.end]);
        continue;
      }
      const [prec, binop, rightAssoc] = this._binaryOpInfo(tok);
      if (prec < minPrec || binop === null) break;
      this.advance();
      const nextMin = rightAssoc ? prec : prec + 1;
      const rhs = this._parseBinary(nextMin, noStruct);
      left = new ExprBinOp(binop, [tok.start, tok.end], left, rhs);
    }
    return left;
  }
  // `base ^ exp` lowering. Scratch/TurboWarp has no two-operand pow block,
  // so constant integer exponents expand into a multiply chain — but ONLY
  // for atom bases (literal / variable), because the duplicated base
  // subtree is shared across n-1 operator parents and the visitor's in-place
  // transforms must not meet aliased complex nodes. Anything else is a loud
  // ParseError steering the author to a temp variable or repeat loop.
  _desugarPow(base, exp, span2) {
    const n = this._tryConstEval(exp);
    if (n === null || !Number.isInteger(n) || n < 0 || n > 32) {
      throw new ParseError(
        "power '^' needs a constant integer exponent (0..32); assign the base to a variable and use repeat/multiplication otherwise",
        span2[0]
      );
    }
    if (!(base instanceof ExprValue || base instanceof ExprName)) {
      throw new ParseError(
        "power '^' base must be a literal or variable; assign complex expressions to a temp variable first",
        span2[0]
      );
    }
    if (n === 0) return new ExprValue(Value.fromFloat(1), span2);
    let result = base;
    for (let i = 1; i < n; i++) {
      result = new ExprBinOp(BinOp.Mul, span2, result, base);
    }
    return result;
  }
  // Constant-fold a pure-literal arithmetic subtree (used for pow exponents
  // like the `3^2` inside `2^3^2`, which desugars into a Mul chain before
  // the outer exponent check runs). Returns a finite number or null.
  _tryConstEval(expr) {
    if (expr instanceof ExprValue && expr.value) {
      const v = expr.value.toNumber();
      return typeof v === "number" && isFinite(v) ? v : null;
    }
    if (expr instanceof ExprBinOp) {
      const a = this._tryConstEval(expr.lhs);
      if (a === null) return null;
      const b = this._tryConstEval(expr.rhs);
      if (b === null) return null;
      switch (expr.op) {
        case BinOp.Add:
          return a + b;
        case BinOp.Sub:
          return a - b;
        case BinOp.Mul:
          return a * b;
        case BinOp.Div:
          return b === 0 ? null : a / b;
        case BinOp.Mod:
          return b === 0 ? null : a % b;
        default:
          return null;
      }
    }
    return null;
  }
  _parseUnary(noStruct = false) {
    if (this._parenDepth > 0) this.skipNewlines();
    const tok = this.peek();
    if (tok.type === TokenType.Minus) {
      this.advance();
      const operand = this._parseUnary(noStruct);
      if (operand instanceof ExprValue && operand.value !== null && operand.value !== void 0) {
        const v = operand.value;
        if (v.kind === "number" || v.kind === "boolean") {
          const n = v.toNumber();
          if (!isNaN(n) && isFinite(n)) {
            return new ExprValue(Value.fromFloat(-n), [tok.start, tok.end]);
          }
        }
      }
      return new ExprUnOp(UnOp.Minus, [tok.start, tok.end], operand);
    }
    if (tok.type in _UNOP_KEYWORDS) {
      this.advance();
      if (tok.type === TokenType.Length && this.peek().type === TokenType.Name && this.peek().value === "of") {
        this.advance();
      }
      const operand = this._parseUnary(noStruct);
      const op = _UNOP_KEYWORDS[tok.type];
      return new ExprUnOp(op, [tok.start, tok.end], operand);
    }
    return this._parseTerm(noStruct);
  }
  _parseTerm(noStruct = false) {
    const tok = this.peek();
    if (tok.type === TokenType.LBracket) {
      const hiddenName = this._parseArrayLiteralToHiddenList();
      return this._parsePostfix(new ExprName(new Name(hiddenName, [tok.start, tok.end])));
    }
    if (tok.type === TokenType.LParen) {
      this.advance();
      this._parenDepth++;
      try {
        const expr = this.parseExpr();
        if (this._parenDepth > 0) this.skipNewlines();
        this.expect(TokenType.RParen, "Expected ')'");
        return this._parsePostfix(expr);
      } finally {
        this._parenDepth--;
      }
    }
    if (tok.type === TokenType.True_) {
      this.advance();
      return this._parsePostfix(
        new ExprValue(Value.fromFloat(1), [tok.start, tok.end])
      );
    }
    if (tok.type === TokenType.False_) {
      this.advance();
      return this._parsePostfix(
        new ExprValue(Value.fromFloat(0), [tok.start, tok.end])
      );
    }
    if ([TokenType.Int, TokenType.Hex, TokenType.Oct, TokenType.Bin].includes(tok.type)) {
      this.advance();
      return this._parsePostfix(
        new ExprValue(Value.fromInt(tok.value), [tok.start, tok.end])
      );
    }
    if (tok.type === TokenType.Float) {
      this.advance();
      return this._parsePostfix(
        new ExprValue(Value.fromFloat(tok.value), [tok.start, tok.end])
      );
    }
    if (tok.type === TokenType.Str) {
      this.advance();
      return this._parsePostfix(
        new ExprValue(Value.fromStr(tok.value), [tok.start, tok.end])
      );
    }
    if (tok.type === TokenType.Arg) {
      this.advance();
      const name = new Name(tok.value, [tok.start, tok.end]);
      return this._parsePostfix(new ExprArg(name));
    }
    if (tok.type === TokenType.Name) {
      this.advance();
      const nameStr = tok.value;
      const span2 = [tok.start, tok.end];
      if (this.peek().type === TokenType.LParen) {
        this.advance();
        let callArgs, callKwargs;
        [callArgs, callKwargs] = this.parseCallArgs();
        this.expect(TokenType.RParen, "Expected ')'");
        const reprDef = reprFromShape(nameStr);
        if (reprDef !== null) {
          return this._parsePostfix(
            new ExprRepr(reprDef, span2, callArgs)
          );
        }
        return this._parsePostfix(
          new ExprFuncCall(nameStr, span2, callArgs, callKwargs)
        );
      }
      if (!noStruct && this.peek().type === TokenType.LBrace) {
        this.advance();
        this.skipNoise();
        const fields = [];
        if (this.peek().type !== TokenType.RBrace) {
          while (true) {
            const fname = this.expect(TokenType.Name, "Expected field name");
            this.expect(TokenType.Colon, "Expected ':' after field name");
            const fval = this.parseExpr();
            fields.push(new StructLiteralField(
              fname.value,
              [fname.start, fname.end],
              fval
            ));
            this.skipNoise();
            if (!this.match(TokenType.Comma)) break;
            this.skipNoise();
          }
        }
        this.expect(TokenType.RBrace, "Expected '}'");
        return this._parsePostfix(
          new ExprStructLiteral(nameStr, span2, fields)
        );
      }
      return this._parsePostfix(new ExprName(new Name(nameStr, span2)));
    }
    if (this.isAtEnd()) {
      const lastTok = this.tokens[this.tokens.length - 1];
      throw new ParseError(
        "Unexpected EOF in expression (source may be truncated)",
        lastTok ? Math.max(0, lastTok.end) : 0
      );
    }
    throw new ParseError(`Unexpected token in expression: ${tok.type}`, tok.start);
  }
  _parsePostfix(expr) {
    while (true) {
      const tok = this.peek();
      if (tok.type === TokenType.LBracket) {
        this.advance();
        const index = this.parseExpr();
        this.expect(TokenType.RBracket, "Expected ']'");
        expr = new ExprBinOp(BinOp.Of, [tok.start, tok.end], expr, index);
        continue;
      }
      if (tok.type === TokenType.Dot) {
        this.advance();
        if (this.peek().type === TokenType.Name) {
          const fieldTok = this.advance();
          expr = new ExprDot(expr, fieldTok.value, [fieldTok.start, fieldTok.end]);
          continue;
        } else if (this.peek().type === TokenType.Str) {
          const propTok = this.advance();
          expr = new ExprProperty(expr, propTok.value, [propTok.start, propTok.end]);
          continue;
        }
      }
      break;
    }
    return expr;
  }
  // ------------------------------------------------------------------
  // Helpers for parsing sub-constructs
  // ------------------------------------------------------------------
  parseName() {
    const nameTok = this.expect(TokenType.Name, "Expected name");
    if (this.peek().type === TokenType.Dot) {
      this.advance();
      const fieldTok = this.expect(TokenType.Name, "Expected field name after '.'");
      return new DotName(
        nameTok.value,
        [nameTok.start, nameTok.end],
        fieldTok.value,
        [fieldTok.start, fieldTok.end]
      );
    }
    return new Name(nameTok.value, [nameTok.start, nameTok.end]);
  }
  // Register (or reuse) a hidden per-sprite list holding the elements of an
  // anonymous `[a, b, c]` literal. Named `__arr_N` and skipped from collision
  // checks against user declarations.
  _hiddenArrayList(elems, span2) {
    this._arrSeq = (this._arrSeq || 0) + 1;
    let name = `__arr_${this._arrSeq}`;
    while (this.sprite.lists[name] || this.sprite.vars[name]) {
      this._arrSeq++;
      name = `__arr_${this._arrSeq}`;
    }
    this.sprite.addList(
      new ListNode(name, span2, new TypeValue(), new ListDefaultValues(elems)),
      this.diagnostics
    );
    return name;
  }
  // Parse `[const, const, ...]` from the opening '[' (not yet consumed)
  // through the closing ']'; hoists the elements into a hidden sprite list
  // and returns its name.
  _parseArrayLiteralToHiddenList() {
    this.advance();
    this.skipNewlines();
    const elems = [];
    if (this.peek().type !== TokenType.RBracket) {
      elems.push(this.parseConstExpr());
      this.skipNewlines();
      while (this.match(TokenType.Comma)) {
        this.skipNoise();
        if (this.peek().type === TokenType.RBracket) break;
        elems.push(this.parseConstExpr());
        this.skipNewlines();
      }
    }
    this.expect(TokenType.RBracket, "Expected ']' in array literal");
    return this._hiddenArrayList(elems, [this.tokens[this.pos - 1].end, this.tokens[this.pos - 1].end]);
  }
  // Guard for the var/local bracket-init hoist: true only when the token
  // after the matching ']' terminates the statement (`;`/newline/`}`/EOF).
  // `var x = [1,2][i];` must NOT take the hoist path — the RHS is a runtime
  // expression (array literal + immediate index), handled by parseExpr.
  _bracketInitIsWholeRhs() {
    let depth = 0;
    let i = 1;
    for (; ; i++) {
      const t2 = this.peek(i);
      if (!t2 || t2.type === TokenType.EOF) return false;
      if (t2.type === TokenType.LBracket) depth++;
      else if (t2.type === TokenType.RBracket) {
        depth--;
        if (depth === 0) break;
      }
    }
    const t = this.peek(i + 1);
    return !t || t.type === TokenType.Semicolon || t.type === TokenType.Newline || t.type === TokenType.RBrace || t.type === TokenType.EOF;
  }
  parseType() {
    if (this.peek().type === TokenType.Name) {
      const nextTok = this.peek(1);
      if ([
        TokenType.Assign,
        TokenType.Semicolon,
        TokenType.Newline,
        TokenType.LBracket,
        TokenType.LParen,
        TokenType.Increment,
        TokenType.Decrement,
        TokenType.Comma,
        TokenType.RBrace,
        TokenType.RParen,
        TokenType.LBrace,
        TokenType.Str
      ].includes(nextTok.type)) {
        return new TypeValue();
      }
      const nameTok = this.advance();
      return new TypeStruct(nameTok.value, [nameTok.start, nameTok.end]);
    }
    return new TypeValue();
  }
  parseValue() {
    const tok = this.peek();
    if (tok.type === TokenType.Minus) {
      this.advance();
      const [val, span2] = this.parseValue();
      const v = val.toNumber();
      return [Value.fromFloat(-v), span2];
    }
    if (tok.type === TokenType.True_) {
      this.advance();
      return [Value.fromFloat(1), [tok.start, tok.end]];
    }
    if (tok.type === TokenType.False_) {
      this.advance();
      return [Value.fromFloat(0), [tok.start, tok.end]];
    }
    if ([TokenType.Int, TokenType.Hex, TokenType.Oct, TokenType.Bin].includes(tok.type)) {
      this.advance();
      return [Value.fromInt(tok.value), [tok.start, tok.end]];
    }
    if (tok.type === TokenType.Float) {
      this.advance();
      return [Value.fromFloat(tok.value), [tok.start, tok.end]];
    }
    if (tok.type === TokenType.Str) {
      this.advance();
      return [Value.fromStr(tok.value), [tok.start, tok.end]];
    }
    if (this.isAtEnd()) {
      const lastTok = this.tokens[this.tokens.length - 1];
      throw new ParseError(
        "Unexpected EOF in constant expression (source may be truncated)",
        lastTok ? Math.max(0, lastTok.end) : 0
      );
    }
    throw new ParseError(`Expected constant value, got ${tok.type}`, tok.start);
  }
  parseConstExpr() {
    if (this.peek().type === TokenType.Name && this.peek(1).type === TokenType.Dot && this.peek(2).type === TokenType.Name) {
      const enumTok = this.advance();
      this.advance();
      const variantTok = this.advance();
      return new ConstExprEnumVariant(
        enumTok.value,
        [enumTok.start, enumTok.end],
        variantTok.value,
        [variantTok.start, variantTok.end]
      );
    }
    if (this.peek().type === TokenType.Name && this.peek(1).type === TokenType.LBrace) {
      const nameTok = this.advance();
      this.advance();
      this.skipNoise();
      const fields = [];
      if (this.peek().type !== TokenType.RBrace) {
        while (true) {
          const fname = this.expect(TokenType.Name, "Expected field name");
          this.expect(TokenType.Colon, "Expected ':'");
          const val2 = this.parseValue();
          fields.push([fname.value, [fname.start, fname.end], val2[0], val2[1]]);
          this.skipNoise();
          if (!this.match(TokenType.Comma)) break;
          this.skipNoise();
        }
      }
      this.expect(TokenType.RBrace, "Expected '}'");
      return new ConstExprStructLiteral(
        nameTok.value,
        [nameTok.start, nameTok.end],
        fields
      );
    }
    const [val, span2] = this.parseValue();
    return new ConstExprValue(val, span2);
  }
  parseArg() {
    const type_ = this.parseType();
    const nameTok = this.expect(TokenType.Name, "Expected argument name");
    let default_ = null;
    if (this.match(TokenType.Assign)) {
      default_ = this.parseConstExpr();
    }
    return new Arg(nameTok.value, [nameTok.start, nameTok.end], type_, default_);
  }
  parseAsset() {
    const pathTok = this.expect(TokenType.Str, "Expected asset path string");
    let alias = null;
    if (this.match(TokenType.As)) {
      const aliasTok = this.expect(TokenType.Str, "Expected alias string");
      alias = aliasTok.value;
    }
    const name = alias || pathTok.value.split("/").pop().split(".")[0];
    const asset = new Asset(name, pathTok.value, [pathTok.start, pathTok.end]);
    const base = pathTok.value.split("/").pop();
    const m = /^([0-9a-fA-F]{32})\.(svg|png|jpg|jpeg|gif|wav|mp3)$/.exec(base);
    if (m) {
      asset.md5ext = base.toLowerCase();
      asset.assetId = m[1].toLowerCase();
      asset.dataFormat = m[2] === "jpg" ? "jpg" : m[2];
    }
    return asset;
  }
  parseCallArgs() {
    this.skipNoise();
    const args = [];
    const kwargs = {};
    if (this.peek().type === TokenType.RParen) {
      return [args, kwargs];
    }
    while (true) {
      this.skipNoise();
      if (this.peek().type === TokenType.Name && this.peek(1).type === TokenType.Colon) {
        const nameTok = this.advance();
        this.advance();
        const value = this.parseExpr();
        kwargs[nameTok.value] = [[nameTok.start, nameTok.end], value];
      } else {
        args.push(this.parseExpr());
      }
      this.skipNoise();
      if (!this.match(TokenType.Comma)) break;
      this.skipNoise();
    }
    return [args, kwargs];
  }
  parseCommaSeparated(parseFn) {
    const result = [];
    this.skipNoise();
    if (this._isListEnd()) {
      return result;
    }
    while (true) {
      this.skipNoise();
      result.push(parseFn());
      this.skipNoise();
      if (!this.match(TokenType.Comma)) break;
      this.skipNoise();
      if (this._isListEnd()) break;
    }
    return result;
  }
  _isListEnd() {
    const t = this.peek().type;
    return [
      TokenType.RBrace,
      TokenType.RParen,
      TokenType.RBracket,
      TokenType.Semicolon,
      TokenType.Newline
    ].includes(t);
  }
};
// Precedence levels (higher = binds tighter)
__publicField(_Parser, "_PREC_OR", 1);
__publicField(_Parser, "_PREC_AND", 2);
__publicField(_Parser, "_PREC_EQ", 3);
__publicField(_Parser, "_PREC_JOIN", 4);
__publicField(_Parser, "_PREC_CMP", 5);
__publicField(_Parser, "_PREC_ADD", 6);
__publicField(_Parser, "_PREC_MUL", 7);
__publicField(_Parser, "_PREC_POW", 8);
// `^` — AI-compat sugar, right-assoc, desugared
__publicField(_Parser, "_PREC_UNARY", 9);
__publicField(_Parser, "_PREC_TERM", 10);
var Parser = _Parser;
function parse(tokens) {
  const parser = new Parser(tokens);
  const sprite = parser.parse();
  sprite.diagnostics = parser.diagnostics;
  sprite._extraTargets = parser.extraTargets;
  return sprite;
}

// ../backend-js/src/preprocessor.js
var PreProcessorError = class extends Error {
  /**
   * @param {string} kind upstream DiagnosticKind name
   * @param {string} message human-readable detail
   * @param {[number, number]} span [start, end] source offsets
   */
  constructor(kind, message, span2 = [0, 0]) {
    super(`${kind}: ${message}`);
    this.name = "PreProcessorError";
    this.kind = kind;
    this.span = span2;
  }
};
var _KEYWORD_TEXT = {
  [TokenType.Define]: "%define",
  [TokenType.Undef]: "%undef",
  [TokenType.Newline]: "\n",
  [TokenType.Backslash]: "\\",
  [TokenType.Costumes]: "costumes",
  [TokenType.Sounds]: "sounds",
  [TokenType.Local]: "local",
  [TokenType.Proc]: "proc",
  [TokenType.Func]: "func",
  [TokenType.Return]: "return",
  [TokenType.NoWarp]: "nowarp",
  [TokenType.On]: "on",
  [TokenType.OnFlag]: "onflag",
  [TokenType.OnKey]: "onkey",
  [TokenType.OnClick]: "onclick",
  [TokenType.OnBackdrop]: "onbackdrop",
  [TokenType.OnLoudness]: "onloudness",
  [TokenType.OnTimer]: "ontimer",
  [TokenType.OnClone]: "onclone",
  [TokenType.If]: "if",
  [TokenType.Else]: "else",
  [TokenType.Elif]: "elif",
  [TokenType.Until]: "until",
  [TokenType.WaitUntil]: "wait_until",
  [TokenType.Forever]: "forever",
  [TokenType.Repeat]: "repeat",
  [TokenType.Not]: "not",
  [TokenType.And]: "and",
  [TokenType.Or]: "or",
  [TokenType.In]: "in",
  [TokenType.Length]: "length",
  [TokenType.Round]: "round",
  [TokenType.Abs]: "abs",
  [TokenType.Floor]: "floor",
  [TokenType.Ceil]: "ceil",
  [TokenType.Sqrt]: "sqrt",
  [TokenType.Sin]: "sin",
  [TokenType.Cos]: "cos",
  [TokenType.Tan]: "tan",
  [TokenType.Asin]: "asin",
  [TokenType.Acos]: "acos",
  [TokenType.Atan]: "atan",
  [TokenType.Ln]: "ln",
  [TokenType.Log]: "log",
  [TokenType.Antiln]: "antiln",
  [TokenType.Antilog]: "antilog",
  [TokenType.Show]: "show",
  [TokenType.Hide]: "hide",
  [TokenType.Add]: "add",
  [TokenType.To]: "to",
  [TokenType.Delete]: "delete",
  [TokenType.Insert]: "insert",
  [TokenType.At]: "at",
  [TokenType.As]: "as",
  [TokenType.Enum]: "enum",
  [TokenType.Struct]: "struct",
  [TokenType.True_]: "true",
  [TokenType.False_]: "false",
  [TokenType.List]: "list",
  [TokenType.Cloud]: "cloud",
  [TokenType.Var]: "var",
  [TokenType.Orphan]: "orphan",
  [TokenType.set_x]: "set_x",
  [TokenType.set_y]: "set_y",
  [TokenType.set_size]: "set_size",
  [TokenType.point_in_direction]: "point_in_direction",
  [TokenType.set_volume]: "set_volume",
  [TokenType.set_rotation_style_left_right]: "set_rotation_style_left_right",
  [TokenType.set_rotation_style_all_around]: "set_rotation_style_all_around",
  [TokenType.set_rotation_style_do_not_rotate]: "set_rotation_style_do_not_rotate",
  [TokenType.Comma]: ",",
  [TokenType.LParen]: "(",
  [TokenType.RParen]: ")",
  [TokenType.LBrace]: "{",
  [TokenType.RBrace]: "}",
  [TokenType.Assign]: "=",
  [TokenType.Eq]: "==",
  [TokenType.Increment]: "++",
  [TokenType.Decrement]: "--",
  [TokenType.AssignAdd]: "+=",
  [TokenType.AssignSubtract]: "-=",
  [TokenType.AssignMultiply]: "*=",
  [TokenType.AssignDivide]: "/=",
  [TokenType.AssignFloorDiv]: "//=",
  [TokenType.AssignModulo]: "%=",
  [TokenType.AssignJoin]: "&=",
  [TokenType.LBracket]: "[",
  [TokenType.RBracket]: "]",
  [TokenType.Dot]: ".",
  [TokenType.Ne]: "!=",
  [TokenType.Lt]: "<",
  [TokenType.Gt]: ">",
  [TokenType.Le]: "<=",
  [TokenType.Ge]: ">=",
  [TokenType.Amp]: "&",
  [TokenType.Plus]: "+",
  [TokenType.Minus]: "-",
  [TokenType.Star]: "*",
  [TokenType.Slash]: "/",
  [TokenType.FloorDiv]: "//",
  [TokenType.Percent]: "%",
  [TokenType.Semicolon]: ";",
  [TokenType.Colon]: ":",
  [TokenType.Pipe]: "|>",
  [TokenType.Question]: "?",
  [TokenType.Caret]: "^"
};
function tokenToString(token) {
  switch (token.type) {
    case TokenType.Name:
      return token.value;
    case TokenType.Arg:
      return `$${token.value}`;
    case TokenType.Bin:
    case TokenType.Oct:
    case TokenType.Int:
    case TokenType.Hex:
    case TokenType.Float:
      return String(token.value);
    case TokenType.Str:
      return `"${token.value}"`;
    default: {
      const text = _KEYWORD_TEXT[token.type];
      return text !== void 0 ? text : token.type;
    }
  }
}
function tokensEqual(a, b) {
  return a.type === b.type && Object.is(a.value, b.value);
}
function cloneToken(token, start = token.start, end = token.end) {
  return new Token(token.type, token.value, start, end);
}
function cloneDefines(functionDefines, simpleDefines) {
  const fn = /* @__PURE__ */ new Map();
  for (const [name, overloads] of functionDefines) fn.set(name, new Map(overloads));
  return [fn, new Map(simpleDefines)];
}
var _RPAREN = Object.freeze(new Token(TokenType.RParen));
var PreProcessor = class _PreProcessor {
  constructor(tokens) {
    this.tokens = tokens;
    this.i = 0;
    this.simpleDefines = /* @__PURE__ */ new Map();
    this.functionDefines = /* @__PURE__ */ new Map();
  }
  // ~ PreProcessor::apply
  apply() {
    this.process({ start: 0, end: this.tokens.length }, /* @__PURE__ */ new Set());
    this.removeMarkerTokens();
    return this.tokens;
  }
  // ~ looksLikeProcDefinition — true when the Define token at index i opens
  // `define Name { ... }` or `define Name(params) { ... }`. Documented
  // superset: AI models habitually emit JS-style procedure definitions where
  // upstream only has constant/function macros (`define NAME value`). The
  // def-shape wins over the (exotic) brace-initial macro body; everything
  // else keeps exact macro semantics.
  looksLikeProcDefinition(i) {
    const toks = this.tokens;
    const isNoise = (t) => t.type === TokenType.Newline || t.type === TokenType.Backslash;
    if (!toks[i + 1] || toks[i + 1].type !== TokenType.Name) return false;
    let j = i + 2;
    while (j < toks.length && isNoise(toks[j])) j += 1;
    if (j >= toks.length) return false;
    if (toks[j].type === TokenType.LBrace) return true;
    if (toks[j].type !== TokenType.LParen) return false;
    let depth = 0;
    while (j < toks.length) {
      if (toks[j].type === TokenType.LParen) depth += 1;
      else if (toks[j].type === TokenType.RParen) {
        depth -= 1;
        if (depth === 0) break;
      }
      j += 1;
    }
    if (j >= toks.length) return false;
    j += 1;
    while (j < toks.length && isNoise(toks[j])) j += 1;
    return j < toks.length && toks[j].type === TokenType.LBrace;
  }
  // ~ PreProcessor::process
  process(span2, suppress) {
    let dirty = false;
    this.i = span2.start;
    while (this.i < span2.end) {
      if (this.tokens[this.i].type === TokenType.Define && this.looksLikeProcDefinition(this.i)) {
        this.tokens[this.i].type = TokenType.Proc;
        this.i += 1;
        continue;
      }
      const defineName = this.parseDefineBegin(span2);
      if (defineName !== null) {
        if (this.parseFunctionDefine(span2, defineName)) continue;
        this.parseSimpleDefine(span2, defineName);
        continue;
      }
      if (this.parseUndef(span2)) continue;
      if (this.substituteSimpleDefine(span2, suppress)) continue;
      if (this.substituteFunctionDefine(span2, suppress)) continue;
      if (this.substituteConcat(span2, suppress)) {
        dirty = true;
        continue;
      }
      if (this.substituteStringify(span2)) {
        dirty = true;
        continue;
      }
      this.i += 1;
    }
    if (dirty) {
      this.process(span2, suppress);
    }
  }
  // ~ remove_marker_tokens — strips marker noise before parsing. Newline is
  // intentionally KEPT (see file header divergence note).
  removeMarkerTokens() {
    const kept = this.tokens.filter((tok) => tok.type !== TokenType.Define && tok.type !== TokenType.Undef && tok.type !== TokenType.Backslash);
    this.tokens.length = 0;
    for (const tok of kept) this.tokens.push(tok);
  }
  expectNoEof() {
    if (this.i >= this.tokens.length) {
      const span2 = this.i > 0 ? [this.tokens[this.i - 1].start, this.tokens[this.i - 1].end] : [0, 0];
      throw new PreProcessorError("UnrecognizedEof", "unexpected end of input", span2);
    }
  }
  removeToken(span2) {
    this.tokens.splice(this.i, 1);
    span2.end -= 1;
  }
  // ~ parse_define_begin: consumes `Define Name` and returns the name token.
  parseDefineBegin(span2) {
    if (this.tokens[this.i].type !== TokenType.Define) return null;
    this.i += 1;
    this.expectNoEof();
    const name = this.tokens[this.i];
    this.i -= 1;
    this.removeToken(span2);
    this.removeToken(span2);
    return name;
  }
  // ~ parse_function_define: `%define NAME(a, b) body`. Returns false when
  // the next token is not `(` (caller falls back to a simple define).
  parseFunctionDefine(span2, defineName) {
    this.expectNoEof();
    if (this.tokens[this.i].type !== TokenType.LParen) return false;
    this.i += 1;
    this.expectNoEof();
    let name = this.tokens[this.i];
    this.i -= 1;
    if (name.type !== TokenType.Name && name.type !== TokenType.RParen) return false;
    this.removeToken(span2);
    const args = [];
    while (!tokensEqual(name, _RPAREN)) {
      if (name.type !== TokenType.Comma) args.push(cloneToken(name));
      this.removeToken(span2);
      this.expectNoEof();
      name = this.tokens[this.i];
    }
    this.removeToken(span2);
    const arity = args.length;
    const body = this.parseDefineBody(span2);
    const key = tokenToString(defineName);
    let overloads = this.functionDefines.get(key);
    if (overloads === void 0) {
      overloads = /* @__PURE__ */ new Map();
      this.functionDefines.set(key, overloads);
    }
    overloads.set(arity, { params: args, body });
    return true;
  }
  // ~ parse_simple_define
  parseSimpleDefine(span2, defineName) {
    const key = tokenToString(defineName);
    const body = this.parseDefineBody(span2);
    this.simpleDefines.set(key, body);
  }
  // ~ parse_define_body: tokens until Newline; Backslash joins lines.
  parseDefineBody(span2) {
    const body = [];
    this.expectNoEof();
    let token = this.tokens[this.i];
    while (true) {
      if (token.type === TokenType.Backslash) {
        this.removeToken(span2);
        this.expectNoEof();
        this.removeToken(span2);
        this.expectNoEof();
        token = this.tokens[this.i];
      }
      if (token.type === TokenType.Newline) break;
      body.push(cloneToken(token));
      this.removeToken(span2);
      this.expectNoEof();
      token = this.tokens[this.i];
    }
    this.removeToken(span2);
    return body;
  }
  // ~ substitute_simple_define
  substituteSimpleDefine(span2, suppress) {
    const tok = this.tokens[this.i];
    const nameSpan = [tok.start, tok.end];
    const macroName = tokenToString(tok);
    const body = this.simpleDefines.get(macroName);
    if (body === void 0) return false;
    if (suppress.has(macroName)) return false;
    if (body.length === 0) {
      this.tokens.splice(this.i, 1);
      span2.end = Math.max(0, span2.end - 1);
      return true;
    }
    const inserted = body.map((t) => cloneToken(t, nameSpan[0], nameSpan[1]));
    this.tokens.splice(this.i, 1, ...inserted);
    const innerSuppress = new Set(suppress);
    innerSuppress.add(macroName);
    span2.end += inserted.length - 1;
    const subspanEnd = this.i + inserted.length;
    const subspan = { start: this.i, end: subspanEnd };
    this.process(subspan, innerSuppress);
    span2.end += subspan.end - subspanEnd;
    return true;
  }
  // ~ substitute_function_define
  substituteFunctionDefine(span2, suppress) {
    const tok = this.tokens[this.i];
    const nameSpan = [tok.start, tok.end];
    const macroName = tokenToString(tok);
    const overloads = this.functionDefines.get(macroName);
    if (overloads === void 0) return false;
    if (suppress.has(macroName)) return false;
    const next = this.tokens[this.i + 1];
    if (next === void 0 || next.type !== TokenType.LParen) return false;
    const [args] = this.parseMacroCallArgs(span2);
    const arity = args.length;
    const def = overloads.get(arity);
    if (def === void 0) {
      const expected = overloads.keys().next();
      throw new PreProcessorError(
        "MacroArgsCountMismatch",
        `macro '${macroName}' expects ${expected.done ? 0 : expected.value} argument(s), given ${arity}`,
        nameSpan
      );
    }
    const { params, body } = def;
    let j = this.i;
    for (const bodyTok of body) {
      const pos = params.findIndex((p) => tokensEqual(p, bodyTok));
      if (pos >= 0) {
        for (const argTok of args[pos]) {
          this.tokens.splice(j, 0, cloneToken(argTok, nameSpan[0], nameSpan[1]));
          j += 1;
          span2.end += 1;
        }
      } else {
        this.tokens.splice(j, 0, cloneToken(bodyTok, nameSpan[0], nameSpan[1]));
        j += 1;
        span2.end += 1;
      }
    }
    const innerSuppress = new Set(suppress);
    innerSuppress.add(macroName);
    const subspan = { start: this.i, end: j };
    this.process(subspan, innerSuppress);
    span2.end += subspan.end - j;
    return true;
  }
  // ~ parse_undef: removes ALL overloads for the name.
  parseUndef(span2) {
    if (this.tokens[this.i].type !== TokenType.Undef) return false;
    this.removeToken(span2);
    this.expectNoEof();
    const name = tokenToString(this.tokens[this.i]);
    this.functionDefines.delete(name);
    this.simpleDefines.delete(name);
    this.removeToken(span2);
    return true;
  }
  // ~ substitute_stringify: STRINGIFY(...) -> single Str token.
  substituteStringify(span2) {
    const tok = this.tokens[this.i];
    if (tok.type !== TokenType.Name || tok.value !== "STRINGIFY") return false;
    const nameSpan = [tok.start, tok.end];
    const next = this.tokens[this.i + 1];
    if (next === void 0 || next.type !== TokenType.LParen) return false;
    this.removeToken(span2);
    this.removeToken(span2);
    this.expectNoEof();
    const parts = [];
    let parens = 0;
    while (true) {
      const cur = this.tokens[this.i];
      if (cur.type === TokenType.RParen && parens === 0) {
        this.removeToken(span2);
        break;
      }
      if (cur.type === TokenType.LParen) parens += 1;
      else if (cur.type === TokenType.RParen) parens -= 1;
      parts.push(tokenToString(cur));
      this.removeToken(span2);
      this.expectNoEof();
    }
    this.tokens.splice(
      this.i,
      0,
      new Token(TokenType.Str, parts.join(" "), nameSpan[0], nameSpan[1])
    );
    span2.end += 1;
    return true;
  }
  // ~ parse_macro_call_args: consumes `NAME ( a, b )`, returns argument
  // token-lists split on top-level commas (nested parens respected).
  parseMacroCallArgs(span2) {
    this.removeToken(span2);
    const open = this.tokens[this.i];
    if (open === void 0 || open.type !== TokenType.LParen) {
      throw new PreProcessorError(
        "UnrecognizedToken",
        `expected '(', got ${open ? open.type : "EOF"}`,
        open ? [open.start, open.end] : [0, 0]
      );
    }
    this.removeToken(span2);
    this.expectNoEof();
    const argsStart = this.i;
    let token = this.tokens[this.i];
    const args = [];
    let arg = [];
    if (token.type !== TokenType.RParen) {
      let parens = 0;
      while (parens >= 0) {
        if (token.type === TokenType.LParen) {
          parens += 1;
          arg.push(cloneToken(token));
        } else if (token.type === TokenType.RParen) {
          parens -= 1;
          if (parens < 0) {
            args.push(arg);
            arg = [];
          } else {
            arg.push(cloneToken(token));
          }
        } else if (token.type === TokenType.Comma && parens === 0) {
          args.push(arg);
          arg = [];
        } else {
          arg.push(cloneToken(token));
        }
        this.removeToken(span2);
        if (parens >= 0) {
          this.expectNoEof();
          token = this.tokens[this.i];
        }
      }
    } else {
      this.removeToken(span2);
    }
    const argsEnd = this.i;
    return [args, argsStart, argsEnd];
  }
  // ~ expand_token_list: expand a detached token list with cloned defines.
  expandTokenList(tokens, suppress) {
    const spanned = tokens.map((t) => cloneToken(t, 0, 0));
    if (spanned.length > 0) {
      const sub = new _PreProcessor(spanned);
      [sub.functionDefines, sub.simpleDefines] = cloneDefines(this.functionDefines, this.simpleDefines);
      sub.process({ start: 0, end: spanned.length }, suppress);
      sub.removeMarkerTokens();
    }
    return spanned;
  }
  // ~ peek_macro_call_args: look ahead without consuming; null if no `(`.
  peekMacroCallArgs() {
    let k = this.i + 1;
    if (k >= this.tokens.length || this.tokens[k].type !== TokenType.LParen) {
      return null;
    }
    k += 1;
    if (k >= this.tokens.length) {
      const prev = this.tokens[k - 1];
      throw new PreProcessorError(
        "UnrecognizedEof",
        "unexpected end of input",
        [prev.start, prev.end]
      );
    }
    const args = [];
    let arg = [];
    let token = this.tokens[k];
    if (token.type !== TokenType.RParen) {
      let parens = 0;
      while (parens >= 0) {
        if (token.type === TokenType.LParen) {
          parens += 1;
          arg.push(cloneToken(token));
        } else if (token.type === TokenType.RParen) {
          parens -= 1;
          if (parens < 0) {
            args.push(arg);
            arg = [];
          } else {
            arg.push(cloneToken(token));
          }
        } else if (token.type === TokenType.Comma && parens === 0) {
          args.push(arg);
          arg = [];
        } else {
          arg.push(cloneToken(token));
        }
        k += 1;
        if (parens >= 0) {
          if (k >= this.tokens.length) {
            const prev = this.tokens[k - 1];
            throw new PreProcessorError(
              "UnrecognizedEof",
              "unexpected end of input",
              [prev.start, prev.end]
            );
          }
          token = this.tokens[k];
        }
      }
    }
    return args;
  }
  // ~ concat_tokens: paste two token texts and re-lex; the result must be
  // exactly one token covering the whole pasted text.
  concatTokens(left, right, span2) {
    const pasted = tokenToString(left) + tokenToString(right);
    try {
      const tokens = new Lexer(pasted).lex();
      if (tokens.length === 1 && tokens[0].start === 0 && tokens[0].end === pasted.length) {
        return tokens[0];
      }
    } catch (e) {
      if (e instanceof LexError) {
        throw new PreProcessorError("InvalidToken", `CONCAT cannot paste '${pasted}'`, span2);
      }
      throw e;
    }
    throw new PreProcessorError("InvalidToken", `CONCAT cannot paste '${pasted}'`, span2);
  }
  // ~ substitute_concat: arguments are macro-expanded BEFORE pasting; on
  // invalid pastes the error is raised before any token is consumed.
  substituteConcat(span2, suppress) {
    const tok = this.tokens[this.i];
    if (tok.type !== TokenType.Name || tok.value !== "CONCAT") return false;
    const nameSpan = [tok.start, tok.end];
    const args = this.peekMacroCallArgs();
    if (args === null) return false;
    if (args.length !== 2) {
      throw new PreProcessorError(
        "MacroArgsCountMismatch",
        `CONCAT expects 2 arguments, given ${args.length}`,
        nameSpan
      );
    }
    const left = this.expandTokenList(args[0], suppress);
    const right = this.expandTokenList(args[1], suppress);
    if (left.length !== 1 || right.length !== 1) {
      throw new PreProcessorError(
        "InvalidToken",
        "CONCAT arguments must each expand to exactly one token",
        nameSpan
      );
    }
    const pasted = this.concatTokens(left[0], right[0], nameSpan);
    this.parseMacroCallArgs(span2);
    this.tokens.splice(this.i, 0, pasted);
    span2.end += 1;
    return true;
  }
};
function preprocess(tokens) {
  return new PreProcessor(tokens).apply();
}

// ../backend-js/src/visitor.js
function visitProjectPass0(project) {
  const diagnostics = [];
  _visitSpritePass0(project.stage, project, diagnostics);
  for (const sprite of Object.values(project.sprites)) {
    _visitSpritePass0(sprite, project, diagnostics);
  }
  return diagnostics;
}
function _visitSpritePass0(sprite, project, diagnostics) {
  for (const enum_ of Object.values(sprite.enums)) {
    let counter = 0;
    for (const variant of enum_.variants) {
      if (variant.value !== null && variant.value !== void 0) {
        const explicit = variant.value[0];
        if (explicit && explicit.kind === "number") {
          counter = explicit.toNumber();
        }
      } else {
        variant.value = [Value.fromFloat(counter), variant.span];
        counter += 1;
      }
    }
  }
  for (const procName of Object.keys(sprite.proc_definitions)) {
    const body = sprite.proc_definitions[procName];
    if (!sprite.proc_locals[procName]) sprite.proc_locals[procName] = {};
    _collectVars(body, sprite, sprite.proc_locals[procName], project);
  }
  for (const funcName of Object.keys(sprite.func_definitions)) {
    const body = sprite.func_definitions[funcName];
    if (!sprite.func_locals[funcName]) sprite.func_locals[funcName] = {};
    _collectVars(body, sprite, sprite.func_locals[funcName], project);
    const func = sprite.funcs[funcName];
    const retVar = new Var(
      `returnedFunc:${funcName}`,
      func.span,
      func.type_ || new TypeValue(),
      null,
      false
    );
    retVar.is_used = true;
    sprite.vars[`returnedFunc:${funcName}`] = retVar;
  }
  for (const event of sprite.events) {
    _collectVars(event.body, sprite, {}, project);
  }
}
function _collectVars(stmts, sprite, localsDict, project) {
  for (const stmt of stmts) {
    if (stmt instanceof StmtSetVar && stmt.is_local) {
      const name = stmt.name instanceof Name ? stmt.name.name : stmt.name.lhs;
      const existing = localsDict[name];
      const isValueType = (t) => !(t instanceof TypeStruct);
      if (existing !== void 0) {
        if (isValueType(existing.type_)) {
          localsDict[name] = new Var(
            name,
            stmt.name.span || [0, 0],
            stmt.type_,
            null,
            !!stmt.is_cloud,
            false
          );
        }
      } else {
        localsDict[name] = new Var(
          name,
          stmt.name.span || [0, 0],
          stmt.type_,
          null,
          !!stmt.is_cloud,
          false
        );
      }
    } else if (stmt instanceof StmtSetVar && !stmt.is_local) {
      const name = stmt.name instanceof Name ? stmt.name.name : stmt.name.lhs;
      if (!(name in sprite.vars) && !(name in localsDict)) {
        const bare = name.startsWith("__") ? name.slice(2) : name;
        const isGlobal = name in project.stage.vars || bare in project.stage.vars;
        if (!isGlobal) {
          sprite.vars[name] = new Var(
            name,
            stmt.name.span || [0, 0],
            stmt.type_,
            null,
            !!stmt.is_cloud,
            false
          );
        }
      }
    }
    const _ensureList = (nm, sp) => {
      if (!(nm in sprite.lists) && !(nm in sprite.vars) && !(nm in project.stage.lists) && !(nm in project.stage.vars)) {
        sprite.lists[nm] = new ListNode(
          nm,
          sp || [0, 0],
          new TypeValue(),
          new ListDefaultValues([])
        );
      }
    };
    const _nmOf = (n) => n instanceof Name ? n.name : String(n);
    if (stmt instanceof StmtAddToList || stmt instanceof StmtDeleteList) {
      _ensureList(_nmOf(stmt.name), stmt.name && stmt.name.span);
    } else if (stmt instanceof StmtSetListIndex || stmt instanceof StmtDeleteListIndex || stmt instanceof StmtInsertAtList) {
      _ensureList(_nmOf(stmt.name), stmt.name && stmt.name.span);
    }
    if (stmt instanceof StmtRepeat || stmt instanceof StmtForever || stmt instanceof StmtUntil) {
      _collectVars(stmt.body, sprite, localsDict, project);
    } else if (stmt instanceof StmtBranch) {
      _collectVars(stmt.if_body, sprite, localsDict, project);
      _collectVars(stmt.else_body, sprite, localsDict, project);
    }
  }
}
function visitProjectPass1(project) {
  const diagnostics = [];
  const sprites = [project.stage, ...Object.values(project.sprites)];
  for (const sprite of sprites) {
    _visitSpritePass1(sprite, project);
  }
  return diagnostics;
}
function _visitSpritePass1(sprite, project) {
  const callsiteCounter = [0];
  for (const procName of Object.keys(sprite.proc_definitions)) {
    sprite.proc_definitions[procName] = _expandFuncCalls(
      sprite.proc_definitions[procName],
      sprite,
      callsiteCounter,
      null
    );
  }
  for (const funcName of Object.keys(sprite.func_definitions)) {
    sprite.func_definitions[funcName] = _expandFuncCalls(
      sprite.func_definitions[funcName],
      sprite,
      callsiteCounter,
      funcName
    );
  }
  for (const event of sprite.events) {
    event.body = _expandFuncCalls(event.body, sprite, callsiteCounter, null);
    if (event.kind && (event.kind.kind === "OnLoudnessGt" || event.kind.kind === "OnTimerGt") && event.kind.value) {
      const [newValue] = _expandExprFuncCalls(event.kind.value, sprite, callsiteCounter);
      event.kind.value = newValue;
    }
  }
  for (const funcName of Object.keys(sprite.func_definitions)) {
    let body = sprite.func_definitions[funcName];
    const _lastStmt = body.length ? body[body.length - 1] : null;
    const _lastName = _lastStmt && _lastStmt.name ? _lastStmt.name instanceof Name ? _lastStmt.name.name : String(_lastStmt.name) : null;
    const _endsWithExplicitReturn = _lastName === "returnedFunc:" + funcName || _lastStmt instanceof StmtBlock || _lastStmt instanceof StmtReturn;
    if (!_endsWithExplicitReturn) {
      body = body.concat([new StmtSetVar(
        new Name(`returnedFunc:${funcName}`, [0, 0]),
        new ExprValue(Value.fromFloat(0), [0, 0]),
        new TypeValue(),
        false,
        false
      )]);
    }
    sprite.proc_definitions[funcName] = body;
    sprite.proc_args[funcName] = sprite.func_args[funcName] || [];
    sprite.procs[funcName] = sprite.funcs[funcName];
    sprite.proc_locals[funcName] = sprite.func_locals[funcName] || {};
  }
}
function _expandFuncCalls(stmts, sprite, counter, funcName = null) {
  const result = [];
  for (const stmt of stmts) {
    const [before, newStmt] = _expandStmtFuncCalls(stmt, sprite, counter, funcName);
    result.push(...before);
    if (newStmt !== null) {
      result.push(newStmt);
    }
  }
  return result;
}
function _cloneCallsiteStmt(stmt) {
  if (stmt instanceof StmtFuncCall) {
    const kwargs = {};
    for (const k of Object.keys(stmt.kwargs || {})) {
      kwargs[k] = _cloneCallExpr(stmt.kwargs[k]);
    }
    return new StmtFuncCall(stmt.name, stmt.span, stmt.args.map(_cloneCallExpr), kwargs);
  }
  if (stmt instanceof StmtSetVar) {
    const name = stmt.name instanceof Name ? new Name(stmt.name.name, stmt.name.span) : stmt.name;
    return new StmtSetVar(name, _cloneCallExpr(stmt.value), stmt.type_, stmt.is_local, stmt.is_cloud);
  }
  return stmt;
}
function _cloneCallExpr(expr) {
  if (expr === null || expr === void 0) return expr;
  if (expr instanceof ExprValue) return new ExprValue(expr.value, expr.span);
  if (expr instanceof ExprName) {
    return new ExprName(
      expr.name instanceof Name ? new Name(expr.name.name, expr.name.span) : expr.name
    );
  }
  if (expr instanceof ExprBinOp) {
    return new ExprBinOp(expr.op, expr.span, _cloneCallExpr(expr.lhs), _cloneCallExpr(expr.rhs));
  }
  if (expr instanceof ExprUnOp) {
    return new ExprUnOp(expr.op, expr.span, _cloneCallExpr(expr.opr));
  }
  if (expr instanceof ExprTernary) {
    return new ExprTernary(
      _cloneCallExpr(expr.cond),
      _cloneCallExpr(expr.then),
      _cloneCallExpr(expr.els),
      expr.span
    );
  }
  if (expr instanceof ExprRepr) {
    return new ExprRepr(expr.repr, expr.span, expr.args.map(_cloneCallExpr));
  }
  return expr;
}
function _expandStmtFuncCalls(stmt, sprite, counter, funcName = null) {
  const before = [];
  if (stmt instanceof StmtReturn) {
    const [newExpr, b] = _expandExprFuncCalls(stmt.value, sprite, counter);
    stmt.value = newExpr;
    before.push(...b);
    if (!stmt.visited) {
      stmt.visited = true;
      if (funcName) {
        before.push(new StmtSetVar(
          new Name(`returnedFunc:${funcName}`, [0, 0]),
          newExpr,
          new TypeValue(),
          false,
          false
        ));
        return [before, new StmtReturn(new ExprValue(Value.fromFloat(0), [0, 0]), true)];
      }
    }
    return [before, stmt];
  }
  if (stmt instanceof StmtSetVar) {
    const [newExpr, b] = _expandExprFuncCalls(stmt.value, sprite, counter);
    stmt.value = newExpr;
    before.push(...b);
    return [before, stmt];
  }
  if (stmt instanceof StmtChangeVar) {
    const [newExpr, b] = _expandExprFuncCalls(stmt.value, sprite, counter);
    stmt.value = newExpr;
    before.push(...b);
    return [before, stmt];
  }
  if (stmt instanceof StmtAddToList) {
    const [newExpr, b] = _expandExprFuncCalls(stmt.value, sprite, counter);
    stmt.value = newExpr;
    before.push(...b);
    return [before, stmt];
  }
  if (stmt instanceof StmtSetListIndex) {
    const [newVal, b] = _expandExprFuncCalls(stmt.value, sprite, counter);
    stmt.value = newVal;
    const [newIdx, b2] = _expandExprFuncCalls(stmt.index, sprite, counter);
    stmt.index = newIdx;
    before.push(...b, ...b2);
    return [before, stmt];
  }
  if (stmt instanceof StmtInsertAtList) {
    const [newVal, b] = _expandExprFuncCalls(stmt.value, sprite, counter);
    stmt.value = newVal;
    const [newIdx, b2] = _expandExprFuncCalls(stmt.index, sprite, counter);
    stmt.index = newIdx;
    before.push(...b, ...b2);
    return [before, stmt];
  }
  if (stmt instanceof StmtBlock) {
    const newArgs = [];
    for (const arg of stmt.args) {
      const [newArg, b] = _expandExprFuncCalls(arg, sprite, counter);
      before.push(...b);
      newArgs.push(newArg);
    }
    stmt.args = newArgs;
    return [before, stmt];
  }
  if (stmt instanceof StmtProcCall) {
    const newArgs = [];
    for (const arg of stmt.args) {
      const [newArg, b] = _expandExprFuncCalls(arg, sprite, counter);
      before.push(...b);
      newArgs.push(newArg);
    }
    stmt.args = newArgs;
    return [before, stmt];
  }
  if (stmt instanceof StmtRepeat) {
    const [newExpr, b] = _expandExprFuncCalls(stmt.times, sprite, counter);
    stmt.times = newExpr;
    before.push(...b);
    stmt.body = _expandFuncCalls(stmt.body, sprite, counter, funcName);
    return [before, stmt];
  }
  if (stmt instanceof StmtUntil) {
    const condCallsites = [];
    const [newCond, b] = _expandExprFuncCalls(stmt.cond, sprite, counter);
    stmt.cond = newCond;
    condCallsites.push(...b);
    stmt.body = _expandFuncCalls(stmt.body, sprite, counter, funcName);
    before.push(...condCallsites);
    stmt.body.push(...condCallsites.map(_cloneCallsiteStmt));
    return [before, stmt];
  }
  if (stmt instanceof StmtForever) {
    stmt.body = _expandFuncCalls(stmt.body, sprite, counter, funcName);
    return [before, stmt];
  }
  if (stmt instanceof StmtBranch) {
    const [newExpr, b] = _expandExprFuncCalls(stmt.cond, sprite, counter);
    stmt.cond = newExpr;
    before.push(...b);
    stmt.if_body = _expandFuncCalls(stmt.if_body, sprite, counter, funcName);
    stmt.else_body = _expandFuncCalls(stmt.else_body, sprite, counter, funcName);
    return [before, stmt];
  }
  if (stmt instanceof StmtWaitUntil) {
    const [newExpr, b] = _expandExprFuncCalls(stmt.cond, sprite, counter);
    stmt.cond = newExpr;
    before.push(...b);
    return [before, stmt];
  }
  if (stmt instanceof StmtDeleteListIndex) {
    const [newExpr, b] = _expandExprFuncCalls(stmt.index, sprite, counter);
    stmt.index = newExpr;
    before.push(...b);
    return [before, stmt];
  }
  if (stmt instanceof StmtFuncCall) {
    const newArgs = [];
    for (const arg of stmt.args) {
      const [newArg, b] = _expandExprFuncCalls(arg, sprite, counter);
      before.push(...b);
      newArgs.push(newArg);
    }
    stmt.args = newArgs;
    if (stmt.name in sprite.funcs) {
      return [before, new StmtProcCall(stmt.name, stmt.span, stmt.args, stmt.kwargs || {})];
    }
    return [before, stmt];
  }
  return [before, stmt];
}
function _expandExprFuncCalls(expr, sprite, counter) {
  const before = [];
  if (expr === null || expr === void 0) {
    return [expr, before];
  }
  if (expr instanceof ExprFuncCall) {
    if (!(expr.name in sprite.funcs)) {
      return [expr, before];
    }
    const newArgs = [];
    for (const arg of expr.args) {
      const [newArg, argBefore] = _expandExprFuncCalls(arg, sprite, counter);
      before.push(...argBefore);
      newArgs.push(newArg);
    }
    before.push(new StmtProcCall(expr.name, expr.span, newArgs, {}));
    counter[0] += 1;
    const tmpName = `__ret_${counter[0]}`;
    const tmpVar = new Var(tmpName, expr.span || [0, 0], new TypeValue(), null, false);
    tmpVar.is_used = true;
    sprite.vars[tmpName] = tmpVar;
    before.push(new StmtSetVar(
      new Name(tmpName, expr.span || [0, 0]),
      new ExprName(new Name(`returnedFunc:${expr.name}`, expr.span)),
      new TypeValue(),
      false,
      false
    ));
    return [new ExprName(new Name(tmpName, expr.span || [0, 0])), before];
  }
  if (expr instanceof ExprBinOp) {
    const [newLhs, b] = _expandExprFuncCalls(expr.lhs, sprite, counter);
    expr.lhs = newLhs;
    before.push(...b);
    const [newRhs, b2] = _expandExprFuncCalls(expr.rhs, sprite, counter);
    expr.rhs = newRhs;
    before.push(...b2);
    return [expr, before];
  }
  if (expr instanceof ExprUnOp) {
    const [newOpr, b] = _expandExprFuncCalls(expr.opr, sprite, counter);
    expr.opr = newOpr;
    before.push(...b);
    return [expr, before];
  }
  if (expr instanceof ExprTernary) {
    const [newCond, b0] = _expandExprFuncCalls(expr.cond, sprite, counter);
    const [newThen] = _expandExprFuncCalls(expr.then, sprite, counter);
    const [newEls] = _expandExprFuncCalls(expr.els, sprite, counter);
    counter[0] += 1;
    const tmpName = `__tern_${counter[0]}`;
    const tmpVar = new Var(
      tmpName,
      expr.span || [0, 0],
      new TypeValue(),
      null,
      false
    );
    tmpVar.is_used = true;
    sprite.vars[tmpName] = tmpVar;
    before.push(...b0);
    before.push(new StmtBranch(
      newCond,
      [new StmtSetVar(new Name(tmpName, expr.span || [0, 0]), newThen, new TypeValue(), false, false)],
      [new StmtSetVar(new Name(tmpName, expr.span || [0, 0]), newEls, new TypeValue(), false, false)],
      true
    ));
    return [new ExprName(new Name(tmpName, expr.span || [0, 0])), before];
  }
  if (expr instanceof ExprRepr) {
    const newArgs = [];
    for (const arg of expr.args) {
      const [newArg, b] = _expandExprFuncCalls(arg, sprite, counter);
      before.push(...b);
      newArgs.push(newArg);
    }
    expr.args = newArgs;
    return [expr, before];
  }
  return [expr, before];
}
function visitProjectPass2(project) {
  const diagnostics = [];
  const sprites = [project.stage, ...Object.values(project.sprites)];
  for (const sprite of sprites) {
    _visitSpritePass2(sprite, project, diagnostics);
  }
  return diagnostics;
}
function _visitSpritePass2(sprite, project, diagnostics) {
  for (const procName of Object.keys(sprite.proc_definitions)) {
    sprite.proc_definitions[procName] = _transformStmts(
      sprite.proc_definitions[procName],
      sprite,
      project,
      diagnostics,
      true
    );
  }
  for (const funcName of Object.keys(sprite.func_definitions)) {
    sprite.func_definitions[funcName] = _transformStmts(
      sprite.func_definitions[funcName],
      sprite,
      project,
      diagnostics,
      true
    );
  }
  for (const event of sprite.events) {
    event.body = _transformStmts(event.body, sprite, project, diagnostics, true);
    if (event.kind && (event.kind.kind === "OnLoudnessGt" || event.kind.kind === "OnTimerGt") && event.kind.value) {
      event.kind.value = _transformExpr(event.kind.value, sprite, project, diagnostics);
    }
  }
}
function _transformStmts(stmts, sprite, project, diagnostics, topLevel = true) {
  for (const stmt of stmts) {
    _transformStmt(stmt, sprite, project, diagnostics);
  }
  const result = [];
  for (let i = 0; i < stmts.length; i++) {
    const stmt = stmts[i];
    if (stmt instanceof StmtReturn) {
      if (topLevel && i === stmts.length - 1) {
        continue;
      }
      result.push(new StmtBlock(Block.StopThisScript, [0, 0], [], {}));
      continue;
    }
    result.push(stmt);
  }
  return result;
}
function _transformStmt(stmt, sprite, project, diagnostics) {
  if (stmt instanceof StmtRepeat || stmt instanceof StmtUntil) {
    if ("times" in stmt && stmt.times !== void 0) {
      stmt.times = _transformExpr(stmt.times, sprite, project, diagnostics);
    } else if ("cond" in stmt && stmt.cond !== void 0) {
      stmt.cond = _transformExpr(stmt.cond, sprite, project, diagnostics);
    }
    stmt.body = _transformStmts(stmt.body, sprite, project, diagnostics, false);
  } else if (stmt instanceof StmtForever) {
    stmt.body = _transformStmts(stmt.body, sprite, project, diagnostics, false);
  } else if (stmt instanceof StmtBranch) {
    stmt.cond = _transformExpr(stmt.cond, sprite, project, diagnostics);
    stmt.if_body = _transformStmts(stmt.if_body, sprite, project, diagnostics, false);
    stmt.else_body = _transformStmts(stmt.else_body, sprite, project, diagnostics, false);
  } else if (stmt instanceof StmtSetVar || stmt instanceof StmtChangeVar || stmt instanceof StmtAddToList) {
    stmt.value = _transformExpr(stmt.value, sprite, project, diagnostics);
  } else if (stmt instanceof StmtSetListIndex) {
    stmt.index = _transformExpr(stmt.index, sprite, project, diagnostics);
    stmt.value = _transformExpr(stmt.value, sprite, project, diagnostics);
  } else if (stmt instanceof StmtInsertAtList) {
    stmt.index = _transformExpr(stmt.index, sprite, project, diagnostics);
    stmt.value = _transformExpr(stmt.value, sprite, project, diagnostics);
  } else if (stmt instanceof StmtDeleteListIndex) {
    stmt.index = _transformExpr(stmt.index, sprite, project, diagnostics);
  } else if (stmt instanceof StmtWaitUntil) {
    stmt.cond = _transformExpr(stmt.cond, sprite, project, diagnostics);
  } else if (stmt instanceof StmtReturn) {
    stmt.value = _transformExpr(stmt.value, sprite, project, diagnostics);
  } else if (stmt instanceof StmtBlock || stmt instanceof StmtProcCall || stmt instanceof StmtFuncCall) {
    stmt.args = stmt.args.map((a) => _transformExpr(a, sprite, project, diagnostics));
  }
}
function _isBooleanExpr(expr) {
  if (expr instanceof ExprBinOp) {
    return expr.op === BinOp.Eq || expr.op === BinOp.Ne || expr.op === BinOp.Lt || expr.op === BinOp.Gt || expr.op === BinOp.Le || expr.op === BinOp.Ge || expr.op === BinOp.And || expr.op === BinOp.Or || expr.op === BinOp.In;
  }
  if (expr instanceof ExprUnOp) {
    return expr.op === UnOp.Not;
  }
  if (expr instanceof ExprRepr) {
    return expr.repr === Repr.Contains || expr.repr === Repr.Touching || expr.repr === Repr.TouchingMousePointer || expr.repr === Repr.TouchingEdge || expr.repr === Repr.KeyPressed || expr.repr === Repr.MouseDown;
  }
  return false;
}
function _transformExpr(expr, sprite, project, diagnostics) {
  if (expr === null || expr === void 0) {
    return expr;
  }
  if (expr instanceof ExprBinOp) {
    expr.lhs = _transformExpr(expr.lhs, sprite, project, diagnostics);
    expr.rhs = _transformExpr(expr.rhs, sprite, project, diagnostics);
  } else if (expr instanceof ExprUnOp) {
    expr.opr = _transformExpr(expr.opr, sprite, project, diagnostics);
  } else if (expr instanceof ExprRepr) {
    expr.args = expr.args.map((a) => _transformExpr(a, sprite, project, diagnostics));
  } else if (expr instanceof ExprTernary) {
    expr.cond = _transformExpr(expr.cond, sprite, project, diagnostics);
    expr.then = _transformExpr(expr.then, sprite, project, diagnostics);
    expr.els = _transformExpr(expr.els, sprite, project, diagnostics);
  }
  if (expr instanceof ExprUnOp && expr.op === UnOp.Minus) {
    const zero = new ExprValue(Value.fromFloat(0), expr.span);
    expr = new ExprBinOp(BinOp.Sub, expr.span, zero, expr.opr);
    return _transformExpr(expr, sprite, project, diagnostics);
  }
  if (expr instanceof ExprBinOp && expr.op === BinOp.Le) {
    const gt = new ExprBinOp(BinOp.Gt, expr.span, expr.lhs, expr.rhs);
    expr = new ExprUnOp(UnOp.Not, expr.span, gt);
    return _transformExpr(expr, sprite, project, diagnostics);
  }
  if (expr instanceof ExprBinOp && expr.op === BinOp.Ge) {
    const lt = new ExprBinOp(BinOp.Lt, expr.span, expr.lhs, expr.rhs);
    expr = new ExprUnOp(UnOp.Not, expr.span, lt);
    return _transformExpr(expr, sprite, project, diagnostics);
  }
  if (expr instanceof ExprBinOp && expr.op === BinOp.Ne) {
    const eq = new ExprBinOp(BinOp.Eq, expr.span, expr.lhs, expr.rhs);
    expr = new ExprUnOp(UnOp.Not, expr.span, eq);
    return _transformExpr(expr, sprite, project, diagnostics);
  }
  if (expr instanceof ExprBinOp && expr.op === BinOp.FloorDiv) {
    const div = new ExprBinOp(BinOp.Div, expr.span, expr.lhs, expr.rhs);
    expr = new ExprUnOp(UnOp.Floor, expr.span, div);
    return _transformExpr(expr, sprite, project, diagnostics);
  }
  if (expr instanceof ExprUnOp && expr.op === UnOp.Not && !_isBooleanExpr(expr.opr)) {
    const zero = new ExprValue(Value.fromFloat(0), expr.span);
    expr = new ExprBinOp(BinOp.Eq, expr.span, expr.opr, zero);
    return _transformExpr(expr, sprite, project, diagnostics);
  }
  if (false) {
    const folded = _tryFoldBinop(expr.op, expr.lhs.value, expr.rhs.value);
    if (folded !== null) {
      return new ExprValue(folded, expr.span);
    }
  }
  if (false) {
    const folded = _tryFoldUnop(expr.op, expr.opr.value);
    if (folded !== null) {
      return new ExprValue(folded, expr.span);
    }
  }
  if (false) {
    if (expr.op === BinOp.Add) {
      if (expr.lhs instanceof ExprValue && expr.lhs.value.kind === "number" && expr.lhs.value.toNumber() === 0) {
        return expr.rhs;
      }
      if (expr.rhs instanceof ExprValue && expr.rhs.value.kind === "number" && expr.rhs.value.toNumber() === 0) {
        return expr.lhs;
      }
    }
    if (expr.op === BinOp.Sub && expr.rhs instanceof ExprValue && expr.rhs.value.kind === "number" && expr.rhs.value.toNumber() === 0) {
      return expr.lhs;
    }
    if (expr.op === BinOp.Mul) {
      if (expr.lhs instanceof ExprValue && expr.lhs.value.kind === "number" && expr.lhs.value.toNumber() === 1) {
        return expr.rhs;
      }
      if (expr.rhs instanceof ExprValue && expr.rhs.value.kind === "number" && expr.rhs.value.toNumber() === 1) {
        return expr.lhs;
      }
    }
    if (expr.op === BinOp.Div && expr.rhs instanceof ExprValue && expr.rhs.value.kind === "number" && expr.rhs.value.toNumber() === 1) {
      return expr.lhs;
    }
    if (expr.op === BinOp.Mul) {
      if (expr.lhs instanceof ExprValue && expr.lhs.value.kind === "number" && expr.lhs.value.toNumber() === 0) {
        return new ExprValue(Value.fromFloat(0), expr.span);
      }
      if (expr.rhs instanceof ExprValue && expr.rhs.value.kind === "number" && expr.rhs.value.toNumber() === 0) {
        return new ExprValue(Value.fromFloat(0), expr.span);
      }
    }
    if (expr.op === BinOp.Join) {
      if (expr.lhs instanceof ExprValue && expr.lhs.value.kind === "string" && expr.lhs.value.data === "") {
        return expr.rhs;
      }
      if (expr.rhs instanceof ExprValue && expr.rhs.value.kind === "string" && expr.rhs.value.data === "") {
        return expr.lhs;
      }
    }
  }
  return expr;
}
function visitProjectDCE(project) {
  const sprites = [project.stage, ...Object.values(project.sprites)];
  for (const sprite of sprites) {
    for (const var_ of Object.values(sprite.vars)) {
      var_.is_used = true;
    }
    for (const lst of Object.values(sprite.lists)) {
      lst.is_used = true;
    }
    for (const struct of Object.values(sprite.structs)) {
      struct.is_used = true;
      for (const field of struct.fields) {
        field.is_used = true;
      }
    }
    for (const enum_ of Object.values(sprite.enums)) {
      enum_.is_used = true;
      for (const variant of enum_.variants) {
        variant.is_used = true;
      }
    }
    for (const argList of Object.values(sprite.proc_args)) {
      for (const arg of argList) {
        arg.is_used = true;
      }
    }
    for (const argList of Object.values(sprite.func_args)) {
      for (const arg of argList) {
        arg.is_used = true;
      }
    }
    sprite.used_procs = new Set(Object.keys(sprite.procs));
    sprite.used_funcs = new Set(Object.keys(sprite.funcs));
  }
}

// ../backend-js/src/config.js
var Config = class {
  constructor(opts = {}) {
    this.pre_build = opts.pre_build ?? null;
    this.post_build = opts.post_build ?? null;
    this.layers = opts.layers ?? null;
    this.std = opts.std ?? null;
    this.bitmap_resolution = opts.bitmap_resolution ?? 1;
    this.frame_rate = opts.frame_rate ?? 30;
    this.max_clones = opts.max_clones ?? 300;
    this.no_miscellaneous_limits = opts.no_miscellaneous_limits ?? false;
    this.no_sprite_fencing = opts.no_sprite_fencing ?? false;
    this.frame_interpolation = opts.frame_interpolation ?? false;
    this.high_quality_pen = opts.high_quality_pen ?? false;
    this.stage_width = opts.stage_width ?? 480;
    this.stage_height = opts.stage_height ?? 360;
  }
};

// src/compiler-build/codegen.browser.js
var NodeID = class {
  constructor(id) {
    this.id = id;
  }
  toString() {
    return this.id;
  }
};
var NodeIDFactory = class {
  constructor() {
    this._counter = 0;
  }
  newId() {
    this._counter += 1;
    return new NodeID(`__node_id_${this._counter}`);
  }
};
var S = class {
  constructor(sprite, project) {
    this.sprite = sprite;
    this.project = project;
    this.proc_name = null;
    this.func_name = null;
    this.locals = {};
  }
  qualifyName(name) {
    if (name in this.sprite.lists) {
      return ["list", name];
    }
    if (name in this.project.stage.lists) {
      return ["list", name];
    }
    if (this.proc_name && this.locals[name]) {
      return this.locals[name] === "mangle" ? ["var", this.proc_name + ":" + name] : ["var", name];
    }
    if (this.func_name && this.locals[name]) {
      return this.locals[name] === "mangle" ? ["var", this.func_name + ":" + name] : ["var", name];
    }
    if (name in this.sprite.vars) {
      return ["var", name];
    }
    if (name in this.project.stage.vars) {
      return ["var", name];
    }
    if (name.startsWith("__")) {
      const bare = name.slice(2);
      if (bare in this.project.stage.vars) {
        return ["var", bare];
      }
      if (bare in this.project.stage.lists) {
        return ["list", bare];
      }
    }
    return null;
  }
};
var CodeGen = class {
  constructor(config = null, opts = {}) {
    this.config = config || new Config();
    this.sourceDir = opts.sourceDir || null;
    this.extensions = {};
    this._broadcast_counter = 0;
    this._broadcasts = {};
  }
  // Upstream datalists.rs: a `list t x = "file.txt";` default imports one
  // item per non-empty line at compile time. Without a configured sourceDir
  // the file cannot be resolved — return an empty list instead of failing.
  _readListDefaultFile(relPath) {
    const p = relPath instanceof Value ? relPath.data : String(relPath || "");
    if (this.sourceDir) {
      try {
        const abs = path.isAbsolute(p) ? p : path.join(this.sourceDir, p);
        if (fs.existsSync(abs)) {
          return fs.readFileSync(abs, "utf8").split(/\r?\n/).filter((line) => line.length > 0);
        }
      } catch {
      }
    }
    console.warn(`[codegen] list default file not resolvable: "${p}"` + (this.sourceDir ? "" : " (no sourceDir configured)"));
    return [];
  }
  // ======================================================================
  // Public API
  // ======================================================================
  genProject(project) {
    const targets = [];
    const stageTarget = this._genSprite(project.stage, project, true);
    targets.push(stageTarget);
    const sortedSprites = Object.values(project.sprites).sort((a, b) => (a.name || "") < (b.name || "") ? -1 : (a.name || "") > (b.name || "") ? 1 : 0);
    sortedSprites.forEach((sprite, i) => {
      sprite._layer_order = i + 1;
    });
    for (const sprite of sortedSprites) {
      const spriteTarget = this._genSprite(sprite, project, false);
      targets.push(spriteTarget);
    }
    stageTarget.broadcasts = { ...this._broadcasts };
    stageTarget.comments = stageTarget.comments || {};
    stageTarget.comments["twconfig"] = {
      blockId: null,
      x: 5,
      y: 5,
      width: 350,
      height: 160,
      minimized: false,
      text: this._turbowarpConfigText()
    };
    const projectJson = {
      targets,
      monitors: [],
      extensions: Object.keys(this.extensions),
      meta: {
        semver: "3.0.0",
        vm: "4.3.1",
        agent: "InstanceScratch/1.0"
      }
    };
    return projectJson;
  }
  // Exact replica of upstream TurbowarpConfig Display output (the trailing
  // "// _twconfig_" marker is how TurboWarp recognizes the comment). Note
  // maxClones uses a bare Infinity literal, which is invalid JSON but is what
  // TurboWarp itself writes/parses.
  _turbowarpConfigText() {
    const c = this.config || new Config();
    const frameRate = c.frame_rate ?? 30;
    const maxClones = c.max_clones ?? 300;
    const noMisc = c.no_miscellaneous_limits ?? false;
    const noFencing = c.no_sprite_fencing ?? false;
    const interpolation = c.frame_interpolation ?? false;
    const hq = c.high_quality_pen ?? false;
    const width = c.stage_width ?? 480;
    const height = c.stage_height ?? 360;
    const clonesLiteral = maxClones === Infinity ? "Infinity" : String(maxClones);
    return `Configuration for https://turbowarp.org/
You can move, resize, and minimize this comment, but don't edit it by hand. This comment can be deleted to remove the stored settings.
{"framerate":` + frameRate + ',"interpolation":' + interpolation + ',"hq":' + hq + ',"width":' + width + ',"height":' + height + ',"runtimeOptions":{"maxClones":' + clonesLiteral + ',"miscLimits":' + !noMisc + ',"fencing":' + !noFencing + "}} // _twconfig_";
  }
  makeSb3(project) {
    const projectJson = this.genProject(project);
    const defaultBackdropSvg = _BROWSER_ASSETS["cd21514d0531fdffb22204e0ec5ed84a.svg"];
    const dangoCatSvg = _BROWSER_ASSETS["dango-cat.svg"];
    const md5Hex = (buf) => _md5HexStr(_bytesToStr(buf));
    const backdropHex = md5Hex(defaultBackdropSvg);
    const dangoHex = md5Hex(dangoCatSvg);
    const backdropMd5ext = backdropHex + ".svg";
    const dangoMd5ext = dangoHex + ".svg";
    const DEFAULT_ASSET_BYTES = {
      [backdropMd5ext]: _strToBytes(defaultBackdropSvg),
      [dangoMd5ext]: _strToBytes(dangoCatSvg),
      "cd21514d0531fdffb22204e0ec5ed84a.svg": _strToBytes(defaultBackdropSvg),
      "dango-cat.svg": _strToBytes(dangoCatSvg)
    };
    const assetFiles = {};
    for (const target of projectJson.targets) {
      if (target.isStage && (!target.costumes || target.costumes.length === 0)) {
        target.costumes = [{
          name: "backdrop1",
          assetId: backdropHex,
          md5ext: backdropMd5ext,
          dataFormat: "svg",
          rotationCenterX: 240,
          rotationCenterY: 180
        }];
      }
      if (!target.isStage && (!target.costumes || target.costumes.length === 0)) {
        target.costumes = [{
          name: "costume1",
          assetId: dangoHex,
          md5ext: dangoMd5ext,
          dataFormat: "svg",
          rotationCenterX: 240,
          rotationCenterY: 180
        }];
      }
      for (const costume of target.costumes) {
        if (costume.md5ext && !assetFiles[costume.md5ext]) {
          if (DEFAULT_ASSET_BYTES[costume.md5ext]) assetFiles[costume.md5ext] = DEFAULT_ASSET_BYTES[costume.md5ext];
          else if (this.userAssets && this.userAssets[costume.md5ext]) assetFiles[costume.md5ext] = this.userAssets[costume.md5ext];
        }
      }
      for (const sound of target.sounds || []) {
        if (sound.md5ext && !assetFiles[sound.md5ext] && this.userAssets && this.userAssets[sound.md5ext]) {
          assetFiles[sound.md5ext] = this.userAssets[sound.md5ext];
        }
      }
      const normalizeAsset = (asset) => {
        if (!asset || !asset.md5ext) return;
        if (/^[a-fA-F0-9]{32}\./.test(asset.md5ext)) return;
        let bytes = assetFiles[asset.md5ext] || DEFAULT_ASSET_BYTES[asset.md5ext];
        if (!bytes) return;
        const ext = (asset.dataFormat || asset.md5ext.split(".").pop() || "svg").replace(/^\./, "");
        const hex = md5Hex(bytes);
        delete assetFiles[asset.md5ext];
        asset.md5ext = hex + "." + ext;
        asset.assetId = hex;
        assetFiles[asset.md5ext] = bytes;
      };
      for (const costume of target.costumes) normalizeAsset(costume);
      for (const sound of target.sounds || []) normalizeAsset(sound);
    }
    const zip = new _JSZip();
    zip.file("project.json", JSON.stringify(projectJson, null, 2));
    for (const [filename, data] of Object.entries(assetFiles)) {
      zip.file(filename, _bytesToU8(data));
    }
    return zip.generateAsync({ type: "uint8array" }).then((u8) => _u8ToArrayBuffer(u8));
  }
  // ======================================================================
  // Sprite target generation
  // ======================================================================
  // Coerce a source-level sprite field (Value instance, primitive, or
  // legacy tuple) to a finite number, or null.
  _numField(v) {
    let n;
    if (v instanceof Value) n = Number(v.data);
    else if (Array.isArray(v)) {
      const head = v[0];
      n = head instanceof Value ? Number(head.data) : Number(head);
    } else {
      n = typeof v === "object" && v !== null && "data" in v ? Number(v.data) : Number(v);
    }
    return Number.isFinite(n) ? n : null;
  }
  // Resolve a parser constant wrapper to a scalar Value. Enum variants
  // evaluate to their explicit discriminant or 0-based position (upstream
  // const-eval); struct literals are not scalars and yield null.
  _constScalar(v, sprite) {
    if (v instanceof ConstExprValue) return v.value;
    if (v instanceof ConstExprEnumVariant) {
      const en = sprite && sprite.enums ? sprite.enums[v.enum_name] : null;
      if (en) {
        const idx = en.variants.findIndex((x) => x.name === v.variant_name);
        if (idx >= 0) {
          let dv = en.variants[idx].value;
          if (Array.isArray(dv)) dv = dv[0];
          if (dv instanceof ConstExprValue) dv = dv.value;
          if (dv instanceof Value) return dv;
          if (typeof dv === "number") return Value.fromFloat(dv);
          return Value.fromFloat(idx);
        }
      }
      return Value.fromFloat(0);
    }
    return null;
  }
  _genSprite(sprite, project, isStage) {
    const s = new S(sprite, project);
    const idFactory = new NodeIDFactory();
    const target = {
      isStage,
      // The official sb3 schema restricts the stage target's name to the
      // literal enum "Stage" (upstream goboscript sb3.rs STAGE_NAME). Any
      // other name fails scratch-parser validation, i.e. turbowarp.org /
      // Scratch reject the import with "validationError".
      name: isStage ? "Stage" : sprite.name || "Sprite1",
      variables: {},
      lists: {},
      broadcasts: {},
      blocks: {},
      comments: {},
      currentCostume: 0,
      costumes: [],
      sounds: [],
      // Upstream sb3.rs: stage is 0, sprites numbered 1..N alphabetically
      // (assigned in genProject via sprite._layer_order).
      layerOrder: isStage ? 0 : sprite._layer_order || 1,
      // SB3 schema requires volume to be a NUMBER — the parser now stores a
      // Value here, and serializing it raw leaked a class object into
      // project.json. Upstream sb3.rs:737-740 writes `volume as number`.
      volume: this._numField(sprite.volume) ?? 100,
      // SB3 schema: sprite targets REQUIRE numeric x/y (scratch-parser
      // rejects the project otherwise). Stage must NOT carry them.
      ...isStage ? {} : { x: 0, y: 0, size: 100, direction: 90 }
    };
    for (const [name, var_] of Object.entries(sprite.vars)) {
      let initialVal = 0;
      let dv = var_.default;
      if (dv instanceof ConstExprValue || dv instanceof ConstExprEnumVariant) {
        dv = this._constScalar(dv, sprite);
      }
      if (dv !== null && dv !== void 0) {
        if (dv instanceof Value) {
          initialVal = dv.kind === "string" ? dv.data : dv.toNumber();
        } else if (typeof dv === "number" || typeof dv === "string" || typeof dv === "boolean") {
          initialVal = dv;
        }
      }
      if (var_.is_cloud) {
        target.variables[name] = [`\u2601 ${name}`, initialVal, true];
      } else {
        target.variables[name] = [name, initialVal];
      }
    }
    for (const [pn, dict] of Object.entries(sprite.proc_locals || {})) {
      for (const nm of Object.keys(dict)) {
        const id = pn + ":" + nm;
        if (!(id in target.variables)) target.variables[id] = [id, 0];
      }
    }
    for (const [name, lst] of Object.entries(sprite.lists)) {
      let initialVal = [];
      const d = lst.default;
      if (d instanceof ListDefaultValues) {
        initialVal = (d.values || []).map((v) => {
          let cv = this._constScalar(v, sprite);
          if (cv === null) cv = v;
          return cv instanceof Value ? cv.kind === "string" ? cv.data : cv.toNumber() : cv;
        });
      } else if (d instanceof ListDefaultFile) {
        initialVal = this._readListDefaultFile(d.path);
      } else if (d instanceof Value) {
        initialVal = [d.kind === "string" ? d.data : d.toString()];
      } else if (Array.isArray(d)) {
        initialVal = d;
      }
      target.lists["L:" + name] = [name, initialVal];
    }
    for (const costume of sprite.costumes) {
      target.costumes.push(this._genCostume(costume));
    }
    for (const sound of sprite.sounds) {
      target.sounds.push(this._genSound(sound));
    }
    const nx = this._numField(sprite.x_position);
    const ny = this._numField(sprite.y_position);
    if (nx !== null) target.x = nx;
    if (ny !== null) target.y = ny;
    const nsize = this._numField(sprite.size);
    if (nsize !== null) target.size = nsize;
    const ndir = this._numField(sprite.direction);
    if (ndir !== null) target.direction = ndir;
    target.visible = !sprite.hidden;
    if (sprite.rotation_style) {
      target.rotationStyle = sprite.rotation_style.style || "all around";
    }
    const topLevelPos = { x: 60, y: 60 };
    for (const event of sprite.events) {
      const eventId = idFactory.newId();
      this._genEvent(event, target.blocks, idFactory, eventId, sprite, s, topLevelPos);
    }
    for (const procName of Object.keys(sprite.procs)) {
      if (sprite.used_procs && !sprite.used_procs.has(procName)) continue;
      const defId = idFactory.newId();
      this._genProcDefinition(
        sprite.procs[procName],
        procName,
        sprite.proc_args[procName] || [],
        sprite.proc_definitions[procName] || [],
        target.blocks,
        idFactory,
        defId,
        sprite,
        s,
        topLevelPos
      );
    }
    for (const chain of sprite.orphanChains) {
      const headId = idFactory.newId();
      this._genStmts(chain, target.blocks, idFactory, headId.id, headId.id, sprite, s);
      const head = target.blocks[headId.id];
      if (head) {
        head.parent = null;
        head.topLevel = true;
        head.x = topLevelPos.x;
        head.y = topLevelPos.y;
        topLevelPos.x += 400;
        if (topLevelPos.x > 800) {
          topLevelPos.x = 60;
          topLevelPos.y += 400;
        }
      }
    }
    return target;
  }
  // Generate a custom block definition:
  //   procedures_definition (hat, topLevel)
  //     └─ custom_block input → procedures_prototype (shadow)
  //   body blocks (parent chain starts at definition)
  // Shared proccode builder — the procedures_call mutation MUST produce the
  // exact same proccode + argumentids as the procedures_prototype, because
  // scratch-vm pairs them by exact string match (upstream mutation.rs builds
  // both sides from the same qualified_args: `name a: %s b: %s`, all %s).
  _procMutationParts(procName, args) {
    const argNames = args.map((a, i) => a && a.name ? a.name : `arg${i}`);
    const used = /* @__PURE__ */ Object.create(null);
    const argIds = argNames.map((name) => {
      let id = name;
      for (let n = 2; used[id]; n++) id = `${name}${n}`;
      used[id] = true;
      return id;
    });
    let proccode;
    if (args.length === 0) {
      proccode = procName;
    } else {
      const parts = args.map((a) => `${a.name}: %s`);
      proccode = `${procName} ${parts.join(" ")}`;
    }
    return { proccode, argIds, argNames };
  }
  _genProcDefinition(proc, procName, args, body, blocks, idFactory, defId, sprite, s, pos) {
    const { proccode, argIds, argNames } = this._procMutationParts(procName, args);
    const argDefaults = args.map(() => "");
    const protoId = idFactory.newId();
    const protoBlock = {
      opcode: "procedures_prototype",
      next: null,
      parent: defId.id,
      inputs: {},
      fields: {},
      shadow: true,
      topLevel: false,
      mutation: {
        tagName: "mutation",
        children: [],
        proccode,
        argumentids: JSON.stringify(argIds),
        argumentnames: JSON.stringify(argNames),
        argumentdefaults: JSON.stringify(argDefaults),
        warp: proc.warp ? "true" : "false"
      }
    };
    const defBlock = {
      opcode: "procedures_definition",
      next: null,
      parent: null,
      inputs: { custom_block: [1, protoId.id] },
      fields: {},
      shadow: false,
      topLevel: true,
      x: pos.x,
      y: pos.y
    };
    pos.y += 100;
    if (pos.y > 800) {
      pos.y = 60;
      pos.x += 400;
    }
    for (let i = 0; i < args.length; i++) {
      const argBlockId = idFactory.newId();
      blocks[argBlockId.id] = {
        opcode: "argument_reporter_string_number",
        next: null,
        parent: protoId.id,
        inputs: {},
        fields: { VALUE: [args[i].name, null] },
        shadow: true,
        topLevel: false
      };
      protoBlock.inputs[argIds[i]] = [1, argBlockId.id];
    }
    blocks[protoId.id] = protoBlock;
    blocks[defId.id] = defBlock;
    if (body && body.length > 0) {
      const procS = new S(sprite, s && s.project);
      procS.proc_name = procName;
      procS.locals = {};
      for (const arg of args) {
        if (arg.name in sprite.lists) continue;
        procS.locals[arg.name] = true;
      }
      for (const nm of Object.keys(sprite.proc_locals[procName] || {})) {
        if (nm in procS.locals) continue;
        if (nm in sprite.lists) continue;
        procS.locals[nm] = "mangle";
      }
      this._genStmts(body, blocks, idFactory, defId.id, defId.id, sprite, procS);
    }
  }
  _genCostume(costume) {
    const out = {
      name: costume.name || "costume1",
      assetId: null,
      md5ext: null,
      dataFormat: null
    };
    if (costume.md5ext) {
      out.assetId = costume.assetId || costume.md5ext.replace(/\.[^.]+$/, "");
      out.md5ext = costume.md5ext;
      out.dataFormat = (costume.dataFormat || costume.md5ext.split(".").pop() || "svg").toLowerCase();
    } else {
      out.assetId = "dango-cat";
      out.md5ext = "dango-cat.svg";
      out.dataFormat = "svg";
    }
    const BITMAP = ["png", "bmp", "jpeg", "jpg", "gif"];
    if (BITMAP.includes(out.dataFormat)) {
      out.bitmapResolution = this.config?.bitmap_resolution ?? 1;
    } else if (costume.bitmapResolution) {
      out.bitmapResolution = costume.bitmapResolution;
    }
    if (costume.rotationCenterX !== void 0 && costume.rotationCenterY !== void 0) {
      out.rotationCenterX = costume.rotationCenterX;
      out.rotationCenterY = costume.rotationCenterY;
    }
    return out;
  }
  _genSound(sound) {
    let dataFormat;
    let assetId, md5ext;
    if (sound.md5ext) {
      assetId = sound.assetId || sound.md5ext.replace(/\.[^.]+$/, "");
      md5ext = sound.md5ext;
      dataFormat = (sound.dataFormat || sound.md5ext.split(".").pop() || "wav").toLowerCase();
    } else {
      assetId = "83a9787d4cb6f3b7632b4ddfe5d0f0a0";
      md5ext = "83a9787d4cb6f3b7632b4ddfe5d0f0a0.wav";
      dataFormat = "wav";
    }
    return {
      name: sound.name || "sound1",
      assetId,
      md5ext,
      dataFormat
    };
  }
  // ======================================================================
  // Event generation
  // ======================================================================
  _genEvent(event, blocks, idFactory, eventId, sprite, s, pos) {
    let opcode = null;
    const block = {
      opcode: null,
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: true,
      x: pos.x,
      y: pos.y
    };
    pos.x += 400;
    if (pos.x > 800) {
      pos.x = 60;
      pos.y += 400;
    }
    const ek = event.kind.kind;
    switch (ek) {
      case "OnFlag":
        block.opcode = "event_whenflagclicked";
        break;
      case "OnKey":
        block.opcode = "event_whenkeypressed";
        block.fields.KEY_OPTION = [event.kind.key || "any", null];
        break;
      case "OnClick":
        block.opcode = "event_whenthisspriteclicked";
        break;
      case "OnBackdrop":
        block.opcode = "event_whenbackdropswitchesto";
        block.fields.BACKDROP = [event.kind.backdrop || "backdrop1", null];
        break;
      case "OnLoudnessGt":
        block.opcode = "event_whengreaterthan";
        block.fields.WHENGREATERTHANMENU = ["LOUDNESS", null];
        block.inputs.VALUE = [1, [10, ""]];
        if (event.kind.value) {
          this._genInput(block, "VALUE", event.kind.value, idFactory.newId(), blocks, idFactory, eventId.id, sprite, s);
        }
        break;
      case "OnTimerGt":
        block.opcode = "event_whengreaterthan";
        block.fields.WHENGREATERTHANMENU = ["TIMER", null];
        block.inputs.VALUE = [1, [10, ""]];
        if (event.kind.value) {
          this._genInput(block, "VALUE", event.kind.value, idFactory.newId(), blocks, idFactory, eventId.id, sprite, s);
        }
        break;
      case "OnClone":
        block.opcode = "control_start_as_clone";
        break;
      case "On": {
        block.opcode = "event_whenbroadcastreceived";
        const broadcastName = event.kind.event || "message1";
        if (!this._broadcasts[broadcastName]) {
          this._broadcasts[broadcastName] = broadcastName;
        }
        block.fields.BROADCAST_OPTION = [broadcastName, this._broadcasts[broadcastName]];
        break;
      }
      default:
        block.opcode = "event_whenflagclicked";
        break;
    }
    blocks[eventId.id] = block;
    if (event.body && event.body.length > 0) {
      this._genStmts(event.body, blocks, idFactory, eventId.id, eventId.id, sprite, s);
    }
  }
  // ======================================================================
  // Statement generation
  // ======================================================================
  _genStmts(stmts, blocks, idFactory, parentId, topLevelId, sprite, s) {
    const anchorExists = !!blocks[parentId];
    let prevId = parentId;
    for (let i = 0; i < stmts.length; i++) {
      const stmt = stmts[i];
      let stmtId;
      if (i === 0 && !anchorExists) {
        stmtId = parentId;
      } else {
        stmtId = idFactory.newId().id;
      }
      const lastId = this._genStmt(stmt, blocks, idFactory, { id: stmtId }, sprite, s);
      if (i === 0) {
        if (anchorExists) {
          blocks[parentId].next = stmtId;
          if (blocks[stmtId]) blocks[stmtId].parent = parentId;
        } else {
          if (blocks[stmtId]) {
            blocks[stmtId].parent = topLevelId !== void 0 && topLevelId !== stmtId ? topLevelId : null;
          }
        }
      } else {
        blocks[prevId].next = stmtId;
        if (blocks[stmtId]) blocks[stmtId].parent = prevId;
      }
      prevId = lastId;
    }
  }
  _genStmt(stmt, blocks, idFactory, thisId, sprite, s) {
    let lastId = thisId.id;
    if (stmt instanceof StmtBlock) {
      this._genStmtBlock(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtSetVar) {
      lastId = this._genSetVar(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtChangeVar) {
      this._genChangeVar(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtShow) {
      this._genShow(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtHide) {
      this._genHide(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtAddToList) {
      this._genAddToList(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtDeleteList) {
      this._genDeleteList(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtDeleteListIndex) {
      this._genDeleteListIndex(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtInsertAtList) {
      this._genInsertAtList(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtSetListIndex) {
      this._genSetListIndex(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtRepeat) {
      this._genRepeat(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtForever) {
      this._genForever(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtBranch) {
      this._genBranch(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtUntil) {
      this._genUntil(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtWaitUntil) {
      this._genWaitUntil(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtProcCall) {
      this._genProcCall(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtFuncCall) {
      this._genFuncCallStmt(stmt, blocks, idFactory, thisId, sprite, s);
    } else if (stmt instanceof StmtReturn) {
      this._genReturn(stmt, blocks, idFactory, thisId, sprite, s);
    } else {
      blocks[thisId.id] = {
        opcode: "control_wait",
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: false
      };
      blocks[thisId.id].inputs.DURATION = [1, [4, 0]];
    }
    return lastId;
  }
  _genStmtBlock(stmt, blocks, idFactory, thisId, sprite, s) {
    const opcode = blockOpcode(stmt.block);
    this._checkExtension(opcode);
    const block = {
      opcode,
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false
    };
    const fields = blockFields(stmt.block);
    if (fields) {
      for (const [fname, fval] of Object.entries(fields)) {
        block.fields[fname] = fval;
      }
    }
    const menu = blockMenu(stmt.block);
    const mutation = blockMutation(stmt.block);
    if (mutation) {
      block.mutation = mutation;
    }
    const argNames = blockArgs(stmt.block);
    for (let i = 0; i < argNames.length && i < stmt.args.length; i++) {
      const inputName = argNames[i];
      const argExpr = stmt.args[i];
      if (menu && menu.input === inputName && argExpr instanceof ExprValue) {
        const menuBlock = {
          opcode: menu.opcode,
          next: null,
          parent: thisId.id,
          inputs: {},
          fields: {},
          shadow: true,
          topLevel: false
        };
        if (menu.field) {
          const valStr = argExpr.value.kind === "string" ? argExpr.value.data : String(argExpr.value.toNumber());
          menuBlock.fields[menu.field] = [valStr, null];
        }
        const menuId = idFactory.newId();
        blocks[menuId.id] = menuBlock;
        block.inputs[inputName] = [1, menuId.id];
        continue;
      }
      let menuShadowId = null;
      if (menu && menu.input === inputName) {
        const menuBlock = {
          opcode: menu.opcode,
          next: null,
          parent: thisId.id,
          inputs: {},
          fields: {},
          shadow: true,
          topLevel: false
        };
        if (menu.field) {
          menuBlock.fields[menu.field] = ["", null];
        }
        const menuId = idFactory.newId();
        blocks[menuId.id] = menuBlock;
        menuShadowId = menuId.id;
      }
      const argId = idFactory.newId();
      this._genInput(block, inputName, argExpr, argId, blocks, idFactory, thisId.id, sprite, s, false, menuShadowId);
    }
    if (menu && !argNames.includes(menu.input)) {
      const menuBlock = {
        opcode: menu.opcode,
        next: null,
        parent: thisId.id,
        inputs: {},
        fields: {},
        shadow: true,
        topLevel: false
      };
      if (menu.field) {
        menuBlock.fields[menu.field] = [menu.default, null];
      }
      const menuId = idFactory.newId();
      blocks[menuId.id] = menuBlock;
      block.inputs[menu.input] = [1, menuId.id];
    }
    blocks[thisId.id] = block;
  }
  _genSetVar(stmt, blocks, idFactory, thisId, sprite, s) {
    const name = stmt.name instanceof Name ? stmt.name.name : stmt.name.lhs;
    const result = s.qualifyName(name);
    let varName = name;
    if (result) {
      varName = result[1];
    }
    if (result && result[0] === "list") {
      const valueIsHiddenArr = stmt.value instanceof ExprName && (stmt.value.name instanceof Name ? stmt.value.name.name : stmt.value.name) in sprite.lists;
      if (valueIsHiddenArr) {
        const arrName = stmt.value.name instanceof Name ? stmt.value.name.name : stmt.value.name;
        const arrList = sprite.lists[arrName];
        if (arrList && arrList.default instanceof ListDefaultValues) {
          return this._genListAssignFromLiteral(
            varName,
            arrList,
            blocks,
            idFactory,
            thisId.id,
            sprite,
            s
          );
        }
      }
    }
    const block = {
      opcode: "data_setvariableto",
      next: null,
      parent: null,
      inputs: {},
      fields: { VARIABLE: [varName, varName] },
      shadow: false,
      topLevel: false
    };
    const valueId = idFactory.newId();
    this._genInput(block, "VALUE", stmt.value, valueId, blocks, idFactory, thisId.id, sprite, s);
    blocks[thisId.id] = block;
    return thisId.id;
  }
  // Lower `listVar = <constant literal>` into:
  //   delete all of listVar
  //   add elem1 to listVar
  //   add elem2 to listVar
  //   ...
  // The first block occupies `thisId`; the rest are chained via `next`.
  _genListAssignFromLiteral(varName, arrList, blocks, idFactory, thisId, sprite, s) {
    const del = {
      opcode: "data_deletealloflist",
      next: null,
      parent: null,
      inputs: {},
      fields: { LIST: [varName, "L:" + varName] },
      shadow: false,
      topLevel: false
    };
    blocks[thisId] = del;
    let lastId = thisId;
    const values = arrList.default && arrList.default.values ? arrList.default.values : [];
    let prevId = thisId;
    for (const v of values) {
      let cv = this._constScalar(v, sprite);
      if (cv === null) cv = v;
      let item;
      if (cv instanceof Value) {
        item = cv.kind === "string" ? cv.data : cv.toNumber();
      } else if (typeof cv === "number" || typeof cv === "string" || typeof cv === "boolean") {
        item = cv;
      } else {
        item = 0;
      }
      const addId = idFactory.newId().id;
      const add = {
        opcode: "data_addtolist",
        next: null,
        parent: prevId,
        inputs: {},
        fields: { LIST: [varName, "L:" + varName] },
        shadow: false,
        topLevel: false
      };
      add.inputs.ITEM = [1, [this._primTypeOf(item), item]];
      blocks[addId] = add;
      blocks[prevId].next = addId;
      prevId = addId;
      lastId = addId;
    }
    return lastId;
  }
  _primTypeOf(v) {
    return typeof v === "string" ? 10 : 4;
  }
  _genChangeVar(stmt, blocks, idFactory, thisId, sprite, s) {
    const name = stmt.name instanceof Name ? stmt.name.name : stmt.name.lhs;
    const result = s.qualifyName(name);
    let varName = name;
    if (result) {
      varName = result[1];
    }
    const block = {
      opcode: "data_changevariableby",
      next: null,
      parent: null,
      inputs: {},
      fields: { VARIABLE: [varName, varName] },
      shadow: false,
      topLevel: false
    };
    const valueId = idFactory.newId();
    this._genInput(block, "VALUE", stmt.value, valueId, blocks, idFactory, thisId.id, sprite, s);
    blocks[thisId.id] = block;
  }
  _genShow(stmt, blocks, idFactory, thisId, sprite, s) {
    const name = stmt.name instanceof Name ? stmt.name.name : stmt.name ? stmt.name.lhs : null;
    if (name) {
      const result = s.qualifyName(name);
      if (result && result[0] === "list") {
        blocks[thisId.id] = {
          opcode: "data_showlist",
          next: null,
          parent: null,
          inputs: {},
          fields: { LIST: [result[1], "L:" + result[1]] },
          shadow: false,
          topLevel: false
        };
        return;
      }
      if (result && result[0] === "var") {
        blocks[thisId.id] = {
          opcode: "data_showvariable",
          next: null,
          parent: null,
          inputs: {},
          fields: { VARIABLE: [result[1], result[1]] },
          shadow: false,
          topLevel: false
        };
        return;
      }
    }
    blocks[thisId.id] = {
      opcode: "looks_show",
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false
    };
  }
  _genHide(stmt, blocks, idFactory, thisId, sprite, s) {
    const name = stmt.name instanceof Name ? stmt.name.name : stmt.name ? stmt.name.lhs : null;
    if (name) {
      const result = s.qualifyName(name);
      if (result && result[0] === "list") {
        blocks[thisId.id] = {
          opcode: "data_hidelist",
          next: null,
          parent: null,
          inputs: {},
          fields: { LIST: [result[1], "L:" + result[1]] },
          shadow: false,
          topLevel: false
        };
        return;
      }
      if (result && result[0] === "var") {
        blocks[thisId.id] = {
          opcode: "data_hidevariable",
          next: null,
          parent: null,
          inputs: {},
          fields: { VARIABLE: [result[1], result[1]] },
          shadow: false,
          topLevel: false
        };
        return;
      }
    }
    blocks[thisId.id] = {
      opcode: "looks_hide",
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false
    };
  }
  _genAddToList(stmt, blocks, idFactory, thisId, sprite, s) {
    const name = stmt.name instanceof Name ? stmt.name.name : stmt.name.lhs;
    const result = s.qualifyName(name);
    let listName = name;
    if (result) {
      listName = result[1];
    }
    const block = {
      opcode: "data_addtolist",
      next: null,
      parent: null,
      inputs: {},
      fields: { LIST: [listName, "L:" + listName] },
      shadow: false,
      topLevel: false
    };
    const valueId = idFactory.newId();
    this._genInput(block, "ITEM", stmt.value, valueId, blocks, idFactory, thisId.id, sprite, s);
    blocks[thisId.id] = block;
  }
  _genDeleteList(stmt, blocks, idFactory, thisId, sprite, s) {
    const name = stmt.name instanceof Name ? stmt.name.name : stmt.name.lhs;
    const result = s.qualifyName(name);
    let listName = name;
    if (result) {
      listName = result[1];
    }
    const block = {
      opcode: "data_deletealloflist",
      next: null,
      parent: null,
      inputs: {},
      fields: { LIST: [listName, "L:" + listName] },
      shadow: false,
      topLevel: false
    };
    blocks[thisId.id] = block;
  }
  _genDeleteListIndex(stmt, blocks, idFactory, thisId, sprite, s) {
    const name = stmt.name instanceof Name ? stmt.name.name : stmt.name.lhs;
    const result = s.qualifyName(name);
    let listName = name;
    if (result) {
      listName = result[1];
    }
    const block = {
      opcode: "data_deleteoflist",
      next: null,
      parent: null,
      inputs: {},
      fields: { LIST: [listName, "L:" + listName] },
      shadow: false,
      topLevel: false
    };
    const indexId = idFactory.newId();
    this._genInput(block, "INDEX", stmt.index, indexId, blocks, idFactory, thisId.id, sprite, s);
    blocks[thisId.id] = block;
  }
  _genInsertAtList(stmt, blocks, idFactory, thisId, sprite, s) {
    const name = stmt.name instanceof Name ? stmt.name.name : stmt.name.lhs;
    const result = s.qualifyName(name);
    let listName = name;
    if (result) {
      listName = result[1];
    }
    const block = {
      opcode: "data_insertatlist",
      next: null,
      parent: null,
      inputs: {},
      fields: { LIST: [listName, "L:" + listName] },
      shadow: false,
      topLevel: false
    };
    const indexId = idFactory.newId();
    this._genInput(block, "INDEX", stmt.index, indexId, blocks, idFactory, thisId.id, sprite, s);
    const valueId = idFactory.newId();
    this._genInput(block, "ITEM", stmt.value, valueId, blocks, idFactory, thisId.id, sprite, s);
    blocks[thisId.id] = block;
  }
  _genSetListIndex(stmt, blocks, idFactory, thisId, sprite, s) {
    const name = stmt.name instanceof Name ? stmt.name.name : stmt.name.lhs;
    const result = s.qualifyName(name);
    let listName = name;
    if (result) {
      listName = result[1];
    }
    const block = {
      opcode: "data_replaceitemoflist",
      next: null,
      parent: null,
      inputs: {},
      fields: { LIST: [listName, "L:" + listName] },
      shadow: false,
      topLevel: false
    };
    const indexId = idFactory.newId();
    this._genInput(block, "INDEX", stmt.index, indexId, blocks, idFactory, thisId.id, sprite, s);
    const valueId = idFactory.newId();
    this._genInput(block, "ITEM", stmt.value, valueId, blocks, idFactory, thisId.id, sprite, s);
    blocks[thisId.id] = block;
  }
  _genRepeat(stmt, blocks, idFactory, thisId, sprite, s) {
    const block = {
      opcode: "control_repeat",
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false
    };
    const timesId = idFactory.newId();
    this._genInput(block, "TIMES", stmt.times, timesId, blocks, idFactory, thisId.id, sprite, s);
    const bodyId = idFactory.newId();
    if (stmt.body && stmt.body.length > 0) {
      block.inputs.SUBSTACK = [2, bodyId.id];
      this._genStmts(stmt.body, blocks, idFactory, bodyId.id, thisId.id, sprite, s);
    }
    blocks[thisId.id] = block;
  }
  _genForever(stmt, blocks, idFactory, thisId, sprite, s) {
    const block = {
      opcode: "control_forever",
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false
    };
    const bodyId = idFactory.newId();
    if (stmt.body && stmt.body.length > 0) {
      block.inputs.SUBSTACK = [2, bodyId.id];
      this._genStmts(stmt.body, blocks, idFactory, bodyId.id, thisId.id, sprite, s);
    }
    blocks[thisId.id] = block;
  }
  _genBranch(stmt, blocks, idFactory, thisId, sprite, s) {
    const hasElse = stmt.has_else || stmt.else_body && stmt.else_body.length > 0;
    const block = {
      opcode: hasElse ? "control_if_else" : "control_if",
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false
    };
    const condId = idFactory.newId();
    const cond = _coerceCondition(stmt.cond, s);
    this._genInput(block, "CONDITION", cond, condId, blocks, idFactory, thisId.id, sprite, s, true);
    if (stmt.if_body && stmt.if_body.length > 0) {
      const ifBodyId = idFactory.newId();
      block.inputs.SUBSTACK = [2, ifBodyId.id];
      this._genStmts(stmt.if_body, blocks, idFactory, ifBodyId.id, thisId.id, sprite, s);
    }
    if (stmt.else_body && stmt.else_body.length > 0) {
      const elseBodyId = idFactory.newId();
      block.inputs.SUBSTACK2 = [2, elseBodyId.id];
      this._genStmts(stmt.else_body, blocks, idFactory, elseBodyId.id, thisId.id, sprite, s);
    }
    blocks[thisId.id] = block;
  }
  _genUntil(stmt, blocks, idFactory, thisId, sprite, s) {
    if (!stmt.body || stmt.body.length === 0) {
      return this._genWaitUntil({ cond: stmt.cond }, blocks, idFactory, thisId, sprite, s);
    }
    const block = {
      opcode: "control_repeat_until",
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false
    };
    const condId = idFactory.newId();
    const cond = _coerceCondition(stmt.cond, s);
    this._genInput(block, "CONDITION", cond, condId, blocks, idFactory, thisId.id, sprite, s, true);
    if (stmt.body && stmt.body.length > 0) {
      const bodyId = idFactory.newId();
      block.inputs.SUBSTACK = [2, bodyId.id];
      this._genStmts(stmt.body, blocks, idFactory, bodyId.id, thisId.id, sprite, s);
    }
    blocks[thisId.id] = block;
  }
  _genWaitUntil(stmt, blocks, idFactory, thisId, sprite, s) {
    const block = {
      opcode: "control_wait_until",
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false
    };
    const condId = idFactory.newId();
    const cond = _coerceCondition(stmt.cond, s);
    this._genInput(block, "CONDITION", cond, condId, blocks, idFactory, thisId.id, sprite, s, true);
    blocks[thisId.id] = block;
  }
  _genProcCall(stmt, blocks, idFactory, thisId, sprite, s) {
    const proccallId = stmt.name instanceof Name ? stmt.name.name : stmt.name;
    const proc = sprite.procs[proccallId];
    const procArgs = sprite.proc_args[proccallId] || [];
    if (!proc && procArgs.length === 0 && (proccallId === "log" || proccallId === "warn" || proccallId === "error" || proccallId === "breakpoint")) {
      const takesArg = proccallId !== "breakpoint";
      const zw = "\u200B\u200B";
      const builtinProccode = takesArg ? `${zw}${proccallId}${zw} %s` : `${zw}${proccallId}${zw}`;
      const builtinBlock = {
        opcode: "procedures_call",
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: false,
        mutation: {
          tagName: "mutation",
          children: [],
          proccode: builtinProccode,
          argumentids: JSON.stringify(takesArg ? ["arg0"] : []),
          // Upstream stmt.rs builds these builtins with Proc::new(…, false)
          // — mutation.rs writes warp:"false". Byte-parity matters because
          // roundtrip diffs are compared as raw JSON.
          warp: "false"
        }
      };
      if (takesArg && stmt.args.length > 0) {
        const inputId = idFactory.newId();
        this._genInput(builtinBlock, "arg0", stmt.args[0], inputId, blocks, idFactory, thisId.id, sprite, s);
      }
      blocks[thisId.id] = builtinBlock;
      return;
    }
    const { proccode, argIds } = this._procMutationParts(proccallId, procArgs);
    const block = {
      opcode: "procedures_call",
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false,
      mutation: {
        tagName: "mutation",
        children: [],
        proccode,
        argumentids: JSON.stringify(argIds),
        warp: proc ? proc.warp ? "true" : "false" : "true"
      }
    };
    for (let i = 0; i < argIds.length && i < stmt.args.length; i++) {
      const argId = argIds[i];
      const argExpr = stmt.args[i];
      const inputId = idFactory.newId();
      this._genInput(block, argId, argExpr, inputId, blocks, idFactory, thisId.id, sprite, s);
    }
    blocks[thisId.id] = block;
  }
  _genFuncCallStmt(stmt, blocks, idFactory, thisId, sprite, s) {
    this._genProcCall(stmt, blocks, idFactory, thisId, sprite, s);
  }
  _genReturn(stmt, blocks, idFactory, thisId, sprite, s) {
    const funcName = s.func_name;
    if (!funcName) {
      blocks[thisId.id] = {
        opcode: "control_stop",
        next: null,
        parent: null,
        inputs: {},
        fields: { STOP_OPTION: ["this script", null] },
        shadow: false,
        topLevel: false,
        mutation: {
          tagName: "mutation",
          children: [],
          hasnext: "false"
        }
      };
      return;
    }
    const block = {
      opcode: "data_setvariableto",
      next: null,
      parent: null,
      inputs: {},
      fields: { VARIABLE: [`returnedFunc:${funcName}`, `returnedFunc:${funcName}`] },
      shadow: false,
      topLevel: false
    };
    if (!stmt.value) {
      block.inputs.VALUE = [1, ["10", ""]];
      blocks[thisId.id] = block;
      return;
    }
    const valueId = idFactory.newId();
    this._genInput(block, "VALUE", stmt.value, valueId, blocks, idFactory, thisId.id, sprite, s);
    blocks[thisId.id] = block;
  }
  // ======================================================================
  // Input generation
  // ======================================================================
  _genInput(blockDict, inputName, expr, exprId, blocks, idFactory, parentId, sprite, s, noEmptyShadow = false, shadowOverride = null) {
    const shadow = shadowOverride !== null ? shadowOverride : noEmptyShadow ? null : this._shadowForInput(inputName);
    if (expr instanceof ExprValue) {
      blockDict.inputs[inputName] = [1, this._valueToShadow(expr.value, inputName)];
    } else if (expr instanceof ExprName) {
      const nameStr = expr.name instanceof Name ? expr.name.name : typeof expr.name === "string" ? expr.name : String(expr.name);
      if (nameStr === "answer") {
        const answerBlock = {
          opcode: "sensing_answer",
          next: null,
          parent: parentId,
          inputs: {},
          fields: {},
          shadow: false,
          topLevel: false
        };
        blocks[exprId.id] = answerBlock;
        blockDict.inputs[inputName] = shadow ? [3, exprId.id, shadow] : [3, exprId.id];
        return;
      }
      if (s.proc_name && s.locals[nameStr] && s.locals[nameStr] !== "mangle") {
        const argRead = {
          opcode: "argument_reporter_string_number",
          next: null,
          parent: parentId,
          inputs: {},
          fields: { VALUE: [nameStr, null] },
          shadow: false,
          topLevel: false
        };
        blocks[exprId.id] = argRead;
        if (shadow) {
          blockDict.inputs[inputName] = [3, exprId.id, shadow];
        } else {
          blockDict.inputs[inputName] = [2, exprId.id];
        }
        return;
      }
      const result = s.qualifyName(nameStr);
      if (result) {
        const [kind, qualifiedName] = result;
        const typeCode = kind === "var" ? 12 : 13;
        const sb3Id = kind === "list" ? "L:" + qualifiedName : qualifiedName;
        blockDict.inputs[inputName] = [
          3,
          [typeCode, qualifiedName, sb3Id],
          shadow
        ];
      } else {
        blockDict.inputs[inputName] = [
          3,
          [12, nameStr, nameStr],
          shadow
        ];
      }
    } else if (expr instanceof ExprArg) {
      const argName = expr.name instanceof Name ? expr.name.name : expr.name;
      const argBlock = {
        opcode: "argument_reporter_string_number",
        next: null,
        parent: parentId,
        inputs: {},
        fields: { VALUE: [argName, null] },
        shadow: false,
        topLevel: false
      };
      blocks[exprId.id] = argBlock;
      if (shadow) {
        blockDict.inputs[inputName] = [3, exprId.id, shadow];
      } else {
        blockDict.inputs[inputName] = [2, exprId.id];
      }
    } else if (expr instanceof ExprDot) {
      const lhsN = expr.lhs instanceof Name ? expr.lhs.name : expr.lhs && expr.lhs.name !== void 0 ? String(expr.lhs.name) : String(expr.lhs);
      const rhsN = expr.rhs instanceof Name ? expr.rhs.name : expr.rhs && expr.rhs.name !== void 0 ? String(expr.rhs.name) : String(expr.rhs);
      const dotted = `${lhsN}.${rhsN}`;
      let qual = s.qualifyName(dotted);
      if (!qual) qual = s.qualifyName(lhsN);
      const finalName = qual ? qual[1] : dotted;
      const typeCode = qual && qual[0] === "list" ? 13 : 12;
      const finalId = qual && qual[0] === "list" ? "L:" + finalName : finalName;
      blockDict.inputs[inputName] = [3, [typeCode, finalName, finalId], shadow];
    } else {
      this._genExpr(expr, blocks, idFactory, exprId, parentId, sprite, s);
      if (shadow) {
        blockDict.inputs[inputName] = [2, exprId.id, shadow];
      } else {
        blockDict.inputs[inputName] = [2, exprId.id];
      }
    }
  }
  _genExpr(expr, blocks, idFactory, exprId, parentId, sprite, s) {
    if (typeof parentId === "string") {
      parentId = { id: parentId };
    }
    if (expr instanceof ExprValue) {
      return;
    }
    if (expr instanceof ExprName) {
      return;
    }
    if (expr instanceof ExprBinOp) {
      this._genBinOp(expr, blocks, idFactory, exprId, parentId, sprite, s);
    } else if (expr instanceof ExprUnOp) {
      this._genUnOp(expr, blocks, idFactory, exprId, parentId, sprite, s);
    } else if (expr instanceof ExprTernary) {
      this._genTernary(expr, blocks, idFactory, exprId, parentId, sprite, s);
    } else if (expr instanceof ExprRepr) {
      this._genRepr(expr, blocks, idFactory, exprId, parentId, sprite, s);
    } else if (expr instanceof ExprFuncCall) {
      this._genFuncCallExpr(expr, blocks, idFactory, exprId, parentId, sprite, s);
    } else if (expr instanceof ExprArg) {
      return;
    } else if (expr instanceof ExprDot) {
      return;
    } else {
      blocks[exprId.id] = {
        opcode: "text",
        next: null,
        parent: parentId.id,
        inputs: {},
        fields: {},
        shadow: true,
        topLevel: false
      };
    }
  }
  _genBinOp(expr, blocks, idFactory, exprId, parentId, sprite, s) {
    if (expr.op === BinOp.Of) {
      const lhsName2 = expr.lhs instanceof ExprName ? expr.lhs.name instanceof Name ? expr.lhs.name.name : expr.lhs.name : expr.lhs instanceof ExprDot ? expr.lhs.name instanceof Name ? expr.lhs.name.name : expr.lhs.name : null;
      const listQual = lhsName2 ? s.qualifyName(lhsName2) : null;
      if (listQual && listQual[0] === "list") {
        const block3 = {
          opcode: "data_itemoflist",
          next: null,
          parent: parentId.id,
          inputs: {},
          fields: { LIST: [listQual[1], "L:" + listQual[1]] },
          shadow: false,
          topLevel: false
        };
        const indexId = idFactory.newId();
        this._genInput(block3, "INDEX", expr.rhs, indexId, blocks, idFactory, exprId.id, sprite, s);
        blocks[exprId.id] = block3;
        return;
      }
      const block2 = {
        opcode: "operator_letter_of",
        next: null,
        parent: parentId.id,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: false
      };
      const stringId = idFactory.newId();
      this._genInput(block2, "STRING", expr.lhs, stringId, blocks, idFactory, exprId.id, sprite, s);
      const letterId = idFactory.newId();
      this._genInput(block2, "LETTER", expr.rhs, letterId, blocks, idFactory, exprId.id, sprite, s);
      blocks[exprId.id] = block2;
      return;
    }
    if (expr.op === BinOp.In) {
      const rhsIsList = expr.rhs instanceof ExprName;
      if (rhsIsList) {
        const rhsNameStr = expr.rhs.name instanceof Name ? expr.rhs.name.name : expr.rhs.name;
        const rhsQual = s.qualifyName(rhsNameStr);
        if (rhsQual && rhsQual[0] === "list") {
          const listName = rhsQual[1];
          const block2 = {
            opcode: "data_listcontainsitem",
            next: null,
            parent: parentId.id,
            inputs: {},
            fields: { LIST: [listName, "L:" + listName] },
            shadow: false,
            topLevel: false
          };
          const itemId = idFactory.newId();
          this._genInput(block2, "ITEM", expr.lhs, itemId, blocks, idFactory, exprId.id, sprite, s);
          blocks[exprId.id] = block2;
          return;
        }
      }
    }
    const opcode = binopOpcode(expr.op);
    this._checkExtension(opcode);
    const block = {
      opcode,
      next: null,
      parent: parentId.id,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false
    };
    const lhsId = idFactory.newId();
    const rhsId = idFactory.newId();
    const lhsName = binopLhs(expr.op);
    const rhsName = binopRhs(expr.op);
    let lhsExpr = expr.lhs;
    let rhsExpr = expr.rhs;
    if (expr.op === BinOp.And || expr.op === BinOp.Or) {
      if (!_isBooleanExpr2(lhsExpr)) {
        const zero = new ExprValue(Value.fromFloat(0), expr.span);
        lhsExpr = new ExprUnOp(
          UnOp.Not,
          expr.span,
          new ExprBinOp(BinOp.Eq, expr.span, lhsExpr, zero)
        );
      }
      if (!_isBooleanExpr2(rhsExpr)) {
        const zero = new ExprValue(Value.fromFloat(0), expr.span);
        rhsExpr = new ExprUnOp(
          UnOp.Not,
          expr.span,
          new ExprBinOp(BinOp.Eq, expr.span, rhsExpr, zero)
        );
      }
    }
    this._genInput(block, lhsName, lhsExpr, lhsId, blocks, idFactory, exprId.id, sprite, s);
    this._genInput(block, rhsName, rhsExpr, rhsId, blocks, idFactory, exprId.id, sprite, s);
    blocks[exprId.id] = block;
  }
  // ExprTernary must never reach codegen: visitor pass1 lowers every
  // ternary into a hidden temp var + control_if_else statements (scratch-vm
  // has no if/else reporter primitive — an invented opcode would violate
  // the sb3 spec and evaluate to undefined at runtime).
  _genTernary() {
    throw new Error(
      "ExprTernary reached codegen un-lowered \u2014 visitor pass1 ternary expansion did not cover this statement type"
    );
  }
  _genUnOp(expr, blocks, idFactory, exprId, parentId, sprite, s) {
    if (expr.op === UnOp.Length) {
      if (expr.opr instanceof ExprName) {
        const nameStr = expr.opr.name instanceof Name ? expr.opr.name.name : expr.opr.name;
        const qualResult = s.qualifyName(nameStr);
        if (qualResult && qualResult[0] === "list") {
          const listName = qualResult[1];
          blocks[exprId.id] = {
            opcode: "data_lengthoflist",
            next: null,
            parent: parentId.id,
            inputs: {},
            fields: { LIST: [listName, "L:" + listName] },
            shadow: false,
            topLevel: false
          };
          return;
        }
      }
    }
    if (expr.op === UnOp.Minus) {
      const subBlock = {
        opcode: "operator_subtract",
        next: null,
        parent: parentId.id,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: false
      };
      subBlock.inputs.NUM1 = [1, [4, "0"]];
      const oprId2 = idFactory.newId();
      this._genInput(subBlock, "NUM2", expr.opr, oprId2, blocks, idFactory, exprId.id, sprite, s);
      blocks[exprId.id] = subBlock;
      return;
    }
    const opcode = unopOpcode(expr.op);
    this._checkExtension(opcode);
    let oprExpr = expr.opr;
    if (expr.op === UnOp.Not && !_isBooleanExpr2(oprExpr)) {
      const zero = new ExprValue(Value.fromFloat(0), expr.span);
      oprExpr = new ExprBinOp(BinOp.Eq, expr.span, oprExpr, zero);
    }
    const block = {
      opcode,
      next: null,
      parent: parentId.id,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false
    };
    const inputName = unopInput(expr.op);
    const oprId = idFactory.newId();
    this._genInput(block, inputName, oprExpr, oprId, blocks, idFactory, exprId.id, sprite, s);
    const fields = unopFields(expr.op);
    if (fields) {
      for (const [fname, fval] of Object.entries(fields)) {
        block.fields[fname] = fval;
      }
    }
    blocks[exprId.id] = block;
  }
  _genRepr(expr, blocks, idFactory, exprId, parentId, sprite, s) {
    const reprVal = expr.repr;
    const opcode = reprOpcode(reprVal);
    this._checkExtension(opcode);
    const block = {
      opcode,
      next: null,
      parent: parentId.id,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: false
    };
    if (reprVal === Repr.SensingOf) {
      let propValue = "x";
      if (expr.args.length > 0 && expr.args[0] instanceof ExprValue) {
        propValue = expr.args[0].value.kind === "string" ? expr.args[0].value.data : String(expr.args[0].value.toNumber());
      }
      block.fields.PROPERTY = [propValue, null];
      const menu2 = reprMenu(reprVal);
      const menuBlock = {
        opcode: menu2.opcode,
        next: null,
        parent: exprId.id,
        inputs: {},
        fields: {},
        shadow: true,
        topLevel: false
      };
      menuBlock.fields[menu2.field] = [menu2.default, null];
      const menuId = idFactory.newId();
      blocks[menuId.id] = menuBlock;
      const objectArg = expr.args.length > 1 ? expr.args[1] : null;
      if (!objectArg) {
        block.inputs.OBJECT = [1, menuId.id];
      } else if (objectArg instanceof ExprValue) {
        let valStr = objectArg.value.kind === "string" ? objectArg.value.data : String(objectArg.value.toNumber());
        if (valStr === "Stage" || valStr === "stage" || valStr === "_stage_") {
          valStr = "_stage_";
        }
        menuBlock.fields[menu2.field] = [valStr, null];
        block.inputs.OBJECT = [1, menuId.id];
      } else {
        const argId = idFactory.newId();
        this._genInput(block, "OBJECT", objectArg, argId, blocks, idFactory, exprId.id, sprite, s, false, menuId.id);
      }
      blocks[exprId.id] = block;
      return;
    }
    const fields = reprFields(reprVal);
    if (fields) {
      for (const [fname, fval] of Object.entries(fields)) {
        block.fields[fname] = fval;
      }
    }
    const menu = reprMenu(reprVal);
    const argNames = reprArgs(reprVal);
    const menuArgIdx = menu ? argNames.indexOf(menu.input) : -1;
    if (menu && menuArgIdx < 0) {
      const menuArgIndex = argNames.length;
      if (expr.args.length > menuArgIndex) {
        const menuArg = expr.args[menuArgIndex];
        if (menuArg instanceof ExprName) {
          const argName = menuArg.name instanceof Name ? menuArg.name.name : menuArg.name;
          const qualResult = s.qualifyName(argName);
          const listName = qualResult ? qualResult[1] : argName;
          if (menu.field) {
            block.fields[menu.field] = [listName, listName];
          }
        } else {
          this._genMenuShadow(
            block,
            menu,
            exprId,
            expr.args[menuArgIndex],
            blocks,
            idFactory,
            sprite,
            s
          );
        }
      } else {
        this._genMenuShadow(
          block,
          menu,
          exprId,
          null,
          blocks,
          idFactory,
          sprite,
          s
        );
      }
    }
    for (let i = 0; i < argNames.length && i < expr.args.length; i++) {
      const inputName = argNames[i];
      const argExpr = expr.args[i];
      const argId = idFactory.newId();
      if (menu && i === menuArgIdx) {
        const menuBlock = {
          opcode: menu.opcode,
          next: null,
          parent: exprId.id,
          inputs: {},
          fields: {},
          shadow: true,
          topLevel: false
        };
        if (menu.field) {
          menuBlock.fields[menu.field] = [menu.default, null];
        }
        const menuId = idFactory.newId();
        blocks[menuId.id] = menuBlock;
        if (argExpr instanceof ExprValue) {
          let valStr = argExpr.value.kind === "string" ? argExpr.value.data : String(argExpr.value.toNumber());
          if (menu.field) {
            if (menu.opcode === "sensing_of_object_menu" && (valStr === "Stage" || valStr === "stage" || valStr === "_stage_")) {
              valStr = "_stage_";
            }
            menuBlock.fields[menu.field] = [valStr, null];
          }
          block.inputs[inputName] = [1, menuId.id];
        } else {
          this._genInput(block, inputName, argExpr, argId, blocks, idFactory, exprId.id, sprite, s, false, menuId.id);
        }
        continue;
      }
      this._genInput(block, inputName, argExpr, argId, blocks, idFactory, exprId.id, sprite, s);
    }
    blocks[exprId.id] = block;
  }
  // Generate a menu shadow block for an input
  _genMenuShadow(block, menu, exprId, argExpr, blocks, idFactory, sprite, s) {
    const menuBlock = {
      opcode: menu.opcode,
      next: null,
      parent: exprId.id,
      inputs: {},
      fields: {},
      shadow: true,
      topLevel: false
    };
    if (menu.field) {
      menuBlock.fields[menu.field] = [menu.default, null];
    }
    const menuId = idFactory.newId();
    blocks[menuId.id] = menuBlock;
    if (argExpr instanceof ExprName) {
      const argName = argExpr.name instanceof Name ? argExpr.name.name : argExpr.name;
      block.inputs[menu.input] = [3, [12, argName, argName], menuId.id];
    } else {
      block.inputs[menu.input] = [1, menuId.id];
    }
  }
  _genFuncCallExpr(expr, blocks, idFactory, exprId, parentId, sprite, s) {
    const callName = expr.name instanceof Name ? expr.name.name : String(expr.name);
    const callArgs = expr.args || [];
    if (/^(to_number|str_to_num|tonumber|num|int|float|val)$/i.test(callName) && callArgs.length === 1) {
      const mulBlock = {
        opcode: "operator_multiply",
        next: null,
        parent: parentId.id,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: false
      };
      this._genInput(mulBlock, "NUM1", callArgs[0], idFactory.newId(), blocks, idFactory, exprId.id, sprite, s);
      mulBlock.inputs.NUM2 = [1, [4, 1]];
      blocks[exprId.id] = mulBlock;
      return;
    }
    blocks[exprId.id] = {
      opcode: "text",
      next: null,
      parent: parentId.id,
      inputs: {},
      fields: {},
      shadow: true,
      topLevel: false
    };
  }
  // ======================================================================
  // Shadow / value helpers
  // ======================================================================
  _valueToShadow(value, inputName) {
    if (value.kind === "number") {
      const n = value.toNumber();
      if (!Number.isFinite(n)) {
        return [4, n > 0 ? "Infinity" : n < 0 ? "-Infinity" : "NaN"];
      }
      return [4, n];
    }
    if (value.kind === "boolean") {
      return [4, value.data ? 1 : 0];
    }
    if (value.kind === "string") {
      if (inputName === "BROADCAST_INPUT") {
        return [11, value.data, value.data];
      }
      const isColorInput = inputName === "COLOR" || inputName === "COLOR2";
      const color = _parseColor(value.data);
      if (isColorInput && color) {
        return [9, color];
      }
      return [10, value.data];
    }
    return [10, ""];
  }
  _shadowForInput(inputName) {
    if (inputName === "BROADCAST_INPUT") {
      const broadcastName = "message1";
      return [11, broadcastName, broadcastName];
    }
    return [10, ""];
  }
  _checkExtension(opcode) {
    if (opcode.startsWith("pen_")) {
      this.extensions.pen = true;
    } else if (opcode.startsWith("music_")) {
      this.extensions.music = true;
    }
  }
  static _valueToNumber(value) {
    if (value instanceof Value) {
      if (value.kind === "number") return value.toNumber();
      if (value.kind === "boolean") return value.toBoolean() ? 1 : 0;
      return value.toNumber();
    }
    return 0;
  }
};
function _coerceCondition(expr, s) {
  if (expr === null || expr === void 0) {
    return new ExprValue(Value.fromFloat(0), [0, 0]);
  }
  if (!_isBooleanExpr2(expr)) {
    const zero = new ExprValue(Value.fromFloat(0), [0, 0]);
    const eq = new ExprBinOp(BinOp.Eq, [0, 0], expr, zero);
    return new ExprUnOp(UnOp.Not, [0, 0], eq);
  }
  return expr;
}
function _isBooleanExpr2(expr) {
  if (expr instanceof ExprBinOp) {
    return expr.op === BinOp.Eq || expr.op === BinOp.Ne || expr.op === BinOp.Lt || expr.op === BinOp.Gt || expr.op === BinOp.Le || expr.op === BinOp.Ge || expr.op === BinOp.And || expr.op === BinOp.Or || expr.op === BinOp.In;
  }
  if (expr instanceof ExprUnOp) {
    return expr.op === UnOp.Not;
  }
  if (expr instanceof ExprRepr) {
    return expr.repr === Repr.Contains || expr.repr === Repr.Touching || expr.repr === Repr.TouchingMousePointer || expr.repr === Repr.TouchingEdge || expr.repr === Repr.KeyPressed || expr.repr === Repr.MouseDown;
  }
  return false;
}
var _COLOR_NAME_MAP = {
  "white": "#ffffff",
  "black": "#000000",
  "red": "#ff0000",
  "green": "#00ff00",
  "blue": "#0000ff",
  "yellow": "#ffff00",
  "cyan": "#00ffff",
  "magenta": "#ff00ff",
  "orange": "#ffa500",
  "purple": "#800080",
  "pink": "#ffc0cb",
  "brown": "#a52a2a",
  "gray": "#808080",
  "grey": "#808080",
  "lightblue": "#add8e6",
  "lightgreen": "#90ee90",
  "lightred": "#ffcccb",
  "darkblue": "#00008b",
  "darkgreen": "#006400",
  "darkred": "#8b0000"
};
var _HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
function _parseColor(string) {
  if (typeof string !== "string") return null;
  const s = string.trim().toLowerCase();
  if (s in _COLOR_NAME_MAP) return _COLOR_NAME_MAP[s];
  if (_HEX_RE.test(s)) {
    if (s.length === 4) {
      return "#" + s.slice(1).split("").map((c) => c + c).join("");
    }
    if (s.length === 9) {
      return s.slice(0, 7);
    }
    return s;
  }
  const m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    const r = parseInt(m[1]);
    const g = parseInt(m[2]);
    const b = parseInt(m[3]);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }
  return null;
}

// src/compiler-build/compile.browser.js
function _offsetToLineCol(source, offset) {
  if (offset < 0) return [1, 1];
  let line = 1, col = 1;
  for (let i = 0; i < source.length; i++) {
    if (i >= offset) break;
    if (source[i] === "\n") {
      line++;
      col = 1;
    } else col++;
  }
  return [line, col];
}
var _DIAGNOSTIC_MESSAGES = {
  VariableRedefinition: "\u91CD\u590D\u58F0\u660E\uFF1A\u8BE5\u540D\u5B57\u6B64\u524D\u5DF2\u58F0\u660E\u8FC7\u3002\u53D8\u91CF\u7528 `var \u540D = \u503C;` \u53EA\u80FD\u58F0\u660E\u4E00\u6B21\uFF0C\u4E4B\u540E\u518D\u8D4B\u503C\u8BF7\u76F4\u63A5\u5199 `\u540D = \u503C;`\uFF1B\u5217\u8868\u7528 `list \u540D;` \u58F0\u660E\uFF0C\u4E14\u4E0D\u80FD\u4E0E\u53D8\u91CF\u540C\u540D\u3002",
  FixedLengthListInvalid: "\u5217\u8868\u56FA\u5B9A\u957F\u5EA6\u5199\u6CD5\u65E0\u6548\uFF1A`list \u540D = [\u9ED8\u8BA4\u503C; \u4E2A\u6570]` \u7684\u4E2A\u6570\u5FC5\u987B\u662F\u6B63\u6574\u6570\u5E38\u91CF\u3002"
};
function _sanitizeSource(src) {
  return src.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}
function _spriteHasContent(s) {
  return s.costumes.length > 0 || s.sounds.length > 0 || Object.keys(s.vars).length > 0 || Object.keys(s.lists).length > 0 || s.events.length > 0 || Object.keys(s.procs).length > 0 || Object.keys(s.funcs).length > 0 || s.orphanChains.length > 0 || Object.keys(s.enums).length > 0 || Object.keys(s.structs).length > 0;
}
function _toUserSourceParseError(userSource, prefixLen, e) {
  const off = Math.max(0, (e.pos || 0) - prefixLen);
  const [line, col] = _offsetToLineCol(userSource, off);
  const err = new Error(`L${line}:${col} ${e.message}`);
  err.line = line;
  err.column = col;
  return err;
}
function validateSource(source) {
  source = _sanitizeSource(source);
  const errors = [];
  let tokens;
  try {
    tokens = lex(source);
  } catch (e) {
    if (e instanceof LexError) {
      const [line, col] = _offsetToLineCol(source, e.offset);
      errors.push({ line, column: col, message: e.message, kind: "LexError" });
      return errors;
    }
    throw e;
  }
  try {
    tokens = preprocess(tokens);
  } catch (e) {
    if (e instanceof PreProcessorError) {
      const [line, col] = _offsetToLineCol(source, e.span ? e.span[0] : 0);
      errors.push({ line, column: col, message: e.message, kind: e.kind });
      return errors;
    }
    throw e;
  }
  {
    const isNoise = (t) => /Whitespace|Newline|Comment/i.test(String(t.type));
    let namingErrors = 0;
    for (let i = 0; i < tokens.length - 1 && namingErrors < 5; i++) {
      const t = tokens[i];
      if (t.type !== TokenType.Func && t.type !== TokenType.Proc) continue;
      let j = i + 1;
      while (j < tokens.length && isNoise(tokens[j])) j++;
      const nameTok = tokens[j];
      if (!nameTok) continue;
      const raw = source.slice(nameTok.start || 0, nameTok.end || 0);
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(raw)) continue;
      const isNameTok = nameTok.type === TokenType.Name;
      const isKwSlot = !isNameTok && Object.prototype.hasOwnProperty.call(KEYWORDS, raw);
      if (!isNameTok && !isKwSlot) continue;
      if (/^def_/.test(raw)) continue;
      const [ln, cl] = _offsetToLineCol(source, nameTok.start || 0);
      errors.push({ line: ln, column: cl, message: "\u51FD\u6570\u540D\u5FC5\u987B\u4EE5 def \u5F00\u5934\uFF08\u4FDD\u7559\u5B57\u4FDD\u62A4\uFF09\uFF1A" + raw + " \u2192 def_" + raw, kind: "NamingError" });
      namingErrors++;
    }
  }
  const parser = new Parser(tokens);
  parser.skipNoise();
  while (!parser.isAtEnd()) {
    try {
      parser.declaration();
    } catch (e) {
      if (e instanceof ParseError) {
        const [line, col] = _offsetToLineCol(source, e.pos);
        errors.push({ line, column: col, message: e.message, kind: "ParseError" });
        if (e.inBody) break;
        parser.skipToNextStatement();
        parser.skipNoise();
        continue;
      }
      throw e;
    }
    parser.skipNoise();
  }
  for (const d of parser.diagnostics || []) {
    const start = d.span ? d.span[0] : 0;
    const end = d.span && d.span.length > 1 ? d.span[1] : start;
    const [line, col] = _offsetToLineCol(source, start);
    const snippet = end > start ? source.slice(start, end).trim() : "";
    const base = _DIAGNOSTIC_MESSAGES[d.kind] || "\u7F16\u8BD1\u8BCA\u65AD\uFF1A" + d.kind;
    errors.push({ line, column: col, message: snippet ? `${base}\uFF08\u51FA\u9519\u4F4D\u7F6E\uFF1A${snippet}\uFF09` : base, kind: d.kind || "Diagnostic" });
  }
  return errors;
}
async function compileSource(userSource) {
  userSource = _sanitizeSource(userSource);
  const stageSource = `costumes "cd21514d0531fdffb22204e0ec5ed84a.svg";
`;
  const prefix = "";
  const suffix = userSource.endsWith("\n") ? "" : "\n";
  const spriteSource = prefix + userSource + suffix;
  const stageTokens = preprocess(lex(stageSource));
  const stageSprite = parse(stageTokens);
  let sprite1;
  try {
    sprite1 = parse(preprocess(lex(spriteSource)));
  } catch (e) {
    if (e instanceof ParseError) throw _toUserSourceParseError(userSource, prefix.length, e);
    throw e;
  }
  const dropped = (sprite1.diagnostics || []).filter((d) => d.kind === "ParseError");
  if (dropped.length > 0) {
    const firstSpan = dropped[0].span || [];
    const off = Math.max(0, (typeof firstSpan[0] === "number" ? firstSpan[0] : 0) - prefix.length);
    const [line, col] = _offsetToLineCol(userSource, off);
    const firstReason = dropped[0].message ? `\uFF1A${dropped[0].message}` : "";
    const err = new Error(`L${line}:${col} \u8BED\u6CD5\u9519\u8BEF\uFF0C\u8BE5\u8BED\u53E5\u5DF2\u88AB\u8DF3\u8FC7\uFF08\u5171 ${dropped.length} \u5904\uFF09\uFF0C\u9879\u76EE\u4E0D\u5B8C\u6574\uFF1B\u8BF7\u4FEE\u590D\u540E\u91CD\u65B0\u7F16\u8BD1${firstReason}`);
    err.line = line;
    err.column = col;
    err.errorCount = dropped.length;
    err.firstReason = dropped[0].message || null;
    throw err;
  }
  const extras = sprite1._extraTargets || [];
  const spritesMap = {};
  if (_spriteHasContent(sprite1) || extras.length === 0) {
    spritesMap[sprite1.name || "Sprite1"] = sprite1;
  }
  let projectStage = stageSprite;
  for (const ext of extras) {
    ext.sprite.name = ext.isStage ? "Stage" : ext.name;
    if (ext.isStage) projectStage = ext.sprite;
    else spritesMap[ext.name] = ext.sprite;
  }
  if (Object.keys(spritesMap).length === 0) spritesMap["Sprite1"] = sprite1;
  const project = new Project(projectStage, spritesMap);
  visitProjectPass0(project);
  visitProjectPass1(project);
  visitProjectPass2(project);
  visitProjectDCE(project);
  const codegen = new CodeGen();
  const arrayBuffer = await codegen.makeSb3(project);
  return arrayBuffer;
}
function countBlocks(projectJson) {
  let count = 0;
  for (const target of projectJson.targets || []) {
    const blocks = target.blocks || {};
    for (const bid in blocks) {
      if (typeof blocks[bid] === "object" && !Array.isArray(blocks[bid])) count++;
    }
  }
  return count;
}

// src/compiler-build/entry.js
globalThis._BROWSER_ASSETS = _BROWSER_ASSETS2;
globalThis._md5HexStr = _md5HexStr2;
globalThis._bytesToStr = _bytesToStr2;
globalThis._strToBytes = _strToBytes2;
globalThis._bytesToU8 = _bytesToU82;
globalThis._u8ToArrayBuffer = _u8ToArrayBuffer2;
globalThis._JSZip = import_jszip.default;
export {
  compileSource,
  countBlocks,
  validateSource
};
/*! Bundled license information:

jszip/dist/jszip.min.js:
  (*!
  
  JSZip v3.10.1 - A JavaScript class for generating and reading zip files
  <http://stuartk.com/jszip>
  
  (c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
  Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.
  
  JSZip uses the library pako released under the MIT license :
  https://github.com/nodeca/pako/blob/main/LICENSE
  *)
*/
