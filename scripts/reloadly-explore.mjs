#!/usr/bin/env node
/**
 * Prints the Reloadly IDs you paste into Vercel as `RELOADLY_OPERATOR_IDS` and
 * `RELOADLY_BUNDLES`. Read-only: it only GETs operator lists, it never tops up.
 *
 *   1. Create an account at https://www.reloadly.com and copy your API
 *      credentials from the dashboard (Developers → Apps → your app).
 *   2. Run:
 *
 *        RELOADLY_CLIENT_ID=xxx RELOADLY_CLIENT_SECRET=yyy \
 *          node scripts/reloadly-explore.mjs
 *
 *      Add RELOADLY_ENV=live to query production; otherwise the sandbox is used
 *      (sandbox credentials start with a different prefix — both work here).
 *
 * Node 18+ required (global fetch).
 */

const AUTH_URL = "https://auth.reloadly.com/oauth/token";
const BASE =
  process.env.RELOADLY_ENV === "live"
    ? "https://topups.reloadly.com"
    : "https://topups-sandbox.reloadly.com";
const ACCEPT = "application/com.reloadly.topups-v1+json";

const COUNTRIES = ["NG", "GH", "KE", "ZA"];

// catalog network id → regex that matches Reloadly's operator name
const NETWORKS = {
  NG: { mtn: /^mtn\b/i, glo: /\bglo\b/i, airtel: /airtel/i, "9mobile": /9mobile|etisalat/i },
  GH: { "mtn-gh": /^mtn\b/i, telecel: /telecel|vodafone/i, airteltigo: /airteltigo|airtel\s*tigo|^tigo\b/i },
  KE: { safaricom: /safaricom/i, "airtel-ke": /airtel/i, "telkom-ke": /telkom/i },
  ZA: { vodacom: /vodacom/i, "mtn-za": /^mtn\b/i, cellc: /cell\s*c/i, "telkom-za": /telkom/i },
};

// catalog bundle ids → { country, network, size } for data-bundle suggestions
const BUNDLES = {
  "ng-mtn-500mb": ["NG", "mtn", "500MB"], "ng-mtn-1gb": ["NG", "mtn", "1GB"],
  "ng-mtn-2gb": ["NG", "mtn", "2GB"], "ng-mtn-5gb": ["NG", "mtn", "5GB"],
  "ng-glo-1gb": ["NG", "glo", "1GB"], "ng-glo-2gb": ["NG", "glo", "2GB"], "ng-glo-5gb": ["NG", "glo", "5GB"],
  "ng-airtel-1gb": ["NG", "airtel", "1GB"], "ng-airtel-2gb": ["NG", "airtel", "2GB"], "ng-airtel-5gb": ["NG", "airtel", "5GB"],
  "ng-9m-1gb": ["NG", "9mobile", "1GB"], "ng-9m-2gb": ["NG", "9mobile", "2GB"],
  "gh-mtn-1gb": ["GH", "mtn-gh", "1GB"], "gh-mtn-2gb": ["GH", "mtn-gh", "2GB"],
  "gh-mtn-5gb": ["GH", "mtn-gh", "5GB"], "gh-mtn-10gb": ["GH", "mtn-gh", "10GB"],
  "gh-tel-1gb": ["GH", "telecel", "1GB"], "gh-tel-3gb": ["GH", "telecel", "3GB"], "gh-tel-7gb": ["GH", "telecel", "7GB"],
  "gh-at-1gb": ["GH", "airteltigo", "1GB"], "gh-at-2gb": ["GH", "airteltigo", "2GB"], "gh-at-5gb": ["GH", "airteltigo", "5GB"],
  "ke-saf-500mb": ["KE", "safaricom", "500MB"], "ke-saf-1gb": ["KE", "safaricom", "1GB"],
  "ke-saf-2gb": ["KE", "safaricom", "2GB"], "ke-saf-5gb": ["KE", "safaricom", "5GB"],
  "ke-airtel-1gb": ["KE", "airtel-ke", "1GB"], "ke-airtel-3gb": ["KE", "airtel-ke", "3GB"], "ke-airtel-7gb": ["KE", "airtel-ke", "7GB"],
  "ke-tel-1gb": ["KE", "telkom-ke", "1GB"], "ke-tel-2gb": ["KE", "telkom-ke", "2GB"],
  "za-vod-1gb": ["ZA", "vodacom", "1GB"], "za-vod-2gb": ["ZA", "vodacom", "2GB"],
  "za-vod-5gb": ["ZA", "vodacom", "5GB"], "za-vod-10gb": ["ZA", "vodacom", "10GB"],
  "za-mtn-1gb": ["ZA", "mtn-za", "1GB"], "za-mtn-2gb": ["ZA", "mtn-za", "2GB"], "za-mtn-5gb": ["ZA", "mtn-za", "5GB"],
  "za-cellc-1gb": ["ZA", "cellc", "1GB"], "za-cellc-3gb": ["ZA", "cellc", "3GB"],
  "za-tel-1gb": ["ZA", "telkom-za", "1GB"], "za-tel-2gb": ["ZA", "telkom-za", "2GB"],
};

