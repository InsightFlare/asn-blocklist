import { ACCESS_EF_B64 } from "../generated/access-ef";
import { createEFSet } from "../runtime";
import type { ASNInput } from "../runtime";

export { ACCESS_EF_B64 };
export const access = createEFSet(ACCESS_EF_B64, { kind: "access" });
export const ACCESS_EF_SET = access;

export function isAccessASN(asn: ASNInput): boolean {
  return access.has(asn);
}
