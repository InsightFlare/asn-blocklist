import { HOSTING_GR_B64 } from "../generated/hosting-gr";
import { createGRSet } from "../runtime";
import type { ASNInput } from "../runtime";

export { HOSTING_GR_B64 };
export const hosting = createGRSet(HOSTING_GR_B64, { kind: "hosting" });
export const HOSTING_GR_SET = hosting;

export function isHostingASN(asn: ASNInput): boolean {
  return hosting.has(asn);
}
