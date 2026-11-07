import { parseAbi, type Address, type PublicClient } from "viem";

import { assertNever } from "./assert-never";
import { tokens, type TokenSymbol } from "./tokens";

export type Route =
  | { kind: "direct" }
  | { kind: "single"; pool: Address; fromCoin: bigint; toCoin: bigint }
  | { kind: "double"; payPool: Address; receivePool: Address };

export type Quote = { payAmount: bigint; maxPayAmount: bigint; route: Route };

const curveTwocryptoAbi = parseAbi([
  "function get_dx(uint256 i, uint256 j, uint256 dy) view returns (uint256)",
]);

const BPS_DENOMINATOR = 10_000n;
// Mirrors PaymentRouter.GET_DX_BUFFER_BPS so the quote equals what the router pulls.
const GET_DX_BUFFER_BPS = 2n;
const MAX_PAY_SLIPPAGE_BPS = 50n;
const TWIN_COIN = 0n;
const USDT0_COIN = 1n;

function routeFor(payToken: TokenSymbol, receiveToken: TokenSymbol): Route {
  const pay = tokens[payToken];
  const receive = tokens[receiveToken];
  switch (pay.kind) {
    case "usdt0":
      switch (receive.kind) {
        case "usdt0":
          return { kind: "direct" };
        case "twin":
          return { kind: "single", pool: receive.pool, fromCoin: USDT0_COIN, toCoin: TWIN_COIN };
        default:
          return assertNever(receive);
      }
    case "twin":
      switch (receive.kind) {
        case "usdt0":
          return { kind: "single", pool: pay.pool, fromCoin: TWIN_COIN, toCoin: USDT0_COIN };
        case "twin":
          return pay.address === receive.address
            ? { kind: "direct" }
            : { kind: "double", payPool: pay.pool, receivePool: receive.pool };
        default:
          return assertNever(receive);
      }
    default:
      return assertNever(pay);
  }
}

/** Quotes the exact pay amount the router will pull at the current block, plus 0.5% slippage headroom. */
export async function quote(
  publicClient: PublicClient,
  {
    payToken,
    receiveToken,
    receiveAmount,
  }: { payToken: TokenSymbol; receiveToken: TokenSymbol; receiveAmount: bigint },
): Promise<Quote> {
  const getDx = async (pool: Address, fromCoin: bigint, toCoin: bigint, dy: bigint) => {
    const dx = await publicClient.readContract({
      address: pool,
      abi: curveTwocryptoAbi,
      functionName: "get_dx",
      args: [fromCoin, toCoin, dy],
    });
    return (dx * (BPS_DENOMINATOR + GET_DX_BUFFER_BPS)) / BPS_DENOMINATOR;
  };

  const route = routeFor(payToken, receiveToken);
  let payAmount: bigint;
  switch (route.kind) {
    case "direct":
      payAmount = receiveAmount;
      break;
    case "single":
      payAmount = await getDx(route.pool, route.fromCoin, route.toCoin, receiveAmount);
      break;
    case "double": {
      const usdt0Needed = await getDx(route.receivePool, USDT0_COIN, TWIN_COIN, receiveAmount);
      payAmount = await getDx(route.payPool, TWIN_COIN, USDT0_COIN, usdt0Needed);
      break;
    }
    default:
      assertNever(route);
  }
  return {
    payAmount,
    maxPayAmount: (payAmount * (BPS_DENOMINATOR + MAX_PAY_SLIPPAGE_BPS)) / BPS_DENOMINATOR,
    route,
  };
}
