"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Check,
  CheckCheck,
  ClipboardList,
  Flame,
  GripVertical,
  LayoutDashboard,
  MessageSquare,
  Plus,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  TriangleAlert,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { AnalyticsReport } from "@/components/AnalyticsReport";
import { DEMO_REFERENCE_TIME, DEMO_TICKETS } from "@/lib/demo-tickets";
import {
  addWorkspaceNote,
  createWorkspace,
  DEMO_ASSIGNEES,
  updateWorkspaceTicket,
  type WorkspaceTicket,
} from "@/lib/workspace";
import { ticketsToCsv } from "@/lib/analytics";
import {
  CATEGORIES,
  STATUS_OPTIONS,
  type Ticket,
  type TicketStatus,
} from "@/lib/types";

const lanes = [
  {
    status: "neu",
    label: "Neu eingegangen",
    description: "Sichten & einordnen",
    color: "bg-blue-500",
    icon: ClipboardList,
  },
  {
    status: "in_bearbeitung",
    label: "In Bearbeitung",
    description: "Nächsten Schritt planen",
    color: "bg-amber-400",
    icon: Wrench,
  },
  {
    status: "erledigt",
    label: "Erledigt",
    description: "Sauber abgeschlossen",
    color: "bg-emerald-500",
    icon: CheckCheck,
  },
] as const;

