const fs = require("node:fs");
const path = require("node:path");
const { fetchAllNetworks } = require("./fetch-peeringdb.cjs");
const { encodeGR } = require("./gr-encode.cjs");
const { encodeEF } = require("./ef-encode.cjs");

const DIST = path.join(__dirname, "..", "..", "dist");

const HOSTING_TYPES = new Set(["Content"]);
const NETWORK_SERVICE_TYPES = new Set(["Network Services"]);
const ACCESS_TYPES = new Set([
  "Cable/DSL/ISP",
  "Enterprise",
  "Educational/Research",
  "Non-Profit",
  "Government",
]);

const TRAFFIC_RANKS = new Map([
  ["0-20Mbps", 1],
  ["20-100Mbps", 2],
  ["100-1000Mbps", 3],
  ["1-5Gbps", 4],
  ["5-10Gbps", 5],
  ["10-20Gbps", 6],
  ["20-50Gbps", 7],
  ["50-100Gbps", 8],
  ["100-200Gbps", 9],
  ["200-300Gbps", 10],
  ["300-500Gbps", 11],
  ["500-1000Gbps", 12],
  ["1-5Tbps", 13],
  ["5-10Tbps", 14],
  ["10-20Tbps", 15],
  ["20-50Tbps", 16],
  ["50-100Tbps", 17],
  ["100+Tbps", 18],
]);

function numberField(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function trafficRank(value) {
  return TRAFFIC_RANKS.get(String(value || "").trim()) || 0;
}

function networkTypes(net) {
  const values = Array.isArray(net.info_types) && net.info_types.length > 0
    ? net.info_types
    : [net.info_type || ""];
  return new Set(values.filter(Boolean));
}

function hasAny(types, candidates) {
  for (const candidate of candidates) {
    if (types.has(candidate)) return true;
  }
  return false;
}

function isLargeTransitNetwork(net) {
  const prefixes4 = numberField(net.info_prefixes4);
  const prefixes6 = numberField(net.info_prefixes6);
  const rank = trafficRank(net.info_traffic);
  return rank >= TRAFFIC_RANKS.get("10-20Tbps") || prefixes4 >= 10000 || prefixes6 >= 5000;
}

function classifyNetwork(net) {
  const types = networkTypes(net);

  if (hasAny(types, HOSTING_TYPES)) return "hosting";
  if (hasAny(types, NETWORK_SERVICE_TYPES)) return "network_service";
  if (types.has("NSP")) {
    return isLargeTransitNetwork(net) ? "transit" : "network_service";
  }
  if (hasAny(types, ACCESS_TYPES)) return "access";
  return "unknown";
}

function writeList(name, asns) {
  fs.writeFileSync(path.join(DIST, `${name}.txt`), asns.map((a) => `AS${a}`).join("\n") + "\n");
  fs.writeFileSync(path.join(DIST, `${name}.gr.b64`), encodeGR(asns));
  fs.writeFileSync(path.join(DIST, `${name}.ef.b64`), encodeEF(asns));
}

async function main() {
  console.log("Fetching PeeringDB networks...");
  const networks = await fetchAllNetworks();

  console.log(`Fetched ${networks.length} networks`);

  const hosting = [];
  const networkService = [];
  const transit = [];
  const access = [];

  for (const net of networks) {
    const asn = net.asn;
    const classification = classifyNetwork(net);
    if (classification === "hosting") {
      hosting.push(asn);
    } else if (classification === "network_service") {
      networkService.push(asn);
    } else if (classification === "transit") {
      transit.push(asn);
    } else if (classification === "access") {
      access.push(asn);
    }
  }

  // Deduplicate — PeeringDB may return multiple net entries for the same ASN
  const dedup = (arr) => [...new Set(arr)];

  hosting = dedup(hosting);
  networkService = dedup(networkService);
  transit = dedup(transit);
  access = dedup(access);

  hosting.sort((a, b) => a - b);
  networkService.sort((a, b) => a - b);
  transit.sort((a, b) => a - b);
  access.sort((a, b) => a - b);

  console.log(`Hosting:          ${hosting.length} ASNs`);
  console.log(`Network service:  ${networkService.length} ASNs`);
  console.log(`Transit/carrier:  ${transit.length} ASNs`);
  console.log(`Access:           ${access.length} ASNs`);

  fs.mkdirSync(DIST, { recursive: true });

  writeList("hosting", hosting);
  writeList("network-service", networkService);
  writeList("transit", transit);
  writeList("access", access);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
