import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    articles: defineTable({
        title: v.string(),
        url: v.string(),
        originalContent: v.string(),
        publishedDate: v.optional(v.string()), // Date string if available
        status: v.union(v.literal("pending"), v.literal("processed")),
        // Phase 2: AI Fields
        aiSummary: v.optional(v.string()),
        aiTags: v.optional(v.array(v.string())),
        updatedContent: v.optional(v.string()), // For Phase 2
        citations: v.optional(v.array(v.string())), // For Phase 2
        // Feature: SEO Scorecard
        seoScore: v.optional(v.number()),
        seoAnalysis: v.optional(v.any()), // Store JSON object for flexibility
    })
        .index("by_url", ["url"])
        .index("by_status", ["status"]),
});
