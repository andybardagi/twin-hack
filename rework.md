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
- Picks the token they want to receive (ARGt, BRAt, USDT0, ...).
- Optionally sets a forward address. Payments then settle directly to that address instead of the merchant's wallet. The forward address is stored in the payment contract. The merchant sets the forwarding address on-chain.
- Creates an order with an amount in the receive token, which generates a QR.
- Gets a real-time confirmation when the payment settles.

## Customer

- Signs in with their wallet.
- Scans the QR and sees what the merchant is asking for (e.g. 15,000 ARGt).
- Picks which of their stablecoins to pay with. The app shows a live quote for each one: amount to pay, fee, and route.
- Signs the payment. No gas, no ETH needed.
- Gets a confirmation.

## Payment intent

The QR carries the merchant's side of the payment: chainId, contract, merchant, receiveToken, receiveAmount, orderId, expiry.

When the customer scans it, the app adds the customer's side: payToken and maxPayAmount (the quote plus slippage).

The customer signs the full intent (EIP-712). Our relayer submits it, and the contract:

1. Pulls payToken from the customer.
2. Routes through the Curve pools.
3. Takes our fee, then sends the rest of receiveAmount to the merchant's payout address (the forward address if one is set).
4. Refunds any leftover payToken to the customer.
5. Emits `PaymentSettled(orderId, merchant, payToken, receiveToken, amount)`.

Each orderId can only be paid once. Expired intents are rejected.

## Gasless

Customers never pay gas. Our relayer submits every payment and every merchant settings change, paying ETH on Arbitrum. The fee below covers it.

The customer signs two EIP-712 messages per payment, and the relayer submits both in a single transaction to our contract:

1. An approval of maxPayAmount to our contract, signed off-chain:
   - USDT0: a `permit` signature (EIP-2612).
   - Twin tokens: an ERC-2771 forward request for `approve`. Our contract passes it to Twin's trusted forwarder, and the token treats the customer as the sender.
2. The payment intent above.

Our contract uses the approval, then runs the payment. If anything fails, the whole transaction reverts, so the approval never stays behind on its own.

## Business model

- A fee of X% per payment, deducted from the merchant's received amount when the payment settles, the same way card processors charge merchants. Target: below Mercado Pago and Pix-based processors [fill in their current rates].
- The fee pays for gas. An Arbitrum transaction costs a few cents, so at 0.5%, a USD 20 payment earns USD 0.10.
- No capital tied up in liquidity pools, and we never hold user funds.
- Later: FX spread on cross-currency payments, volume tiers for large merchants.

## To verify before building

- Twin's trusted forwarder: its address on Arbitrum, whether `execute` can be called by anyone (our contract needs to call it) or only by whitelisted relayers, and its exact `ForwardRequest` format. Ask the Twin mentors.
- USDT0 supports `permit` (EIP-2612) and EIP-3009, so paying with USDT0 is gasless out of the box.
- Decimals: USDT0 has 6, Twin tokens have 18. Quotes, slippage, and fees must use each token's own decimals.
- Pool depth for demo-sized amounts.
- Pool type, which decides whether we can quote exact output with `get_dx`.