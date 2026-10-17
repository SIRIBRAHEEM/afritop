/**
 * Vendor identifiers that come from your provider accounts — operator ids,
 * service ids, variation codes, bundle codes.
 *
 * These are supplied as JSON through environment variables so onboarding a new
 * operator, bundle or DISCO never needs a code change. When a mapping is
 * missing the route is treated as "no vending partner", which falls back to the
 * simulated pipeline — never a guessed id, and never a charge with no delivery.
 *
 * Example (Vercel → Environment Variables):
 *   RELOADLY_OPERATOR_IDS   {"NG:mtn":341,"GH:mtn-gh":102}
 *   RELOADLY_BUNDLES        {"ng-mtn-1gb":{"operatorId":341,"amount":500}}
 *   VTPASS_SERVICE_IDS      {"electricity:ikeja":"ikeja-electric"}
 *   HUBTEL_SERVICE_IDS      {"electricity:GH:ecg":"e6d6bac062b5499cb1ece1ac3d742a84"}
 */

function jsonEnv<T extends object>(name: string, fallback: T): T {
  const raw = process.env[name];
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as T;
    console.warn(`[vendors] ${name} must be a JSON object — ignoring.`);
  } catch {
    console.warn(`[vendors] ${name} is not valid JSON — ignoring.`);
  }
  return fallback;
}

/** Reloadly operator ids for airtime, keyed "COUNTRY:networkId" (e.g. "NG:mtn"). */
export function reloadlyOperatorId(countryCode: string, networkId: string): number | undefined {
  const map = jsonEnv<Record<string, number>>("RELOADLY_OPERATOR_IDS", {});
  const id = map[`${countryCode}:${networkId}`];
  return typeof id === "number" ? id : undefined;
}

/** Reloadly data-bundle operators, keyed by catalog bundle id. */
export function reloadlyBundle(bundleId: string): { operatorId: number; amount?: number } | undefined {
  const map = jsonEnv<Record<string, { operatorId: number; amount?: number }>>("RELOADLY_BUNDLES", {});
  const entry = map[bundleId];
  if (!entry || typeof entry.operatorId !== "number") return undefined;
  return entry;
}

/** VTPass service ids, keyed "service:networkId" (e.g. "electricity:ikeja"). */
export function vtpassServiceId(service: string, networkId: string): string | undefined {
  const map = jsonEnv<Record<string, string>>("VTPASS_SERVICE_IDS", {});
  return map[`${service}:${networkId}`];
}

/** How many VTPass service ids are configured — used to gate the vendor on. */
export function vtpassServiceIdCount(): number {
  return Object.keys(jsonEnv<Record<string, string>>("VTPASS_SERVICE_IDS", {})).length;
}

/** Hubtel product service ids, keyed "service:country:networkId". */
export function hubtelServiceId(service: string, countryCode: string, networkId: string): string | undefined {
  const map = jsonEnv<Record<string, string>>("HUBTEL_SERVICE_IDS", {});
  return map[`${service}:${countryCode}:${networkId}`];
}

/** How many Hubtel service ids are configured — used to gate the vendor on. */
export function hubtelServiceIdCount(): number {
  return Object.keys(jsonEnv<Record<string, string>>("HUBTEL_SERVICE_IDS", {})).length;
}
