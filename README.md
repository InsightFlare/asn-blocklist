# asn-blocklist

An auto-maintained ASN classifier generated from the [PeeringDB](https://www.peeringdb.com/) community database. Designed for web analytics tools to identify and tag hosting, network-service, transit/carrier, and access-network traffic.

## What are ASN classifications?

Every network on the internet has a unique ASN (Autonomous System Number). By classifying ASNs, we can distinguish:

- **Hosting/Cloud**: Data centers and cloud providers like DigitalOcean, AWS, Vultr. Traffic from these ASNs is disproportionately likely to be bots, scrapers, monitoring systems, or automated scripts.
- **Network services**: DDoS protection, VPN/proxy, managed network, and smaller NSP networks. These are useful risk signals, but not equivalent to hosting.
- **Transit/carrier**: Large NSP/backbone and carrier networks. These should not be treated as bot traffic on ASN alone.
- **Access networks**: Residential broadband, mobile, enterprise, education, nonprofit, and government networks.

PeeringDB is the de-facto standard database for network interconnection. Each network operator self-reports structured fields such as `info_type`, `info_types`, prefixes, traffic, scope, and policy. This repository pulls PeeringDB weekly, classifies every network, and generates compact datasets for each class.

## Files

### Hosting / cloud / datacenter

PeeringDB `Content` networks.

| File | Format | Description |
|------|--------|-------------|
| [`hosting.txt`](dist/hosting.txt) | Plain text, one `AS12345` per line | Human review, grep, direct inclusion |
| [`hosting.gr.b64`](dist/hosting.gr.b64) | Base64, Golomb-Rice(k=4) compressed gaps | Small embedding. One-time decode to bitmap at init, then O(1) lookup |
| [`hosting.ef.b64`](dist/hosting.ef.b64) | Base64, Elias-Fano + select index | Query directly on the compressed data |

### Network service networks

PeeringDB `Network Services` networks and non-transit `NSP` networks.

| File | Format | Description |
|------|--------|-------------|
| [`network-service.txt`](dist/network-service.txt) | Plain text, one `AS12345` per line | Human review, grep |
| [`network-service.gr.b64`](dist/network-service.gr.b64) | Base64, Golomb-Rice(k=4) compressed gaps | Small embedding. One-time decode to bitmap at init, then O(1) lookup |
| [`network-service.ef.b64`](dist/network-service.ef.b64) | Base64, Elias-Fano + select index | Query directly on the compressed data |

### Transit / carrier networks

Large PeeringDB `NSP` networks detected from structured scale signals such as advertised traffic and prefix counts.

| File | Format | Description |
|------|--------|-------------|
| [`transit.txt`](dist/transit.txt) | Plain text, one `AS12345` per line | Human review, grep |
| [`transit.gr.b64`](dist/transit.gr.b64) | Base64, Golomb-Rice(k=4) compressed gaps | Small embedding. One-time decode to bitmap at init, then O(1) lookup |
| [`transit.ef.b64`](dist/transit.ef.b64) | Base64, Elias-Fano + select index | Query directly on the compressed data |

### Access / non-hosting networks

PeeringDB `info_type` in `{Cable/DSL/ISP, Enterprise, Educational/Research, Non-Profit, Government}`.

| File | Format | Description |
|------|--------|-------------|
| [`access.txt`](dist/access.txt) | Plain text, one `AS12345` per line | Human review, grep |
| [`access.gr.b64`](dist/access.gr.b64) | Base64, Golomb-Rice(k=4) compressed gaps | Same format as hosting |
| [`access.ef.b64`](dist/access.ef.b64) | Base64, Elias-Fano + select index | Same format as hosting |

## Choosing an encoding

Use the npm package default (`asn-blocklist`) unless you have a specific size or cold-start constraint. The default entry uses EF datasets because they can be queried directly without expanding the whole set into a bitmap.

| Format | Best for | Characteristics | Tradeoffs |
|------|------|------|------|
| Plain text (`.txt`) | Shell scripts, audits, human review, simple server-side loading | One `AS12345` per line; easy to diff, grep, and inspect | Largest format; consumers usually load it into a `Set` for fast lookup |
| Golomb-Rice (`.gr.b64`) | Small embedded payloads where one-time initialization is fine | Stores sorted ASN gaps with fixed `k=4`; smallest or near-smallest Base64 payload for these lists | Must decode sequentially at startup; the runtime expands it to a compact bitmap for O(1) lookups |
| Elias-Fano (`.ef.b64`) | Serverless, edge, and SDK usage where cold-start expansion should be minimal | Stores high/low bits plus a select index; queries the compressed structure directly | Slightly larger than GR for some lists; lookup does a bounded bucket scan rather than a full bitmap check |

- Use `asn-blocklist` or `/*/ef` subpath imports for application code.
- Use `/*/gr` subpath imports when bundle size matters more than startup decode work.
- Use `.txt` files when humans or operations tooling need to inspect the data.

## Usage

### npm package

```bash
npm install asn-blocklist
```

The default entry loads the EF datasets and exposes high-level classification helpers:

```js
import {
  classifyASN,
  isAccessASN,
  isHostingASN,
  isNetworkServiceASN,
  isTransitASN,
} from "asn-blocklist";

classifyASN(14061);      // "hosting" | "network_service" | "transit" | "access" | "unknown"
classifyASN("AS4134");   // "transit"
isHostingASN("AS14061"); // boolean
isNetworkServiceASN(9009); // boolean
isTransitASN("AS4134");  // boolean
isAccessASN(7922);       // boolean
```

Use subpath imports when you only need one list or one encoding:

```js
import { isHostingASN } from "asn-blocklist/hosting/ef";
import { isNetworkServiceASN } from "asn-blocklist/network-service/ef";
import { isTransitASN } from "asn-blocklist/transit/ef";
import { isAccessASN } from "asn-blocklist/access/gr";
```

Use the runtime entry to load your own embedded or fetched dataset:

```js
import { createASNSet } from "asn-blocklist/runtime";
import { HOSTING_EF_B64 } from "asn-blocklist/data/hosting-ef";

const hosting = createASNSet(HOSTING_EF_B64, { kind: "hosting", encoding: "auto" });
hosting.has("AS14061");
```

Public entry points:

| Import | Description |
|------|------|
| `asn-blocklist` | Default EF-backed classifier and runtime exports |
| `asn-blocklist/runtime` | GR / EF parsers and generic classification helpers |
| `asn-blocklist/hosting/ef` | Hosting EF set and `isHostingASN` |
| `asn-blocklist/hosting/gr` | Hosting GR set and `isHostingASN` |
| `asn-blocklist/network-service/ef` | Network-service EF set and `isNetworkServiceASN` |
| `asn-blocklist/network-service/gr` | Network-service GR set and `isNetworkServiceASN` |
| `asn-blocklist/transit/ef` | Transit EF set and `isTransitASN` |
| `asn-blocklist/transit/gr` | Transit GR set and `isTransitASN` |
| `asn-blocklist/access/ef` | Access EF set and `isAccessASN` |
| `asn-blocklist/access/gr` | Access GR set and `isAccessASN` |
| `asn-blocklist/data/hosting-ef` | Raw hosting EF Base64 constant |
| `asn-blocklist/data/hosting-gr` | Raw hosting GR Base64 constant |
| `asn-blocklist/data/network-service-ef` | Raw network-service EF Base64 constant |
| `asn-blocklist/data/network-service-gr` | Raw network-service GR Base64 constant |
| `asn-blocklist/data/transit-ef` | Raw transit EF Base64 constant |
| `asn-blocklist/data/transit-gr` | Raw transit GR Base64 constant |
| `asn-blocklist/data/access-ef` | Raw access EF Base64 constant |
| `asn-blocklist/data/access-gr` | Raw access GR Base64 constant |

### Raw files

All binary formats (`.gr.b64`, `.ef.b64`) share a common header:

| Offset | Bytes | Field |
|--------|-------|-------|
| 0 | 4 | `OFFSET` (uint32 LE) — minimum ASN in the set |
| 4 | 4 | `N` (uint32 LE) — number of elements |
| 8 | 4 | `U` (uint32 LE) — value range (max - min + 1) |
| 12 | 1 | `k` (uint8) — Golomb-Rice parameter (GR only; 0 when unused) |
| 13 | 1 | `l` (uint8) — Elias-Fano low bits width (EF only; 0 when unused) |
| 14 | payload | Encoded data (format-specific) |

#### GR payload

Immediately after byte 14: the Golomb-Rice encoded gap bitstream. Gaps are decoded sequentially until `N - 1` gaps have been read.

#### EF payload

The EF format has its own sub-header at the start of the payload, followed by three independent bitstreams:

| Offset | Bytes | Field |
|--------|-------|-------|
| 14 | 4 | `lowOffset` (uint32 LE) — absolute byte offset of low bits array |
| 18 | 4 | `highOffset` (uint32 LE) — absolute byte offset of high unary bitstream |
| 22 | 4 | `selectOffset` (uint32 LE) — absolute byte offset of select0 index |
| 26 | 2 | `selectStep` (uint16 LE) — number of zeros between select samples |
| 28 | … | Low bits array (`N * l` bits, packed) |
| … | … | High unary bitstream (`N + ceil(U / 2^l)` bits) |
| … | … | Select0 index (array of uint32 bit positions, relative to high bitstream start) |

### Plain text

```bash
# Check if an ASN is in the hosting class
grep "^AS14061$" dist/hosting.txt
```

### GR format (init required, smallest size)

Best for environments where a one-time cold-start decode is acceptable and embedding size is critical.

```js
const DATA = "..."; // Paste the content of hosting.gr.b64 here

const buf = Uint8Array.from(atob(DATA), c => c.charCodeAt(0));
const view = new DataView(buf.buffer);

// Read header
const OFFSET = view.getUint32(0, true);
const N = view.getUint32(4, true);
const U = view.getUint32(8, true);
const k = view.getUint8(12);           // Golomb-Rice parameter (= 4)

// Decode Golomb-Rice gaps
const gaps = [];
let pos = 14 * 8; // start after 14-byte header
while (gaps.length < N - 1) {  // N-1 gaps between consecutive ASNs
  let q = 0;
  while ((buf[pos >> 3] >> (7 - (pos & 7))) & 1) { q++; pos++; }
  pos++; // skip zero delimiter
  let r = 0;
  for (let i = 0; i < k; i++) {
    r = (r << 1) | ((buf[pos >> 3] >> (7 - (pos & 7))) & 1);
    pos++;
  }
  gaps.push((q << k) | r);
}

// Build bucket bitmap (one-time init)
const BUCKETS = Math.ceil(U / 16);
const bucket = new Uint16Array(BUCKETS);
let cur = 0;                         // first ASN is always at relative position 0
bucket[0] |= 1;
for (let i = 0; i < gaps.length; i++) {
  cur += gaps[i];
  bucket[cur >> 4] |= (1 << (cur & 15));
}

// Query (per-request)
function isBlocked(asn) {
  const p = asn - OFFSET;
  if (p < 0 || p >= U) return false;
  return (bucket[p >> 4] >> (p & 15)) & 1;
}
```

### EF format (no bitmap expansion, direct query)

Best for serverless environments where cold-start expansion cost matters. No full decompression needed — the data itself is the query structure.

```js
const DATA = "..."; // Paste the content of hosting.ef.b64 here

const buf = Uint8Array.from(atob(DATA), c => c.charCodeAt(0));

// ---------- Header ----------
const view = new DataView(buf.buffer);
const l = view.getUint8(13);             // low bits width (= 4)
const OFFSET = view.getUint32(0, true);
const N = view.getUint32(4, true);
const U = view.getUint32(8, true);
const lowOffset = view.getUint32(14, true);
const highOffset = view.getUint32(18, true);
const selectOffset = view.getUint32(22, true);
const selectStep = view.getUint16(26, true);

// ---------- Select (locate high-bit bucket) ----------
function selectZero(n) {
  if (n === 0) return 0;
  const idx = (n - 1) / selectStep | 0;
  let pos = view.getUint32(selectOffset + idx * 4, true); // bit offset in high stream
  const target = n - idx * selectStep;
  let count = 0;
  while (count < target) {
    if (((buf[highOffset + (pos >> 3)] >> (7 - (pos & 7))) & 1) === 0) count++;
    pos++;
  }
  return pos;
}

function readLow(pos) {
  const bytePos = lowOffset + (pos * l >> 3);
  const bitPos = (pos * l) & 7;
  const raw = (buf[bytePos] << 8 | (buf[bytePos + 1] || 0)) >> (16 - l - bitPos);
  return raw & ((1 << l) - 1);
}

// ---------- Query ----------
function isBlocked(x) {
  if (x < OFFSET || x > OFFSET + U - 1) return false;
  const p = x - OFFSET;
  const h = p >> l;
  const lo = p & ((1 << l) - 1);

  let start, end;

  if (h === 0) {
    start = 0;
    end = selectZero(1) - 1;
  } else {
    const r1 = selectZero(h);
    const r2 = selectZero(h + 1);
    start = r1 - h;
    end = r2 - (h + 1);
  }

  // Scan matching low bits (at most 16 values in the bucket)
  for (let i = start; i < end; i++) {
    if (readLow(i) === lo) return true;
  }
  return false;
}
```

## Data source

- **Source**: [PeeringDB API](https://www.peeringdb.com/apidocs/), community-maintained by network operators worldwide
- **Update frequency**: Weekly via GitHub Actions, auto-committed on changes

## Versioning

The npm package uses `MAJOR.YYYYMMDD.PATCH`.

- `MAJOR`: runtime API and binary format compatibility.
- `YYYYMMDD`: PeeringDB snapshot or generation date.
- `PATCH`: same-day rebuild or generator/runtime fix.

Example: `1.20260703.0`.

### Important caveat

ASN classification is a strong signal, not an absolute judgment. Hosting and network-service ASNs occasionally carry legitimate traffic (corporate VPNs, monitoring services, RSS readers), and access/transit networks sometimes carry bot traffic (residential proxies, infected devices). We recommend **tagging** traffic rather than **dropping** it:

```js
// Prefer classification over binary filtering
const type = classifyASN(asn); // "hosting" | "network_service" | "transit" | "access" | "unknown"
// Use as a signal in your analytics pipeline, not as a hard firewall rule
```

### Classification

| PeeringDB `info_type` | List | Description |
|------|:--:|------|
| NSP | transit or network_service | Large NSPs are split into transit; smaller NSPs become network_service |
| Content | hosting | CDN/cloud/content networks |
| Network Services | network_service | DDoS protection/anycast/proxy/network services |
| Cable/DSL/ISP | access | Residential broadband ISPs |
| Enterprise | access | Corporate networks |
| Educational/Research | access | Universities and research networks |
| Non-Profit | access | Non-profit organizations |
| Government | access | Government networks |
| Route Server / Collector | Ignored | Routing infrastructure |
| (unclassified) | Ignored | Conservative: allow through |

## License

MIT
