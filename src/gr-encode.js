/**
 * Golomb-Rice (k=4) encoder.
 *
 * Produces a Base64 string with the common header followed by
 * bit-packed GR-encoded gaps.
 *
 * Common header (14 bytes):
 *   0..3   OFFSET  uint32 LE
 *   4..7   N       uint32 LE
 *   8..11  U       uint32 LE
 *   12     k       uint8
 *   13     l       uint8 (0 = unused)
 *   14..   GR-encoded gap bitstream
 *
 * TODO: implement proper GR bit-packing. Currently uses raw uint16 gaps
 * as a placeholder to enable end-to-end testing.
 */

function encodeGR(asns) {
  if (asns.length === 0) return "";

  const OFFSET = asns[0];
  const N = asns.length;
  const U = asns[N - 1] - asns[0] + 1;
  const k = 4;
  const l = 0; // unused for GR

  // Placeholder: store gaps as uint16 instead of bit-packed GR
  const gaps = [];
  gaps.push(asns[0] - OFFSET); // always 0
  for (let i = 1; i < N; i++) {
    gaps.push(asns[i] - asns[i - 1]);
  }

  // Build header + gaps buffer
  const payload = Buffer.alloc(gaps.length * 2);
  for (let i = 0; i < gaps.length; i++) {
    payload.writeUInt16LE(gaps[i], i * 2);
  }

  const header = Buffer.alloc(14);
  header.writeUInt32LE(OFFSET, 0);
  header.writeUInt32LE(N, 4);
  header.writeUInt32LE(U, 8);
  header.writeUInt8(k, 12);
  header.writeUInt8(l, 13);

  return Buffer.concat([header, payload]).toString("base64");
}

module.exports = { encodeGR };
