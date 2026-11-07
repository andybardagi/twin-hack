import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { OrderAmount } from "@/components/orders/order-amount";
import { formatOrderDisplay } from "@/src/helpers/order-display";
import { tokens } from "@/src/helpers/tokens";

test("the public order display contains only the amount and token", () => {
  const token = tokens.find((token) => token.symbol === "USDT");
  if (!token) throw new Error("Missing USDT token");
  const display = formatOrderDisplay("123450000", token.address);
  expect(Object.keys(display).sort()).toEqual(["amount", "token"]);

  const html = renderToStaticMarkup(createElement(OrderAmount, display));
  expect(html).toContain("123.45");
  expect(html).toContain("USDT");
  expect(html).not.toMatch(/merchant|wallet|button|href|form/i);
});
