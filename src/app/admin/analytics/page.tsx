/**
 * @file admin/analytics/page.tsx
 * @description Auswertungs- und KPI-Seite für SmartMaintain (Sprint 04 – Block C).
 *
 * Zeigt aggregierte Kennzahlen und Diagramme für Verwalter:
 * - KPI-Kacheln: Gesamttickets, Erledigungsrate, Dringend-Anteil, Ø-Durchsatz
 * - Kreisdiagramm: Kategorienverteilung (Sanitär, Elektro, Heizung, …)
 * - Balkendiagramm: Dringlichkeitsverteilung (Hoch / Mittel / Niedrig)
 * - Balkendiagramm: Ticketaufkommen der letzten 7 Tage
 * - CSV-Export: Alle Tickets als Excel-kompatible CSV-Datei
 *
 * Diagramme: Recharts (PieChart, BarChart, ResponsiveContainer)
 * Datenquelle: Convex-Query api.tickets.list (Echtzeit)
 * Auth: Geschützt via isAuthenticated() – Weiterleitung zu /admin/login
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  LayoutDashboard, TrendingUp, Download, ArrowLeft,
  Clock, CheckCircle2, AlertTriangle, Activity,
} from "lucide-react";
import Link from "next/link";
import { isAuthenticated, getRole, hasAdminAccess, ROLE_LABELS, type UserRole } from "@/lib/auth";
import { Spinner } from "@/components/ui/Spinner";
import type { Ticket } from "@/lib/types";

/**
 * Farbpalette für Kategorien im Kreisdiagramm.
 * Jede Kategorie hat eine eindeutige Farbe für gute Lesbarkeit.
 */
const CATEGORY_COLORS: Record<string, string> = {
  Sanitär:        "#3b82f6", // Blau
  Elektro:        "#f59e0b", // Amber
  Heizung:        "#ef4444", // Rot
  Schädlinge:     "#8b5cf6", // Violett
  "Fenster/Türen":"#10b981", // Grün
  "Dach/Fassade": "#6366f1", // Indigo
  Aufzug:         "#f97316", // Orange
  Allgemein:      "#64748b", // Grau-blau
  Sonstiges:      "#94a3b8", // Grau
};

/**
 * Farbpalette für Dringlichkeitsstufen im Balkendiagramm.
 * Ampelfarben: Rot = Hoch, Gelb = Mittel, Grün = Niedrig
 */
const URGENCY_COLORS: Record<string, string> = {
  Hoch:    "#ef4444",
  Mittel:  "#f59e0b",
  Niedrig: "#22c55e",
};

/**
 * AnalyticsPage – Einstiegspunkt mit Auth-Guard und Datenladen.
 *
 * Prüft Authentifizierung, lädt Ticket-Daten und gibt AnalyticsContent aus.
 */
