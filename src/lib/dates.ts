/**
 * Date helpers shared by tRPC routers and client-side Zod refinements, so this
 * module must not import `server-only`.
 */

/** Current PH calendar day (YYYY-MM-DD), independent of the host timezone. */
export function todayInManila(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const part = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

/**
 * Schedule times are PH wall clock (UTC+08:00, no DST): travelDate stores the
 * calendar day as UTC midnight and departureTime the time-of-day, so combine
 * the two into a single +08:00 instant before comparing to now.
 */
export function isDeparted(travelDate: Date, departureTime: Date): boolean {
  const day = travelDate.toISOString().slice(0, 10);
  const time = departureTime.toISOString().slice(11, 19);
  return Date.parse(`${day}T${time}+08:00`) <= Date.now();
}
