"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatUnits, type Address } from "viem";
import { arbitrum } from "viem/chains";
import { useConfig, useConnectors, WagmiProvider, type Connector } from "wagmi";

import { assertNever } from "@workspace/payments/assert-never";
import { tokens as paymentTokens, type TokenSymbol } from "@workspace/payments/tokens";
import { Button } from "@workspace/ui/components/button";
import { Field, FieldDescription } from "@workspace/ui/components/field";

import {
  payOrder,
  payOrderErrorMessage,
  paymentTokenSymbol,
  payTokenLabel,
  quotePayment,
  type PayStep,
} from "@/components/orders/pay-order";
import { TokenPicker } from "@/components/tokens/token-picker";
import type { PaymentTerms } from "@/lib/orders/pay-order";
import { wagmiConfig } from "@/lib/wagmi";
import { tokens } from "@/src/helpers/tokens";

const QUOTE_REFRESH_MS = 15_000;

const payTokens = tokens.filter((token) => token.config.canPay);
const payTokenSymbols = payTokens
  .map((token) => paymentTokenSymbol(token.address))
  .filter((symbol) => symbol !== undefined);

function stepMessage(step: PayStep, payToken: TokenSymbol): string {
  switch (step) {
    case "connect":
      return "Connect your wallet and switch to Arbitrum if asked…";
    case "quote":
      return "Getting a fresh quote…";
    case "permit":
      return "Sign the USDT spending permit in your wallet. It costs no gas.";
    case "approve":
      return `Approve ${payToken} in your wallet. This one-time transaction uses a little ETH for gas. Waiting for confirmation…`;
    case "sign":
      return "Sign the payment in your wallet. It costs no gas.";
    case "send":
      return "Sending your payment. This takes a few seconds…";
    default:
      return assertNever(step);
  }
}

function PayOrderFields({
  orderId,
  payer,
  terms,
}: {
  orderId: string;
  payer: Address;
  terms: PaymentTerms;
}) {
  const config = useConfig();
  const router = useRouter();
  const availableConnectors = useConnectors();
  const [hydrated, setHydrated] = useState(false);
  // The server has no WalletConnect connector, so match its empty list until hydrated.
  const connectors = hydrated ? availableConnectors : [];
  useEffect(() => setHydrated(true), []);

  const receiveSymbol = paymentTokenSymbol(terms.receiveToken);
  const [payToken, setPayToken] = useState<TokenSymbol>(
    receiveSymbol && payTokenSymbols.includes(receiveSymbol)
      ? receiveSymbol
      : (payTokenSymbols[0] ?? "USDT0"),
  );
  const [step, setStep] = useState<PayStep>("connect");

  const quoted = useQuery({
    queryKey: ["pay-quote", orderId, payToken],
    queryFn: () => quotePayment(config, { payToken, terms }),
    refetchInterval: QUOTE_REFRESH_MS,
  });
  const payment = useMutation({
    mutationFn: (connector: Connector) =>
      payOrder(config, connector, { orderId, payer, payToken, terms }, setStep),
    retry: false,
    onSuccess: () => router.refresh(),
  });
  const busy = payment.isPending || payment.isSuccess;
  const decimals = paymentTokens[payToken].decimals;

  return (
    <div className="space-y-4" aria-busy={payment.isPending}>
      <Field>
        <span className="text-sm font-medium">Pay with</span>
        <TokenPicker
          variant="field"
          title="Pay with"
          description="Choose the stablecoin you want to pay from. The merchant still receives their token."
          tokens={payTokens}
          value={payTokens.find((token) => paymentTokenSymbol(token.address) === payToken)}
          disabled={busy}
          onChange={(token) => {
            const symbol = paymentTokenSymbol(token.address);
            if (symbol) setPayToken(symbol);
          }}
        />
        <FieldDescription id="pay-token-quote" aria-live="polite">
          {quoted.isPending && "Getting a quote…"}
          {quoted.isError && "Couldn’t get a quote right now. It will retry shortly."}
          {quoted.isSuccess &&
            `You pay about ${formatUnits(quoted.data.payAmount, decimals)} ${payTokenLabel(payToken)} (at most ${formatUnits(quoted.data.maxPayAmount, decimals)}). No gas needed.`}
        </FieldDescription>
      </Field>

      {hydrated && connectors.length === 0 && (
        <p role="alert" className="text-sm">
          No wallet found. Open this page in your wallet’s browser, or enable a browser wallet and
          reload.
        </p>
      )}
      <div className="flex flex-col gap-2">
        {connectors.map((connector) => (
          <Button
            key={connector.uid}
            size="lg"
            disabled={busy || !quoted.isSuccess}
            onClick={() => payment.mutate(connector)}
          >
            {payment.isPending && payment.variables?.uid === connector.uid
              ? "Paying…"
              : `Pay with ${connector.name}`}
          </Button>
        ))}
      </div>

      <div role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {payment.isPending && <p>{stepMessage(step, payToken)}</p>}
        {payment.isSuccess && (
          <p className="text-foreground">
            Payment sent.{" "}
            <a
              className="underline underline-offset-4"
              href={`${arbitrum.blockExplorers.default.url}/tx/${payment.data}`}
              target="_blank"
              rel="noreferrer"
            >
              View transaction
            </a>
          </p>
        )}
      </div>
      {payment.isError && (
        <p role="alert" className="text-sm text-destructive">
          {payOrderErrorMessage(payment.error)}
        </p>
      )}
    </div>
  );
}

export function PayOrderForm(props: { orderId: string; payer: Address; terms: PaymentTerms }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <PayOrderFields {...props} />
    </WagmiProvider>
  );
}
