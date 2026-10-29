const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

export function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export const fileSafe = (s: string) => s.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "") || "qr-code";

/** A rough "device" label from a user agent string. */
export function deviceFromUserAgent(ua: string): string {
  if (!ua) return "Unknown";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Macintosh|Mac OS X/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  if (/bot|crawl|spider|curl|wget/i.test(ua)) return "Bot / script";
  return "Other";
}
