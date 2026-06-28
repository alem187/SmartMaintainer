# SmartMaintain

**Intelligentes Ticketsystem für die Hausverwaltung** — Mieter melden Schäden mobil, KI kategorisiert automatisch, Verwalter behalten den Überblick.

---

## Was ist SmartMaintain?

SmartMaintain ist eine Web-App für Hausverwaltungen, die den Prozess von Schadensmeldungen digitalisiert und durch KI automatisiert. Mieter können über ein mobilfreundliches Formular Schäden melden — inklusive Fotoupload. Die Meldung wird in Echtzeit von Google Gemini analysiert und automatisch kategorisiert, priorisiert und zusammengefasst. Verwalter sehen alle Tickets auf einem übersichtlichen Dashboard.

## Features

### Mieter-Ansicht (Mobile-First)
- Schadensmeldung über ein einfaches Formular
- Fotoupload mit Vorschau und Löschmöglichkeit
- Zeichenzähler für die Beschreibung
- Animierter Erfolgsstatus nach Einreichung
- Optimiert für iOS und Android (Safe-Area, kein Zoom, Touch-Feedback)

### Admin-Dashboard
- Übersicht aller eingegangenen Tickets
- Statistik-Kacheln: Gesamt, Neue, In Bearbeitung, Dringend
- Filterleiste: Alle / Neu / In Arbeit / Erledigt
- Status direkt im Ticket ändern (Neu → In Bearbeitung → Erledigt)
- Echtzeit-Updates ohne Seitenreload

### KI-Analyse (Google Gemini API)
- **Verwendete API:** Google AI Studio (`generativelanguage.googleapis.com`)
- Automatische Kategorisierung: Sanitär, Elektro, Heizung, Schädlinge, Fenster/Türen, Dach/Fassade, Aufzug, Allgemein, Sonstiges
- Dringlichkeitsbewertung: Hoch, Mittel, Niedrig
- Kurzzusammenfassung in max. 6 Wörtern
- Fallback bei API-Fehler oder fehlendem Key

## Tech-Stack

| Technologie | Zweck |
|---|---|
| **Next.js 16** | Frontend-Framework (App Router, React 19, Turbopack) |
| **Convex** | Backend, Datenbank, Serverless Functions, Echtzeit-Sync |
| **Google Gemini 2.5 Flash** | KI-Analyse der Schadensmeldungen |
| **Tailwind CSS v4** | Styling und Animationen |
| **TypeScript** | Typsicherheit im gesamten Projekt |
| **Lucide React** | Icons |

## Projektstruktur

```
SmartMaintainer/
├── convex/                  # Backend (Convex)
│   ├── schema.ts            # Datenbank-Schema (Tickets-Tabelle)
│   ├── tickets.ts           # CRUD-Operationen + Status-Updates
│   ├── storage.ts           # Datei-Upload (Fotos)
│   ├── ai.ts                # Gemini-Integration + Analyse-Logik
│   └── _generated/          # Auto-generierte Convex-Typen
├── src/
│   ├── app/
│   │   ├── page.tsx         # Mieter-Formular (Startseite)
│   │   ├── admin/page.tsx   # Verwaltungs-Dashboard
│   │   ├── layout.tsx       # Root-Layout + Convex-Provider
│   │   └── globals.css      # Tailwind + Animationen + iOS-Fixes
│   ├── components/
│   │   ├── TicketCard.tsx    # Ticket-Karte mit Kategorie-Farben
│   │   ├── TicketImage.tsx   # Bildanzeige mit Hover-Zoom
│   │   ├── ConvexClientProvider.tsx
│   │   └── ui/              # Logo, Spinner, StatCard
│   ├── hooks/
│   │   └── useTicketSubmit.ts  # Custom Hook für Formular-Logik
│   └── lib/
│       └── types.ts         # Geteilte Types und Konstanten
├── .env.local               # API-Keys und Convex-Config
└── package.json
```

## Installation & Setup

### Voraussetzungen
- Node.js ≥ 18
- Ein Google AI API Key ([hier erstellen](https://aistudio.google.com/apikey))

### 1. Dependencies installieren

```bash
npm install
```

### 2. Convex einrichten

```bash
npx convex dev --configure new --dev-deployment local
```

### 3. Google API Key setzen

In `.env.local` den Key eintragen:

```
GOOGLE_API_KEY=dein_api_key_hier
```

Dann als Convex-Umgebungsvariable registrieren:

```bash
npx convex env set GOOGLE_API_KEY dein_api_key_hier
```

### 4. Starten

In zwei Terminals:

```bash
# Terminal 1: Convex Backend
npx convex dev

# Terminal 2: Next.js Frontend
npm run dev
```

### 5. Öffnen

- **Mieter-Formular:** [http://localhost:3000](http://localhost:3000)
- **Admin-Dashboard:** [http://localhost:3000/admin](http://localhost:3000/admin)

## Nutzung

### Als Mieter
1. Öffne die Startseite auf dem Handy oder Browser
2. Beschreibe den Schaden im Textfeld
3. Optional: Foto anhängen
4. Absenden — die KI analysiert die Meldung automatisch

### Als Verwalter
1. Öffne `/admin` im Browser
2. Alle Tickets erscheinen in Echtzeit mit KI-Kategorie und Dringlichkeit
3. Filtere nach Status (Neu / In Arbeit / Erledigt)
4. Ändere den Status direkt im Ticket per Dropdown

## Lizenz

MIT
