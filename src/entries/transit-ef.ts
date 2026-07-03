import { TRANSIT_EF_B64 } from "../generated/transit-ef";
import { createEFSet } from "../runtime";
import type { ASNInput } from "../runtime";

export { TRANSIT_EF_B64 };
export const transit = createEFSet(TRANSIT_EF_B64, { kind: "transit" });
export const TRANSIT_EF_SET = transit;

export function isTransitASN(asn: ASNInput): boolean {
  return transit.has(asn);
}
