export const FREQUENCIES = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

const MONTHS_PER_PAYMENT = { monthly: 1, quarterly: 3, yearly: 12 };

export function nextPaymentDate(date, frequency, dayOfMonth) {
  const next = new Date(date + "T00:00:00Z");
  if (frequency === "weekly") {
    next.setUTCDate(next.getUTCDate() + 7);
  } else {
    next.setUTCDate(1);
    next.setUTCMonth(next.getUTCMonth() + MONTHS_PER_PAYMENT[frequency]);
    const lastDay = new Date(
      Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
    ).getUTCDate();
    next.setUTCDate(Math.min(dayOfMonth, lastDay));
  }
  return next.toISOString().slice(0, 10);
}

export function formatPaymentDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}
