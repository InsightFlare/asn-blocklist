import { NETWORK_SERVICE_EF_B64 } from "../generated/network-service-ef";
import { createEFSet } from "../runtime";
import type { ASNInput } from "../runtime";

export { NETWORK_SERVICE_EF_B64 };
export const networkService = createEFSet(NETWORK_SERVICE_EF_B64, {
  kind: "network_service",
});
export const NETWORK_SERVICE_EF_SET = networkService;

export function isNetworkServiceASN(asn: ASNInput): boolean {
  return networkService.has(asn);
}
