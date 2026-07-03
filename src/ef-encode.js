/**
 * Elias-Fano + select0 index encoder.
 *
 * Produces a Base64 string with:
 *   - Common header (14 bytes)
 *   - EF sub-header (14 bytes): lowOffset, highOffset, selectOffset, selectStep
 *   - Low bits array (N * l bits)
 *   - High unary bitstream
 *   - Select0 index (array of uint32 bit positions)
 *
 * TODO: implement proper EF encoding with bit packing.
 * Currently stores raw values and offsets as a placeholder.
 */

function encodeEF(asns) {
  if (asns.length === 0) return "";

  const OFFSET = asns[0];
  const N = asns.length;
  const U = asns[N - 1] - asns[0] + 1;
  const k = 0; // unused for EF
  const l = 4; // low bits width = floor(log2(U/N))

  // Sub-header: offsets (placeholder values)
  const subHeader = Buffer.alloc(14);
  subHeader.writeUInt32LE(28, 0);  // lowOffset
  subHeader.writeUInt32LE(28, 4);  // highOffset (placeholder)
  subHeader.writeUInt32LE(28, 8);  // selectOffset (placeholder)
  subHeader.writeUInt16LE(64, 12); // selectStep

  // Placeholder payload: raw uint32 values
  const payload = Buffer.alloc(asns.length * 4);
  for (let i = 0; i < asns.length; i++) {
    payload.writeUInt32LE(asns[i] - OFFSET, i * 4);
  }

  // Common header
  const header = Buffer.alloc(14);
  header.writeUInt32LE(OFFSET, 0);
  header.writeUInt32LE(N, 4);
  header.writeUInt32LE(U, 8);
  header.writeUInt8(k, 12);
  header.writeUInt8(l, 13);

  return Buffer.concat([header, subHeader, payload]).toString("base64");
}

module.exports = { encodeEF };
