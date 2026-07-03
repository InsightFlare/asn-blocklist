import { ACCESS_EF_B64 } from "../generated/access-ef";
import { HOSTING_EF_B64 } from "../generated/hosting-ef";
import { NETWORK_SERVICE_EF_B64 } from "../generated/network-service-ef";
import { TRANSIT_EF_B64 } from "../generated/transit-ef";
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
export const networkService = createEFSet(NETWORK_SERVICE_EF_B64, {
  kind: "network_service",
});
export const transit = createEFSet(TRANSIT_EF_B64, { kind: "transit" });
export const access = createEFSet(ACCESS_EF_B64, { kind: "access" });

export function classifyASN(asn: ASNInput): ASNClass {
  return classifyWithSets(asn, { hosting, networkService, transit, access });
}

export function isHostingASN(asn: ASNInput): boolean {
  return hosting.has(asn);
}

export function isNetworkServiceASN(asn: ASNInput): boolean {
  return networkService.has(asn);
}

export function isTransitASN(asn: ASNInput): boolean {
  return transit.has(asn);
}

export function isAccessASN(asn: ASNInput): boolean {
  return access.has(asn);
}
