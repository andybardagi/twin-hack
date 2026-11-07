# Ponte: QR payments in any LatAm stablecoin

> HackaTwin 2026, Stablecoins track (Twin)

A crypto native from São Paulo walks into a café in Buenos Aires. They hold BRAt in their own wallet and keep their own keys. The café wants pesos.

Today they have two bad options. They can pay by card and eat the FX fees. Or they can download a local payments app, create an account, pass KYC with their passport and a selfie, deposit their crypto into the app's custody, and only then scan the QR. That is a lot to ask for a coffee, from someone who uses crypto precisely so they don't have to ask anyone's permission.

With Ponte, the café shows a QR for **15,000 ARGt**. The customer connects their wallet, picks **BRAt** (or any other Twin stablecoin, or USDT), and signs. That's it: no account, no KYC, no deposit, no gas. The café receives exactly 15,000 ARGt minus a 0.5% fee. The conversion from BRAt to ARGt runs through Curve pools inside the payment transaction, and the funds go straight from the customer's wallet to the merchant's.

## Hackathon deliverables

| Deliverable                 | Where                                                                        |
| --------------------------- | ---------------------------------------------------------------------------- |
| Public repository           | [github.com/andybardagi/twin-hack](https://github.com/andybardagi/twin-hack) |
| Tokens, chain and contracts | [Chain and contracts](#chain-and-contracts)                                  |
| Onchain proof               | [Onchain proof](#onchain-proof): 6 settled payments on Arbitrum One          |
| Live demo                   | [pontetwin.vercel.app](https://pontetwin.vercel.app)                         |

## Chain and contracts

**Chain:** Arbitrum One (chain ID `42161`)

**Our contract:** `PaymentRouter` at [`0x4DE32c75eecDF3229114F105293698284b261Bb1`](https://arbiscan.io/address/0x4DE32c75eecDF3229114F105293698284b261Bb1) ([source](./contracts/src/PaymentRouter.sol))

**Tokens used:** all seven Twin stablecoins plus USDT0. Every Twin token routes through its Curve Twocrypto pool against USDT0.

| Token | Currency           | Token address                                                                                                        | Curve pool (Twin / USDT0)                                                                                              |
| ----- | ------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| ARGt  | Argentine peso     | [`0x59863989d080B22476DB95656d0C3CC18be92214`](https://arbiscan.io/token/0x59863989d080B22476DB95656d0C3CC18be92214) | [`0x356d349da9add7efb56a35fab939a2c6d852f853`](https://arbiscan.io/address/0x356d349da9add7efb56a35fab939a2c6d852f853) |
| BRAt  | Brazilian real     | [`0xC4ed6Aba5373D78E160F4df39e011F078Be54df8`](https://arbiscan.io/token/0xC4ed6Aba5373D78E160F4df39e011F078Be54df8) | [`0xeef48df5f1c509cd9730774b4e8a4464626ef8d5`](https://arbiscan.io/address/0xeef48df5f1c509cd9730774b4e8a4464626ef8d5) |
| COLt  | Colombian peso     | [`0xa16d5DB80A45157E0e451750B81FF0CC0b61d558`](https://arbiscan.io/token/0xa16d5DB80A45157E0e451750B81FF0CC0b61d558) | [`0x7d2dffa9e903b8377c96196da424c7965b06bcc3`](https://arbiscan.io/address/0x7d2dffa9e903b8377c96196da424c7965b06bcc3) |
| PERt  | Peruvian sol       | [`0x899438713f62B04d6CD8e8709986F7256fB6E3d9`](https://arbiscan.io/token/0x899438713f62B04d6CD8e8709986F7256fB6E3d9) | [`0x41af8cc0811dd07f167752b821cf5b11dba7ca85`](https://arbiscan.io/address/0x41af8cc0811dd07f167752b821cf5b11dba7ca85) |
| MEXt  | Mexican peso       | [`0xb96aA6babCcD738d6644ADd4912fE5eFbEBF5a25`](https://arbiscan.io/token/0xb96aA6babCcD738d6644ADd4912fE5eFbEBF5a25) | [`0x6edbf3ada7b6d9524c3248955538d573aae449cf`](https://arbiscan.io/address/0x6edbf3ada7b6d9524c3248955538d573aae449cf) |
| CHLt  | Chilean peso       | [`0xe8dbC4680235cCAeFf48e4C0B0EaceeBb89E5e17`](https://arbiscan.io/token/0xe8dbC4680235cCAeFf48e4C0B0EaceeBb89E5e17) | [`0xa087f05ecd245476d7844f6eab28d98724696ac2`](https://arbiscan.io/address/0xa087f05ecd245476d7844f6eab28d98724696ac2) |
| BOLt  | Bolivian boliviano | [`0x1edF5E61B6a4Fe19FEf3A695328F61aAa07728eA`](https://arbiscan.io/token/0x1edF5E61B6a4Fe19FEf3A695328F61aAa07728eA) | [`0x9c7809c813bcc67e288c56d5ce5e0225996bfcd2`](https://arbiscan.io/address/0x9c7809c813bcc67e288c56d5ce5e0225996bfcd2) |
| USDT0 | US dollar          | [`0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9`](https://arbiscan.io/token/0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9) | hub token, no pool                                                                                                     |

On Arbitrum, USDT and USDT0 share the same address: the USDT contract was upgraded in place to USDT0 in 2025. The UI shows it as "USDT".

## Onchain proof

Each transaction below is a real payment our product executed: a merchant-signed order paid by a customer, submitted by our relayer, and settled by `PaymentRouter` with a `PaymentSettled` event. Open any hash on Arbiscan and check the **Logs** tab.

| Customer paid | Merchant received | Route                         | Transaction                                                                                                      |
| ------------- | ----------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 2.90 USDT0    | 4,800 ARGt        | USDT0 → ARGt (1 swap)         | [`0xb0d0ade0…a08e15`](https://arbiscan.io/tx/0xb0d0ade04047f372c24d37ee5c9ef48b0c42283fe8c2c3d4bf256a8dd2a08e15) |
| 13.43 BRAt    | 4,000 ARGt        | BRAt → USDT0 → ARGt (2 swaps) | [`0x68d507d8…7e84`](https://arbiscan.io/tx/0x68d507d8b4c66ac2fa804aecc75d57281e7b3d6efd7610e6227c392969f17e84)   |
| 6.74 BRAt     | 2,000 ARGt        | BRAt → USDT0 → ARGt (2 swaps) | [`0xd9d9c5a7…a640f`](https://arbiscan.io/tx/0xd9d9c5a72ffa33c44dd46bc85f345c6add19dbf675daa3701d94e47b5e0a640f)  |
| 6.77 BRAt     | 2,000 ARGt        | BRAt → USDT0 → ARGt (2 swaps) | [`0x4bbcc168…f56a`](https://arbiscan.io/tx/0x4bbcc168abdd8831d157ddc50f975a43a57bb497af8d6f17deb6dd04e7d3f56a)   |
| 6,500 ARGt    | 6,500 ARGt        | Same token, no swap           | [`0xea966021…afa2`](https://arbiscan.io/tx/0xea9660214402ba208dc89531ce2915763937a028ac559711b30e45a605b6afa2)   |
| 0.81 USDT0    | 1,340 ARGt        | USDT0 → ARGt (1 swap)         | [`0xb2c5706b…b3d1`](https://arbiscan.io/tx/0xb2c5706be41edbe4793a7fb78bdfb49bebfbf986f51dac2418a9f168a9afb3d1)   |

"Merchant received" is the order amount. The 0.5% fee is deducted from it at settlement.

Merchant setup transactions, also on `PaymentRouter`:

- Register signing key: [`0x48f52cce…ef68`](https://arbiscan.io/tx/0x48f52cce26e2fba08fe8e3aa2eeb08c9366873d6c59d2f6f912e06e2e578ef68)
- Set forward address: [`0x6c3a62b1…ea39`](https://arbiscan.io/tx/0x6c3a62b11823523dc10c324f5462f1a3727d2c8a5fe0c6be0e40e76a74beea39)
- Contract deployment and pool setup: [`0x0ce4eef9…b889`](https://arbiscan.io/tx/0x0ce4eef9654ea322104ae6d4c61153adcb62f58a4f2f1e82d81d0d409bdcb889)

## How it works

```
Merchant                         Customer                       Arbitrum One
────────                         ────────                       ────────────
Types 15,000 ARGt on keypad
Device key signs order (EIP-712)
Shows QR ───────────────────────► Scans QR
                                  Server checks the order was
                                  signed by the merchant's key
                                  Picks BRAt, sees live quote
                                  Signs payment intent (EIP-712)
                                          │
                                  Our relayer submits ──────────► PaymentRouter.pay()
                                                                  1. Verify both signatures
                                                                  2. Pull BRAt from customer
                                                                  3. BRAt → USDT0 → ARGt on Curve
                                                                  4. 0.5% fee to treasury
                                                                  5. ARGt to merchant
Live confirmation ◄─────────────────────────────────────────────  PaymentSettled event
```

- **Any token in, the token you want out.** Every Twin pool pairs with USDT0, so any pair settles in at most two swaps in one transaction. The contract quotes with Curve's `get_dx` on-chain and swaps for an exact output, so the merchant receives exactly the amount they asked for.
- **Gasless for customers.** The customer only signs; our relayer submits and pays the gas. USDT0 payments use `permit` (EIP-2612). Twin tokens have no `permit`, so the first payment with each Twin token needs one `approve` transaction from the customer's wallet.
- **The backend can't redirect funds.** The merchant's signing key is generated on their device and registered on-chain. The contract rejects any order not signed by that key, so our server can't forge an order or change where it pays out.
- **Wallet login.** Merchants and customers sign in with Sign-In with Ethereum (EIP-4361). No passwords, no gas.
- **Merchant fee in the order.** The merchant signs `feeBps` as part of the order, so a fee change never affects orders already issued.

Full design: [project.md](./project.md).

## Built for self-custodial users

Paying a merchant with stablecoins today means going through a custodial app first. You create an account, pass KYC with your ID and a selfie, deposit your crypto into the app's wallet, and only then can you scan and pay. Your funds sit with the app, under its limits and freezes, and every payment is tied to your identity.

Ponte skips all of that:

- **No account and no KYC.** You connect the wallet you already use and sign a message (Sign-In with Ethereum). That proves you own the address. It isn't a transaction and costs no gas.
- **Your keys, your funds.** Tokens stay in your wallet until the moment you pay. The contract pulls only the quoted amount for that one order, capped by the `maxPayAmount` you signed.
- **Nothing to top up.** Pay with whichever stablecoin you hold. You don't need to deposit funds, hold the merchant's currency, or keep ETH for gas, apart from one `approve` per Twin token.
- **Nobody can take custody.** Ponte never holds user funds. The relayer only submits what you and the merchant signed. It can't change the amount, the token, or where the money goes.

## Why it needs local currency onchain

Mercado Pago, Pix and card processors are closed systems that don't talk to each other, and none of them settles a Brazilian wallet into Argentine pesos at the counter. Ponte does it because ARGt, BRAt and the rest are ERC-20 tokens with public Curve liquidity: our contract composes the merchant's signed order, the customer's tokens and two Curve pools into one atomic payment. Nobody holds user funds, and we tie up no capital in liquidity.

**Business model:** 0.5% per payment, deducted from the merchant's proceeds at settlement, like card processors charge today. The fee covers the relayer's gas (a few cents per Arbitrum transaction). Curve's 0.3% per swap is included in the quote the customer sees.

## Repository layout

```
contracts/          Foundry project: PaymentRouter.sol, deploy script, Arbitrum fork tests
apps/web            Next.js app: merchant keypad and QR, customer pay page, order history, relayer API
packages/payments   PaymentRouter ABI, token list, EIP-712 types, quote helpers (viem)
packages/ui         Shared component library
```

More detail: [docs/architecture.md](./docs/architecture.md) and [docs/conventions.md](./docs/conventions.md).

## Running locally

Needs Node 20+, pnpm, Docker (for Postgres) and [Foundry](https://getfoundry.sh).

```sh
git submodule update --init --recursive   # contracts/lib: forge-std, openzeppelin-contracts
pnpm install
docker compose up -d                      # Postgres on host port 5433
export DATABASE_URL='postgresql://app:password@localhost:5433/app'
pnpm --filter web db:migrate
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
export BETTER_AUTH_URL='http://localhost:3000'
pnpm dev
```

The app reads the deployed `PaymentRouter` above through `https://arb1.arbitrum.io/rpc`. Set `PAYMENT_ROUTER_ADDRESS` or `ARBITRUM_RPC_URL` to override either, for example to point at an Anvil fork. `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is optional and adds WalletConnect.

### Tests

```sh
pnpm test                                 # web tests, needs Postgres
(cd contracts && forge build)             # writes the PaymentRouter artifact the chain tests deploy
pnpm --filter web test:chain              # forks Arbitrum with Anvil, needs Postgres
```

### Contracts

From `contracts/` (copy `.env.example` to `.env`, fill it in, then `source .env`):

```sh
forge test                                # fork tests against Arbitrum One
forge script script/Deploy.s.sol --rpc-url $ARBITRUM_RPC_URL --broadcast --verify
```

`--verify` is optional and needs an Etherscan v2 API key in `ETHERSCAN_API_KEY`.
