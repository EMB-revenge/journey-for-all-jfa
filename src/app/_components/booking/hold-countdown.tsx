"use client";

import { useEffect, useRef, useState } from "react";

function clock(remainingMs: number) {
  const total = Math.ceil(Math.max(0, remainingMs) / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Counts down from the server's `expiresAt` (SPEC 12), never from a fresh
 * local five minutes. The booking summary reuses this.
 */
export function HoldCountdown({
  expiresAt,
  onExpire,
}: {
  expiresAt: Date;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, expiresAt.getTime() - Date.now()),
  );
  const onExpireRef = useRef(onExpire);
  const fired = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    fired.current = false;

    function tick() {
      const left = Math.max(0, expiresAt.getTime() - Date.now());
      setRemaining(left);

      if (left === 0 && !fired.current) {
        fired.current = true;
        onExpireRef.current();
      }
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <p
      role="timer"
      aria-live="polite"
      className="text-sm font-medium text-neutral-700"
    >
      Seats held for{" "}
      <span className="font-mono text-base font-bold text-neutral-900 tabular-nums">
        {clock(remaining)}
      </span>
    </p>
  );
}
