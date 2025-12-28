import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all articles (for Phase 1 & 3 UI)
export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("articles").order("desc").collect();
    },
});

// Create a new article (used by Scraper)
export const create = mutation({
    args: {
        title: v.string(),
        url: v.string(),
        originalContent: v.string(),
        publishedDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("articles")
            .withIndex("by_url", (q) => q.eq("url", args.url))
            .first();

        if (existing) {
            // Skip if already exists
            return existing._id;
        }

        return await ctx.db.insert("articles", {
            ...args,
            status: "pending",
        });
    },
});

// Update article (used in Phase 2)
export const update = mutation({
    args: {
        id: v.id("articles"),
        updatedContent: v.string(),
        citations: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            updatedContent: args.updatedContent,
            citations: args.citations,
            status: "processed",
        });
    },
});

export const deleteArticle = mutation({
    args: { id: v.id("articles") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
