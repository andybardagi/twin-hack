# onchain p2p payments — QR payments in any LatAm stablecoin

On-chain QR payments for Latin American merchants. The customer pays with whatever stablecoin they hold, and the merchant receives whatever stablecoin they want. The conversion happens in the same transaction through Curve pools on Arbitrum. See the hackathon [docs](./hackatwin-track-twin.md).

Supported tokens (Arbitrum): USDT0, ARGt, BRAt, COLt, PERt, MEXt, CHLt, BOLt.

On Arbitrum, USDT and USDT0 are the same token: in 2025 the Arbitrum USDT contract (`0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9`) was upgraded in place to USDT0, keeping its address and balances. In the UI we show it as "USDT".

## Routing

Every Twin pool on Curve is paired with USDT0, so:

- Same token on both sides: direct transfer, no swap.
- USDT0 to a Twin token (or back): one swap.
- Twin token to Twin token (e.g. BRAt to ARGt): two swaps through USDT0, in a single transaction.

## Authentication

No username or password. Merchants and customers sign in with their EVM wallet by signing a message (Sign-In with Ethereum, EIP-4361), the same pattern Lighter.xyz uses. Signing proves the user owns the address and starts a session. It's not a transaction and costs no gas.

## Merchant

- Signs in with their wallet.
- Registers a signing key once. The app generates the key on the merchant's device, and the merchant's wallet registers it in the payment contract with an on-chain transaction. The merchant can rotate or revoke it the same way.
- Picks the token they want to receive (ARGt, BRAt, USDT0, ...).
- Optionally sets a forward address. Payments then settle directly to that address instead of the merchant's wallet. The forward address is stored in the payment contract. The merchant sets the forwarding address on-chain.
- Creates an order with an amount in the receive token. The signing key signs the order, with no wallet prompt, and the signed order becomes the QR.
- Gets a real-time confirmation when the payment settles.

The signing key never leaves the merchant's device, so our backend can't forge an order or change where it pays out.

## Customer

- Signs in with their wallet.
- Scans the QR. The app checks that the order was signed by the merchant's registered signing key and rejects it otherwise. Then it shows what the merchant is asking for (e.g. 15,000 ARGt).
- Picks which of their stablecoins to pay with. The app shows a live quote for each one: amount to pay, fee, and route.
- Signs the payment. No gas, no ETH needed. The first payment with a Twin token asks for one extra approval transaction, and we fund its gas (see [Gasless](#gasless)).
- Gets a confirmation.

## Payment intent

The QR carries the order, signed by the merchant's key with EIP-712: `merchant`, `receiveToken`, `receiveAmount`, `orderId`, `expiry`. `chainId` and the contract address live in the EIP-712 domain, so a signature from another chain or contract is rejected.

When the customer scans it, the app adds the customer's side: `payToken`, `maxPayAmount` (the quote plus slippage), and the order hash, so the customer signs that exact order.

The customer signs the intent (EIP-712). Our relayer submits the order, the merchant signature, and the intent. The contract:

1. Recovers the order signer and checks it is the merchant's registered signing key.
2. Rejects the payment if this merchant's `orderId` was already paid, or if the order has expired.
3. Pulls `payToken` from the customer, up to `maxPayAmount`.
4. Routes through the Curve pools as an exact-output swap: it calls `get_dx` in the same transaction, adds a 1–2 basis point buffer, then `exchange` with `min_dy = receiveAmount`. For Twin-to-Twin, it calls `get_dx` on the second pool first (USDT0 needed), then on the first (pay token needed). Same token on both sides skips the swap.
5. Takes our fee, then sends the rest of `receiveAmount` to the payout address: the merchant's forward address if one is set, otherwise `order.merchant`.
6. Refunds any leftover `payToken` to the customer.
7. Emits `PaymentSettled(merchant, orderId, payer, payToken, payAmount, receiveToken, receiveAmount, fee, payout)`.

Each `orderId` can only be paid once per merchant.

## Gasless

Customers never pay gas. Our relayer submits every payment, paying ETH on Arbitrum. The fee below covers it, including the one-time gas drips for Twin-token approvals.

Merchant settings (signing key, forward address) are transactions the merchant sends from their wallet, not relayed.

**Paying with USDT0.** The customer signs two EIP-712 messages: a `permit` (EIP-2612) for `maxPayAmount`, and the payment intent. The relayer submits both in a single transaction. The contract calls `permit` inside try/catch and then checks the allowance, so a front-run `permit` can't block the payment.

**Paying with a Twin token.** All seven Twin tokens on Arbitrum share one beacon implementation (`TwinToken.sol`). Its ERC-2771 forwarder is `address(0)` and it has no `permit`, so only the customer's own address can call `approve`. Gas drip:

- When the customer picks a Twin token they haven't approved yet, the relayer sends them just enough ETH for one `approve`.
- The customer signs the `approve` transaction to our contract.
- After that, each payment needs only the intent signature.
- Abuse guard: only send to addresses that hold that Twin token and have no allowance yet, once per address and token.

## Business model

- A fee of X% per payment, deducted from the merchant's received amount when the payment settles, the same way card processors charge merchants. Target: below Mercado Pago and Pix-based processors [fill in their current rates].
- Curve takes 0.3% per swap, about 0.6% on Twin-to-Twin payments, on top of our fee. That cost is part of the quote the customer sees, and it counts against the "below Mercado Pago" target.
- The fee pays for gas, including the one-time drips. An Arbitrum transaction costs a few cents, so at 0.5%, a USD 20 payment earns USD 0.10.
- No capital tied up in liquidity pools, and we never hold user funds.
- Later: FX spread on cross-currency payments, volume tiers for large merchants, and batched approve-and-pay with a sponsored-gas service (EIP-5792 + EIP-7702 + paymaster) so wallets that support it skip the extra Twin-token approval transaction.

## Verified

- Twin tokens have no working trusted forwarder and no `permit`. All seven sit behind beacon `0xa92426af5c8a9edf335fabc55716965dc9e08f32`, implementation `0xd9EFF713Da2F9D3785B5187A2f4A5C4A1Ef0718e` (`TwinToken.sol`). `isTrustedForwarder(address(0))` returns true; any other address returns false, so ERC-2771 is off. Reproduce with `cast call 0x59863989d080B22476DB95656d0C3CC18be92214 "isTrustedForwarder(address)(bool)" 0x0000000000000000000000000000000000000000 --rpc-url https://arb1.arbitrum.io/rpc`.
- The pools are Curve Twocrypto (`version()` `v3.0.0`). Coin 0 is the Twin token, coin 1 is USDT0. `get_dx` exists and is accurate, but slightly under the target, so the contract adds a 1–2 basis point buffer and sets `min_dy = receiveAmount`.
- Each swap costs 0.3% (`mid_fee` and `out_fee` are both 0.3%).
- Decimals: USDT0 has 6, Twin tokens have 18. Quotes, slippage, and fees must use each token's own decimals.
- USDT0 supports `permit` (EIP-2612).

## Open

- Ask the Twin mentors whether a beacon upgrade with a real forwarder (or `permit`) is planned. That would drop the gas drip for Twin-token payments.