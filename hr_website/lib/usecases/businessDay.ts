const BUSINESS_TIME_ZONE = "Asia/Bangkok";

export function getBusinessDayRange(now: Date): { start: Date; end: Date } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, Number(value)]),
  ) as Record<"year" | "month" | "day", number>;

  // Asia/Bangkok is UTC+7 and does not observe daylight saving time.
  const start = new Date(
    Date.UTC(values.year, values.month - 1, values.day, -7),
  );
  const end = new Date(
    Date.UTC(values.year, values.month - 1, values.day + 1, -7),
  );

  return { start, end };
}
