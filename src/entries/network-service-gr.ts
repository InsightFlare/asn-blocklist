import { NETWORK_SERVICE_GR_B64 } from "../generated/network-service-gr";
import { createGRSet } from "../runtime";
import type { ASNInput } from "../runtime";

export { NETWORK_SERVICE_GR_B64 };
export const networkService = createGRSet(NETWORK_SERVICE_GR_B64, {
  kind: "network_service",
});
export const NETWORK_SERVICE_GR_SET = networkService;

export function isNetworkServiceASN(asn: ASNInput): boolean {
  return networkService.has(asn);
}
