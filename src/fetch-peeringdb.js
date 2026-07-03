const PEERINGDB_API = "https://www.peeringdb.com/api/net";

async function fetchAllNetworks() {
  const networks = [];
  const limit = 250;
  let skip = 0;

  while (true) {
    const url = `${PEERINGDB_API}?depth=0&limit=${limit}&skip=${skip}&fields=asn,info_type`;
    console.log(`  Fetching skip=${skip}...`);

    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`PeeringDB API error: ${resp.status} ${resp.statusText}`);
    }

    const json = await resp.json();
    const data = json.data;
    if (!data || data.length === 0) break;

    networks.push(...data);
    skip += limit;

    // Be polite to the API
    await new Promise((r) => setTimeout(r, 1200));
  }

  return networks;
}

module.exports = { fetchAllNetworks };
