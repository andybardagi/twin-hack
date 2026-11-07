import { erc20Abi, maxUint256, parseEther, parseUnits } from "viem";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { approveTwin, twinApprovalStatus } from "../src/approval";
import { tokens } from "../src/tokens";
import { customer, startArbitrumFork, type ArbitrumFork } from "./arbitrum-fork";

const MAX_PAY_AMOUNT = parseUnits("100", tokens.BRAt.decimals);

describe("Twin approval on an Arbitrum fork", () => {
  let fork: ArbitrumFork;

  beforeAll(async () => {
    fork = await startArbitrumFork();
  });

  afterAll(() => {
    fork?.stop();
  });

  const status = () =>
    twinApprovalStatus(fork.publicClient, {
      payer: customer.address,
      token: tokens.BRAt,
      router: fork.router,
      maxPayAmount: MAX_PAY_AMOUNT,
    });

  it("needs approval with a positive gas cost when unapproved and funded", async () => {
    const result = await status();
    expect(result.kind).toBe("needs-approval");
    if (result.kind !== "needs-approval") return;
    expect(result.gasCost).toBeGreaterThan(0n);
    expect(result.gasCost).toBeLessThan(parseEther("1"));
  });

  it("reports insufficient ETH when the payer cannot afford the approve", async () => {
    await fork.testClient.setBalance({ address: customer.address, value: 0n });
    const result = await status();
    await fork.testClient.setBalance({ address: customer.address, value: parseEther("1") });
    expect(result).toMatchObject({ kind: "insufficient-eth", ethBalance: 0n });
    if (result.kind !== "insufficient-eth") return;
    expect(result.gasCost).toBeGreaterThan(0n);
  });

  it("approveTwin grants an unlimited allowance, after which the payer is approved", async () => {
    await approveTwin(fork.walletFor(customer), fork.publicClient, {
      token: tokens.BRAt,
      router: fork.router,
    });
    const allowance = await fork.publicClient.readContract({
      address: tokens.BRAt.address,
      abi: erc20Abi,
      functionName: "allowance",
      args: [customer.address, fork.router],
    });
    expect(allowance).toBe(maxUint256);
    expect(await status()).toEqual({ kind: "approved" });
  });
});
