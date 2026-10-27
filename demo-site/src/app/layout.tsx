import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#11254b",
};

export const metadata: Metadata = {
  title: "SmartMaintain · Interaktiver Demo-Arbeitsplatz",
  description:
    "Der bestehende SmartMaintainer-Demo-Arbeitsplatz als statischer Auszug: Tickets zuweisen, Status und Notizen bearbeiten, Auswertungen und CSV-Export ausprobieren. Ausschließlich erfundene Daten.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className="antialiased">
        {children}
        <footer className="border-t border-slate-200 bg-white px-4 py-5 text-center text-[11px] leading-relaxed text-slate-500">
          Statischer Auszug des bestehenden SmartMaintainer-Demo-Arbeitsplatzes.
          {" "}
          <a className="underline underline-offset-2 hover:text-blue-700" href="https://github.com/alem187/SmartMaintainer" target="_blank" rel="noreferrer">Originalprojekt</a>
          {" · "}
          <a className="underline underline-offset-2 hover:text-blue-700" href="https://github.com/alem187/SmartMaintainer/pull/1" target="_blank" rel="noreferrer">Beitrag: Demo, Analytics und Tests</a>
          <br />
          Kein Live-System, keine echte KI-Auswertung, kein Versand. Änderungen bleiben bis zum Neuladen nur im Arbeitsspeicher.
        </footer>
      </body>
    </html>
  );
}
