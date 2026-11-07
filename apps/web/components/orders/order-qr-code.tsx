"use client";

import { QRCodeSVG } from "qrcode.react";

export function OrderQrCode({ url }: { url: string }) {
  // Fixed black on white preserves QR contrast in both themes, outside the design tokens.
  return (
    <div className="w-fit max-w-full rounded-3xl border border-border bg-white p-3.5 text-black">
      <QRCodeSVG
        value={url}
        size={208}
        marginSize={2}
        bgColor="#ffffff"
        fgColor="#000000"
        title="Scan to view the requested amount"
        role="img"
        className="h-auto max-w-full"
      />
    </div>
  );
}
