import type { ASNInput } from "./types";

export function normalizeASN(input: ASNInput): number | null {
  if (typeof input === "number") {
    return Number.isSafeInteger(input) && input > 0 ? input : null;
  }

  const value = String(input).trim();
  const match = /^(?:AS)?(\d+)$/i.exec(value);
  if (!match) return null;

  const asn = Number(match[1]);
  return Number.isSafeInteger(asn) && asn > 0 ? asn : null;
}
