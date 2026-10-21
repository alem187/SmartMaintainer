# Analytics: Entscheidungen und Validierung

## Problem und Ergebnis

Die beiden Analytics-Seiten enthielten dieselben Berechnungen und CSV-Exporter.
Der Tagesdurchschnitt teilte die gesamte Tickethistorie durch sieben. Die
Tagesbeschriftungen zeigten Kalenderdaten, während die Zählung rollierende
24-Stunden-Fenster verwendete. Erledigte Tickets mit hoher Dringlichkeit
erschienen weiterhin als zu priorisierende Arbeit.

Beide Rollen verwenden jetzt `AnalyticsReport` und dieselben reinen Funktionen
in `src/lib/analytics.ts`. Die ursprüngliche Anwendung und ihr Backend bleiben
die Grundlage; dieser Beitrag betrifft Analytics, Demo, Tests und Dokumentation.

## Definitionen

- **Zeitraum:** 7 oder 30 Kalendertage einschließlich heute, alternativ gesamte
  bisherige Historie. Zukunftsdatierte/ungültige Zeitstempel werden ausgeblendet.
- **Zeitzone:** Europe/Berlin, unabhängig vom Gerät. Kalenderdaten werden mit
  `Intl.DateTimeFormat` ermittelt; Sommerzeitgrenzen sind abgedeckt.
- **Erledigungsrate:** aktuell erledigte Meldungen geteilt durch alle Treffer.
  Dies ist keine Aussage über Erledigungsdauer oder SLA-Erfüllung.
- **Dringend & offen:** Priorität Hoch, Status nicht erledigt.
- **Eingang Ø/Tag:** Treffer aus den letzten sieben Kalendertagen geteilt durch
  sieben, auch wenn der ausgewählte Zeitraum länger ist. Heute ist ein Teiltag.
- Suche und Zeitraum wirken auf KPIs, Diagramm, Liste und CSV gemeinsam.
- Die Liste ist rein lesend. Statusänderungen bleiben im bestehenden Dashboard.

## Demonstration

`/demo` zeigt zwölf handgeschriebene Beispieltickets mit festem Bezugszeitpunkt
21.10.2026, 14:00 Uhr Berlin. Keine echten Mieter, Adressen, Fotos oder Tickets.
Kein Convex-Provider wird auf dieser Route gemountet, keine Backend-Queries oder
KI-Aufrufe. CSV entsteht ausschließlich lokal. Der Leerzustand ist umschaltbar.
Die Beispieldaten ersetzen nie Daten im Admin-/Viewer-Bereich.

## CSV-Vertrag

Semikolon, CRLF, UTF-8-BOM. Jedes Feld wird in doppelte Anführungszeichen gesetzt;
enthaltene Anführungszeichen werden verdoppelt. Führende Formelzeichen
`=`, `+`, `-`, `@` sowie Tab/Zeilenumbrüche werden durch ein Apostroph neutralisiert,
auch hinter führenden Leer-/Steuerzeichen. Das verändert solche Zellwerte
absichtlich. Export enthält auch Ort und explizite Zeitzonenangabe.
Der Export ist kein verlustfreies Backupformat.

## Validierung

`npm test` verwendet den eingebauten Node-Testläufer, ohne zusätzlichen Runner.
Regressionstests decken Zeitraumgrenzen, beide Sommerzeitwechsel, Suche,
leere Daten, ausstehende Analyse, offene Dringlichkeit und CSV-Struktur/Formeln ab.
`npm run lint`, `npm run typecheck`, `npm run build` ergänzen die Prüfung.
GitHub Actions führt Tests, Lint, Build (inklusive TypeScript) und Produktionsaudit aus.

Manuell geprüft: 1440px und 390px, kein horizontaler Seitenüberlauf,
Zeitraumwechsel, Suchtreffer, CSV-Download mit passender Zeilenanzahl,
Leerzustand mit deaktiviertem Export, Filter zurücksetzen, Browserkonsole.

## Grenzen und nächste Schritte

- Vorhandene Anmeldung ist eine Browser-Demo. Rollen/Zugangswerte liegen im
  Client; Convex-Endpunkte brauchen vor Echtdaten serverseitige Identitäts- und
  Berechtigungsprüfungen. Dieser Beitrag implementiert keine produktive Anmeldung.
- Kein Deployment und keine Convex-Konfiguration werden hier verändert.
- Bisheriges Schema hat keinen Erledigungszeitpunkt: keine erfundenen
  Bearbeitungszeiten, SLA-Zahlen oder Trends gegenüber dem Vormonat.
- KI-Fehler können bisher als Mittel/Sonstiges gespeichert werden. Verteilungen
  belegen keine Modellgenauigkeit; fachliche Prüfung bleibt nötig.
- Gesamte Ticketliste wird weiterhin im Client aggregiert. Für große Bestände:
  serverseitige Aggregation, Pagination und zugriffsgeschützte Exporte ergänzen.
- Next.js und Lockfile wurden aktualisiert. `npm audit --omit=dev` meldete am
  21.10.2026 null bekannte Produktionslücken. Vollaudit: fünf hohe Meldungen
  über `braces → micromatch → fast-glob → @next/eslint-plugin-next →
eslint-config-next` im Entwicklungspfad. Kein erzwungenes Framework-Downgrade.
  Die vorhandene Bildkomponente erzeugt weiterhin einen Lint-Performancehinweis.

## Portfolio-Beschreibung

> Beitrag zu SmartMaintain: responsive Analytics-Oberfläche für zwei Rollen,
> interaktive Demo mit synthetischen Daten, korrekte Kalenderauswertung für
> Europe/Berlin und robuster CSV-Export. Mit Regressionstests und GitHub Actions
> abgesichert; bestehende Backend- und Authentifizierungsgrenzen dokumentiert.

Den Pull Request als konkreten Arbeitsnachweis verlinken. Bis zum Merge lautet
der Status „Beitrag vorgeschlagen“; die ursprüngliche Anwendung nicht als
vollständige Eigenentwicklung darstellen.
