import type { ASNEncoding, ASNListKind, ASNSetMetadata } from "./types";

export interface CommonHeader {
  offset: number;
  count: number;
  range: number;
  k: number;
  l: number;
}

export function dataView(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

export function readCommonHeader(bytes: Uint8Array): CommonHeader {
  if (bytes.byteLength < 14) {
    throw new Error("ASN dataset is too short to contain a valid header");
  }

  const view = dataView(bytes);
  return {
    offset: view.getUint32(0, true),
    count: view.getUint32(4, true),
    range: view.getUint32(8, true),
    k: view.getUint8(12),
    l: view.getUint8(13),
  };
}

export function metadataFromHeader(
  header: CommonHeader,
  kind: ASNListKind,
  encoding: ASNEncoding,
): ASNSetMetadata {
  return {
    kind,
    encoding,
    offset: header.offset,
    count: header.count,
    range: header.range,
    minASN: header.offset,
    maxASN: header.offset + header.range - 1,
  };
}

export function detectEncoding(header: CommonHeader): ASNEncoding {
  if (header.k > 0 && header.l === 0) return "gr";
  if (header.k === 0 && header.l > 0) return "ef";
  throw new Error("Unable to detect ASN dataset encoding");
}
