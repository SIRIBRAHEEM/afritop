#!/usr/bin/env node
/**
 * Prints the VTPass service IDs you paste into Vercel as `VTPASS_SERVICE_IDS`.
 * Read-only: it only GETs the service list, it never vends.
 *
 *   1. Create an account at https://vtpass.com, then copy your keys from the
 *      dashboard (API Keys). You need the API key and the PUBLIC key — GET
 *      requests are authenticated with those two.
 *   2. Run:
 *
 *        VTPASS_API_KEY=xxx VTPASS_PUBLIC_KEY=yyy \
 *          node scripts/vtpass-explore.mjs
 *
 *      Add VTPASS_ENV=live to query production; otherwise the sandbox is used.
 *
 * Node 18+ required (global fetch).
 */

const BASE =
  process.env.VTPASS_ENV === "live"
    ? "https://vtpass.com/api"
    : "https://sandbox.vtpass.com/api";

// catalog distributor id → regex that matches VTPass's DISCO service name
const DISCOS = {
  ikeja: /ikeja/i,
  eko: /\beko\b/i,
  abuja: /abuja|aedc/i,
  ph: /port\s*harcourt|phed/i,
  ibadan: /ibadan|ibedc/i,
  enugu: /enugu|eedc/i,
  kano: /kano|kedco/i,
  jos: /\bjos\b|jed/i,
  kaduna: /kaduna|kaedco/i,
  benin: /benin|bedc/i,
  aba: /\baba\b/i,
  yola: /yola|yedc/i,
};

async function main() {
  const apiKey = process.env.VTPASS_API_KEY;
  const publicKey = process.env.VTPASS_PUBLIC_KEY;
  if (!apiKey || !publicKey) {
    console.error("✗ Set VTPASS_API_KEY and VTPASS_PUBLIC_KEY first (GET uses the public key).");
    process.exit(1);
  }

  console.log(`VTPass ${BASE.includes("sandbox") ? "SANDBOX" : "PRODUCTION"}\n`);

  const res = await fetch(`${BASE}/services?identifier=electricity-bill`, {
    headers: { "api-key": apiKey, "public-key": publicKey, Accept: "application/json" },
  });
  if (!res.ok) {
    console.error("✗ /services failed:", res.status, await res.text().catch(() => ""));
    process.exit(1);
  }
  const data = await res.json().catch(() => ({}));
  const services = data.content || [];
  if (!services.length) {
    console.error("✗ No electricity services returned. Check your keys / environment.");
    process.exit(1);
  }

  console.log("── Electricity services available on this account ──");
  for (const s of services) console.log(`  ${String(s.serviceID).padEnd(22)} ${s.name}`);

  const mapping = {};
  console.log("\n── Suggested VTPASS_SERVICE_IDS ──");
  for (const [distId, re] of Object.entries(DISCOS)) {
    const hit = services.find((s) => re.test(s.name || "") || re.test(s.serviceID || ""));
    if (hit) {
      mapping[`electricity:${distId}`] = hit.serviceID;
      console.log(`  electricity:${distId.padEnd(9)} → ${hit.serviceID}  (${hit.name})`);
    } else {
      console.log(`  electricity:${distId.padEnd(9)} → not offered (your catalog may still list it)`);
    }
  }

  console.log("\n── Paste into Vercel (Environment Variables) ──\n");
  console.log(`VTPASS_SERVICE_IDS=${JSON.stringify(mapping)}`);
  console.log("\nRemember: fund the VTPass wallet, or vending fails. Set VTPASS_ENV=live.\n");
}

main().catch((err) => {
  console.error("✗ Failed:", err?.message || err);
  process.exit(1);
});
