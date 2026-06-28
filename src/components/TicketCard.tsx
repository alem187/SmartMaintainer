/**
 * @file TicketCard.tsx
 * @description Ticket-Karte für die Darstellung einer Schadensmeldung.
 *
 * Unterstützt zwei Modi:
 * - Standard (readOnly=false): Verwalter können Status per Dropdown ändern
 * - Read-only (readOnly=true):  Viewer sehen Status nur als Badge (kein Dropdown)
 *
 * Props:
 * @param ticket   - Das Ticket-Objekt aus der Convex-Datenbank
 * @param readOnly - true = kein Status-Dropdown (für Viewer-Rolle), default: false
 */
"use client";

import { useMutation } from "convex/react";
import { AlertTriangle, CheckCircle2, Clock, Zap } from "lucide-react";
import { api } from "@convex/_generated/api";
import { TicketImage } from "@/components/TicketImage";
import type { Ticket, TicketUrgency } from "@/lib/types";
import { STATUS_OPTIONS, URGENCY_STYLES } from "@/lib/types";

/** Icons pro Dringlichkeitsstufe */
const URGENCY_ICONS: Record<TicketUrgency, typeof AlertTriangle> = {
  Hoch:    Zap,
  Mittel:  Clock,
  Niedrig: CheckCircle2,
};

/** Farbgebung pro Kategorie als Tailwind-Klassen */
const CATEGORY_COLORS: Record<string, string> = {
  "Sanitär":       "bg-cyan-50 text-cyan-700 border-cyan-100",
  "Elektro":       "bg-amber-50 text-amber-700 border-amber-100",
  "Heizung":       "bg-orange-50 text-orange-700 border-orange-100",
  "Schädlinge":    "bg-rose-50 text-rose-700 border-rose-100",
  "Fenster/Türen": "bg-indigo-50 text-indigo-700 border-indigo-100",
  "Dach/Fassade":  "bg-stone-50 text-stone-700 border-stone-100",
  "Aufzug":        "bg-violet-50 text-violet-700 border-violet-100",
  "Allgemein":     "bg-gray-50 text-gray-600 border-gray-100",
  "Sonstiges":     "bg-slate-50 text-slate-600 border-slate-100",
};

/**
 * Gibt Tailwind-Klassen für den Status-Badge zurück.
 * @param status - "neu" | "in_bearbeitung" | "erledigt"
 */
function getStatusStyles(status: string) {
  switch (status) {
    case "neu":            return "bg-blue-50 text-blue-700 border-blue-100";
    case "in_bearbeitung": return "bg-amber-50 text-amber-700 border-amber-100";
    case "erledigt":       return "bg-emerald-50 text-emerald-700 border-emerald-100";
    default:               return "bg-gray-50 text-gray-600 border-gray-100";
  }
}

/**
 * Übersetzt den Status-Schlüssel in lesbaren deutschen Text.
 * @param status - Interner Status-Schlüssel
 */
function getStatusLabel(status: string) {
  switch (status) {
    case "neu":            return "Neu";
    case "in_bearbeitung": return "In Arbeit";
    case "erledigt":       return "Erledigt";
    default:               return status;
  }
}

/**
 * Berechnet eine relative Zeitangabe aus einem Timestamp.
 * @param timestamp - Unix-Timestamp in Millisekunden (Date.now()-Format)
 * @returns Lesbarer String wie "vor 5 Min.", "vor 2 Std.", "vor 3 Tagen"
 */
function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(diff / 3600000);
  const days    = Math.floor(diff / 86400000);

  if (minutes < 1)  return "Gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  if (hours < 24)   return `vor ${hours} Std.`;
  if (days < 7)     return `vor ${days} Tag${days > 1 ? "en" : ""}`;
  return new Date(timestamp).toLocaleDateString("de-DE");
}

/**
 * TicketCard – Visuelle Karte für eine einzelne Schadensmeldung.
 *
 * @param ticket   - Ticket-Daten aus Convex
 * @param readOnly - Wenn true: Status-Dropdown wird durch statisches Badge ersetzt
 *                   (verwendet für Viewer-Rolle: Geschäftsführung / IT)
 */
export function TicketCard({
  ticket,
  readOnly = false,
}: {
  ticket: Ticket;
  readOnly?: boolean;
}) {
  // Status-Update-Mutation (nur bei readOnly=false verwendet)
  const updateStatus = useMutation(api.tickets.updateStatus);

  const urgencyKey    = (ticket.urgency as TicketUrgency) || "Mittel";
  const style         = URGENCY_STYLES[urgencyKey] || URGENCY_STYLES.Mittel;
  const UrgencyIcon   = URGENCY_ICONS[urgencyKey] || Clock;
  const categoryColor = CATEGORY_COLORS[ticket.category || ""] || CATEGORY_COLORS["Allgemein"];

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-200">

      {/* Dringlichkeits-Farbbalken oben */}
      <div className={`h-1 w-full ${style.bar}`} />

      <div className="p-5">
        {/* Zeile 1: Kategorie-Badge + Zeitangabe */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${categoryColor}`}>
            {ticket.category || "⏳ Analysiere…"}
          </span>
          <span className="text-[11px] text-gray-400 font-medium">
            {getRelativeTime(ticket.createdAt)}
          </span>
        </div>

        {/* KI-Zusammenfassung als Titel */}
        <h3 className="text-[15px] font-bold text-gray-900 mb-1 leading-snug">
          {ticket.aiSummary || "Neue Meldung"}
        </h3>

        {/* Originalbeschreibung (max. 2 Zeilen) */}
        <p className="text-gray-400 text-[13px] leading-relaxed line-clamp-2 mb-3">
          {ticket.description}
        </p>

        {/* Foto falls vorhanden */}
        {ticket.storageId && <TicketImage storageId={ticket.storageId} />}

        {/* Footer: Dringlichkeit + Status */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-50">

          {/* Dringlichkeits-Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${style.bg} ${style.text}`}
            style={{ borderColor: "transparent" }}
          >
            <UrgencyIcon className="w-3 h-3" />
            {ticket.urgency || "…"}
          </div>

          {readOnly ? (
            /**
             * READ-ONLY Modus (Viewer-Rolle):
             * Status wird als einfaches Badge angezeigt – kein Dropdown, keine Änderung möglich.
             */
            <div className={`inline-flex items-center rounded-lg text-[11px] font-semibold border px-2.5 py-1 ${getStatusStyles(ticket.status)}`}>
              {getStatusLabel(ticket.status)}
            </div>
          ) : (
            /**
             * EDIT Modus (Admin-Rolle):
             * Status-Dropdown erlaubt direkte Statusänderung via Convex-Mutation.
             */
            <div className={`inline-flex items-center rounded-lg text-[11px] font-semibold border px-1 ${getStatusStyles(ticket.status)}`}>
              <select
                value={ticket.status}
                onChange={(e) =>
                  updateStatus({ ticketId: ticket._id, status: e.target.value })
                }
                className="bg-transparent border-none outline-none py-1 px-1 cursor-pointer text-inherit font-inherit"
                aria-label="Ticket-Status ändern"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
