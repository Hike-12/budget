const indiaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function calendarToday(now = new Date()) {
  return indiaDate.format(now);
}

export function validCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function nextDay(date) {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 1);
  return day.toISOString().slice(0, 10);
}

export function nextScheduledDate(date, weekdays) {
  for (
    let result = date, offset = 0;
    offset < 7;
    result = nextDay(result), offset++
  ) {
    if (weekdays.includes(new Date(`${result}T00:00:00Z`).getUTCDay()))
      return result;
  }
  throw new Error("A schedule needs at least one weekday");
}

export function scheduleStart(startDate, today, lastDate, weekdays) {
  return nextScheduledDate(
    [startDate, today, lastDate ? nextDay(lastDate) : ""].sort().at(-1),
    weekdays,
  );
}
