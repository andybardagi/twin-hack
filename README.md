# On-chain P2P payments

QR payments on Arbitrum: a merchant signs an order, the customer pays it with any supported stablecoin, and `PaymentRouter` swaps through Curve so the merchant receives the token they asked for: the asked amount minus our 50 bps fee, deducted at settlement. Customers pay no gas; our relayer submits every payment. Full design in [project.md](./project.md).

## Chain and contracts

Chain: Arbitrum One (chain ID 42161)

PaymentRouter: [`0x4DE32c75eecDF3229114F105293698284b261Bb1`](https://arbiscan.io/address/0x4DE32c75eecDF3229114F105293698284b261Bb1)

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
