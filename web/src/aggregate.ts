export type Granularity = "minute" | "hour" | "day" | "week" | "month";

export const GRANULARITIES: { key: Granularity; label: string; approxMs: number }[] = [
  { key: "minute", label: "Minute", approxMs: 60_000 },
  { key: "hour", label: "Hour", approxMs: 3_600_000 },
  { key: "day", label: "Day", approxMs: 86_400_000 },
  { key: "week", label: "Week", approxMs: 7 * 86_400_000 },
  { key: "month", label: "Month", approxMs: 30 * 86_400_000 },
];

/** Upper bound on bars in a chart; finer granularities are disabled past this. */
export const MAX_BUCKETS = 1500;

export const bucketCount = (from: Date, to: Date, g: Granularity) =>
  Math.ceil((to.getTime() - from.getTime()) / GRANULARITIES.find((x) => x.key === g)!.approxMs);

/** Floors a date to the start of its bucket, in the viewer's local time zone. */
export function floorTo(date: Date, g: Granularity): Date {
  const d = new Date(date);
  switch (g) {
    case "minute":
      d.setSeconds(0, 0);
      break;
    case "hour":
      d.setMinutes(0, 0, 0);
      break;
    case "day":
      d.setHours(0, 0, 0, 0);
      break;
    case "week": // weeks start on Monday
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      break;
    case "month":
      d.setHours(0, 0, 0, 0);
      d.setDate(1);
      break;
  }
  return d;
}

function next(date: Date, g: Granularity): Date {
  const d = new Date(date);
  switch (g) {
    case "minute":
      d.setMinutes(d.getMinutes() + 1);
      break;
    case "hour":
      d.setHours(d.getHours() + 1);
      break;
    case "day":
      d.setDate(d.getDate() + 1);
      break;
    case "week":
      d.setDate(d.getDate() + 7);
      break;
    case "month":
      d.setMonth(d.getMonth() + 1);
      break;
  }
  return d;
}

export interface Bucket {
  start: Date;
  count: number;
}

/** Counts visits per bucket across [from, to], including empty buckets. */
export function bucketize(timestamps: string[], from: Date, to: Date, g: Granularity): Bucket[] {
  const counts = new Map<number, number>();
  for (const t of timestamps) {
    const key = floorTo(new Date(t), g).getTime();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const buckets: Bucket[] = [];
  for (let d = floorTo(from, g); d <= to; d = next(d, g)) {
    buckets.push({ start: d, count: counts.get(d.getTime()) ?? 0 });
  }
  return buckets;
}

export function formatBucket(date: Date, g: Granularity): string {
  switch (g) {
    case "minute":
    case "hour":
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    case "day":
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    case "week":
      return `Week of ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    case "month":
      return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  }
}

/** Visits grouped by local hour of day (0–23). */
export function byHourOfDay(timestamps: string[]): number[] {
  const counts = new Array(24).fill(0);
  for (const t of timestamps) counts[new Date(t).getHours()]++;
  return counts;
}

/** Visits grouped by day of week, Monday first. */
export function byDayOfWeek(timestamps: string[]): number[] {
  const counts = new Array(7).fill(0);
  for (const t of timestamps) counts[(new Date(t).getDay() + 6) % 7]++;
  return counts;
}
