import { getAddress, type Address } from "viem";

export type Token = {
  name: string;
  symbol: string;
  address: Address;
  decimals: number;
  fiatDecimals: number;
  config: { canPay: boolean; canCollect: boolean };
};

export const tokens: Token[] = [
  {
    name: "Tether USD",
    symbol: "USDT",
    address: getAddress("0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"),
    decimals: 6,
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
  {
    name: "Argentine peso",
    symbol: "ARGt",
    address: getAddress("0x59863989d080B22476DB95656d0C3CC18be92214"),
    decimals: 18,
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
  {
    name: "Brazilian real",
    symbol: "BRAt",
    address: getAddress("0xC4ed6Aba5373D78E160F4df39e011F078Be54df8"),
    decimals: 18,
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
  {
    name: "Colombian peso",
    symbol: "COLt",
    address: getAddress("0xa16d5DB80A45157E0e451750B81FF0CC0b61d558"),
    decimals: 18,
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
  {
    name: "Peruvian sol",
    symbol: "PERt",
    address: getAddress("0x899438713f62B04d6CD8e8709986F7256fB6E3d9"),
    decimals: 18,
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
  {
    name: "Mexican peso",
    symbol: "MEXt",
    address: getAddress("0xb96aA6babCcD738d6644ADd4912fE5eFbEBF5a25"),
    decimals: 18,
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
  {
    name: "Chilean peso",
    symbol: "CHLt",
    address: getAddress("0xe8dbC4680235cCAeFf48e4C0B0EaceeBb89E5e17"),
    decimals: 18,
    fiatDecimals: 0,
    config: { canPay: true, canCollect: true },
  },
  {
    name: "Bolivian boliviano",
    symbol: "BOLt",
    address: getAddress("0x1edF5E61B6a4Fe19FEf3A695328F61aAa07728eA"),
    decimals: 18,
    fiatDecimals: 2,
    config: { canPay: true, canCollect: true },
  },
];
