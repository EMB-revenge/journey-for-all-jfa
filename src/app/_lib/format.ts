export function formatTime(date: Date) {
  return date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

export function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatLongDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Bookings are stamped in PH time, the same wall clock passengers read. */
export function formatBookedAt(date: Date) {
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  });
}
