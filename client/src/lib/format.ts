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
