import type { ASNClass, ASNInput, ASNSet } from "./types";

export function classifyWithSets(
  asn: ASNInput,
  sets: {
    hosting?: ASNSet;
    networkService?: ASNSet;
    transit?: ASNSet;
    access?: ASNSet;
  },
): ASNClass {
  if (sets.hosting?.has(asn)) return "hosting";
  if (sets.networkService?.has(asn)) return "network_service";
  if (sets.transit?.has(asn)) return "transit";
  if (sets.access?.has(asn)) return "access";
  return "unknown";
}
