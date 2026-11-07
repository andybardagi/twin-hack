import { parseArgs } from "node:util";
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  formatUnits,
  http,
  isAddressEqual,
  isHex,
  parseUnits,
  size,
  toHex,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";

import { paymentRouterAbi } from "../src/abi";
import { approveTwin, twinApprovalStatus } from "../src/approval";
import { assertNever } from "../src/assert-never";
import { paymentRouterAddress as router } from "../src/deployment";
import { submitPayment } from "../src/pay";
import { quote } from "../src/quote";
import { isTokenSymbol, tokens, type TokenSymbol } from "../src/tokens";
import { hashOrder, noPermit, signIntent, signOrder, signUsdt0Permit } from "../src/typed-data";

const ORDER_TTL_SECONDS = 600n;
const USAGE =
  "Usage: pnpm demo:pay --pay <token> --receive <token> --amount <receive amount, e.g. 15000>";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name}`);
  return value;
}

function privateKeyEnv(name: string) {
  const value = requireEnv(name);
  if (!isHex(value) || size(value) !== 32)
    throw new Error(`${name} must be a 0x-prefixed 32-byte hex private key`);
  return privateKeyToAccount(value);
}

function tokenArg(name: string, value: string | undefined): TokenSymbol {
  if (value === undefined || !isTokenSymbol(value)) {
    throw new Error(`--${name} must be one of ${Object.keys(tokens).join(", ")}\n${USAGE}`);
  }
  return value;
}

const { values } = parseArgs({
  options: { pay: { type: "string" }, receive: { type: "string" }, amount: { type: "string" } },
});
const payToken = tokenArg("pay", values.pay);
const receiveToken = tokenArg("receive", values.receive);
if (values.amount === undefined || !/^\d+(\.\d+)?$/.test(values.amount)) {
  throw new Error(`--amount must be a positive decimal number\n${USAGE}`);
}
const receiveAmount = parseUnits(values.amount, tokens[receiveToken].decimals);
if (receiveAmount === 0n) throw new Error("--amount must be greater than zero");

const transport = http(process.env.ARBITRUM_RPC_URL ?? "https://arb1.arbitrum.io/rpc");
const publicClient = createPublicClient({ chain: arbitrum, transport });
const walletFor = (envName: string) =>
  createWalletClient({ account: privateKeyEnv(envName), chain: arbitrum, transport });
const relayer = walletFor("RELAYER_PRIVATE_KEY");
const merchant = walletFor("MERCHANT_PRIVATE_KEY");
const merchantSigner = walletFor("MERCHANT_SIGNER_PRIVATE_KEY");
const customer = walletFor("CUSTOMER_PRIVATE_KEY");
const domain = { chainId: await publicClient.getChainId(), router };

async function confirm(hash: Hex, label: string) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`${label} tx ${hash} reverted`);
}

const registeredKey = await publicClient.readContract({
  address: router,
  abi: paymentRouterAbi,
  functionName: "signingKeyOf",
  args: [merchant.account.address],
});
if (!isAddressEqual(registeredKey, merchantSigner.account.address)) {
  const hash = await merchant.writeContract({
    address: router,
    abi: paymentRouterAbi,
    functionName: "setSigningKey",
    args: [merchantSigner.account.address],
  });
  await confirm(hash, "setSigningKey");
}

const quoted = await quote(publicClient, { payToken, receiveToken, receiveAmount });
const { timestamp } = await publicClient.getBlock();
const deadline = timestamp + ORDER_TTL_SECONDS;

async function authorizePayment() {
  const pay = tokens[payToken];
  switch (pay.kind) {
    case "usdt0":
      return signUsdt0Permit(customer, publicClient, {
        ...domain,
        value: quoted.maxPayAmount,
        deadline,
      });
    case "twin": {
      const approval = await twinApprovalStatus(publicClient, {
        payer: customer.account.address,
        token: pay,
        router,
        maxPayAmount: quoted.maxPayAmount,
      });
      switch (approval.kind) {
        case "approved":
          break;
        case "needs-approval":
          await approveTwin(customer, publicClient, { token: pay, router });
          break;
        case "insufficient-eth":
          throw new Error(
            `Customer needs ~${formatEther(approval.gasCost)} ETH for the one-time ${payToken} approve but has ${formatEther(approval.ethBalance)} ETH`,
          );
        default:
          assertNever(approval);
      }
      return noPermit;
    }
    default:
      return assertNever(pay);
  }
}
const permit = await authorizePayment();

const order = {
  merchant: merchant.account.address,
  receiveToken: tokens[receiveToken].address,
  receiveAmount,
  orderId: toHex(crypto.getRandomValues(new Uint8Array(32))),
  expiry: deadline,
  feeBps: await publicClient.readContract({
    address: router,
    abi: paymentRouterAbi,
    functionName: "feeBps",
  }),
};
const intent = {
  payer: customer.account.address,
  payToken: tokens[payToken].address,
  maxPayAmount: quoted.maxPayAmount,
  orderHash: hashOrder(domain, order),
};
const { hash, settled } = await submitPayment(relayer, publicClient, {
  router,
  order,
  merchantSignature: await signOrder(merchantSigner, domain, order),
  intent,
  payerSignature: await signIntent(customer, domain, intent),
  permit,
});

const payDecimals = tokens[payToken].decimals;
const receiveDecimals = tokens[receiveToken].decimals;
console.log(
  JSON.stringify(
    {
      route: quoted.route.kind,
      quote: {
        payAmount: `${formatUnits(quoted.payAmount, payDecimals)} ${payToken}`,
        maxPayAmount: `${formatUnits(quoted.maxPayAmount, payDecimals)} ${payToken}`,
      },
      payAmount: `${formatUnits(settled.payAmount, payDecimals)} ${payToken}`,
      merchantReceived: `${formatUnits(settled.receiveAmount - settled.fee, receiveDecimals)} ${receiveToken}`,
      fee: `${formatUnits(settled.fee, receiveDecimals)} ${receiveToken}`,
      tx: `https://arbiscan.io/tx/${hash}`,
    },
    null,
    2,
  ),
);
