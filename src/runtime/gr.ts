import { bitAt, toUint8Array } from "./base64";
import { metadataFromHeader, readCommonHeader } from "./header";
import { normalizeASN } from "./normalize";
import type { ASNInput, ASNSet, ASNSetOptions } from "./types";

export function createGRSet(data: string | Uint8Array, options: ASNSetOptions = {}): ASNSet {
  const bytes = toUint8Array(data);
  const header = readCommonHeader(bytes);
  if (header.k === 0) {
    throw new Error("ASN dataset is not Golomb-Rice encoded");
  }

  const bucket = new Uint16Array(Math.ceil(header.range / 16));
  if (header.count > 0) {
    bucket[0] |= 1;
  }

  let bitPosition = 14 * 8;
  let relative = 0;
  for (let i = 1; i < header.count; i++) {
    let q = 0;
    while (bitAt(bytes, bitPosition) === 1) {
      q++;
      bitPosition++;
    }
    bitPosition++;

    let r = 0;
    for (let j = 0; j < header.k; j++) {
      r = (r << 1) | bitAt(bytes, bitPosition);
      bitPosition++;
    }

    relative += (q << header.k) | r;
    bucket[relative >> 4] |= 1 << (relative & 15);
  }

  const kind = options.kind ?? "hosting";
  const metadata = metadataFromHeader(header, kind, "gr");

  return {
    kind,
    encoding: "gr",
    metadata,
    has(input: ASNInput): boolean {
      const asn = normalizeASN(input);
      if (asn === null) return false;
      const position = asn - header.offset;
      if (position < 0 || position >= header.range) return false;
      return ((bucket[position >> 4] >> (position & 15)) & 1) === 1;
    },
  };
}