export function DemoWorkspace() {
  const [tickets, setTickets] = useState(() => createWorkspace(DEMO_TICKETS));
  const [screen, setScreen] = useState<"board" | "analytics">("board");
  const navigate = (next: "board" | "analytics") => {
    setScreen(next);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  };
  const [search, setSearch] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [category, setCategory] = useState("");
  const [mobileLane, setMobileLane] = useState<TicketStatus>("neu");
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  const active = tickets.find((ticket) => ticket._id === selected);
  const open = tickets.filter((ticket) => ticket.status !== "erledigt");
  const urgent = open.filter((ticket) => ticket.urgency === "Hoch");
  const filtered = tickets.filter((ticket) => {
    if (
      urgentOnly &&
      !(ticket.urgency === "Hoch" && ticket.status !== "erledigt")
    )
      return false;
    if (
      unassignedOnly &&
      !(ticket.assignee === "Nicht zugewiesen" && ticket.status !== "erledigt")
    )
      return false;
    if (category && ticket.category !== category) return false;
    const query = search.trim().toLocaleLowerCase("de-DE");
    return (
      !query ||
      [
        ticket.description,
        ticket.aiSummary,
        ticket.location,
        ticket.assignee,
      ].some((value) => value?.toLocaleLowerCase("de-DE").includes(query))
    );
  });
  const update = (
    id: string,
    patch: Parameters<typeof updateWorkspaceTicket>[2],
  ) => {
    setTickets((current) => updateWorkspaceTicket(current, id, patch));
    if (patch.status) setMobileLane(patch.status);
    setAnnouncement(
      "Beispielticket aktualisiert. Änderungen gelten nur in dieser Demo.",
    );
  };
  const clearFilters = () => {
    setSearch("");
    setUrgentOnly(false);
    setUnassignedOnly(false);
    setCategory("");
  };
  const reset = () => {
    setTickets(createWorkspace(DEMO_TICKETS));
    clearFilters();
    setSelected(null);
    setCreating(false);
    setAnnouncement("Demo auf die ursprünglichen Beispieldaten zurückgesetzt.");
  };
  const exportBoard = () => {
    const url = URL.createObjectURL(
      new Blob([ticketsToCsv(filtered)], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "smartmaintain_demo_tickets.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setAnnouncement(
      `${filtered.length} Beispieltickets exportiert. Zuständigkeiten und Notizen sind nicht Teil des CSV-Reports.`,
    );
  };
  return (
    <div className="min-h-screen bg-[#f3f5f9] text-slate-900">
      <div className="bg-[#0d1830] px-4 py-2 text-center text-[11px] leading-relaxed text-slate-300">
        <span className="font-semibold text-white">
          Produktdemo mit Beispieldaten.
        </span>{" "}
        Alles ausprobieren — Änderungen bleiben nur bis zum Neuladen. Kein
        Versand, kein echtes Ticket.
      </div>
      <nav
        aria-label="Demo-Ansichten"
        className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl sm:px-8"
      >
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-2 gap-y-2 py-3 sm:gap-x-6">
          <button
            onClick={() => navigate("board")}
            className="flex items-center gap-2.5 text-base font-bold tracking-tight"
          >
            <span className="rounded-xl bg-blue-600 p-2.5 text-white">
              <Wrench size={18} />
            </span>
            SmartMaintain<span className="-ml-2 text-blue-600">.</span>
            <span className="ml-1 rounded-md bg-slate-100 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              Demo
            </span>
          </button>
          <div className="order-3 flex w-full gap-1 rounded-xl bg-slate-100 p-1 md:order-none md:w-auto">
            {(
              [
                {
                  value: "board",
                  label: "Arbeitsplatz",
                  icon: LayoutDashboard,
                },
                { value: "analytics", label: "Auswertung", icon: Activity },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                aria-pressed={screen === value}
                onClick={() => navigate(value)}
                className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-5 text-xs font-semibold transition ${screen === value ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={reset}
            aria-label="Demo zurücksetzen"
            className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs text-slate-500 hover:bg-slate-100"
          >
            <RotateCcw size={14} />
            <span className="hidden lg:inline">Demo zurücksetzen</span>
          </button>
        </div>
      </nav>
      {screen === "analytics" ? (
        <AnalyticsReport
          tickets={tickets}
          backHref="/demo"
          roleLabel="Demo · Auswertung"
          demo
          embedded
          referenceTime={DEMO_REFERENCE_TIME}
        />
      ) : (
        <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-8 sm:py-8">
          <section className="relative overflow-hidden rounded-3xl bg-[#11254b] px-5 py-6 text-white sm:px-8 sm:py-8">
            <div className="pointer-events-none absolute -right-20 -top-40 size-96 rounded-full border-[55px] border-white/[0.035]" />
            <div className="relative flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                  <span className="size-1.5 rounded-full bg-teal-300" /> Dein
                  Arbeitsplatz
                </p>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-[40px] sm:leading-tight">
                  Weniger Chaos.
                  <br />
                  Mehr erledigt.
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-300">
                  Von „Da tropft etwas“ zum klaren Auftrag. Ordne Meldungen zu,
                  plane die nächsten Schritte und behalte offene Fälle im Blick.
                </p>
              </div>
              <button
                onClick={() => setCreating(true)}
                className="flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#11254b] transition hover:bg-blue-50"
              >
                <Plus size={18} /> Meldung anlegen
              </button>
            </div>
            <div className="relative mt-7 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
              {[
                { label: "Offene Fälle", value: open.length },
                { label: "Dringend", value: urgent.length },
                { label: "Abgeschlossen", value: tickets.length - open.length },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-2xl font-semibold tabular-nums">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-300">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section
            aria-label="Schnellfilter"
            className="grid gap-3 md:grid-cols-3"
          >
            <button
              onClick={() => {
                clearFilters();
                setUrgentOnly(true);
                setMobileLane("neu");
              }}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${urgentOnly ? "border-orange-300 bg-orange-50" : "border-slate-200 bg-white"}`}
            >
              <span className="rounded-xl bg-orange-50 p-2.5 text-orange-600">
                <Flame size={19} />
              </span>
              <span className="flex-1">
                <strong className="block text-sm">
                  {urgent.length}{" "}
                  {urgent.length === 1 ? "Fall braucht" : "Fälle brauchen"}{" "}
                  Vorrang
                </strong>
                <span className="mt-1 block text-xs text-slate-500">
                  Hohe Priorität · noch offen
                </span>
              </span>
              <ArrowRight size={16} className="text-slate-400" />
            </button>
            <button
              onClick={() => {
                clearFilters();
                setUnassignedOnly(true);
              }}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${unassignedOnly ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}
            >
              <span className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <UserRound size={19} />
              </span>
              <span className="flex-1">
                <strong className="block text-sm">
                  {
                    open.filter(
                      (ticket) => ticket.assignee === "Nicht zugewiesen",
                    ).length
                  }{" "}
                  ohne Zuständigkeit
                </strong>
                <span className="mt-1 block text-xs text-slate-500">
                  Aufgaben an ein Team übergeben
                </span>
              </span>
              <ArrowRight size={16} className="text-slate-400" />
            </button>
            <button
              onClick={() => navigate("analytics")}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5"
            >
              <span className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
                <Activity size={19} />
              </span>
              <span className="flex-1">
                <strong className="block text-sm">
                  Zahlen statt Bauchgefühl
                </strong>
                <span className="mt-1 block text-xs text-slate-500">
                  Auswertung & CSV-Bericht öffnen
                </span>
              </span>
              <ArrowRight size={16} className="text-slate-400" />
            </button>
          </section>
          <section aria-label="Tickets filtern" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Dein Maßnahmenboard
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Ticket öffnen oder am Desktop zwischen Spalten ziehen.
                </p>
              </div>
              <button
                onClick={exportBoard}
                disabled={!filtered.length}
                className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 disabled:opacity-40"
              >
                <ArrowDownToLine size={15} /> Treffer exportieren
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="flex min-w-0 flex-1 basis-60 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400 focus-within:ring-2 focus-within:ring-blue-600">
                <Search size={16} />
                <span className="sr-only">Board durchsuchen</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Meldung, Ort oder Team suchen…"
                  className="min-h-11 w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none"
                />
              </label>
              <label className="sr-only" htmlFor="board-category">
                Kategorie filtern
              </label>
              <select
                id="board-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="min-h-11 max-w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600"
              >
                <option value="">Alle Kategorien</option>
                {CATEGORIES.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
              <button
                onClick={() => setUrgentOnly(!urgentOnly)}
                aria-pressed={urgentOnly}
                className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-xs font-medium ${urgentOnly ? "border-orange-200 bg-orange-50 text-orange-700" : "border-slate-200 bg-white text-slate-600"}`}
              >
                <TriangleAlert size={14} /> Dringend & offen
              </button>
              {(search || category || urgentOnly || unassignedOnly) && (
                <button
                  onClick={clearFilters}
                  className="min-h-11 px-3 text-xs font-medium text-blue-700"
                >
                  Filter löschen
                </button>
              )}
            </div>
            <p role="status" className="text-xs text-slate-500">
              {filtered.length} von {tickets.length} Meldungen
              {unassignedOnly ? " · Ohne Zuständigkeit & offen" : ""}
            </p>
          </section>
          <div
            className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 lg:hidden"
            aria-label="Board-Spalte auswählen"
          >
            {lanes.map((lane) => (
              <button
                key={lane.status}
                onClick={() => setMobileLane(lane.status)}
                aria-pressed={mobileLane === lane.status}
                className={`min-h-11 min-w-0 flex-1 rounded-lg px-2 text-xs font-semibold ${mobileLane === lane.status ? "bg-slate-900 text-white" : "text-slate-500"}`}
              >
                {lane.status === "neu"
                  ? "Neu"
                  : lane.status === "in_bearbeitung"
                    ? "In Arbeit"
                    : "Erledigt"}{" "}
                <span className="ml-1 opacity-60">
                  {
                    filtered.filter((ticket) => ticket.status === lane.status)
                      .length
                  }
                </span>
              </button>
            ))}
          </div>
          <div className="grid items-start gap-4 lg:grid-cols-3">
            {lanes.map((lane) => {
              const items = filtered.filter(
                (ticket) => ticket.status === lane.status,
              );
              const LaneIcon = lane.icon;
              return (
                <section
                  key={lane.status}
                  aria-label={lane.label}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (dragging) update(dragging, { status: lane.status });
                    setDragging(null);
                  }}
                  className={`min-w-0 rounded-2xl border p-3 transition ${mobileLane !== lane.status ? "hidden lg:block" : ""} ${dragging ? "border-blue-300 bg-blue-50/60" : "border-slate-200/80 bg-slate-100/70"}`}
                >
                  <div className="mb-4 flex items-center gap-2 px-1 pt-1">
                    <span className={`size-2 rounded-full ${lane.color}`} />
                    <h3 className="text-xs font-semibold">{lane.label}</h3>
                    <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                      {items.length}
                    </span>
                    <LaneIcon size={14} className="ml-auto text-slate-400" />
                  </div>
                  <div className="space-y-3">
                    {items.map((ticket) => (
                      <article
                        key={ticket._id}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", ticket._id);
                          event.dataTransfer.effectAllowed = "move";
                          setDragging(ticket._id);
                        }}
                        onDragEnd={() => setDragging(null)}
                        className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <span
                            className={`rounded-md px-2 py-1 text-[10px] font-semibold ${ticket.urgency === "Hoch" && ticket.status !== "erledigt" ? "bg-orange-50 text-orange-700" : "bg-slate-50 text-slate-500"}`}
                          >
                            {ticket.category || "Einordnung ausstehend"}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-400">
                            {ticket.urgency === "Hoch" &&
                              ticket.status !== "erledigt" && (
                                <Flame size={12} className="text-orange-500" />
                              )}
                            <GripVertical
                              size={13}
                              className="hidden lg:block"
                            />
                          </span>
                        </div>
                        <button
                          onClick={() => setSelected(ticket._id)}
                          className="block w-full rounded text-left focus-visible:outline-2 focus-visible:outline-blue-600"
                        >
                          <h4 className="text-sm font-semibold leading-snug group-hover:text-blue-700">
                            {ticket.aiSummary || "Neue Meldung"}
                          </h4>
                          <p className="mt-1.5 text-[11px] text-slate-500">
                            {ticket.location || "Ort nicht angegeben"}
                          </p>
                          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">
                            {ticket.nextStep || ticket.description}
                          </p>
                        </button>
                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[10px] text-slate-500">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <UserRound size={12} className="shrink-0" />
                            <span className="truncate">
                              {ticket.assignee === "Nicht zugewiesen"
                                ? "Team zuweisen"
                                : ticket.assignee}
                            </span>
                          </span>
                          <button
                            onClick={() => setSelected(ticket._id)}
                            aria-label={`Details zu ${ticket.aiSummary || "Neue Meldung"}`}
                            className="flex min-h-8 items-center gap-1 rounded-lg px-2 font-semibold text-blue-700 hover:bg-blue-50"
                          >
                            {ticket.notes.length > 0 && (
                              <>
                                <MessageSquare size={11} />
                                {ticket.notes.length}
                              </>
                            )}{" "}
                            Öffnen <ArrowRight size={12} />
                          </button>
                        </div>
                      </article>
                    ))}
                    {!items.length && (
                      <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-xs leading-relaxed text-slate-400">
                        <LaneIcon size={22} className="mx-auto mb-3" />
                        Keine passenden Tickets in dieser Spalte.
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
          <p className="pb-4 text-[11px] leading-relaxed text-slate-500">
            Demo-Teams und Meldungen sind erfunden. Zuweisungen benachrichtigen
            niemanden. KI-Prioritäten müssen fachlich geprüft werden.
          </p>
        </main>
      )}
      {active && (
        <TicketEditor
          key={active._id}
          ticket={active}
          onClose={() => setSelected(null)}
          onUpdate={(patch) => update(active._id, patch)}
          onNote={(text) => {
            setTickets((current) =>
              addWorkspaceNote(current, active._id, {
                id: crypto.randomUUID(),
                text,
                createdAt: Date.now(),
              }),
            );
            setAnnouncement("Notiz in der Demo hinzugefügt.");
          }}
        />
      )}
      {creating && (
        <CreateTicket
          onClose={() => setCreating(false)}
          onCreate={({ description, location, category: newCategory }) => {
            const ticket: WorkspaceTicket = {
              _id: `demo-${crypto.randomUUID()}` as Ticket["_id"],
              createdAt: DEMO_REFERENCE_TIME,
              description,
              aiSummary: description.slice(0, 70),
              location,
              category: newCategory,
              status: "neu",
              assignee: "Nicht zugewiesen",
              nextStep: "",
              notes: [],
            };
            setTickets((current) => [ticket, ...current]);
            clearFilters();
            setMobileLane("neu");
            setCreating(false);
            setSelected(ticket._id);
            setAnnouncement(
              "Neue Beispielmeldung angelegt. Es wurde nichts versendet.",
            );
          }}
        />
      )}
      {announcement && (
        <div
          className="pointer-events-none fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-md items-start gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs leading-relaxed text-white shadow-xl"
          role="status"
        >
          <Check size={15} className="mt-0.5 shrink-0 text-teal-300" />
          <span className="flex-1">{announcement}</span>
          <button
            onClick={() => setAnnouncement("")}
            aria-label="Hinweis schließen"
            className="pointer-events-auto p-1"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

function useModalDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);
  return ref;
}

function TicketEditor({
  ticket,
  onClose,
  onUpdate,
  onNote,
}: {
  ticket: WorkspaceTicket;
  onClose: () => void;
  onUpdate: (patch: Parameters<typeof updateWorkspaceTicket>[2]) => void;
  onNote: (text: string) => void;
}) {
  const dialogRef = useModalDialog();
  const [nextStep, setNextStep] = useState(ticket.nextStep);
  const [note, setNote] = useState("");
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="ticket-title"
      className="fixed inset-0 z-40 m-0 flex h-dvh max-h-none w-full max-w-none items-end justify-end bg-slate-950/40 p-0 backdrop-blur-sm sm:items-stretch"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <section className="relative max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-h-none sm:max-w-lg sm:rounded-none sm:p-7">
        <div className="mb-7 flex items-center justify-between">
          <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
            Beispielticket · Details
          </span>
          <button
            autoFocus
            onClick={onClose}
            aria-label="Ticket schließen"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mb-2 text-xs text-slate-500">
          {ticket.location || "Ort nicht angegeben"}
        </p>
        <h2
          id="ticket-title"
          className="text-2xl font-semibold leading-tight tracking-tight"
        >
          {ticket.aiSummary || "Neue Meldung"}
        </h2>
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">
          {ticket.description}
        </p>
        <div className="my-6 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs leading-relaxed text-blue-800">
          <Sparkles size={14} className="mb-2" />
          {ticket.category || "Kategorie ausstehend"} · Priorität:{" "}
          {ticket.urgency || "Nicht bewertet"}
          <p className="mt-1 text-[11px] text-blue-700">
            {ticket.urgency
              ? "Beispiel einer KI-Einordnung, fachlich prüfen."
              : "Manuell angelegt, keine KI-Analyse ausgeführt."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-slate-600">
            Status
            <select
              value={ticket.status}
              onChange={(event) =>
                onUpdate({ status: event.target.value as TicketStatus })
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-2 text-xs font-normal"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Zuständiges Team
            <select
              value={ticket.assignee}
              onChange={(event) => onUpdate({ assignee: event.target.value })}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-2 text-xs font-normal"
            >
              {DEMO_ASSIGNEES.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onUpdate({ nextStep });
          }}
          className="mt-6"
        >
          <label
            className="block text-xs font-semibold text-slate-600"
            htmlFor="next-step"
          >
            Nächster Schritt
          </label>
          <textarea
            id="next-step"
            value={nextStep}
            onChange={(event) => setNextStep(event.target.value)}
            maxLength={240}
            rows={2}
            placeholder="Zum Beispiel: Termin zur Prüfung vereinbaren"
            className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-3 text-sm"
          />
          <button className="mt-2 flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white">
            <Check size={13} />
            Schritt speichern
          </button>
        </form>
        <section className="mt-7 border-t border-slate-100 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare size={15} /> Notizen{" "}
            <span className="text-xs font-normal text-slate-400">
              Nur diese Demo
            </span>
          </h3>
          <ul className="mt-4 space-y-3">
            {ticket.notes.map((item) => (
              <li
                key={item.id}
                className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600"
              >
                <p className="whitespace-pre-wrap break-words">{item.text}</p>
                <time
                  dateTime={new Date(item.createdAt).toISOString()}
                  className="mt-2 block text-[10px] text-slate-400"
                >
                  {new Date(item.createdAt).toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · Lokale Notiz
                </time>
              </li>
            ))}
          </ul>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (note.trim()) {
                onNote(note);
                setNote("");
              }
            }}
            className="mt-4"
          >
            <label className="sr-only" htmlFor="new-note">
              Notiz hinzufügen
            </label>
            <textarea
              id="new-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={1000}
              rows={2}
              placeholder="Was wurde besprochen oder geprüft?"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm"
            />
            <button
              disabled={!note.trim()}
              className="mt-2 flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white disabled:opacity-40"
            >
              <Send size={12} />
              Notiz hinzufügen
            </button>
          </form>
        </section>
        <p className="mt-7 text-[10px] leading-relaxed text-slate-400">
          Alle Änderungen gelten nur im Arbeitsspeicher dieses Browser-Tabs und
          werden beim Neuladen verworfen.
        </p>
      </section>
    </dialog>
  );
}

function CreateTicket({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: {
    description: string;
    location: string;
    category: Ticket["category"];
  }) => void;
}) {
  const dialogRef = useModalDialog();
  const [formError, setFormError] = useState("");
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="create-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 z-40 m-0 flex h-dvh max-h-none w-full max-w-none items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const description = String(data.get("description")).trim();
          if (description.length < 10 || !String(data.get("location")).trim()) {
            setFormError(
              "Bitte einen Ort und mindestens zehn Zeichen Beschreibung eingeben.",
            );
            return;
          }
          onCreate({
            description,
            location: String(data.get("location")).trim(),
            category: String(data.get("category")) as Ticket["category"],
          });
        }}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 id="create-title" className="text-xl font-semibold">
            Beispielmeldung anlegen
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Formular schließen"
            className="rounded-lg p-2"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Teste den Weg vom Eingang bis zur Erledigung. Bitte nur erfundene
          Angaben verwenden.
        </p>
        <label className="mt-5 block text-xs font-semibold">
          Ort
          <input
            autoFocus
            name="location"
            required
            maxLength={100}
            placeholder="Zum Beispiel: Musterhof · Haus A"
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal"
          />
        </label>
        <label className="mt-4 block text-xs font-semibold">
          Beschreibung
          <textarea
            name="description"
            required
            minLength={10}
            maxLength={1000}
            rows={3}
            placeholder="Was ist kaputt? Mindestens 10 Zeichen."
            className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal"
          />
        </label>
        <label className="mt-4 block text-xs font-semibold">
          Kategorie
          <select
            name="category"
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal"
          >
            {CATEGORIES.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <button className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white">
          <Plus size={16} />
          Beispielmeldung erstellen
        </button>
        {formError && (
          <p role="alert" className="mt-3 text-xs text-red-700">
            {formError}
          </p>
        )}
        <p className="mt-3 text-center text-[10px] text-slate-400">
          Kein Versand · Keine KI-Anfrage · Beim Neuladen zurückgesetzt
        </p>
      </form>
    </dialog>
  );
}
