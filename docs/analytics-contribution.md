# Arbeitsplatz und Analytics: Entscheidungen und Validierung

## Problem und Ergebnis

Die beiden Analytics-Seiten enthielten dieselben Berechnungen und CSV-Exporter.
Der Tagesdurchschnitt teilte die gesamte Tickethistorie durch sieben. Die
Tagesbeschriftungen zeigten Kalenderdaten, während die Zählung rollierende
24-Stunden-Fenster verwendete. Erledigte Tickets mit hoher Dringlichkeit
erschienen weiterhin als zu priorisierende Arbeit.

Beide Rollen verwenden jetzt `AnalyticsReport` und dieselben reinen Funktionen
in `src/lib/analytics.ts`. Die ursprüngliche Anwendung und ihr Backend bleiben
die Grundlage. Dieser Beitrag ergänzt einen interaktiven Demo-Arbeitsplatz,
die gemeinsame Auswertung sowie Tests und Dokumentation. Der Arbeitsplatz
zeigt den eigentlichen Bearbeitungsablauf zusätzlich zur Kennzahlenansicht.

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
- Die Analytics-Liste ist rein lesend. In der isolierten Demo erfolgen Änderungen
  im Arbeitsplatz; im bisherigen Echtzeitbetrieb bleiben sie im Dashboard.

## Demonstration

`/demo` startet mit dem **Arbeitsplatz**. Drei Statusspalten zeigen neue,
in Bearbeitung befindliche und erledigte Beispieltickets. Karten lassen sich
am Desktop zwischen den Spalten ziehen. Auf dem Smartphone wird eine Spalte
gewählt; der Status lässt sich unabhängig von Drag-and-drop im Detail ändern.
Dort können Nutzer ein Demo-Team zuweisen, den nächsten Schritt speichern und
Notizen ergänzen. Neue Meldungen werden lokal angelegt. Suche, Kategorie sowie
Filter für dringende und unzugewiesene offene Fälle unterstützen die Übersicht.

Die zweite Ansicht **Auswertung** erhält denselben Ticketzustand. Statuswechsel
und neue Beispieltickets wirken sich auf Kennzahlen und Export aus. Die Filter
der beiden Ansichten sind unabhängig; das Umschalten erhält die Tickets.
Der Leerzustand der Auswertung ist ein Anzeigeexperiment und löscht keine Tickets.
Der übergeordnete Zurücksetzen-Button stellt die ursprünglichen Fixtures wieder her.

Die zwölf ursprünglichen Tickets sind handgeschrieben, mit festem Bezugszeitpunkt
21.10.2026, 14:00 Uhr Berlin. Neue Beispieltickets verwenden denselben Zeitpunkt.
Keine echten Mieter, Adressen, Fotos oder Tickets. Kein Convex-Provider wird auf
dieser Route gemountet, keine Backend-Queries oder KI-Aufrufe.

**Alle Änderungen bleiben ausschließlich im React-Zustand des geöffneten Tabs.**
Neuladen verwirft sie; es gibt weder Datenbank- noch Local-Storage-Persistenz.
Teamzuweisungen benachrichtigen niemanden. Neue Meldungen erzeugen keine echten
Tickets. CSV entsteht ausschließlich lokal. Die Beispieldaten und Ergänzungen
ersetzen nie Daten im Admin-/Viewer-Bereich. Team-, Notiz- und Planungselemente
sind Demo-Funktionen und wurden nicht in das bestehende Backend integriert.

## CSV-Vertrag

Semikolon, CRLF, UTF-8-BOM. Jedes Feld wird in doppelte Anführungszeichen gesetzt;
enthaltene Anführungszeichen werden verdoppelt. Führende Formelzeichen
`=`, `+`, `-`, `@` sowie Tab/Zeilenumbrüche werden durch ein Apostroph neutralisiert,
auch hinter führenden Leer-/Steuerzeichen. Das verändert solche Zellwerte
absichtlich. Export enthält auch Ort und explizite Zeitzonenangabe.
Der Export ist kein verlustfreies Backupformat. Er umfasst Ticketdaten, aber
keine Demo-Zuständigkeiten, nächsten Schritte oder Notizen.

## Validierung

`npm test` verwendet den eingebauten Node-Testläufer, ohne zusätzlichen Runner.
14 Regressionstests umfassen zehn Analytics- und vier Workflow-Tests:
Zeitraumgrenzen, beide Sommerzeitwechsel, Suche, leere Daten, ausstehende Analyse,
offene Dringlichkeit, CSV-Struktur/Formeln sowie Initialisierung und Änderungen
des lokalen Workflows. Die Workflow-Funktionen verändern ihre Eingabedaten nicht.
`npm run lint`, `npm run typecheck`, `npm run build` ergänzen die Prüfung.
GitHub Actions führt Tests, Lint, Build (inklusive TypeScript) und Produktionsaudit aus.

Manuell geprüft: 1440px und 390px, kein horizontaler Seitenüberlauf,
Zeitraumwechsel, Suchtreffer, CSV-Download mit passender Zeilenanzahl,
Leerzustand mit deaktiviertem Export, Filter zurücksetzen, Browserkonsole.
Arbeitsplatz: Teamzuweisung, nächster Schritt, Notiz, Statuswechsel mit aktualisierter
Auswertung, neue Beispielmeldung (12 → 13) und Zurücksetzen (13 → 12). Mobil:
Spaltenwechsel, scrollbarer modaler Ticketdialog, Escape und kein horizontaler
Überlauf; der Dialog verwendet die native modale Fokusführung.

## Grenzen und nächste Schritte

- Vorhandene Anmeldung ist eine Browser-Demo. Rollen/Zugangswerte liegen im
  Client; Convex-Endpunkte brauchen vor Echtdaten serverseitige Identitäts- und
  Berechtigungsprüfungen. Dieser Beitrag implementiert keine produktive Anmeldung.
- Kein Deployment und keine Convex-Konfiguration werden hier verändert.
- Der neue Arbeitsplatz ist eine lokale Produktdemo. Für echte Zusammenarbeit
  fehlen unter anderem serverseitige Speicherung, Rollenprüfung, Änderungshistorie
  und Benachrichtigungen; diese Funktionen werden nicht vorgetäuscht.
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

> Beitrag zu SmartMaintain: interaktiver Demo-Arbeitsplatz mit Ticketboard,
> Teamzuweisung, nächsten Schritten und Notizen; gemeinsame responsive
> Analytics für zwei Rollen mit Kalenderauswertung für Europe/Berlin und
> robustem CSV-Export. Mit synthetischen Daten, 14 Regressionstests und
> GitHub Actions; bestehende Backend- und Authentifizierungsgrenzen dokumentiert.

Den Pull Request als konkreten Arbeitsnachweis verlinken. Bis zum Merge lautet
der Status „Beitrag vorgeschlagen“; die ursprüngliche Anwendung nicht als
vollständige Eigenentwicklung darstellen.
