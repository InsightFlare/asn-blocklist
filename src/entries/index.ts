import { ACCESS_EF_B64 } from "../generated/access-ef";
import { HOSTING_EF_B64 } from "../generated/hosting-ef";
import { DATA_VERSION, DATASETS, FORMAT_VERSION, PACKAGE_VERSION } from "../generated/metadata";
import { classifyWithSets, createEFSet } from "../runtime";
import type { ASNClass, ASNInput } from "../runtime";

export { DATA_VERSION, DATASETS, FORMAT_VERSION, PACKAGE_VERSION };
export type {
  ASNClass,
  ASNEncoding,
  ASNInput,
  ASNListKind,
  ASNSet,
  ASNSetMetadata,
} from "../runtime";
export {
  classifyWithSets,
  createASNSet,
  createEFSet,
  createGRSet,
  normalizeASN,
} from "../runtime";

export const hosting = createEFSet(HOSTING_EF_B64, { kind: "hosting" });
export const access = createEFSet(ACCESS_EF_B64, { kind: "access" });

export function classifyASN(asn: ASNInput): ASNClass {
  return classifyWithSets(asn, { hosting, access });
}

export function isHostingASN(asn: ASNInput): boolean {
  return hosting.has(asn);
}

export function isAccessASN(asn: ASNInput): boolean {
  return access.has(asn);
}
