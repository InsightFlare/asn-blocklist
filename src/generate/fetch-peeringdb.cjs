const PEERINGDB_API = "https://www.peeringdb.com/api/net";

async function fetchPage(skip, limit, retries = 3) {
  const fields = [
    "asn",
    "info_type",
    "info_types",
    "info_prefixes4",
    "info_prefixes6",
    "info_traffic",
    "info_ratio",
    "info_scope",
    "ix_count",
    "fac_count",
    "policy_general",
    "policy_locations",
    "policy_ratio",
    "policy_contracts",
  ].join(",");
  const url = `${PEERINGDB_API}?depth=0&limit=${limit}&skip=${skip}&fields=${fields}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    const resp = await fetch(url);

    if (resp.ok) {
      return await resp.json();
    }

    if (resp.status === 429) {
      const retryAfter = parseInt(resp.headers.get("retry-after") || "10", 10);
      console.log(`  Rate limited (429). Waiting ${retryAfter}s...`);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }

    throw new Error(`PeeringDB API error: ${resp.status} ${resp.statusText}`);
  }

  throw new Error(`PeeringDB API: too many retries at skip=${skip}`);
}

async function fetchAllNetworks() {
  const networks = [];
  const limit = 250;
  let skip = 0;
  const delay = 3000; // 3s between requests to stay under rate limit

  while (true) {
    console.log(`  Fetching skip=${skip} (${networks.length} networks so far)...`);

    const json = await fetchPage(skip, limit);
    const data = json.data;
    if (!data || data.length === 0) break;

    networks.push(...data);
    skip += limit;

    if (data.length === limit) {
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  return networks;
}

module.exports = { fetchAllNetworks };
