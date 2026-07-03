const fs = require("node:fs");
const path = require("node:path");

const DIST = path.join(__dirname, "..", "dist");
const MIN_HOSTING = 5000;
const MIN_ACCESS = 10000;

function readASNs(file) {
  return fs.readFileSync(path.join(DIST, file), "utf8")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => Number(line.replace(/^AS/i, "")));
}

function assertList(name, asns, minCount) {
  if (asns.length < minCount) {
    throw new Error(`${name} list has ${asns.length} ASNs, expected at least ${minCount}`);
  }

  const seen = new Set();
  for (let i = 0; i < asns.length; i++) {
    const asn = asns[i];
    if (!Number.isSafeInteger(asn) || asn <= 0) {
      throw new Error(`${name} contains invalid ASN at index ${i}: ${asn}`);
    }
    if (seen.has(asn)) {
      throw new Error(`${name} contains duplicate ASN: AS${asn}`);
    }
    if (i > 0 && asns[i - 1] >= asn) {
      throw new Error(`${name} is not strictly sorted at AS${asns[i - 1]} / AS${asn}`);
    }
    seen.add(asn);
  }

  return seen;
}

function main() {
  const hosting = readASNs("hosting.txt");
  const access = readASNs("consumer.txt");
  const hostingSet = assertList("hosting", hosting, MIN_HOSTING);
  assertList("access", access, MIN_ACCESS);

  const overlap = access.filter((asn) => hostingSet.has(asn));
  if (overlap.length > 0) {
    throw new Error(`hosting/access lists overlap, first overlap: AS${overlap[0]}`);
  }

  console.log(`Data checks passed: hosting=${hosting.length}, access=${access.length}`);
}

main();
