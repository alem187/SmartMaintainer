/**
 * @file viewer/page.tsx
 * @description Read-only Dashboard für Geschäftsführung & IT & Datenschutz.
 *
 * Rolle: "viewer" – Lesezugriff auf alle Tickets und Analytics.
 *
 * Funktionen:
 * - Echtzeit-Ticket-Übersicht (nur ansehen, kein Status-Ändern)
 * - Statistik-Kacheln: Gesamt, Offen, In Arbeit, Dringend
 * - Filterung nach Status
 * - Direktlink zur Analytics-Seite (/viewer/analytics)
 * - Auth-Guard: Weiterleitung zu /admin/login wenn nicht eingeloggt
 * - Rolle wird im Header angezeigt (ROLE_LABELS)
 *
 * Unterschiede zu /admin:
 * - Kein Status-Ändern möglich (TicketCard im read-only Modus)
 * - Kein Logout-Button (Viewer haben festen Zugang)
 * - Lila statt blau als Akzentfarbe (visuelle Differenzierung)
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Wrench, Eye, Inbox, Clock, CheckCircle2,
  AlertTriangle, TrendingUp, X,
} from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { TicketCard } from "@/components/TicketCard";
import { isAuthenticated, getRole, ROLE_LABELS } from "@/lib/auth";
import type { Ticket, TicketStatus } from "@/lib/types";

/** Filter-Tab-Konfiguration – identisch zum Admin-Dashboard */
const FILTER_TABS: { value: TicketStatus | "alle"; label: string; icon: typeof Inbox }[] = [
  { value: "alle",           label: "Alle",      icon: Inbox         },
  { value: "neu",            label: "Neu",       icon: AlertTriangle },
  { value: "in_bearbeitung", label: "In Arbeit", icon: Clock         },
  { value: "erledigt",       label: "Erledigt",  icon: CheckCircle2  },
];

/** Berechnet aggregierte Statistiken aus der Ticket-Liste */
function useTicketStats(tickets: Ticket[]) {
  return {
    total:          tickets.length,
    neu:            tickets.filter((t) => t.status === "neu").length,
    inBearbeitung:  tickets.filter((t) => t.status === "in_bearbeitung").length,
    erledigt:       tickets.filter((t) => t.status === "erledigt").length,
    hoch:           tickets.filter((t) => t.urgency === "Hoch").length,
  };
}

/**
 * ViewerDashboard – Einstiegspunkt der Viewer-Seite.
 * Auth-Guard: Nur Benutzer mit Rolle "viewer" dürfen diese Seite sehen.
 */
export default function ViewerDashboard() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated() || getRole() !== "viewer") {
      // Nicht eingeloggt oder falsche Rolle → zurück zum Login
      router.replace("/admin/login");
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  const tickets = useQuery(api.tickets.list) as Ticket[] | undefined;

  if (!authChecked) return null;

  if (tickets === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="animate-scale-in flex flex-col items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center">
            <Spinner className="w-7 h-7 text-violet-600" />
          </div>
          <p className="text-gray-400 text-sm font-medium">Tickets werden geladen…</p>
        </div>
      </div>
    );
  }

  return <ViewerContent tickets={tickets} />;
}

/**
 * ViewerContent – Haupt-UI des Viewer-Dashboards.
 * Read-only: Tickets können nicht bearbeitet werden.
 */