export default function AnalyticsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  // Auth-Guard: identisch zum Admin-Dashboard
  useEffect(() => {
    if (!isAuthenticated() || !hasAdminAccess()) {
      router.replace("/admin/login");
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  // Echtzeit-Ticket-Daten von Convex
  const tickets = useQuery(api.tickets.list) as Ticket[] | undefined;

  if (!authChecked) return null;

  if (tickets === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <Spinner className="w-8 h-8 text-blue-600" />
      </div>
    );
  }

  return <AnalyticsContent tickets={tickets} />;
}

/**
 * AnalyticsContent – Haupt-UI der Auswertungsseite.
 *
 * Berechnet alle Kennzahlen aus den Rohdaten und rendert Diagramme + KPI-Kacheln.
 *
 * @param tickets - Vollständige Ticket-Liste aus Convex
 */
function AnalyticsContent({ tickets }: { tickets: Ticket[] }) {

  // ── KPI-Berechnungen ──────────────────────────────────────────────────────

  const total = tickets.length;
  const erledigt = tickets.filter((t) => t.status === "erledigt").length;
  const hoch = tickets.filter((t) => t.urgency === "Hoch").length;

  /** Erledigungsrate in Prozent (abgerundet) */
  const erledigungsRate = total > 0 ? Math.round((erledigt / total) * 100) : 0;

  // ── Kategorienverteilung für Kreisdiagramm ───────────────────────────────

  const categoryMap: Record<string, number> = {};
  tickets.forEach((t) => {
    const cat = t.category || "Sonstiges"; // Tickets ohne Kategorie → "Sonstiges"
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  // Nach Anzahl absteigend sortieren für bessere Lesbarkeit
  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // ── Dringlichkeitsverteilung für Balkendiagramm ──────────────────────────

  const urgencyMap: Record<string, number> = { Hoch: 0, Mittel: 0, Niedrig: 0 };
  tickets.forEach((t) => {
    if (t.urgency) urgencyMap[t.urgency] = (urgencyMap[t.urgency] || 0) + 1;
  });
  const urgencyData = Object.entries(urgencyMap).map(([name, value]) => ({ name, value }));

  // ── Durchsatz der letzten 7 Tage ─────────────────────────────────────────

  const now = Date.now();
  const dayMs = 86_400_000; // Millisekunden pro Tag

  /**
   * Erzeugt ein Array mit 7 Einträgen (heute - 6 Tage bis heute).
   * Jeder Eintrag enthält das Datum (kurz) und die Anzahl erstellter Tickets an diesem Tag.
   */
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * dayMs);
    return {
      date: d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric" }),
      count: tickets.filter((t) => {
        const diff = now - t.createdAt;
        return diff >= (6 - i) * dayMs && diff < (7 - i) * dayMs;
      }).length,
    };
  });

  // ── CSV-Export ────────────────────────────────────────────────────────────

  /**
   * Erstellt eine CSV-Datei aus allen Tickets und startet den Browser-Download.
   *
   * Format: Semikolon-getrennt, UTF-8 mit BOM (für Excel-Kompatibilität).
   * Anführungszeichen in Textfeldern werden escaped.
   */
  const exportCSV = () => {
    const header = ["ID", "Erstellt", "Beschreibung", "Kategorie", "Dringlichkeit", "Status", "KI-Zusammenfassung"];
    const rows = tickets.map((t) => [
      t._id,
      new Date(t.createdAt).toLocaleString("de-DE"),
      `"${t.description.replace(/"/g, '""')}"`,   // Anführungszeichen escapen
      t.category || "",
      t.urgency || "",
      t.status,
      `"${(t.aiSummary || "").replace(/"/g, '""')}"`,
    ]);

    // CSV-String zusammenbauen
    const csv = [header, ...rows].map((r) => r.join(";")).join("\n");

    // BOM (Byte Order Mark) für Excel-Kompatibilität voranstellen
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });

    // Temporären Download-Link erstellen und klicken
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url); // Speicher freigeben
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">

      {/* Header mit Navigation und Export-Button */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Zurück zum Dashboard */}
            <Link
              href="/admin"
              className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors mr-2"
              aria-label="Zurück zum Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Auswertung & KPIs</h1>
              <p className="text-[11px] text-gray-400 font-medium tracking-wide uppercase">{ROLE_LABELS[getRole() as UserRole] || "Verwaltung"} · Analytics-Ansicht</p>
            </div>
          </div>

          {/* CSV-Export Button */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
            title="Alle Tickets als CSV exportieren"
          >
            <Download className="w-4 h-4" />
            CSV-Export
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* KPI-Kacheln: 4 wichtigste Kennzahlen auf einen Blick */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            label="Tickets gesamt"
            value={total}
            sub="alle Meldungen"
            icon={<Activity className="w-5 h-5" />}
            color="blue"
          />
          <KpiCard
            label="Erledigungsrate"
            value={`${erledigungsRate}%`}
            sub={`${erledigt} von ${total} erledigt`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
          />
          <KpiCard
            label="Dringend (Hoch)"
            value={hoch}
            sub="sofort priorisieren"
            icon={<AlertTriangle className="w-5 h-5" />}
            color="red"
          />
          <KpiCard
            label="Durchsatz Ø/Tag"
            value={(total / 7).toFixed(1)}
            sub="letzte 7 Tage"
            icon={<Clock className="w-5 h-5" />}
            color="amber"
          />
        </div>

        {/* Diagramme: Kategorien + Dringlichkeit nebeneinander */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Kreisdiagramm: Kategorienverteilung */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-blue-500" />
              Kategorienverteilung
            </h2>
            {categoryData.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Noch keine Daten</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}   // Donut-Form statt ausgefülltem Kreis
                    outerRadius={100}
                    paddingAngle={3}   // Kleiner Abstand zwischen Segmenten
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.name] || "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Tickets`, ""]} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Balkendiagramm: Dringlichkeitsverteilung */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Dringlichkeitsverteilung
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={urgencyData} barSize={48}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <Tooltip formatter={(value) => [`${value} Tickets`, "Anzahl"]} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {urgencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={URGENCY_COLORS[entry.name] || "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Balkendiagramm: Ticket-Durchsatz letzte 7 Tage */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-500" />
            Ticketaufkommen (letzte 7 Tage)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={days} barSize={32}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Tooltip formatter={(value) => [`${value} Tickets`, "Meldungen"]} />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/**
 * KpiCard – Einzelne KPI-Kachel mit Icon, Wert, Label und Untertext.
 *
 * @param label - Kurzbezeichnung der Kennzahl
 * @param value - Anzuzeigende Zahl oder Prozentangabe
 * @param sub   - Erklärungstext unter dem Wert
 * @param icon  - Lucide-Icon
 * @param color - Farbschema der Kachel
 */
function KpiCard({ label, value, sub, icon, color }: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "red" | "amber";
}) {
  // Farb-Klassen pro Variante
  const colors = {
    blue:  { bg: "bg-blue-50",  text: "text-blue-600",  val: "text-blue-700"  },
    green: { bg: "bg-green-50", text: "text-green-600", val: "text-green-700" },
    red:   { bg: "bg-red-50",   text: "text-red-600",   val: "text-red-700"   },
    amber: { bg: "bg-amber-50", text: "text-amber-600", val: "text-amber-700" },
  };
  const c = colors[color];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      {/* Icon */}
      <div className={`w-10 h-10 ${c.bg} ${c.text} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      {/* Hauptwert */}
      <p className={`text-2xl font-extrabold ${c.val} tracking-tight`}>{value}</p>
      {/* Bezeichnung */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">{label}</p>
      {/* Untertext */}
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
