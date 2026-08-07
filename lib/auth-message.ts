/**
 * The exact message a wallet signs to log in. Built identically on the client
 * (to sign) and the server (to verify), with the nonce + issued-at pinned by
 * the server so a captured signature can never be replayed.
 */
export function buildAuthMessage(opts: {
  address: string;
  nonce: string;
  issuedAt: string;
  domain: string;
}): string {
  return [
    "Afritop: sign in with your wallet",
    "",
    `Domain: ${opts.domain}`,
    `Address: ${opts.address}`,
    `Nonce: ${opts.nonce}`,
    `Issued at: ${opts.issuedAt}`,
    "",
    "Signing in links your Afritop transaction history to this wallet address. This request does not trigger a blockchain transaction and costs no gas.",
  ].join("\n");
}
