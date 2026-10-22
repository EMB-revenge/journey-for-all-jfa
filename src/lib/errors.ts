/**
 * Error payloads shared between procedures and the client (SPEC 17).
 *
 * `conflict()` in `~/server/api/trpc` throws one of these on `TRPCError.cause`.
 * The tRPC error formatter copies it to `error.data.conflict`, which is the
 * only reason the payload survives the wire: tRPC drops `cause` otherwise.
 */

/**
 * A seat conflict. Either someone else took seats first, or the caller's hold
 * expired before they confirmed.
 */
export type ConflictPayload =
  { takenSeats: string[] } | { reason: "HOLD_EXPIRED" };

/**
 * Prisma's unique-constraint violation. Matched by shape so callers need no
 * import from `generated/prisma`.
 */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export function isConflictPayload(value: unknown): value is ConflictPayload {
  if (typeof value !== "object" || value === null) return false;

  if ("takenSeats" in value) {
    return (
      Array.isArray(value.takenSeats) &&
      value.takenSeats.every((seatId) => typeof seatId === "string")
    );
  }

  return "reason" in value && value.reason === "HOLD_EXPIRED";
}
