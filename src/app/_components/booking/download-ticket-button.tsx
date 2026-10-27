"use client";

import { toPng } from "html-to-image";
import { useState } from "react";

/**
 * Saves the element with the given id as a PNG. The ticket card on the page
 * is the target, so the image matches what the passenger sees.
 */
export function DownloadTicketButton({
  targetId,
  fileName,
}: {
  targetId: string;
  fileName: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    const element = document.getElementById(targetId);
    if (!element) return;

    setBusy(true);
    setError(null);

    try {
      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setError("Could not create the image. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className="rounded-xl bg-charcoal px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Preparing image..." : "Download ticket"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}