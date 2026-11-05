import type { Prisma } from "../../generated/prisma";

export type ScheduleStatusFilter = "upcoming" | "past" | "cancelled" | "all";

export function scheduleStatusWhere(
  status: ScheduleStatusFilter,
  today: Date,
): Prisma.ScheduleWhereInput {
  if (status === "upcoming") {
    return { travelDate: { gte: today }, isCancelled: false };
  }
  if (status === "past") {
    return { travelDate: { lt: today }, isCancelled: false };
  }
  if (status === "cancelled") return { isCancelled: true };
  return {};
}
