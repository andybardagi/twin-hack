# 005 — Merchant order creation

## Status: done

A signed-in merchant registers a device signing key on `PaymentRouter` (Arbitrum), picks a receive token and
amount, and the device key signs an EIP-712 order with no wallet prompt. The server stores the signed order and
shows a QR linking to `/pay/order/<id>`, a public page where the server verifies the signature. The merchant's
order page shows settlement as it happens. This also decides feature 003: Elysia.

## Decisions

- Tokens: static list in `apps/web/src/helpers/tokens.ts`, derived from `@workspace/payments/tokens` for address
  and decimals. Each token adds a name, `fiatDecimals` (the most decimals a merchant can request per payment: 2
  for all, 0 for CHLt), and `canPay` / `canCollect`. USDT0 is shown as USDT.
- Orders: `orders` table with a UUIDv7 primary key that is also the on-chain `orderId` (the UUID's 16 bytes
  left-padded to bytes32). The amount is `numeric(78,0)` base units, a string in TypeScript, gross of fee. The
  token address is stored checksummed. `merchant_id` comes from the session only (FK to `user.id`, on delete
  restrict), and `merchant_address` from the session's primary wallet. No `chain_id` column: Arbitrum only.
- Signed order fields: `merchant`, `receiveToken`, `receiveAmount`, `orderId`, `expiry`, `feeBps`. `feeBps` is in
  the contract's order type hash and must equal the router's current `feeBps`.
- Two-step create: `POST /api/orders` reserves the id, sets `expires_at` to now + 15 minutes and reads `feeBps`
  from the router; the browser signs; `POST /api/orders/:id/signature` checks the signature against the on-chain
  key and attaches it. Unsigned rows never show on any page.
- Signing key: generated in the browser, stored in IndexedDB wrapped by a non-extractable AES-GCM key, never leaves
  the device. One key per merchant on chain; the merchant's wallet registers, rotates and revokes it. Rotating
  warns that open unpaid orders stop working.
- `/settings` holds the signing key, the forward address (on chain only), and the default receive token
  (`merchant_settings` table, read and written through `/api/merchant-settings`). The default prefills the order
  form and can be changed per order.
- `/orders/new` is blocked, with a reason and a link to settings, unless the on-chain `signingKeyOf` matches this
  device's key.
- Pay page: `/pay/order/<id>` is public and read-only. The server verifies the signature against the on-chain
  `signingKeyOf` and shows valid, invalid, expired or paid. The merchant address never reaches the browser, and an
  RPC failure shows "try again", never a pass.
- QR: `qrcode.react`, fixed black on white in both themes, linking to `/pay/order/<id>` built from
  `BETTER_AUTH_URL`.
- Settlement: the merchant order page polls `GET /api/orders/:id/status` every 3 seconds while the order is open.
  The server reads `paid(merchant, orderId)` and writes `settled_at` the first time it is true. Open, expired and
  paid derive from `expires_at` and `settled_at`; there is no status column.
- The deployed `PaymentRouter` (`0x4DE32c75eecDF3229114F105293698284b261Bb1`) and `https://arb1.arbitrum.io/rpc`
  are the defaults. `PAYMENT_ROUTER_ADDRESS` and `ARBITRUM_RPC_URL` override them at runtime, and invalid overrides
  throw. The build needs neither.
- `apps/web` depends on `@workspace/payments` for the ABI, tokens, `signOrder` and `hashOrder`.

## Out of scope

- Customer sign-in, quote and pay.
- Deploying `PaymentRouter` to Arbitrum.
- A cleanup job for unsigned reservations; they expire and stay hidden.
- Writing `settled_at` without a poll: it is only written when the merchant's order page asks for the status.
- Order lists.

## Acceptance and verification

- A merchant with this device's key registered can create an order, sign it without a wallet prompt, and see its
  QR. A merchant without a matching key is sent to settings.
- The server rejects bad input, other merchants' orders, expired or already signed reservations, and signatures
  that don't match the on-chain key.
- The pay page shows the amount and token for a valid order, and reports invalid, expired, paid and RPC failures.
- The merchant order page flips to paid after a real payment and writes `settled_at` once.
- Real Postgres integration tests cover the order and settings routes and repositories. Chain tests
  (`pnpm --filter web test:chain`) deploy `PaymentRouter` on an Anvil Arbitrum fork and cover key registration,
  rotation and revocation, forward addresses, signed orders the router accepts, pay page verification, and
  settlement.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm build` without env, `pnpm test`, `pnpm knip`, and `pnpm format`.

The API layout lives in `docs/architecture.md`; local setup lives in `docs/conventions.md` and `README.md`.
