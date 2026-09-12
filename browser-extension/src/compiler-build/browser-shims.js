// Browser shims for the goboscript compiler bundle.
import JSZip from 'jszip';

const utf8enc = new TextEncoder();
const utf8dec = new TextDecoder('utf-8');

function _bytesToStr(buf) {
  if (typeof buf === 'string') return buf;
  const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return utf8dec.decode(u);
}
function _strToBytes(str) { return utf8enc.encode(str); }
function _bytesToU8(data) { return data instanceof Uint8Array ? data : _strToBytes(String(data)); }
function _u8ToArrayBuffer(u8) { return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength); }

// ---- MD5 (pure JS, RFC1321) ----
function _md5HexStr(str) {
  const bytes = utf8enc.encode(str);
  const n = bytes.length;
  const nbits = n * 8;
  const padded = new Uint8Array(((n + 8) >> 6 << 6) + 64);
  padded.set(bytes);
  padded[n] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, nbits, true);
  const S = [7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21];
  const K = [];
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
  let a0=0x67452301|0,b0=0xefcdab89|0,c0=0x98badcfe|0,d0=0x10325476|0;
  const hex = (x) => ('00000000' + (x >>> 0).toString(16)).slice(-8);
  for (let i = 0; i < padded.length; i += 64) {
    const M = [];
    for (let j = 0; j < 16; j++) M[j] = dv.getUint32(i + j * 4, true);
    let A=a0,B=b0,C=c0,D=d0;
    for (let j=0;j<64;j++){
      let F,g;
      if (j<16){ F=(B&C)|(~B&D); g=j; }
      else if (j<32){ F=(D&B)|(~D&C); g=(5*j+1)%16; }
      else if (j<48){ F=B^C^D; g=(3*j+5)%16; }
      else { F=C^(B|~D); g=(7*j)%16; }
      F=(F+A+K[j]+M[g])|0;
      A=D;D=C;C=B;B=(B+rol(F,S[(j>>4)*4+(j%4)]))|0;
    }
    a0=(a0+A)|0;b0=(b0+B)|0;c0=(c0+C)|0;d0=(d0+D)|0;
  }
  return hex(a0)+hex(b0)+hex(c0)+hex(d0);
}
function rol(n,c){ return (n << c) | (n >>> (32 - c)); }

const _BROWSER_ASSETS = {
  'cd21514d0531fdffb22204e0ec5ed84a.svg': '{{BACKDROP_SVG}}',
  'dango-cat.svg': '{{DANGO_SVG}}',
};

export { JSZip, _md5HexStr, _bytesToStr, _strToBytes, _bytesToU8, _u8ToArrayBuffer, _BROWSER_ASSETS };
