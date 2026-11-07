# On-chain P2P payments

QR payments on Arbitrum: a merchant signs an order, the customer pays it with any supported stablecoin, and `PaymentRouter` swaps through Curve so the merchant receives the token they asked for: the asked amount minus our 50 bps fee, deducted at settlement. Customers pay no gas; our relayer submits every payment. Full design in [project.md](./project.md).

## Chain and contracts

Chain: Arbitrum One (chain ID 42161)

PaymentRouter: <TBD>

Demo transactions: <TBD>

| Token | Address | Curve Twocrypto pool (Twin / USDT0) |
| ----- | ------- | ----------------------------------- |
| USDT0 | `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9` | — |
| ARGt | `0x59863989d080B22476DB95656d0C3CC18be92214` | `0x356d349da9add7efb56a35fab939a2c6d852f853` |
| BRAt | `0xC4ed6Aba5373D78E160F4df39e011F078Be54df8` | `0xeef48df5f1c509cd9730774b4e8a4464626ef8d5` |
| COLt | `0xa16d5DB80A45157E0e451750B81FF0CC0b61d558` | `0x7d2dffa9e903b8377c96196da424c7965b06bcc3` |
| PERt | `0x899438713f62B04d6CD8e8709986F7256fB6E3d9` | `0x41af8cc0811dd07f167752b821cf5b11dba7ca85` |
| MEXt | `0xb96aA6babCcD738d6644ADd4912fE5eFbEBF5a25` | `0x6edbf3ada7b6d9524c3248955538d573aae449cf` |
| CHLt | `0xe8dbC4680235cCAeFf48e4C0B0EaceeBb89E5e17` | `0xa087f05ecd245476d7844f6eab28d98724696ac2` |
| BOLt | `0x1edF5E61B6a4Fe19FEf3A695328F61aAa07728eA` | `0x9c7809c813bcc67e288c56d5ce5e0225996bfcd2` |

## Contracts

From `contracts/` (copy `.env.example` to `.env` and fill it in, then `source .env`):

```sh
forge test   # fork tests against Arbitrum One
forge script script/Deploy.s.sol --rpc-url $ARBITRUM_RPC_URL --broadcast --verify
```

`--verify` is optional and needs an Etherscan v2 API key in `ETHERSCAN_API_KEY`.

## Running the app

Needs Node 20+, pnpm, Postgres (`docker compose up -d`, host port 5433), and [Foundry](https://getfoundry.sh) for the contracts and chain tests. From the repo root:

```sh
git submodule update --init --recursive   # contracts/lib: forge-std, openzeppelin-contracts
pnpm install
export DATABASE_URL='postgresql://app:password@localhost:5433/app'
pnpm --filter web db:migrate
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
export BETTER_AUTH_URL='http://localhost:3000'
export PAYMENT_ROUTER_ADDRESS=0x...   # PaymentRouter to read; not deployed to Arbitrum yet
export ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
pnpm dev
```

`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is optional and adds WalletConnect. Without `PAYMENT_ROUTER_ADDRESS` and `ARBITRUM_RPC_URL`, the app runs but signing key, forward address, and order creation show as not available. `pnpm build` needs none of these variables.

`pnpm test` runs the web tests against Postgres. The chain tests fork Arbitrum with Anvil, deploy `PaymentRouter` from the Forge artifact, and also need Postgres:

```sh
(cd contracts && forge build)             # writes contracts/out/PaymentRouter.sol/PaymentRouter.json
pnpm --filter web test:chain              # forks ARBITRUM_RPC_URL, default https://arb1.arbitrum.io/rpc
```

Details live in [docs/conventions.md](./docs/conventions.md).
