import test from "node:test";
import assert from "node:assert/strict";
import {
  createWorkspace,
  updateWorkspaceTicket,
  addWorkspaceNote,
} from "../src/lib/workspace.ts";

const fixtures = [
  {
    _id: "demo-1",
    createdAt: 1,
    description: "Erfundener Schaden",
    status: "neu",
    urgency: "Hoch",
  },
];

test("workspace initialization does not mutate the source fixtures", () => {
  const rows = createWorkspace(fixtures);
  assert.equal(rows[0].assignee, "Nicht zugewiesen");
  rows[0].notes.push({ id: "note-1", text: "Test", createdAt: 1 });
  assert.equal(fixtures[0].notes, undefined);
  assert.notEqual(rows[0], fixtures[0]);
});
test("status, assignment and next step updates are immutable and independent", () => {
  const original = createWorkspace(fixtures);
  const updated = updateWorkspaceTicket(original, "demo-1", {
    status: "in_bearbeitung",
    assignee: "Sanitär-Team",
    nextStep: "  Prüfung vereinbaren  ",
  });
  assert.equal(original[0].status, "neu");
  assert.equal(updated[0].status, "in_bearbeitung");
  assert.equal(updated[0].assignee, "Sanitär-Team");
  assert.equal(updated[0].nextStep, "Prüfung vereinbaren");
  const resolved = updateWorkspaceTicket(updated, "demo-1", {
    status: "erledigt",
  });
  assert.equal(resolved[0].status, "erledigt");
  assert.equal(resolved[0].assignee, "Sanitär-Team");
});
test("unknown ticket or invalid status cannot corrupt the board", () => {
  const original = createWorkspace(fixtures);
  assert.deepEqual(
    updateWorkspaceTicket(original, "missing", { status: "erledigt" }),
    original,
  );
  assert.deepEqual(
    updateWorkspaceTicket(original, "demo-1", { status: "invalid" }),
    original,
  );
});
test("notes reject blanks, trim and bound text without changing existing notes", () => {
  const original = createWorkspace(fixtures);
  assert.deepEqual(
    addWorkspaceNote(original, "demo-1", {
      id: "blank",
      text: "  ",
      createdAt: 1,
    }),
    original,
  );
  const updated = addWorkspaceNote(original, "demo-1", {
    id: "note-1",
    text: "  Termin vereinbart  ",
    createdAt: 1,
  });
  assert.equal(updated[0].notes[0].text, "Termin vereinbart");
  assert.equal(original[0].notes.length, 0);
  const long = addWorkspaceNote(updated, "demo-1", {
    id: "note-2",
    text: "x".repeat(2000),
    createdAt: 2,
  });
  assert.equal(long[0].notes[1].text.length, 1000);
  assert.equal(updated[0].notes.length, 1);
});