async function getToken() {
  const id = process.env.RELOADLY_CLIENT_ID;
  const secret = process.env.RELOADLY_CLIENT_SECRET;
  if (!id || !secret) {
    console.error("✗ Set RELOADLY_CLIENT_ID and RELOADLY_CLIENT_SECRET first.");
    process.exit(1);
  }
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: id,
      client_secret: secret,
      grant_type: "client_credentials",
      audience: BASE,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    console.error("✗ Auth failed:", res.status, data.message || data.error || JSON.stringify(data));
    process.exit(1);
  }
  return data.access_token;
}

async function allOperators(token) {
  const out = [];
  for (let page = 1; page <= 20; page++) {
    const url = `${BASE}/operators?size=200&page=${page}&includeBundles=true&includeData=true`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: ACCEPT } });
    if (!res.ok) {
      console.error("✗ /operators failed:", res.status, await res.text().catch(() => ""));
      process.exit(1);
    }
    const batch = await res.json().catch(() => []);
    if (!Array.isArray(batch) || batch.length === 0) break;
    out.push(...batch);
    if (batch.length < 200) break;
  }
  return out;
}

/** amount → description, tolerant of object or array shapes. */
function descriptions(amounts, map) {
  const byAmount = {};
  if (Array.isArray(amounts)) for (const a of amounts) byAmount[a] = undefined;
  if (map && typeof map === "object" && !Array.isArray(map)) {
    for (const [k, v] of Object.entries(map)) byAmount[k] = v;
  } else if (Array.isArray(map)) {
    map.forEach((v, i) => {
      const key = amounts?.[i];
      if (key != null) byAmount[key] = v;
    });
  }
  return byAmount;
}

async function main() {
  console.log(`Reloadly ${BASE.includes("sandbox") ? "SANDBOX" : "PRODUCTION"} · ${COUNTRIES.join(", ")}\n`);
  const token = await getToken();
  const ops = await allOperators(token);
  console.log(`Fetched ${ops.length} operators.\n`);

  const forCountry = (cc) => ops.filter((o) => o?.country?.isoName === cc);

  // ── Airtime operator ids ─────────────────────────────────────────────
  const operatorIds = {};
  console.log("── Airtime operators (RELOADLY_OPERATOR_IDS) ──");
  for (const cc of COUNTRIES) {
    const list = forCountry(cc).filter((o) => !o.data && !o.bundle);
    for (const [netId, re] of Object.entries(NETWORKS[cc])) {
      const hit = list.find((o) => re.test(o.name || ""));
      if (hit) {
        operatorIds[`${cc}:${netId}`] = hit.operatorId;
        console.log(`  ${cc}:${netId.padEnd(11)} → ${hit.operatorId}  (${hit.name})`);
      } else {
        console.log(`  ${cc}:${netId.padEnd(11)} → NOT FOUND — pick from the list below`);
      }
    }
  }

  // ── Data bundle operators ────────────────────────────────────────────
  const bundles = {};
  console.log("\n── Data bundles (RELOADLY_BUNDLES) ──");
  for (const [bundleId, [cc, netId, size]] of Object.entries(BUNDLES)) {
    const re = NETWORKS[cc][netId];
    const candidate = forCountry(cc).find((o) => (o.data || o.bundle) && re.test(o.name || ""));
    if (!candidate) {
      console.log(`  ${bundleId.padEnd(16)} → no data operator for ${cc}:${netId}`);
      continue;
    }
    const amounts = candidate.localFixedAmounts || candidate.fixedAmounts || [];
    const desc = descriptions(amounts, candidate.localFixedAmountsDescriptions || candidate.fixedAmountsDescriptions);
    const parsed = /^(\d+)(MB|GB)$/.exec(size);
    const regex = parsed
      ? new RegExp(`${parsed[1]}\\s*${parsed[2] === "GB" ? "G(?:B)?" : "M(?:B)?"}`, "i")
      : null;
    const entry = regex ? Object.entries(desc).find(([, label]) => label && regex.test(String(label))) : undefined;
    if (entry) {
      bundles[bundleId] = { operatorId: candidate.operatorId, amount: Number(entry[0]) };
      console.log(`  ${bundleId.padEnd(16)} → operatorId ${candidate.operatorId}, amount ${entry[0]}  (${entry[1]})`);
    } else {
      console.log(`  ${bundleId.padEnd(16)} → REVIEW: ${candidate.name} has these local amounts:`);
      for (const [amount, label] of Object.entries(desc).slice(0, 12)) {
        console.log(`        ${amount}  ${label ?? ""}`);
      }
    }
  }

  console.log("\n── Paste into Vercel (Environment Variables) ──\n");
  console.log(`RELOADLY_OPERATOR_IDS=${JSON.stringify(operatorIds)}`);
  console.log(`RELOADLY_BUNDLES=${JSON.stringify(bundles)}`);
  console.log("\nReview anything marked REVIEW/NOT FOUND. Then set RELOADLY_ENV=live.\n");
}

main().catch((err) => {
  console.error("✗ Failed:", err?.message || err);
  process.exit(1);
});
