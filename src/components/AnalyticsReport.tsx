"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpRight,
  Activity,
  CheckCheck,
  Clock3,
  Search,
  SlidersHorizontal,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  filterTickets,
  summarizeTickets,
  ticketsToCsv,
  REPORT_TIME_ZONE,
  type ReportPeriod,
  type ReportTicket,
} from "@/lib/analytics";

const colors = [
  "#2563eb",
  "#14b8a6",
  "#a78bfa",
  "#f59e0b",
  "#f472b6",
  "#64748b",
];
const statusLabels = {
  neu: "Neu",
  in_bearbeitung: "In Arbeit",
  erledigt: "Erledigt",
};

export function AnalyticsReport({
  tickets,
  backHref,
  roleLabel,
  demo = false,
  referenceTime,
}: {
  tickets: readonly ReportTicket[];
  backHref: string;
  roleLabel: string;
  demo?: boolean;
  referenceTime?: number;
}) {
  const [period, setPeriod] = useState<ReportPeriod>("30");
  const [search, setSearch] = useState("");
  const [clock, setClock] = useState<number | null>(referenceTime ?? null);
  const [emptyDemo, setEmptyDemo] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    if (referenceTime !== undefined) return;
    const update = () => setClock(Date.now());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, [referenceTime]);
  if (clock === null)
    return (
      <p className="p-8 text-slate-500" role="status">
        Auswertung wird vorbereitet…
      </p>
    );
  const filtered = filterTickets(
    emptyDemo ? [] : tickets,
    period,
    search,
    clock,
  );
  const report = summarizeTickets(filtered, clock);
  const reset = () => {
    setPeriod("30");
    setSearch("");
    setEmptyDemo(false);
  };
  const exportCsv = () => {
    const url = URL.createObjectURL(
      new Blob([ticketsToCsv(filtered)], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${demo ? "demo_" : ""}tickets_${period}_tage.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setAnnouncement(`${filtered.length} Tickets als CSV exportiert.`);
  };
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      {demo && (
        <div className="bg-slate-950 px-4 py-2.5 text-center text-xs leading-relaxed text-slate-300">
          <span className="font-semibold text-white">
            Interaktive Produktdemo
          </span>{" "}
          · Ausschließlich erfundene Daten · Kein Backend, keine Anmeldung{" "}
          <span className="hidden sm:inline">· Stand 21. Oktober 2026</span>
        </div>
      )}
      <header className="border-b border-slate-200/80 bg-white px-4 sm:px-8">
        <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-3 py-4">
          <Link
            href={backHref}
            aria-label={demo ? "Demo zurücksetzen" : "Zurück zum Dashboard"}
            onClick={
              demo
                ? (event) => {
                    event.preventDefault();
                    reset();
                  }
                : undefined
            }
            className="flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Wrench size={20} />
            </span>
            <span>
              <span className="block text-base font-bold tracking-tight">
                SmartMaintain<span className="text-blue-600">.</span>
              </span>
              <span className="block text-xs text-slate-500">
                Property operations, simplified.
              </span>
            </span>
          </Link>
          <span className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500">
            {roleLabel}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">
              Übersicht / Auswertung
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Gute Entscheidungen.
              <br className="sm:hidden" /> Klare Zahlen.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
              Schäden erkennen, Prioritäten setzen und die Verwaltung im Blick
              behalten.
            </p>
          </div>
          <button
            onClick={exportCsv}
            disabled={!filtered.length}
            className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowDownToLine size={16} /> CSV exportieren
          </button>
        </div>
        <section
          aria-label="Auswertung filtern"
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
        >
          <div className="flex items-center gap-2 px-1 text-xs font-semibold text-slate-500">
            <SlidersHorizontal size={15} /> Zeitraum
          </div>
          <div className="flex flex-wrap gap-1" aria-label="Zeitraum">
            {(
              [
                ["7", "7 Tage"],
                ["30", "30 Tage"],
                ["all", "Gesamt"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                aria-pressed={period === value}
                onClick={() => setPeriod(value)}
                className={`min-h-10 rounded-lg px-3 text-xs font-semibold transition ${period === value ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex min-w-0 flex-1 basis-52 items-center gap-2 rounded-xl bg-slate-50 px-3 text-slate-400 focus-within:ring-2 focus-within:ring-blue-600">
            <Search size={16} />
            <span className="sr-only">Tickets durchsuchen</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ort, Kategorie oder Meldung suchen…"
              className="min-h-11 w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
          {demo && (
            <button
              onClick={() => setEmptyDemo(!emptyDemo)}
              aria-pressed={emptyDemo}
              className="min-h-10 rounded-lg px-3 text-xs text-slate-500 underline underline-offset-4"
            >
              {emptyDemo ? "Beispieldaten anzeigen" : "Leeren Zustand testen"}
            </button>
          )}
        </section>
        <p role="status" className="text-xs text-slate-500">
          {filtered.length} von {emptyDemo ? 0 : tickets.length} Meldungen ·
          Filter gelten für alle Kennzahlen und den Export · Zeitzone Berlin
        </p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Meldungen",
              value: report.total,
              note: "im gewählten Zeitraum",
              icon: Activity,
              color: "text-blue-600 bg-blue-50",
            },
            {
              label: "Erledigt",
              value: `${report.resolvedPercent}%`,
              note: `${report.resolved} von ${report.total} Meldungen`,
              icon: CheckCheck,
              color: "text-teal-700 bg-teal-50",
            },
            {
              label: "Dringend & offen",
              value: report.urgentOpen,
              note: "hohe Priorität, nicht erledigt",
              icon: TriangleAlert,
              color: "text-orange-700 bg-orange-50",
            },
            {
              label: "Eingang Ø / Tag",
              value: report.weeklyAverage.toFixed(1).replace(".", ","),
              note: "letzte 7 Kalendertage",
              icon: Clock3,
              color: "text-violet-700 bg-violet-50",
            },
          ].map(({ label, value, note, icon: Icon, color }) => (
            <section
              key={label}
              className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
            >
              <div className="mb-5 flex items-center justify-between gap-2">
                <h2 className="text-xs font-medium text-slate-500">{label}</h2>
                <span className={`rounded-lg p-2 ${color}`}>
                  <Icon size={16} />
                </span>
              </div>
              <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {value}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                {note}
              </p>
            </section>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.65fr_1fr]">
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">Ticketaufkommen</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Eingegangene Meldungen · letzte 7 Kalendertage
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                {demo ? "Beispieldaten" : "Echtzeitdaten"}
              </span>
            </div>
            <div
              className="h-56 w-full min-w-0"
              role="img"
              aria-label={`Ticketaufkommen: ${report.days.map((day) => `${day.date}: ${day.count}`).join(", ")}`}
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={report.days}
                  barSize={26}
                  margin={{ left: -25, right: 5 }}
                >
                  <CartesianGrid vertical={false} stroke="#eef2f6" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickMargin={12}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f1f5f9" }}
                    formatter={(value) => [value, "Meldungen"]}
                  />
                  <Bar
                    dataKey="count"
                    fill="#2563eb"
                    radius={[5, 5, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="font-semibold">Schadensbereiche</h2>
            <p className="mt-1 text-xs text-slate-500">
              Verteilung im gewählten Zeitraum
            </p>
            <div className="mt-6 space-y-4">
              {report.categories.length ? (
                report.categories.map((category, index) => (
                  <div key={category.name}>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-slate-600">{category.name}</span>
                      <span className="font-semibold">
                        {category.value}{" "}
                        <span className="ml-1 font-normal text-slate-400">
                          / {Math.round((category.value / report.total) * 100)}%
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(category.value / report.total) * 100}%`,
                          backgroundColor: colors[index % colors.length],
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-12 text-sm text-slate-400">
                  Noch keine Kategorien vorhanden.
                </p>
              )}
            </div>
          </section>
        </div>
        <section
          aria-label="Dringlichkeitsverteilung"
          className="flex flex-wrap items-center gap-3 text-xs text-slate-500"
        >
          <h2 className="mr-1 font-medium">Prioritäten aller Treffer</h2>
          {report.urgency.map(({ name, value }) => (
            <span
              key={name}
              className="rounded-full border border-slate-200 bg-white px-3 py-2"
            >
              {name}: <strong className="ml-1 text-slate-700">{value}</strong>
            </span>
          ))}
        </section>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-5">
            <div>
              <h2 className="font-semibold">Meldungen im Detail</h2>
              <p className="mt-1 text-xs text-slate-500">
                Neueste zuerst · {filtered.length} Treffer
              </p>
            </div>
            <ArrowUpRight size={18} className="text-slate-400" />
          </div>
          {!filtered.length ? (
            <div className="px-5 py-14 text-center">
              <Search size={25} className="mx-auto mb-3 text-slate-300" />
              <h3 className="font-semibold">Keine passenden Meldungen</h3>
              <p className="mt-2 text-sm text-slate-500">
                Versuche einen anderen Zeitraum oder setze die Filter zurück.
              </p>
              <button
                onClick={reset}
                className="mt-5 min-h-11 rounded-xl bg-blue-50 px-4 text-sm font-semibold text-blue-700"
              >
                Filter zurücksetzen
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((ticket) => (
                <li
                  key={ticket._id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:flex-nowrap"
                >
                  <span
                    className={`hidden size-9 shrink-0 items-center justify-center rounded-xl sm:flex ${ticket.status === "erledigt" ? "bg-teal-50 text-teal-600" : "bg-blue-50 text-blue-600"}`}
                  >
                    <Wrench size={16} />
                  </span>
                  <div className="min-w-0 flex-1 basis-44">
                    <p
                      className="truncate text-sm font-semibold"
                      title={ticket.description}
                    >
                      {ticket.aiSummary || ticket.description}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {ticket.location || "Ort nicht angegeben"} ·{" "}
                      {ticket.category || "Kategorie ausstehend"}
                    </p>
                    <details className="mt-2 text-xs text-slate-500">
                      <summary className="cursor-pointer text-blue-700">
                        Beschreibung lesen
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap break-words leading-relaxed">
                        {ticket.description}
                      </p>
                    </details>
                  </div>
                  <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-5">
                    <span
                      className={`text-xs ${ticket.urgency === "Hoch" ? "font-semibold text-orange-700" : "text-slate-500"}`}
                    >
                      {ticket.urgency || "Priorität ausstehend"}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${ticket.status === "erledigt" ? "bg-teal-50 text-teal-700" : ticket.status === "neu" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}
                    >
                      {statusLabels[ticket.status] || ticket.status}
                    </span>
                    <time
                      dateTime={new Date(ticket.createdAt).toISOString()}
                      className="text-[11px] tabular-nums text-slate-400"
                    >
                      {new Intl.DateTimeFormat("de-DE", {
                        timeZone: REPORT_TIME_ZONE,
                        day: "2-digit",
                        month: "2-digit",
                      }).format(ticket.createdAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <footer className="flex flex-wrap justify-between gap-3 pb-5 text-[11px] leading-relaxed text-slate-500">
          <p>
            KI-Prioritäten sind Vorschläge und müssen fachlich geprüft werden.
          </p>
          {demo ? (
            <p>Lokale Demo · Keine Daten werden gespeichert oder versendet.</p>
          ) : (
            <Link href={backHref} className="flex items-center gap-1">
              <ArrowLeft size={12} /> Zurück zur Übersicht
            </Link>
          )}
        </footer>
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </main>
    </div>
  );
}
