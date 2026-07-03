import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import test from "node:test";

import {
  classifyASN,
  createASNSet,
  createEFSet,
  createGRSet,
  isAccessASN,
  isHostingASN,
  isNetworkServiceASN,
  isTransitASN,
  normalizeASN,
} from "asn-blocklist";
import { createASNSet as createRuntimeASNSet } from "asn-blocklist/runtime";
import { isHostingASN as isHostingEFASN } from "asn-blocklist/hosting/ef";
import { isHostingASN as isHostingGRASN } from "asn-blocklist/hosting/gr";
import { isNetworkServiceASN as isNetworkServiceEFASN } from "asn-blocklist/network-service/ef";
import { isNetworkServiceASN as isNetworkServiceGRASN } from "asn-blocklist/network-service/gr";
import { isTransitASN as isTransitEFASN } from "asn-blocklist/transit/ef";
import { isTransitASN as isTransitGRASN } from "asn-blocklist/transit/gr";
import { isAccessASN as isAccessEFASN } from "asn-blocklist/access/ef";
import { isAccessASN as isAccessGRASN } from "asn-blocklist/access/gr";
import { HOSTING_EF_B64 } from "asn-blocklist/data/hosting-ef";
import { HOSTING_GR_B64 } from "asn-blocklist/data/hosting-gr";
import { NETWORK_SERVICE_EF_B64 } from "asn-blocklist/data/network-service-ef";
import { NETWORK_SERVICE_GR_B64 } from "asn-blocklist/data/network-service-gr";
import { TRANSIT_EF_B64 } from "asn-blocklist/data/transit-ef";
import { TRANSIT_GR_B64 } from "asn-blocklist/data/transit-gr";
import { ACCESS_EF_B64 } from "asn-blocklist/data/access-ef";
import { ACCESS_GR_B64 } from "asn-blocklist/data/access-gr";

function readList(file) {
  return fs.readFileSync(new URL(`../dist/${file}`, import.meta.url), "utf8")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => Number(line.replace(/^AS/i, "")));
}

const hosting = readList("hosting.txt");
const networkService = readList("network-service.txt");
const transit = readList("transit.txt");
const access = readList("access.txt");
const require = createRequire(import.meta.url);

test("normalizes ASN input", () => {
  assert.equal(normalizeASN(14061), 14061);
  assert.equal(normalizeASN("AS14061"), 14061);
  assert.equal(normalizeASN("as14061"), 14061);
  assert.equal(normalizeASN("14061"), 14061);
  assert.equal(normalizeASN("AS0"), null);
  assert.equal(normalizeASN("not-an-asn"), null);
  assert.equal(normalizeASN(1.5), null);
});

test("GR and EF hosting sets match hosting.txt", () => {
  const ef = createEFSet(HOSTING_EF_B64, { kind: "hosting" });
  const gr = createGRSet(HOSTING_GR_B64, { kind: "hosting" });

  for (const asn of hosting) {
    assert.equal(ef.has(asn), true, `EF should contain AS${asn}`);
    assert.equal(gr.has(asn), true, `GR should contain AS${asn}`);
  }

  assert.equal(ef.has(hosting[0] - 1), false);
  assert.equal(gr.has(hosting.at(-1) + 1), false);
  assert.equal(ef.metadata.count, hosting.length);
  assert.equal(gr.metadata.count, hosting.length);
});

test("GR and EF access sets match access.txt", () => {
  const ef = createEFSet(ACCESS_EF_B64, { kind: "access" });
  const gr = createGRSet(ACCESS_GR_B64, { kind: "access" });

  for (const asn of access) {
    assert.equal(ef.has(asn), true, `EF should contain AS${asn}`);
    assert.equal(gr.has(asn), true, `GR should contain AS${asn}`);
  }

  assert.equal(ef.metadata.count, access.length);
  assert.equal(gr.metadata.count, access.length);
});

