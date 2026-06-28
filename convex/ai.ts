/**
 * @file convex/ai.ts
 * @description KI-Analyse-Modul für SmartMaintain – Gemini AI Integration.
 *
 * Analysiert Schadensmeldungen automatisch und erkennt:
 * - Gewerk/Kategorie (z.B. Sanitär, Elektro, Heizung)
 * - Dringlichkeit (Hoch / Mittel / Niedrig)
 * - Kurzzusammenfassung (max. 6 Wörter)
 *
 * Technischer Ablauf:
 * 1. analyzeTicket wird von tickets.create via ctx.scheduler.runAfter gestartet
 * 2. Gemini API wird mit strukturiertem Prompt aufgerufen
 * 3. JSON-Antwort wird geparst und via updateAnalysis in der DB gespeichert
 * 4. Bei Fehler oder fehlendem API-Key: Fallback-Werte werden gespeichert
 *
 * API-Key Konfiguration:
 * - Key wird als Convex Environment Variable gespeichert: GOOGLE_API_KEY
 * - Setzen via: npx convex env set GOOGLE_API_KEY "dein-key"
 * - Neue Google AI Studio Keys (AQ. Format) werden via x-goog-api-key Header übergeben
 */

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Fallback-Werte die gespeichert werden wenn die KI-Analyse nicht möglich ist.
 * Verhindert dass Tickets ohne Kategorie/Dringlichkeit bleiben.
 */
const FALLBACK_ANALYSIS = {
  category: "Sonstiges",
  urgency: "Mittel",
  aiSummary: "Automatische Analyse nicht verfügbar",
};

/** Verwendetes Gemini-Modell (Google AI Studio) */
const GEMINI_MODEL = "gemini-2.5-flash";

/**
 * API-Endpunkt für die Gemini Generative Language API.
 * v1beta wird benötigt für Kompatibilität mit den neueren AQ. API-Keys.
 */
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Erstellt den strukturierten Prompt für die Gemini-Anfrage.
 *
 * Der Prompt ist so formuliert, dass Gemini ausschließlich ein valides
 * JSON-Objekt zurückgibt (kein Markdown, keine Erklärungen).
 * Das macht das Parsen der Antwort zuverlässiger.
 *
 * Klassifikationsregeln:
 * - Hoch:    Wasserschaden, Stromausfall, Gasgeruch, gesundheitsgefährdend
 * - Mittel:  Defekte Geräte, tropfender Hahn, Heizung kaputt
 * - Niedrig: Kosmetische Schäden, quietschende Tür, abblätternder Putz
 *
 * @param description - Die Schadensbeschreibung des Mieters
 * @returns Vollständiger Prompt-String für die Gemini API
 */
function buildPrompt(description: string): string {
  return `Du bist ein Assistent für eine Hausverwaltung. Analysiere die folgende Schadensmeldung eines Mieters und antworte NUR mit einem validen JSON-Objekt (kein Markdown, keine Erklärung).

Schadensmeldung: "${description}"

Antworte mit genau diesem JSON-Format:
{
  "category": "<Sanitär | Elektro | Heizung | Schädlinge | Fenster/Türen | Dach/Fassade | Aufzug | Allgemein | Sonstiges>",
  "urgency": "<Hoch | Mittel | Niedrig>",
  "summary": "<kurze Zusammenfassung in max. 6 Wörtern>"
}

Regeln:
- "Hoch" = Wasserschaden, Stromausfall, Gasgeruch, gesundheitsgefährdend
- "Mittel" = Defekte Geräte, tropfender Hahn, Heizung kaputt
- "Niedrig" = Kosmetische Schäden, quietschende Tür, abblätternder Putz`;
}

/**
 * Parst die JSON-Antwort der Gemini API.
 *
 * Bereinigt mögliche Markdown-Code-Blöcke (```json ... ```) die Gemini
 * gelegentlich trotz Anweisung zurückgibt, bevor JSON.parse aufgerufen wird.
 *
 * @param text - Rohtext aus der Gemini API Antwort
 * @returns Strukturiertes Analyse-Objekt mit category, urgency, aiSummary
 * @throws JSON.parse-Fehler wenn die Antwort kein valides JSON ist
 */
