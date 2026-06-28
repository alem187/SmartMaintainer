import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tickets: defineTable({
    description: v.string(),
    location: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    status: v.string(), // "neu" | "in_bearbeitung" | "erledigt"
    category: v.optional(v.string()),
    urgency: v.optional(v.string()),
    aiSummary: v.optional(v.string()),
    createdAt: v.number(),
  }),
});
