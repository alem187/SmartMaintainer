/**
 * @file admin/page.tsx
 * @description Verwaltungs-Dashboard für SmartMaintain (Sprint 03 + Sprint 04).
 *
 * Funktionen:
 * - Auth-Guard: Nicht eingeloggte Benutzer werden zu /admin/login weitergeleitet
 * - Echtzeit-Ticket-Liste via Convex (automatisches Update ohne Reload)
 * - Statistik-Kacheln: Gesamt, Offen, In Arbeit, Dringend
 * - Filterung nach Status (Alle / Neu / In Arbeit / Erledigt)
 * - Sprint 04 Block B: Roter Alert-Banner bei dringenden Tickets ("Hoch")
 * - Navigation zur Analytics-Seite (/admin/analytics)
 * - Logout-Funktion
 *
 * Datenfluss:
 * Convex DB → useQuery(api.tickets.list) → DashboardContent → TicketCard
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Wrench, LayoutDashboard, Inbox, Clock, CheckCircle2,
  AlertTriangle, BarChart3, TrendingUp, LogOut, X,
} from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { TicketCard } from "@/components/TicketCard";
import { isAuthenticated, getRole, hasAdminAccess, logout, ROLE_LABELS, type UserRole } from "@/lib/auth";
import type { Ticket, TicketStatus } from "@/lib/types";

/**
 * Konfiguration der Filter-Tabs im Dashboard.
 * Jeder Tab filtert die Ticket-Liste nach Status.
 */
const FILTER_TABS: { value: TicketStatus | "alle"; label: string; icon: typeof Inbox }[] = [
  { value: "alle", label: "Alle", icon: Inbox },
  { value: "neu", label: "Neu", icon: AlertTriangle },
  { value: "in_bearbeitung", label: "In Arbeit", icon: Clock },
  { value: "erledigt", label: "Erledigt", icon: CheckCircle2 },
];

/**
 * Berechnet aggregierte Statistiken aus der Ticket-Liste.
 *
 * @param tickets - Alle Tickets aus der Datenbank
 * @returns Objekt mit Zählern für total, neu, inBearbeitung, erledigt, hoch
 */
function useTicketStats(tickets: Ticket[]) {
  return {
    total: tickets.length,
    neu: tickets.filter((t) => t.status === "neu").length,
    inBearbeitung: tickets.filter((t) => t.status === "in_bearbeitung").length,
    erledigt: tickets.filter((t) => t.status === "erledigt").length,
    /** Anzahl der Tickets mit Dringlichkeit "Hoch" – für Alert-Banner */
    hoch: tickets.filter((t) => t.urgency === "Hoch").length,
  };
}

/**
 * AdminDashboard – Einstiegspunkt der Admin-Seite.
 *
 * Verantwortlichkeiten:
 * 1. Auth-Check: Weiterleitung zu /admin/login wenn nicht eingeloggt
 * 2. Daten laden: Convex-Query für alle Tickets
 * 3. Ladeindikator zeigen bis Daten verfügbar
 * 4. DashboardContent rendern sobald alles bereit ist
 */
