# Afritop ⚡

Buy **airtime**, **data bundles** and **prepaid electricity** for Africa — paid in **USDC**, delivered in seconds.

- **Countries:** 🇳🇬 Nigeria · 🇬🇭 Ghana · 🇰🇪 Kenya · 🇿🇦 South Africa
- **Airtime delivery:** [Africa's Talking](https://developers.africastalking.com) API
- **Payments:** USDC **directly from any EVM wallet** — on [Arc](https://docs.arc.io) (Circle's stablecoin L1), Base, Polygon, Ethereum or Arbitrum, verified on-chain
- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · viem

## Quick start

```bash
npm install
cp .env.local.example .env.local   # fill in keys (optional — demo works without them)
npm run dev                        # → http://localhost:3000
```

## How payments work

1. Build a top-up in the **Buy** flow.
2. You land on `/pay/[order]` — connect any EVM wallet (MetaMask, Coinbase Wallet, …).
3. Pick a network: **Arc Testnet** (default — Circle's stablecoin L1, gas in USDC) or
   Base, Polygon, Ethereum, Arbitrum.
4. Your wallet sends the exact USDC amount to the **receiver** address shown.
5. We verify the transfer **on-chain** (`/api/confirm-usdc`) — recipient, amount and
   sender are checked against public RPCs — then deliver the top-up.

- **Demo mode:** without `USDC_RECEIVER`, payments go to a burn address on Arc
  Testnet (grab free testnet USDC from [faucet.circle.com](https://faucet.circle.com)),
  mainnet chains are locked, and a *simulate payment* button is available.
- **Going live:** set `USDC_RECEIVER` to your own EVM address to unlock mainnet and
  real USDC. Airtime delivery goes live by adding your Africa's Talking key.

> ⚠️ **Arc note:** Arc's USDC is dual-decimal — native gas uses 18 decimals while the
> ERC-20 interface (`0x3600…`) uses 6. The on-chain verification parses standard
> `Transfer` logs from that wrapper. Before relying on real settlements, run one
> end-to-end testnet payment (faucet → wallet `transfer` → `/api/confirm-usdc`).

## Wiring up the real APIs

| Variable | Purpose |
| --- | --- |
| `USDC_RECEIVER` | Your EVM address receiving USDC payments (unlocks mainnet) |
| `AT_API_KEY` | Africa's Talking sandbox/live key — enables real airtime sends |
| `AT_USERNAME` | Your Africa's Talking app username (`sandbox` for testing) |
| `AT_ENV` | `sandbox` or `live` |
| `CIRCLE_API_KEY` | Optional — enables the alternate Circle hosted checkout |
| `CIRCLE_ENV` | `sandbox` or `live` |
| `CIRCLE_WEBHOOK_SECRET` | Verifies webhook signatures (HMAC-SHA256) |
| `NEXT_PUBLIC_APP_URL` | Public base URL for Circle redirects |

**Circle webhook:** register `POST /api/webhook` in the Circle developer console
(use a tunnel like ngrok locally). We listen for `checkout.session.completed` and
fulfil the linked order automatically.

> ⚠️ Security: the webhook **refuses requests (503) until `CIRCLE_WEBHOOK_SECRET`
> is set** — this prevents forged fulfillment events. The `/api/purchase` endpoint
> (used by the simulated payer) is **disabled (403) when `CIRCLE_ENV=live`**,
> so in production fulfillment only ever happens via the verified webhook.

## What's live vs simulated

- **Payments** — real on-chain USDC verification (`/api/confirm-usdc`) via public
  RPCs on Arc Testnet / Base / Polygon / Ethereum / Arbitrum.
- **Airtime** — real via Africa's Talking when `AT_API_KEY` is set; otherwise simulated.
- **Data bundles & electricity tokens** — currently simulated. The fulfilment logic
  in `lib/fulfill.ts` is where you'd plug in a vending partner (e.g. VTpass for
  Nigeria) for live data/electricity vending.

## Architecture

```
app/
  page.tsx                    # marketing landing page
  buy/                        # multi-step top-up flow + live order summary
  pay/[orderId]/              # payment hub: connect wallet → pay USDC → confirm
  success/                    # receipt, token display, on-chain link, polling
  transactions/               # order history
  api/
    checkout/                 # validate → persist order → return /pay/[orderId]
    confirm-usdc/             # verify USDC transfer on-chain → fulfil order
    purchase/                 # demo simulate (disabled in live mode)
    transactions/             # order history (JSON file store)
    webhook/                  # Circle hosted-checkout webhook (HMAC verified)
lib/
  catalog.ts                  # countries, networks, distributors, bundles, FX
  chains.ts                   # Arc testnet + Base/Polygon/Ethereum/Arbitrum, USDC, receiver
  usdc-verify.ts              # on-chain USDC transfer verification (viem)
  africastalking.ts           # airtime send client
  circle.ts                   # optional Circle hosted-checkout client
  fulfill.ts                  # payment → delivery pipeline
  store.ts                    # file-based order store (data/orders.json)
components/
  PayPanel.tsx                # wallet connect / chain switch / pay / confirm UI
  navbar, footer, logo, status chip
```

## Notes

- Exchange rates in `lib/fx.ts` are **indicative placeholders** — swap in a live
  FX feed before going to production.
- Order history is a simple JSON file (`data/orders.json`, gitignored) — replace
  with a real database (e.g. Postgres + Prisma) for production.
