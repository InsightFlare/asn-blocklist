import { createEFSet } from "./ef";
import { createGRSet } from "./gr";
import { detectEncoding, readCommonHeader } from "./header";
import { toUint8Array } from "./base64";
import type { ASNSet, CreateASNSetOptions } from "./types";

export function createASNSet(data: string | Uint8Array, options: CreateASNSetOptions = {}): ASNSet {
  const bytes = toUint8Array(data);
  const encoding = options.encoding === "auto" || options.encoding === undefined
    ? detectEncoding(readCommonHeader(bytes))
    : options.encoding;

  if (encoding === "gr") {
    return createGRSet(bytes, { kind: options.kind });
  }

  return createEFSet(bytes, { kind: options.kind });
}