export default function AdminDashboard() {
  const router = useRouter();

  /** Verhindert Flackern: Dashboard wird erst gerendert nach Auth-Check */
  const [authChecked, setAuthChecked] = useState(false);

  // Auth-Guard: beim ersten Rendern prüfen ob Session vorhanden
  useEffect(() => {
    // Nur Benutzer mit Admin-Rechten ("admin" oder "it") dürfen diese Seite sehen
    if (!isAuthenticated() || !hasAdminAccess()) {
      router.replace("/admin/login");
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  // Echtzeit-Abonnement aller Tickets via Convex
  // undefined = noch ladend, [] = keine Tickets, [...] = Daten vorhanden
  const tickets = useQuery(api.tickets.list) as Ticket[] | undefined;

  // Noch nicht authentifiziert: nichts rendern (Weiterleitung läuft)
  if (!authChecked) return null;

  // Daten werden geladen: Spinner anzeigen
  if (tickets === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="animate-scale-in flex flex-col items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center">
            <Spinner className="w-7 h-7 text-blue-600" />
          </div>
          <p className="text-gray-400 text-sm font-medium">Tickets werden geladen…</p>
        </div>
      </div>
    );
  }

  return <DashboardContent tickets={tickets} />;
}

/**
 * DashboardContent – Haupt-UI des Dashboards.
 *
 * Wird nur gerendert wenn Tickets geladen sind und User authentifiziert ist.
 *
 * Sprint 04 Features:
 * - Block B: UrgentAlert-Banner für "Hoch"-Tickets
 * - Block A: Logout-Button + Auth-Status
 * - Navigation zu Analytics (/admin/analytics)
 *
 * @param tickets - Vollständige Ticket-Liste aus Convex
 */
function DashboardContent({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const stats = useTicketStats(tickets);

  /** Aktuell aktiver Filter-Tab */
  const [filter, setFilter] = useState<TicketStatus | "alle">("alle");

  /** Steuert ob der Urgent-Alert-Banner sichtbar ist */
  const [dismissedAlert, setDismissedAlert] = useState(false);

  /**
   * Alert-Banner wird angezeigt wenn:
   * - Es "Hoch"-Tickets gibt (stats.hoch > 0)
   * - Der Benutzer den Alert noch nicht weggeklickt hat
   */
  const showAlert = !dismissedAlert && stats.hoch > 0;

  // Gefilterte Ticket-Liste basierend auf aktivem Tab
  const filtered =
    filter === "alle" ? tickets : tickets.filter((t) => t.status === filter);

  /** Logout: Session löschen und zur Login-Seite weiterleiten */
  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">

      {/*
       * SPRINT 04 – BLOCK B: Urgent Alert Banner
       * Erscheint automatisch wenn Tickets mit Dringlichkeit "Hoch" existieren.
       * Kann vom Verwalter mit X-Button geschlossen werden.
       */}
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
              <span className="text-red-100 text-sm"> — sofortige Bearbeitung erforderlich!</span>
            </div>
          </div>
          {/* Alert schließen */}
          <button
            onClick={() => setDismissedAlert(true)}
            className="text-white/60 hover:text-white transition-colors ml-4 shrink-0"
            aria-label="Alert schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Header */}
      <header className="animate-slide-down bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo + Titel */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm shadow-blue-200/60">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">SmartMaintain</h1>
              <p className="text-[11px] text-gray-400 font-medium tracking-wide uppercase">
                {ROLE_LABELS[getRole() as UserRole] || "Verwaltung"} · Dashboard
              </p>
            </div>
          </div>

          {/* Rechte Header-Aktionen */}
          <div className="flex items-center gap-2">
            {/* SPRINT 04 – BLOCK C: Link zur Analytics-Seite */}
            <Link
              href="/admin/analytics"
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Auswertung
            </Link>

            {/* Datums-Anzeige */}
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 text-sm text-gray-500">
              <BarChart3 className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString("de-DE", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </div>

            {/* SPRINT 04 – BLOCK A: Logout-Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
              title="Abmelden"
              aria-label="Abmelden"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Statistik-Kacheln */}
        <div className="animate-fade-in-up grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatTile label="Gesamt" value={stats.total} icon={<Inbox className="w-4 h-4" />} accent="blue" />
          <StatTile label="Offen" value={stats.neu} icon={<AlertTriangle className="w-4 h-4" />} accent="purple" />
          <StatTile label="In Arbeit" value={stats.inBearbeitung} icon={<Clock className="w-4 h-4" />} accent="amber" />
          <StatTile label="Dringend" value={stats.hoch} icon={<AlertTriangle className="w-4 h-4" />} accent="red" />
        </div>

        {/* Status-Filter-Tabs */}
        <div
          className="animate-fade-in-up flex gap-1.5 mb-6 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 overflow-x-auto"
          style={{ animationDelay: "80ms" }}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = filter === tab.value;
            const Icon = tab.icon;
            // Zähler pro Tab berechnen
            const count =
              tab.value === "alle" ? stats.total
              : tab.value === "neu" ? stats.neu
              : tab.value === "in_bearbeitung" ? stats.inBearbeitung
              : stats.erledigt;

            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`touch-feedback flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-200/60"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Ticket-Raster oder Leer-Zustand */}
        {filtered.length === 0 ? (
          <EmptyState filtered={filter !== "alle"} />
        ) : (
          <div className="stagger-children grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ticket) => (
              <TicketCard key={ticket._id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * StatTile – Statistik-Kachel in der oberen Dashboard-Zeile.
 *
 * @param label  - Bezeichnung der Kennzahl (z.B. "Gesamt")
 * @param value  - Numerischer Wert
 * @param icon   - Lucide-Icon als ReactNode
 * @param accent - Farbakzent der Kachel (beeinflusst Gradient-Farbe des Icons)
 */
function StatTile({ label, value, icon, accent }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: "blue" | "purple" | "amber" | "red";
}) {
  // Gradient-Klassen pro Akzentfarbe
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

/**
 * EmptyState – Platzhalter wenn keine Tickets im aktiven Filter vorhanden sind.
 *
 * @param filtered - true wenn ein aktiver Filter (nicht "alle") gesetzt ist
 */
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
        {filtered
          ? "Versuche einen anderen Filter."
          : "Neue Schadensmeldungen erscheinen hier automatisch in Echtzeit."}
      </p>
    </div>
  );
}
