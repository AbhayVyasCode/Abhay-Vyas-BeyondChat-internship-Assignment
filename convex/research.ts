"use node";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { search } from "google-sr";

export const searchRelatedContent = action({
    args: { articleId: v.id("articles") },
    handler: async (ctx, args) => {
        const article = await ctx.runQuery(api.articles.get, { id: args.articleId });
        if (!article) throw new Error("Article not found");

        console.log(`Searching for: ${article.title}`);

        // Update state to 'searching'
        await ctx.runMutation(api.articles.updateResearchState, {
            id: args.articleId,
            state: "searching"
        });

        try {
            // Search Google
            const searchResults = await search({
                query: article.title,
                limit: 5, // Get top 5, we'll let user pick
            });

            // Filter out non-article links if possible (basic heuristic)
            const candidates = searchResults
                .filter(result => result.link && !result.link.includes('beyondchats.com') && !result.link.includes('youtube.com'))
                .slice(0, 4)
                .map(result => ({
                    url: result.link,
                    title: result.title || "No Title",
                    snippet: result.description || "No description available",
                    status: "pending"
                }));

            // Update DB with candidates
            await ctx.runMutation(api.articles.updateResearchCandidates, {
                id: args.articleId,
                candidates: candidates,
                state: "reviewing"
            });

            return { success: true, count: candidates.length };

        } catch (error: any) {
            console.error("Search failed:", error);
            // Revert state
            await ctx.runMutation(api.articles.updateResearchState, {
                id: args.articleId,
                state: "idle"
            });
            throw new Error("Search failed: " + error.message);
        }
    },
});
