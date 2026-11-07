"use client";

import { QRCodeSVG } from "qrcode.react";

export function OrderQrCode({ url }: { url: string }) {
  // Fixed black on white preserves QR contrast in both themes, outside the design tokens.
  return (
    <div className="w-fit max-w-full rounded-lg bg-white p-4 text-black">
      <QRCodeSVG
        value={url}
        size={256}
        marginSize={4}
        bgColor="#ffffff"
        fgColor="#000000"
        title="Scan to view the requested amount"
        role="img"
        className="h-auto max-w-full"
      />
    </div>
  );
}
