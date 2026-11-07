import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { OrderQrCode } from "@/components/orders/order-qr-code";

test("renders an accessible SVG with fixed black on white contrast", () => {
  const html = renderToStaticMarkup(
    createElement(OrderQrCode, {
      url: "https://merchant.example/pay/order/01900000-0000-7000-8000-000000000001",
    }),
  );

  expect(html).toContain("<svg");
  expect(html).toContain('role="img"');
  expect(html).toContain("Scan to view the requested amount");
  expect(html).toContain('fill="#ffffff"');
  expect(html).toContain('fill="#000000"');
  expect(html).toContain("bg-white");
});
