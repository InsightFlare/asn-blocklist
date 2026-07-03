import { bitAt, toUint8Array } from "./base64";
import { dataView, metadataFromHeader, readCommonHeader } from "./header";
import { normalizeASN } from "./normalize";
import type { ASNInput, ASNSet, ASNSetOptions } from "./types";

interface EFSubHeader {
  lowOffset: number;
  highOffset: number;
  selectOffset: number;
  selectStep: number;
}

function readEFSubHeader(bytes: Uint8Array): EFSubHeader {
  if (bytes.byteLength < 28) {
    throw new Error("ASN EF dataset is too short to contain a valid sub-header");
  }

  const view = dataView(bytes);
  return {
    lowOffset: view.getUint32(14, true),
    highOffset: view.getUint32(18, true),
    selectOffset: view.getUint32(22, true),
    selectStep: view.getUint16(26, true),
  };
}

export function createEFSet(data: string | Uint8Array, options: ASNSetOptions = {}): ASNSet {
  const bytes = toUint8Array(data);
  const header = readCommonHeader(bytes);
  if (header.l === 0) {
    throw new Error("ASN dataset is not Elias-Fano encoded");
  }

  const view = dataView(bytes);
  const sub = readEFSubHeader(bytes);
  const lowMask = (1 << header.l) - 1;
  const kind = options.kind ?? "hosting";
  const metadata = metadataFromHeader(header, kind, "ef");

  function selectZero(n: number): number {
    if (n === 0) return 0;

    const sampleIndex = Math.floor((n - 1) / sub.selectStep);
    let position = view.getUint32(sub.selectOffset + sampleIndex * 4, true);
    const target = n - sampleIndex * sub.selectStep;
    let count = 0;

    while (count < target) {
      if (bitAt(bytes, sub.highOffset * 8 + position) === 0) {
        count++;
      }
      position++;
    }

    return position;
  }

  function readLow(index: number): number {
    let value = 0;
    const bitPosition = sub.lowOffset * 8 + index * header.l;
    for (let i = 0; i < header.l; i++) {
      value = (value << 1) | bitAt(bytes, bitPosition + i);
    }
    return value;
  }

  return {
    kind,
    encoding: "ef",
    metadata,
    has(input: ASNInput): boolean {
      const asn = normalizeASN(input);
      if (asn === null) return false;
      if (asn < header.offset || asn > header.offset + header.range - 1) return false;

      const relative = asn - header.offset;
      const high = relative >> header.l;
      const low = relative & lowMask;

      let start: number;
      let end: number;

      if (high === 0) {
        start = 0;
        end = selectZero(1) - 1;
      } else {
        const previousZero = selectZero(high);
        const nextZero = selectZero(high + 1);
        start = previousZero - high;
        end = nextZero - (high + 1);
      }

      for (let i = start; i < end; i++) {
        if (readLow(i) === low) return true;
      }
      return false;
    },
  };
}
