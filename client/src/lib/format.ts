// Money is always integer cents in the API (SRS 1.4); overage is in micros of a dollar

export const formatMoney = (cents: number, currency = "usd") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);

// 2000 micros → "$0.002"
export const formatMicros = (micros: number) =>
  `$${(micros / 1_000_000).toFixed(6).replace(/0+$/, "").replace(/\.$/, "")}`;

export const formatUnits = (units: number) => new Intl.NumberFormat("en-US").format(units);

export const formatDate = (iso: string | null | undefined) =>
  iso
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(
        new Date(iso),
      )
    : "—";

// "2026-10-03" (a UTC day from the API) → "Oct 3"
export const formatDay = (day: string, withYear = false) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear && { year: "numeric" }),
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));

export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
