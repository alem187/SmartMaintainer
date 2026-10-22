import type { Ticket } from "./types";

export type ReportTicket = Pick<
  Ticket,
  | "_id"
  | "createdAt"
  | "description"
  | "location"
  | "category"
  | "urgency"
  | "status"
  | "aiSummary"
>;
export type ReportPeriod = "7" | "30" | "all";
export const REPORT_TIME_ZONE = "Europe/Berlin";

// Compare calendar dates in the property's time zone, independent of the browser
// and daylight saving time. Never subtract 24h to advance a local calendar day.
export function dayKey(timestamp: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(timestamp);
}

function shiftDay(key: string, offset: number): string {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function filterTickets(
  tickets: readonly ReportTicket[],
  period: ReportPeriod,
  search: string,
  now: number,
): ReportTicket[] {
  const today = dayKey(now);
  const start =
    period === "all" ? "0000-01-01" : shiftDay(today, 1 - Number(period));
  const query = search.trim().toLocaleLowerCase("de-DE");
  return tickets
    .filter((ticket) => {
      if (!Number.isFinite(ticket.createdAt) || ticket.createdAt > now)
        return false;
      if (dayKey(ticket.createdAt) < start) return false;
      return (
        !query ||
        [
          ticket.description,
          ticket.aiSummary,
          ticket.location,
          ticket.category,
          ticket._id,
        ].some((value) => value?.toLocaleLowerCase("de-DE").includes(query))
      );
    })
    .sort((a, b) => b.createdAt - a.createdAt || a._id.localeCompare(b._id));
}

export function summarizeTickets(
  tickets: readonly ReportTicket[],
  now: number,
) {
  const today = dayKey(now);
  const days = Array.from({ length: 7 }, (_, index) => {
    const key = shiftDay(today, index - 6);
    return {
      key,
      date: new Intl.DateTimeFormat("de-DE", {
        timeZone: "UTC",
        weekday: "short",
        day: "numeric",
      }).format(new Date(`${key}T12:00:00Z`)),
      count: 0,
    };
  });
  const categories = new Map<string, number>();
  const urgency = new Map<string, number>([
    ["Hoch", 0],
    ["Mittel", 0],
    ["Niedrig", 0],
    ["Ausstehend", 0],
  ]);
  let resolved = 0;
  let urgentOpen = 0;
  for (const ticket of tickets) {
    const category = ticket.category || "Ausstehend";
    categories.set(category, (categories.get(category) || 0) + 1);
    const level = ticket.urgency || "Ausstehend";
    urgency.set(level, (urgency.get(level) || 0) + 1);
    if (ticket.status === "erledigt") resolved++;
    if (ticket.urgency === "Hoch" && ticket.status !== "erledigt") urgentOpen++;
    const day = days.find((day) => day.key === dayKey(ticket.createdAt));
    if (day && ticket.createdAt <= now) day.count++;
  }
  return {
    total: tickets.length,
    resolved,
    urgentOpen,
    resolvedPercent: tickets.length
      ? Math.round((resolved / tickets.length) * 100)
      : 0,
    weeklyAverage: days.reduce((sum, day) => sum + day.count, 0) / 7,
    days,
    categories: [...categories]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "de")),
    urgency: [...urgency].map(([name, value]) => ({ name, value })),
  };
}

// Quoting protects CSV structure; the prefix separately neutralizes spreadsheet
// formulas, including inputs hidden behind whitespace/control characters.
export function csvCell(value: string): string {
  const safe =
    /^[\s\u0000-\u001f]*[=+@-]/u.test(value) || /^[\t\r\n]/u.test(value)
      ? `'${value}`
      : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function ticketsToCsv(tickets: readonly ReportTicket[]): string {
  const header = [
    "ID",
    "Erstellt (Europe/Berlin)",
    "Ort",
    "Beschreibung",
    "Kategorie",
    "Dringlichkeit",
    "Status",
    "KI-Zusammenfassung",
  ];
  const rows = tickets.map((ticket) => [
    ticket._id,
    new Intl.DateTimeFormat("de-DE", {
      timeZone: REPORT_TIME_ZONE,
      dateStyle: "short",
      timeStyle: "short",
    }).format(ticket.createdAt),
    ticket.location || "",
    ticket.description,
    ticket.category || "",
    ticket.urgency || "",
    ticket.status,
    ticket.aiSummary || "",
  ]);
  return (
    "\uFEFF" +
    [header, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n")
  );
}
