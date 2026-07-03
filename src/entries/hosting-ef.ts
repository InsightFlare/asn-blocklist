import { HOSTING_EF_B64 } from "../generated/hosting-ef";
import { createEFSet } from "../runtime";
import type { ASNInput } from "../runtime";

export { HOSTING_EF_B64 };
export const hosting = createEFSet(HOSTING_EF_B64, { kind: "hosting" });
export const HOSTING_EF_SET = hosting;

export function isHostingASN(asn: ASNInput): boolean {
  return hosting.has(asn);
}
