// Organization-wide date/time display (Settings → General: time zone + date format).
// Settings are loaded once after login (MainLayout) and every date shown in the dashboard goes through here.

const DEFAULTS = { timeZone: "Asia/Karachi", dateFormat: "DD/MM/YYYY" };
let current = { ...DEFAULTS };

export function setDateSettings(settings) {
  current = {
    timeZone: settings?.time_zone || DEFAULTS.timeZone,
    dateFormat: settings?.date_format || DEFAULTS.dateFormat,
  };
}

function parts(value) {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  let fmt;
  try {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: current.timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
    });
  } catch (e) {
    fmt = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  }
  const p = {};
  fmt.formatToParts(date).forEach((x) => { p[x.type] = x.value; });
  return p;
}

function datePart(p) {
  if (current.dateFormat === "MM/DD/YYYY") return `${p.month}/${p.day}/${p.year}`;
  if (current.dateFormat === "YYYY-MM-DD") return `${p.year}-${p.month}-${p.day}`;
  return `${p.day}/${p.month}/${p.year}`;
}

function timePart(p) {
  return `${p.hour}:${p.minute}:${p.second} ${String(p.dayPeriod || "").toUpperCase()}`.trim();
}

export function formatDate(value) {
  const p = parts(value);
  return p ? datePart(p) : "—";
}

export function formatTime(value) {
  const p = parts(value);
  return p ? timePart(p) : "—";
}

export function formatDateTime(value) {
  const p = parts(value);
  return p ? `${datePart(p)}, ${timePart(p)}` : "—";
}
