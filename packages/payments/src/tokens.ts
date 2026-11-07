import type { Address } from "viem";

type Token =
  | { kind: "usdt0"; address: Address; decimals: 6 }
  | { kind: "twin"; address: Address; decimals: 18; pool: Address };

/** Arbitrum One tokens the PaymentRouter settles. Twin pools are Curve Twocrypto with coins (Twin, USDT0). */
export const tokens = {
  USDT0: { kind: "usdt0", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6 },
  ARGt: {
    kind: "twin",
    address: "0x59863989d080B22476DB95656d0C3CC18be92214",
    decimals: 18,
    pool: "0x356D349dA9ADd7Efb56a35fAB939A2c6D852f853",
  },
  BRAt: {
    kind: "twin",
    address: "0xC4ed6Aba5373D78E160F4df39e011F078Be54df8",
    decimals: 18,
    pool: "0xEef48Df5F1c509cD9730774b4e8A4464626ef8D5",
  },
  COLt: {
    kind: "twin",
    address: "0xa16d5DB80A45157E0e451750B81FF0CC0b61d558",
    decimals: 18,
    pool: "0x7D2dFfa9e903b8377c96196dA424C7965b06BCc3",
  },
  PERt: {
    kind: "twin",
    address: "0x899438713f62B04d6CD8e8709986F7256fB6E3d9",
    decimals: 18,
    pool: "0x41af8cc0811dd07f167752b821cf5b11dba7ca85",
  },
  MEXt: {
    kind: "twin",
    address: "0xb96aA6babCcD738d6644ADd4912fE5eFbEBF5a25",
    decimals: 18,
    pool: "0x6edbf3ada7b6d9524c3248955538d573aae449cf",
  },
  CHLt: {
    kind: "twin",
    address: "0xe8dbC4680235cCAeFf48e4C0B0EaceeBb89E5e17",
    decimals: 18,
    pool: "0xa087f05ecd245476d7844f6eab28d98724696ac2",
  },
  BOLt: {
    kind: "twin",
    address: "0x1edF5E61B6a4Fe19FEf3A695328F61aAa07728eA",
    decimals: 18,
    pool: "0x9c7809c813bcc67e288c56d5ce5e0225996bfcd2",
  },
} as const satisfies Record<string, Token>;

export type TokenSymbol = keyof typeof tokens;

export function isTokenSymbol(value: string): value is TokenSymbol {
  return Object.hasOwn(tokens, value);
}
