/**
 * Golomb-Rice (k=4) encoder producing bit-packed Base64 output.
 */

class BitWriter {
  constructor() {
    this.bytes = [];
    this.current = 0;
    this.bitPos = 0;
  }

  writeBit(b) {
    if (b) this.current |= (0x80 >> this.bitPos);
    this.bitPos++;
    if (this.bitPos === 8) {
      this.bytes.push(this.current);
      this.current = 0;
      this.bitPos = 0;
    }
  }

  writeBits(value, count) {
    for (let i = count - 1; i >= 0; i--) {
      this.writeBit((value >> i) & 1);
    }
  }

  // Golomb-Rice unary: write `count` ones followed by a zero
  writeUnary(count) {
    for (let i = 0; i < count; i++) this.writeBit(1);
    this.writeBit(0);
  }

  finish() {
    if (this.bitPos > 0) {
      this.bytes.push(this.current);
    }
    return Buffer.from(this.bytes);
  }
}

function encodeGR(asns) {
  if (asns.length === 0) return "";

  const OFFSET = asns[0];
  const N = asns.length;
  const U = asns[N - 1] - asns[0] + 1;
  const k = 4;

  // Compute gaps (N-1 gaps between consecutive ASNs)
  const bw = new BitWriter();
  for (let i = 1; i < N; i++) {
    const g = asns[i] - asns[i - 1];
    const q = g >> k;
    const r = g & ((1 << k) - 1);
    bw.writeUnary(q);
    bw.writeBits(r, k);
  }

  const payload = bw.finish();
  const totalBits = (N - 1 === 0) ? 0 : (bw.bytes.length - (bw.bitPos > 0 ? 1 : 0)) * 8 + bw.bitPos;

  // Common header
  const header = Buffer.alloc(14);
  header.writeUInt32LE(OFFSET, 0);
  header.writeUInt32LE(N, 4);
  header.writeUInt32LE(U, 8);
  header.writeUInt8(k, 12);
  header.writeUInt8(0, 13); // l = unused

  return Buffer.concat([header, payload]).toString("base64");
}

module.exports = { encodeGR };
