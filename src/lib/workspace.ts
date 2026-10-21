import type { ReportTicket } from "./analytics";
import type { TicketStatus } from "./types";

export type DemoNote = { id: string; text: string; createdAt: number };
export type WorkspaceTicket = ReportTicket & {
  assignee: string;
  nextStep: string;
  notes: DemoNote[];
};
export const DEMO_ASSIGNEES = [
  "Nicht zugewiesen",
  "Haustechnik",
  "Sanitär-Team",
  "Elektro-Team",
  "Hausverwaltung",
] as const;

export function createWorkspace(
  tickets: readonly ReportTicket[],
): WorkspaceTicket[] {
  return tickets.map((ticket) => ({
    ...ticket,
    assignee: "Nicht zugewiesen",
    nextStep: "",
    notes: [],
  }));
}

/** Pure, immutable local workflow. Does not invoke a backend or send a message. */
export function updateWorkspaceTicket(
  tickets: readonly WorkspaceTicket[],
  id: string,
  patch: { status?: TicketStatus; assignee?: string; nextStep?: string },
): WorkspaceTicket[] {
  const validStatuses: TicketStatus[] = ["neu", "in_bearbeitung", "erledigt"];
  if (patch.status !== undefined && !validStatuses.includes(patch.status))
    return [...tickets];
  return tickets.map((ticket) =>
    ticket._id !== id
      ? ticket
      : {
          ...ticket,
          status: patch.status ?? ticket.status,
          assignee:
            patch.assignee === undefined
              ? ticket.assignee
              : patch.assignee.trim().slice(0, 80),
          nextStep:
            patch.nextStep === undefined
              ? ticket.nextStep
              : patch.nextStep.trim().slice(0, 240),
        },
  );
}

export function addWorkspaceNote(
  tickets: readonly WorkspaceTicket[],
  id: string,
  note: DemoNote,
): WorkspaceTicket[] {
  const text = note.text.trim().slice(0, 1000);
  if (!text) return [...tickets];
  return tickets.map((ticket) =>
    ticket._id === id
      ? { ...ticket, notes: [...ticket.notes, { ...note, text }] }
      : ticket,
  );
}
