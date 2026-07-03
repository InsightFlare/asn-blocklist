import { ACCESS_GR_B64 } from "../generated/access-gr";
import { createGRSet } from "../runtime";
import type { ASNInput } from "../runtime";

export { ACCESS_GR_B64 };
export const access = createGRSet(ACCESS_GR_B64, { kind: "access" });
export const ACCESS_GR_SET = access;

export function isAccessASN(asn: ASNInput): boolean {
  return access.has(asn);
}
