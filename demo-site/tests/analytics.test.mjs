import test from "node:test";
import assert from "node:assert/strict";
import {
  dayKey,
  filterTickets,
  summarizeTickets,
  csvCell,
  ticketsToCsv,
} from "../src/lib/analytics.ts";

const now = Date.parse("2026-10-21T12:00:00Z");
const ticket = (date, extra = {}) => ({
  _id: `test-${date}`,
  createdAt: Date.parse(date),
  description: "Wasserhahn tropft",
  status: "neu",
  ...extra,
});

test("7 calendar days include Berlin midnight and exclude old/future tickets", () => {
  const first = ticket("2026-10-14T22:00:00Z"); // October 15 in Berlin
  const before = ticket("2026-10-14T21:59:59Z");
  const future = ticket("2026-10-21T13:00:00Z");
  assert.deepEqual(filterTickets([before, future, first], "7", "", now), [
    first,
  ]);
});
test("7-day average excludes old tickets even when total period is all", () => {
  const result = summarizeTickets(
    [ticket("2026-10-20T10:00:00Z"), ticket("2026-09-01T10:00:00Z")],
    now,
  );
  assert.equal(result.total, 2);
  assert.equal(result.weeklyAverage, 1 / 7);
  assert.equal(
    result.days.reduce((sum, day) => sum + day.count, 0),
    1,
  );
});
test("resolved high-priority tickets are not counted as urgent open work", () => {
  const result = summarizeTickets(
    [
      ticket("2026-10-20", { urgency: "Hoch", status: "erledigt" }),
      ticket("2026-10-21", { urgency: "Hoch" }),
    ],
    now,
  );
  assert.equal(result.urgentOpen, 1);
  assert.equal(result.resolvedPercent, 50);
});
test("Berlin calendar buckets handle the 25-hour autumn clock change", () => {
  const reference = Date.parse("2026-10-26T12:00:00Z");
  const rows = [ticket("2026-10-24T22:30:00Z"), ticket("2026-10-25T22:30:00Z")];
  const result = summarizeTickets(rows, reference);
  assert.equal(result.days.find((day) => day.key === "2026-10-25").count, 2);
  assert.equal(dayKey(Date.parse("2026-10-25T23:00:00Z")), "2026-10-26");
});
test("Berlin calendar buckets handle the 23-hour spring clock change", () => {
  const reference = Date.parse("2026-03-30T12:00:00Z");
  const result = summarizeTickets(
    [ticket("2026-03-28T23:30:00Z"), ticket("2026-03-29T21:30:00Z")],
    reference,
  );
  assert.equal(result.days.find((day) => day.key === "2026-03-29").count, 2);
  assert.equal(result.days.length, 7);
});
test("search is case-insensitive across location, description, category and summary", () => {
  const row = ticket("2026-10-20", {
    location: "Musterhof",
    category: "Sanitär",
    aiSummary: "Armatur undicht",
  });
  for (const query of [" MUSTERHOF ", "wasserhahn", "SANITÄR", "undicht"])
    assert.equal(filterTickets([row], "all", query, now).length, 1);
  assert.equal(filterTickets([row], "all", "kein Treffer", now).length, 0);
});
test("empty and pending analysis produce finite honest statistics", () => {
  const empty = summarizeTickets([], now);
  assert.equal(empty.resolvedPercent, 0);
  assert.equal(empty.weeklyAverage, 0);
  const pending = summarizeTickets([ticket("2026-10-20")], now);
  assert.deepEqual(pending.categories, [{ name: "Ausstehend", value: 1 }]);
  assert.equal(
    pending.urgency.find((row) => row.name === "Ausstehend").value,
    1,
  );
});
test("CSV quotes every field and preserves Unicode, semicolons, newlines and quotes", () => {
  assert.equal(csvCell('Küche; "A"\nWasser'), '"Küche; ""A""\nWasser"');
  const csv = ticketsToCsv([ticket("2026-10-20", { location: 'Haus; "B"' })]);
  assert.ok(csv.startsWith('\uFEFF"ID";'));
  assert.ok(csv.includes('"Haus; ""B"""'));
  assert.ok(csv.includes("\r\n"));
});
test("CSV neutralizes formula prefixes including whitespace and controls", () => {
  for (const value of [
    "=1+1",
    "+SUM(A1)",
    "-1+2",
    "@SUM(A1)",
    "  =1",
    "\t=1",
    "\r=1",
    "\n=1",
    "\u0000=1",
  ]) {
    assert.ok(csvCell(value).startsWith("\"'"), JSON.stringify(value));
  }
  assert.equal(csvCell("normal text"), '"normal text"');
});
test("30-day boundary and invalid timestamps are filtered consistently", () => {
  const rows = [
    ticket("2026-09-21T22:00:00Z"),
    ticket("2026-09-21T21:59:59Z"),
    ticket("invalid"),
  ];
  assert.deepEqual(filterTickets(rows, "30", "", now), [rows[0]]);
});
