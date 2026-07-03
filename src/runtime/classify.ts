import type { ASNClass, ASNInput, ASNSet } from "./types";

export function classifyWithSets(
  asn: ASNInput,
  sets: { hosting?: ASNSet; access?: ASNSet },
): ASNClass {
  if (sets.hosting?.has(asn)) return "hosting";
  if (sets.access?.has(asn)) return "access";
  return "unknown";
}