function ViewerContent({ tickets }: { tickets: Ticket[] }) {
  const stats = useTicketStats(tickets);
  const [filter, setFilter] = useState<TicketStatus | "alle">("alle");
  const [dismissedAlert, setDismissedAlert] = useState(false);

  const showAlert = !dismissedAlert && stats.hoch > 0;
  const filtered = filter === "alle" ? tickets : tickets.filter((t) => t.status === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">

      {/* Urgent Alert für hohe Dringlichkeit */}
      {showAlert && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 flex items-center justify-between shadow-lg shadow-red-500/20 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="font-bold">
                {stats.hoch} dringende{stats.hoch !== 1 ? "" : "s"} Ticket{stats.hoch !== 1 ? "s" : ""}
              </span>
              <span className="text-red-100 text-sm"> — Verwalter wurden informiert</span>
            </div>
          </div>
          <button onClick={() => setDismissedAlert(true)} className="text-white/60 hover:text-white transition-colors ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="animate-slide-down bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Lila Icon – visuelle Unterscheidung von Admin (blau) */}
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center shadow-sm shadow-violet-200/60">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">SmartMaintain</h1>
              <p className="text-[11px] text-gray-400 font-medium tracking-wide uppercase">
                {ROLE_LABELS["viewer"]} · Lesezugriff
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Link zur Analytics-Seite */}
            <Link
              href="/viewer/analytics"
              className="flex items-center gap-2 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Auswertung
            </Link>

            {/* Read-only Hinweis-Badge */}
            <div className="hidden sm:flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-xs text-amber-600 font-medium">
              <Eye className="w-3 h-3" />
              Nur lesen
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Statistik-Kacheln */}
        <div className="animate-fade-in-up grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatTile label="Gesamt"      value={stats.total}          icon={<Inbox className="w-4 h-4" />}         accent="blue"   />
          <StatTile label="Offen"       value={stats.neu}            icon={<AlertTriangle className="w-4 h-4" />} accent="purple" />
          <StatTile label="In Arbeit"   value={stats.inBearbeitung}  icon={<Clock className="w-4 h-4" />}         accent="amber"  />
          <StatTile label="Dringend"    value={stats.hoch}           icon={<AlertTriangle className="w-4 h-4" />} accent="red"    />
        </div>

        {/* Hinweisbox: read-only */}
        <div className="animate-fade-in-up mb-5 flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700" style={{ animationDelay: "60ms" }}>
          <Eye className="w-4 h-4 shrink-0" />
          <span>Du hast <strong>Lesezugriff</strong>. Ticket-Status kann nur vom Verwalter geändert werden.</span>
        </div>

        {/* Filter-Tabs */}
        <div className="animate-fade-in-up flex gap-1.5 mb-6 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 overflow-x-auto" style={{ animationDelay: "80ms" }}>
          {FILTER_TABS.map((tab) => {
            const isActive = filter === tab.value;
            const Icon = tab.icon;
            const count =
              tab.value === "alle"           ? stats.total
              : tab.value === "neu"          ? stats.neu
              : tab.value === "in_bearbeitung"? stats.inBearbeitung
              : stats.erledigt;

            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`touch-feedback flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-violet-600 text-white shadow-sm shadow-violet-200/60"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Ticket-Raster – read-only (TicketCard ohne Status-Änderung) */}
        {filtered.length === 0 ? (
          <EmptyState filtered={filter !== "alle"} />
        ) : (
          <div className="stagger-children grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ticket) => (
              // readOnly-Prop deaktiviert das Status-Dropdown in der TicketCard
              <TicketCard key={ticket._id} ticket={ticket} readOnly />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, icon, accent }: {
  label: string; value: number; icon: React.ReactNode;
  accent: "blue" | "purple" | "amber" | "red";
}) {
  const styles = {
    blue:   "from-blue-500 to-blue-600 shadow-blue-200/40",
    purple: "from-violet-500 to-violet-600 shadow-violet-200/40",
    amber:  "from-amber-400 to-amber-500 shadow-amber-200/40",
    red:    "from-red-500 to-red-600 shadow-red-200/40",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${styles[accent]} shadow-sm flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</p>
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="animate-scale-in bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Wrench className="w-8 h-8 text-gray-300" />
      </div>
      <h2 className="text-lg font-semibold text-gray-600 mb-1">
        {filtered ? "Keine Tickets in dieser Kategorie" : "Noch keine Meldungen"}
      </h2>
      <p className="text-gray-400 text-sm">
        {filtered ? "Versuche einen anderen Filter." : "Neue Schadensmeldungen erscheinen hier automatisch."}
      </p>
    </div>
  );
}
