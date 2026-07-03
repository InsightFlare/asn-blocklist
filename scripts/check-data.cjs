const fs = require("node:fs");
const path = require("node:path");

const DIST = path.join(__dirname, "..", "dist");
const MIN_HOSTING = 1000;
const MIN_NETWORK_SERVICE = 1000;
const MIN_TRANSIT = 100;
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
  const networkService = readASNs("network-service.txt");
  const transit = readASNs("transit.txt");
  const access = readASNs("access.txt");
  const lists = [
    ["hosting", hosting, MIN_HOSTING],
    ["network-service", networkService, MIN_NETWORK_SERVICE],
    ["transit", transit, MIN_TRANSIT],
    ["access", access, MIN_ACCESS],
  ];
  const sets = lists.map(([name, asns, minCount]) => [
    name,
    assertList(name, asns, minCount),
  ]);

  for (let leftIndex = 0; leftIndex < sets.length; leftIndex++) {
    for (let rightIndex = leftIndex + 1; rightIndex < sets.length; rightIndex++) {
      const [leftName, leftSet] = sets[leftIndex];
      const [rightName, rightSet] = sets[rightIndex];
      for (const asn of leftSet) {
        if (rightSet.has(asn)) {
          throw new Error(`${leftName}/${rightName} lists overlap, first overlap: AS${asn}`);
        }
      }
    }
  }

  console.log(
    `Data checks passed: hosting=${hosting.length}, network-service=${networkService.length}, transit=${transit.length}, access=${access.length}`,
  );
}

main();
