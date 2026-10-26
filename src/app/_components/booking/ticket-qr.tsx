"use client";

import { QRCodeSVG } from "qrcode.react";

export function TicketQr({ value }: { value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <QRCodeSVG value={value} size={160} level="M" />
    </div>
  );
}