function parseAiResponse(text: string) {
  // Markdown-Code-Blöcke entfernen falls vorhanden
  const cleaned = text.replace(/```json|```/g, "").trim();
  const json = JSON.parse(cleaned);
  return {
    category: json.category || FALLBACK_ANALYSIS.category,
    urgency:  json.urgency  || FALLBACK_ANALYSIS.urgency,
    aiSummary: json.summary || "Keine Zusammenfassung",
  };
}

/**
 * analyzeTicket – Interne Convex-Action für die KI-Analyse eines Tickets.
 *
 * Wird ausschließlich intern von tickets.create via ctx.scheduler aufgerufen.
 * Läuft asynchron im Hintergrund, blockiert nicht die Ticket-Erstellung.
 *
 * Fehlerbehandlung:
 * - Kein API-Key: Sofortiger Fallback, Warnung im Log
 * - Rate Limit (429): Bis zu 3 Versuche mit 10s Pause dazwischen
 * - Sonstige Fehler: Fallback mit Fehlermeldung im aiSummary-Feld
 *
 * @param ticketId    - ID des zu analysierenden Tickets
 * @param description - Schadensbeschreibung die analysiert werden soll
 */
export const analyzeTicket = internalAction({
  args: {
    ticketId: v.id("tickets"),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // API-Key aus Convex Environment Variables lesen
    const apiKey = process.env.GOOGLE_API_KEY;

    // Kein API-Key gesetzt: Fallback speichern und abbrechen
    if (!apiKey) {
      console.warn("GOOGLE_API_KEY nicht gesetzt – KI-Analyse übersprungen.");
      await ctx.runMutation(internal.tickets.updateAnalysis, {
        ticketId: args.ticketId,
        ...FALLBACK_ANALYSIS,
      });
      return;
    }

    // Retry-Schleife für Rate-Limit-Handling (max. 3 Versuche)
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        /**
         * Gemini API Anfrage.
         * Authentifizierung via x-goog-api-key Header (unterstützt AQ. Format Keys).
         * Alternative: ?key=API_KEY Query-Parameter für ältere AIzaSy... Keys.
         */
        const res = await fetch(GEMINI_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildPrompt(args.description) }] }],
          }),
        });

        // HTTP-Fehler: Status-Code und Body für Debugging auslesen
        if (!res.ok) {
          const errorBody = await res.text();
          throw { status: res.status, message: errorBody };
        }

        // Erfolgreiche Antwort: Text extrahieren und parsen
        const data = await res.json();
        const text = data.candidates[0].content.parts[0].text;
        const analysis = parseAiResponse(text);

        // Analyseergebnis in Datenbank speichern
        await ctx.runMutation(internal.tickets.updateAnalysis, {
          ticketId: args.ticketId,
          ...analysis,
        });
        return; // Erfolgreich: Schleife beenden

      } catch (e: any) {
        const isRateLimit = e?.status === 429;

        // Rate Limit: Warten und erneut versuchen
        if (isRateLimit && attempt < maxRetries) {
          console.warn(`Rate limit (Versuch ${attempt}/${maxRetries}), warte 10s...`);
          await new Promise((r) => setTimeout(r, 10000));
          continue;
        }

        // Alle Versuche fehlgeschlagen oder anderer Fehler: Fallback speichern
        console.error("KI-Analyse fehlgeschlagen:", e);
        await ctx.runMutation(internal.tickets.updateAnalysis, {
          ticketId: args.ticketId,
          category: FALLBACK_ANALYSIS.category,
          urgency: FALLBACK_ANALYSIS.urgency,
          aiSummary: isRateLimit
            ? "Rate-Limit erreicht – bitte später erneut versuchen"
            : "Analyse fehlgeschlagen",
        });
      }
    }
  },
});
