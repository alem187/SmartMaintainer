import type { Metadata } from "next";
import { DemoWorkspace } from "@/components/DemoWorkspace";

export const metadata: Metadata = {
  title: "SmartMaintain · Interaktiver Arbeitsplatz",
  description:
    "Interaktives Maßnahmenboard mit Zuständigkeiten, Notizen und Analytics. Alle Daten sind erfunden; kein Backend erforderlich.",
  robots: { index: false, follow: false },
};

export default function DemoPage() {
  return <DemoWorkspace />;
}
