import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    articles: defineTable({
        title: v.string(),
        url: v.string(),
        originalContent: v.string(),
        publishedDate: v.optional(v.string()), // Date string if available
        status: v.union(v.literal("pending"), v.literal("processed")),

        // Phase 2: Research & AI Fields
        researchState: v.optional(v.string()), // "idle" | "searching" | "reviewing" | "processing" | "complete"
        researchCandidates: v.optional(v.array(v.object({
            url: v.string(),
            title: v.string(),
            snippet: v.string(),
            status: v.string(), // "pending" | "approved" | "rejected"
        }))),
        userTone: v.optional(v.string()),
        userKeywords: v.optional(v.array(v.string())),

        aiSummary: v.optional(v.string()),
        aiTags: v.optional(v.array(v.string())),
        updatedContent: v.optional(v.string()), // For Phase 2
        citations: v.optional(v.array(v.string())), // For Phase 2
        // Feature: SEO Scorecard
        seoScore: v.optional(v.number()),
        seoAnalysis: v.optional(v.any()), // Store JSON object for flexibility

        // Phase 2 Extensions
        customPrompt: v.optional(v.string()),
        versionHistory: v.optional(v.array(v.object({
            timestamp: v.number(),
            summary: v.optional(v.string()),
            tags: v.optional(v.array(v.string())),
            updatedContent: v.optional(v.string()),
            seoAnalysis: v.optional(v.any())
        }))),

        // Phase 2 Set 2 Extensions
        targetLanguage: v.optional(v.string()),
        readabilityLevel: v.optional(v.number()) // 0-100
    })
        .index("by_url", ["url"])
        .index("by_status", ["status"]),
});
