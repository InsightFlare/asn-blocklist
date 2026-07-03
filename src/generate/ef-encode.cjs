/**
 * Elias-Fano + select0 index encoder producing Base64 output.
 *
 * Common header + EF sub-header + 3 bitstreams.
 *
 * l = floor(log2(U/N)) padded to nearest integer.
 * For each p = asn[i] - OFFSET: high = p >> l, low = p & ((1<<l)-1)
 *
 * Low bits:   packed N*l bits
 * High bits:  unary-encoded bucket delimiters (1=element, 0=bucket boundary)
 * Select0:    bit-position index into the high stream, sampled every selectStep zeros
 */

const SELECT_STEP = 256;

class BitWriter {
  constructor() {
    this.bytes = [];
    this.current = 0;
    this.bitPos = 0;
    this.totalBits = 0;
  }

  writeBit(b) {
    if (b) this.current |= (0x80 >> this.bitPos);
    this.bitPos++;
    this.totalBits++;
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

  finish() {
    if (this.bitPos > 0) {
      this.bytes.push(this.current);
    }
    return Buffer.from(this.bytes);
  }
}

function encodeEF(asns) {
  if (asns.length === 0) return "";

  const OFFSET = asns[0];
  const N = asns.length;
  const U = asns[N - 1] - asns[0] + 1;

  // l = floor(log2(U/N))
  const l = Math.max(1, Math.floor(Math.log2(U / N)));

  // Split each value into (high, low)
  const lowVals = new Array(N);
  const highVals = new Array(N);
  const hMax = 0;
  for (let i = 0; i < N; i++) {
    const p = asns[i] - OFFSET;
    lowVals[i] = p & ((1 << l) - 1);
    highVals[i] = p >> l;
  }

  // --- Low bits bitstream ---
  const lowWriter = new BitWriter();
  for (let i = 0; i < N; i++) {
    lowWriter.writeBits(lowVals[i], l);
  }
  const lowBytes = lowWriter.finish();

  // --- High bits bitstream ---
  // Group elements by high value, emit 1s for elements + 0 as bucket delimiter
  const highWriter = new BitWriter();
  const bucketGroups = new Map();
  for (let i = 0; i < N; i++) {
    const h = highVals[i];
    if (!bucketGroups.has(h)) bucketGroups.set(h, []);
    bucketGroups.get(h).push(i);
  }

  const sortedBuckets = [...bucketGroups.keys()].sort((a, b) => a - b);
  const maxBucket = sortedBuckets[sortedBuckets.length - 1];

  // Also track zero positions for select index
  const zeroPositions = []; // bit positions of each zero

  for (let b = 0; b <= maxBucket; b++) {
    const count = bucketGroups.has(b) ? bucketGroups.get(b).length : 0;
    for (let j = 0; j < count; j++) {
      highWriter.writeBit(1);
    }
    highWriter.writeBit(0);
    zeroPositions.push(highWriter.totalBits - 1);
  }
  const highBytes = highWriter.finish();

  // --- Select0 index ---
  // Sample every SELECT_STEP zeros, store bit positions as uint32
  const selectPositions = [];
  for (let i = 0; i < zeroPositions.length; i += SELECT_STEP) {
    selectPositions.push(zeroPositions[i]);
  }

  const selectBytes = Buffer.alloc(selectPositions.length * 4);
  for (let i = 0; i < selectPositions.length; i++) {
    selectBytes.writeUInt32LE(selectPositions[i], i * 4);
  }

  // --- Assemble ---
  const commonHeader = Buffer.alloc(14);
  commonHeader.writeUInt32LE(OFFSET, 0);
  commonHeader.writeUInt32LE(N, 4);
  commonHeader.writeUInt32LE(U, 8);
  commonHeader.writeUInt8(0, 12);   // k = unused
  commonHeader.writeUInt8(l, 13);

  // EF sub-header
  const lowOffset = 14 + 14;        // after common + sub headers
  const highOffset = lowOffset + lowBytes.length;
  const selectOffset = highOffset + highBytes.length;

  const subHeader = Buffer.alloc(14);
  subHeader.writeUInt32LE(lowOffset, 0);
  subHeader.writeUInt32LE(highOffset, 4);
  subHeader.writeUInt32LE(selectOffset, 8);
  subHeader.writeUInt16LE(SELECT_STEP, 12);

  return Buffer.concat([commonHeader, subHeader, lowBytes, highBytes, selectBytes]).toString("base64");
}

module.exports = { encodeEF };
