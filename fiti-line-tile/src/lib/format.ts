const TAIPEI = "Asia/Taipei";

function parts(iso: string | Date, withTime: boolean): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const bag = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TAIPEI,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: withTime ? "2-digit" : undefined,
      minute: withTime ? "2-digit" : undefined,
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  const day = `${bag.year}/${bag.month}/${bag.day}`;
  return withTime ? `${day} ${bag.hour}:${bag.minute}` : day;
}

export function formatTaipei(iso: string | Date): string {
  return parts(iso, true);
}

export function formatTaipeiDate(iso: string | Date): string {
  return parts(iso, false);
}

export function formatTwd(amount: number): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function minutesFromSeconds(seconds: number): string {
  if (!seconds) return "—";
  return `${(seconds / 60).toFixed(1)} 分`;
}
