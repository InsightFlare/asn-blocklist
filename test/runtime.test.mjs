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
  normalizeASN,
} from "asn-blocklist";
import { createASNSet as createRuntimeASNSet } from "asn-blocklist/runtime";
import { isHostingASN as isHostingEFASN } from "asn-blocklist/hosting/ef";
import { isHostingASN as isHostingGRASN } from "asn-blocklist/hosting/gr";
import { isAccessASN as isAccessEFASN } from "asn-blocklist/access/ef";
import { isAccessASN as isAccessGRASN } from "asn-blocklist/access/gr";
import { HOSTING_EF_B64 } from "asn-blocklist/data/hosting-ef";
import { HOSTING_GR_B64 } from "asn-blocklist/data/hosting-gr";
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
const access = readList("consumer.txt");
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

test("GR and EF access sets match consumer.txt", () => {
  const ef = createEFSet(ACCESS_EF_B64, { kind: "access" });
  const gr = createGRSet(ACCESS_GR_B64, { kind: "access" });

  for (const asn of access) {
    assert.equal(ef.has(asn), true, `EF should contain AS${asn}`);
    assert.equal(gr.has(asn), true, `GR should contain AS${asn}`);
  }

  assert.equal(ef.metadata.count, access.length);
  assert.equal(gr.metadata.count, access.length);
});

test("createASNSet auto-detects encodings", () => {
  assert.equal(createASNSet(HOSTING_EF_B64, { kind: "hosting" }).encoding, "ef");
  assert.equal(createASNSet(HOSTING_GR_B64, { kind: "hosting" }).encoding, "gr");
  assert.equal(createRuntimeASNSet(ACCESS_EF_B64, { kind: "access" }).encoding, "ef");
});

test("default classification API uses EF datasets", () => {
  assert.equal(isHostingASN(hosting[0]), true);
  assert.equal(isAccessASN(access[0]), true);
  assert.equal(classifyASN(hosting[0]), "hosting");
  assert.equal(classifyASN(access[0]), "access");
  assert.equal(classifyASN(429496729), "unknown");
});

test("public subpath imports work", () => {
  assert.equal(isHostingEFASN(hosting[0]), true);
  assert.equal(isHostingGRASN(hosting[0]), true);
  assert.equal(isAccessEFASN(access[0]), true);
  assert.equal(isAccessGRASN(access[0]), true);
});

test("CommonJS exports work", () => {
  const main = require("asn-blocklist");
  const runtime = require("asn-blocklist/runtime");
  const hostingEF = require("asn-blocklist/hosting/ef");

  assert.equal(main.isHostingASN(hosting[0]), true);
  assert.equal(main.classifyASN(access[0]), "access");
  assert.equal(runtime.createASNSet(HOSTING_EF_B64, { kind: "hosting" }).has(hosting[0]), true);
  assert.equal(hostingEF.isHostingASN(hosting[0]), true);
});
