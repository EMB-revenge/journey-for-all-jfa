import { z } from "zod";

/**
 * URL contract for the seat map and the passengers page. The URL is the only
 * state source after a reload, so it carries the trip and enough search
 * context to get back to the same results.
 */
export const seatMapParamsSchema = z.object({
  scheduleId: z.string().min(1),
  passengers: z.coerce.number().int().min(1).max(6).default(1),
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type SeatMapParams = z.infer<typeof seatMapParamsSchema>;

export function seatMapHref(
  params: SeatMapParams,
  path = "/booking/seat-map",
): string {
  const query = new URLSearchParams({
    scheduleId: params.scheduleId,
    passengers: String(params.passengers),
  });
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.date) query.set("date", params.date);
  return `${path}?${query.toString()}`;
}

/** The original results page, or the search form when context is missing. */
export function searchHref(params: Partial<SeatMapParams>): string {
  if (!params.from || !params.to || !params.date) return "/";

  const query = new URLSearchParams({
    from: params.from,
    to: params.to,
    date: params.date,
    passengers: String(params.passengers ?? 1),
  });
  return `/search?${query.toString()}`;
}
