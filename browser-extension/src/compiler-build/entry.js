// Bundle entry: sets up browser shim globals, then re-exports the compiler.
import { JSZip, _md5HexStr, _bytesToStr, _strToBytes, _bytesToU8, _u8ToArrayBuffer, _BROWSER_ASSETS } from './browser-shims.patched.js';
globalThis._BROWSER_ASSETS = _BROWSER_ASSETS;
globalThis._md5HexStr = _md5HexStr;
globalThis._bytesToStr = _bytesToStr;
globalThis._strToBytes = _strToBytes;
globalThis._bytesToU8 = _bytesToU8;
globalThis._u8ToArrayBuffer = _u8ToArrayBuffer;
globalThis._JSZip = JSZip;

export { compileSource, validateSource, countBlocks } from './compile.browser.js';
