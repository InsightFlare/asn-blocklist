export type ASNInput = number | `AS${number}` | string;
export type ASNClass = "hosting" | "access" | "unknown";
export type ASNListKind = "hosting" | "access";
export type ASNEncoding = "gr" | "ef";

export interface ASNSetMetadata {
  kind: ASNListKind;
  encoding: ASNEncoding;
  offset: number;
  count: number;
  range: number;
  minASN: number;
  maxASN: number;
}

export interface ASNSet {
  readonly kind: ASNListKind;
  readonly encoding: ASNEncoding;
  readonly metadata: ASNSetMetadata;
  has(asn: ASNInput): boolean;
}

export interface ASNSetOptions {
  kind?: ASNListKind;
}

export interface CreateASNSetOptions extends ASNSetOptions {
  encoding?: ASNEncoding | "auto";
}
