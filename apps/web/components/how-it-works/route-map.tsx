import { Fragment } from "react";

import { ArrowIcon } from "@/components/how-it-works/icons";
import { TokenChip, TokenText } from "@/components/how-it-works/token-chip";
import { tokens } from "@/src/helpers/tokens";
import type { Copy } from "@/components/how-it-works/copy";

const twinTokens = ["ARGt", "BRAt", "COLt", "PERt", "MEXt", "CHLt", "BOLt"];

function tokenIcon(symbol: string) {
  const token = tokens.find((candidate) => candidate.symbol === symbol);
  if (!token) throw new Error(`Unknown token: ${symbol}`);
  return token.icon;
}
const mapCenter = 160;
const mapRadius = 122;

function TokenHub({ label }: { label: string }) {
  const spokes = twinTokens.map((symbol, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / twinTokens.length;
    return {
      symbol,
      x: (mapCenter + mapRadius * Math.cos(angle)).toFixed(2),
      y: (mapCenter + mapRadius * Math.sin(angle)).toFixed(2),
    };
  });

  return (
    <svg role="img" aria-label={label} viewBox="0 0 320 320" className="mx-auto w-full max-w-80">
      {spokes.map(({ symbol, x, y }) => (
        <line
          key={symbol}
          x1={mapCenter}
          y1={mapCenter}
          x2={x}
          y2={y}
          className="stroke-muted-foreground/50"
          strokeWidth="1.5"
        />
      ))}
      {spokes.map(({ symbol, x, y }) => (
        <g key={symbol}>
          <circle cx={x} cy={y} r="30" className="fill-card stroke-border" strokeWidth="1.5" />
          <image
            href={tokenIcon(symbol)}
            x={Number(x) - 10}
            y={Number(y) - 20}
            width="20"
            height="20"
          />
          <text
            x={x}
            y={Number(y) + 11}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-foreground font-mono text-[0.65rem] font-medium"
          >
            {symbol}
          </text>
        </g>
      ))}
      <circle cx={mapCenter} cy={mapCenter} r="40" className="fill-primary" />
      <image
        href={tokenIcon("USDT")}
        x={mapCenter - 14}
        y={mapCenter - 26}
        width="28"
        height="28"
      />
      <text
        x={mapCenter}
        y={mapCenter + 14}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-primary-foreground font-mono text-sm font-semibold"
      >
        USDT
      </text>
    </svg>
  );
}

function RouteCard({
  title,
  body,
  tokens,
  edge,
}: {
  title: string;
  body: string;
  tokens: string[];
  edge: string;
}) {
  return (
    <li className="space-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground">
      <div className="flex items-center gap-1" aria-hidden>
        {tokens.map((symbol, index) => (
          <Fragment key={`${symbol}-${index}`}>
            {index > 0 && (
              <span className="flex flex-1 flex-col items-center text-muted-foreground">
                <ArrowIcon className="size-4" />
                <span className="text-[0.7rem]">{edge}</span>
              </span>
            )}
            <TokenChip symbol={symbol} />
          </Fragment>
        ))}
      </div>
      <div>
        <h3 className="font-medium">
          <TokenText>{title}</TokenText>
        </h3>
        <p className="text-sm text-muted-foreground">
          <TokenText>{body}</TokenText>
        </p>
      </div>
    </li>
  );
}

function RouteMap({ text }: { text: Copy["routing"] }) {
  return (
    <div className="grid items-center gap-8 md:grid-cols-2">
      <TokenHub label={text.mapLabel} />
      <ul className="flex flex-col gap-4">
        <RouteCard {...text.same} tokens={["ARGt", "ARGt"]} edge={text.transfer} />
        <RouteCard {...text.one} tokens={["USDT", "BRAt"]} edge={text.swap} />
        <RouteCard {...text.two} tokens={["BRAt", "USDT", "ARGt"]} edge={text.swap} />
      </ul>
    </div>
  );
}

export { RouteMap };
