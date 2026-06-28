/**
 * @file convex/tickets.ts
 * @description Convex-Backend-Funktionen für die Ticket-Verwaltung in SmartMaintain.
 *
 * Enthält alle Datenbankoperationen (Queries und Mutations) rund um Tickets.
 * Diese Funktionen laufen serverseitig auf der Convex-Plattform und sind
 * via Echtzeit-Subscriptions mit dem Frontend verbunden.
 *
 * Übersicht der Funktionen:
 * - create:         Neues Ticket anlegen + KI-Analyse starten
 * - list:           Alle Tickets abrufen (absteigend nach Erstelldatum)
 * - get:            Einzelnes Ticket per ID abrufen
 * - updateStatus:   Status eines Tickets ändern (neu → in_bearbeitung → erledigt)
 * - updateAnalysis: KI-Analyseergebnis in Ticket speichern (intern)
 */

import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * create – Erstellt ein neues Schadensmeldungs-Ticket.
 *
 * Ablauf:
 * 1. Ticket in der Datenbank anlegen (Status: "neu")
 * 2. KI-Analyse asynchron im Hintergrund starten (non-blocking)
 *    → analyzeTicket aus convex/ai.ts kategorisiert Beschreibung via Gemini AI
 *
 * @param description - Freitext-Schadensbeschreibung des Mieters
 * @param storageId   - Optional: ID des hochgeladenen Fotos in Convex Storage
 * @returns ID des neu erstellten Tickets
 */
export const create = mutation({
  args: {
    description: v.string(),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    // Ticket in Datenbank speichern
    const ticketId = await ctx.db.insert("tickets", {
      description: args.description,
      storageId: args.storageId,
      status: "neu",
      createdAt: Date.now(),
    });

    // KI-Analyse sofort im Hintergrund starten (runAfter mit 0ms Delay)
    // → Blockiert die Ticket-Erstellung nicht; Analyse läuft parallel
    await ctx.scheduler.runAfter(0, internal.ai.analyzeTicket, {
      ticketId,
      description: args.description,
    });

    return ticketId;
  },
});

/**
 * list – Gibt alle Tickets in absteigender Reihenfolge zurück.
 *
 * Wird vom Admin-Dashboard und der Analytics-Seite als Echtzeit-Subscription genutzt.
 * Convex aktualisiert automatisch alle Subscriber bei Datenbankänderungen.
 *
 * @returns Array aller Ticket-Dokumente, neueste zuerst
 */
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("tickets").order("desc").collect();
  },
});

/**
 * get – Gibt ein einzelnes Ticket anhand seiner ID zurück.
 *
 * Nützlich für Detail-Ansichten oder wenn nur ein spezifisches Ticket benötigt wird.
 *
 * @param ticketId - Die Convex-Dokument-ID des gesuchten Tickets
 * @returns Das Ticket-Dokument oder null wenn nicht gefunden
 */
export const get = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ticketId);
  },
});

/**
 * updateStatus – Ändert den Bearbeitungsstatus eines Tickets.
 *
 * Wird vom TicketCard-Dropdown im Admin-Dashboard aufgerufen.
 * Mögliche Status-Werte: "neu" | "in_bearbeitung" | "erledigt"
 *
 * @param ticketId - ID des zu aktualisierenden Tickets
 * @param status   - Neuer Status-Wert
 */
export const updateStatus = mutation({
  args: {
    ticketId: v.id("tickets"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, { status: args.status });
  },
});

/**
 * updateAnalysis – Speichert das Ergebnis der KI-Analyse in einem Ticket.
 *
 * Diese Funktion ist **intern** und kann nur von anderen Convex-Funktionen
 * aufgerufen werden (nicht direkt vom Frontend). Sie wird von analyzeTicket
 * in convex/ai.ts nach Abschluss der Gemini-Anfrage aufgerufen.
 *
 * @param ticketId  - ID des analysierten Tickets
 * @param category  - Erkannte Kategorie (z.B. "Sanitär", "Elektro")
 * @param urgency   - Erkannte Dringlichkeit ("Hoch" | "Mittel" | "Niedrig")
 * @param aiSummary - Kurzzusammenfassung der KI (max. 6 Wörter)
 */
export const updateAnalysis = internalMutation({
  args: {
    ticketId: v.id("tickets"),
    category: v.string(),
    urgency: v.string(),
    aiSummary: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, {
      category: args.category,
      urgency: args.urgency,
      aiSummary: args.aiSummary,
    });
  },
});
