import type { Metadata } from "next";
import { AnalyticsReport } from "@/components/AnalyticsReport";
import { DEMO_REFERENCE_TIME, DEMO_TICKETS } from "@/lib/demo-tickets";

export const metadata: Metadata = {
  title: "SmartMaintain · Interaktive Analytics-Demo",
  description:
    "Ticket-Analytics mit Zeitraumfiltern, Suche und CSV-Export. Alle Daten sind erfunden; kein Backend erforderlich.",
  robots: { index: false, follow: false },
};

export default function DemoPage() {
  return (
    <AnalyticsReport
      tickets={DEMO_TICKETS}
      referenceTime={DEMO_REFERENCE_TIME}
      demo
      backHref="/demo"
      roleLabel="Demo · Auswertung"
    />
  );
}
