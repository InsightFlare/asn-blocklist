const fs = require("node:fs");
const path = require("node:path");
const { fetchAllNetworks } = require("./fetch-peeringdb");
const { encodeGR } = require("./gr-encode");
const { encodeEF } = require("./ef-encode");

const DIST = path.join(__dirname, "..", "dist");

const BLOCKLIST_TYPES = new Set(["NSP", "Content", "Network Services"]);
const ALLOWLIST_TYPES = new Set([
  "Cable/DSL/ISP",
  "Enterprise",
  "Educational/Research",
  "Non-Profit",
  "Government",
]);

async function main() {
  console.log("Fetching PeeringDB networks...");
  const networks = await fetchAllNetworks();

  console.log(`Fetched ${networks.length} networks`);

  const hosting = [];
  const consumer = [];

  for (const net of networks) {
    const asn = net.asn;
    const type = net.info_type || "";
    if (BLOCKLIST_TYPES.has(type)) {
      hosting.push(asn);
    } else if (ALLOWLIST_TYPES.has(type)) {
      consumer.push(asn);
    }
  }

  hosting.sort((a, b) => a - b);
  consumer.sort((a, b) => a - b);

  console.log(`Hosting (blocklist): ${hosting.length} ASNs`);
  console.log(`Consumer (access):  ${consumer.length} ASNs`);

  fs.mkdirSync(DIST, { recursive: true });

  // Plain text
  fs.writeFileSync(path.join(DIST, "hosting.txt"), hosting.map((a) => `AS${a}`).join("\n") + "\n");
  fs.writeFileSync(path.join(DIST, "consumer.txt"), consumer.map((a) => `AS${a}`).join("\n") + "\n");

  // GR format (init required)
  fs.writeFileSync(path.join(DIST, "hosting.gr.b64"), encodeGR(hosting));
  fs.writeFileSync(path.join(DIST, "consumer.gr.b64"), encodeGR(consumer));

  // EF format (no expansion needed)
  fs.writeFileSync(path.join(DIST, "hosting.ef.b64"), encodeEF(hosting));
  fs.writeFileSync(path.join(DIST, "consumer.ef.b64"), encodeEF(consumer));

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
