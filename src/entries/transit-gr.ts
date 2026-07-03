import { TRANSIT_GR_B64 } from "../generated/transit-gr";
import { createGRSet } from "../runtime";
import type { ASNInput } from "../runtime";

export { TRANSIT_GR_B64 };
export const transit = createGRSet(TRANSIT_GR_B64, { kind: "transit" });
export const TRANSIT_GR_SET = transit;

export function isTransitASN(asn: ASNInput): boolean {
  return transit.has(asn);
}
