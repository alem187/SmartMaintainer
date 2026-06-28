import { Id } from "@convex/_generated/dataModel";

export interface Ticket {
  _id: Id<"tickets">;
  _creationTime: number;
  description: string;
  location?: string;
  storageId?: Id<"_storage">;
  status: TicketStatus;
  category?: TicketCategory;
  urgency?: TicketUrgency;
  aiSummary?: string;
  createdAt: number;
}

export type TicketStatus = "neu" | "in_bearbeitung" | "erledigt";
export type TicketUrgency = "Hoch" | "Mittel" | "Niedrig";
export type TicketCategory =
  | "Sanitär"
  | "Elektro"
  | "Heizung"
  | "Schädlinge"
  | "Fenster/Türen"
  | "Dach/Fassade"
  | "Aufzug"
  | "Allgemein"
  | "Sonstiges";

export const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "neu", label: "Neu" },
  { value: "in_bearbeitung", label: "In Bearbeitung" },
  { value: "erledigt", label: "Erledigt" },
];

export const URGENCY_STYLES: Record<
  TicketUrgency,
  { bar: string; text: string; bg: string }
> = {
  Hoch: { bar: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
  Mittel: { bar: "bg-yellow-400", text: "text-yellow-700", bg: "bg-yellow-50" },
  Niedrig: { bar: "bg-green-400", text: "text-green-700", bg: "bg-green-50" },
};

export const CATEGORIES: TicketCategory[] = [
  "Sanitär",
  "Elektro",
  "Heizung",
  "Schädlinge",
  "Fenster/Türen",
  "Dach/Fassade",
  "Aufzug",
  "Allgemein",
  "Sonstiges",
];