test("GR and EF network service sets match network-service.txt", () => {
  const ef = createEFSet(NETWORK_SERVICE_EF_B64, {
    kind: "network_service",
  });
  const gr = createGRSet(NETWORK_SERVICE_GR_B64, {
    kind: "network_service",
  });

  for (const asn of networkService) {
    assert.equal(ef.has(asn), true, `EF should contain AS${asn}`);
    assert.equal(gr.has(asn), true, `GR should contain AS${asn}`);
  }

  assert.equal(ef.metadata.count, networkService.length);
  assert.equal(gr.metadata.count, networkService.length);
});

test("GR and EF transit sets match transit.txt", () => {
  const ef = createEFSet(TRANSIT_EF_B64, { kind: "transit" });
  const gr = createGRSet(TRANSIT_GR_B64, { kind: "transit" });

  for (const asn of transit) {
    assert.equal(ef.has(asn), true, `EF should contain AS${asn}`);
    assert.equal(gr.has(asn), true, `GR should contain AS${asn}`);
  }

  assert.equal(ef.metadata.count, transit.length);
  assert.equal(gr.metadata.count, transit.length);
});

test("createASNSet auto-detects encodings", () => {
  assert.equal(createASNSet(HOSTING_EF_B64, { kind: "hosting" }).encoding, "ef");
  assert.equal(createASNSet(HOSTING_GR_B64, { kind: "hosting" }).encoding, "gr");
  assert.equal(createRuntimeASNSet(ACCESS_EF_B64, { kind: "access" }).encoding, "ef");
});

test("default classification API uses EF datasets", () => {
  assert.equal(isHostingASN(hosting[0]), true);
  assert.equal(isNetworkServiceASN(networkService[0]), true);
  assert.equal(isTransitASN(transit[0]), true);
  assert.equal(isAccessASN(access[0]), true);
  assert.equal(classifyASN(hosting[0]), "hosting");
  assert.equal(classifyASN(networkService[0]), "network_service");
  assert.equal(classifyASN(transit[0]), "transit");
  assert.equal(classifyASN(access[0]), "access");
  assert.equal(classifyASN(429496729), "unknown");

  assert.equal(classifyASN(4134), "transit");
  assert.equal(classifyASN(9808), "transit");
  assert.equal(classifyASN(4837), "transit");
  assert.equal(classifyASN(9009), "network_service");
  assert.equal(classifyASN(62874), "network_service");
  assert.equal(classifyASN(14061), "hosting");
});

test("public subpath imports work", () => {
  assert.equal(isHostingEFASN(hosting[0]), true);
  assert.equal(isHostingGRASN(hosting[0]), true);
  assert.equal(isNetworkServiceEFASN(networkService[0]), true);
  assert.equal(isNetworkServiceGRASN(networkService[0]), true);
  assert.equal(isTransitEFASN(transit[0]), true);
  assert.equal(isTransitGRASN(transit[0]), true);
  assert.equal(isAccessEFASN(access[0]), true);
  assert.equal(isAccessGRASN(access[0]), true);
});

test("CommonJS exports work", () => {
  const main = require("asn-blocklist");
  const runtime = require("asn-blocklist/runtime");
  const hostingEF = require("asn-blocklist/hosting/ef");
  const networkServiceEF = require("asn-blocklist/network-service/ef");
  const transitEF = require("asn-blocklist/transit/ef");

  assert.equal(main.isHostingASN(hosting[0]), true);
  assert.equal(main.isNetworkServiceASN(networkService[0]), true);
  assert.equal(main.isTransitASN(transit[0]), true);
  assert.equal(main.classifyASN(access[0]), "access");
  assert.equal(runtime.createASNSet(HOSTING_EF_B64, { kind: "hosting" }).has(hosting[0]), true);
  assert.equal(hostingEF.isHostingASN(hosting[0]), true);
  assert.equal(networkServiceEF.isNetworkServiceASN(networkService[0]), true);
  assert.equal(transitEF.isTransitASN(transit[0]), true);
});
