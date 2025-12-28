"use node";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
    console.error("GOOGLE_API_KEY is not set. Use `npx convex env set GOOGLE_API_KEY <key>`");
}

const genAI = new GoogleGenerativeAI(apiKey || "dummy_key");

export const transformArticle = action({
    args: { id: v.id("articles") },
    handler: async (ctx, args) => {
        const article = await ctx.runQuery(api.articles.get, { id: args.id });

        if (!article) throw new Error("Article not found");
        if (!article.originalContent) throw new Error("Article has no content to analyze");

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
        You are an elite content editor. Process the following article content:
        
        "${article.originalContent.slice(0, 5000)}" 
        (truncated for efficiency)

        1. Generate a concise 2-sentence summary.
        2. Extract 3-5 relevant hashtags/tags.
        3. Rewrite the content to be more professional, engaging, and structured with clear Markdown headers.
        4. Analyze the content for SEO (Search Engine Optimization).
        
        Return your response in JSON format:
        {
            "summary": "...",
            "tags": ["..."],
            "rewrittenContent": "...",
            "seo": {
                "score": 85, 
                "readability": "HighSchool", 
                "critique": ["Use more active voice", "Include keyword in H1"],
                "keywords": ["Tech", "Innovation"]
            }
        }
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // Clean up JSON markdown if present
            text = text.replace(/```json/g, "").replace(/```/g, "").trim();

            // Attempt to find the first '{' and last '}' to extract the JSON object
            const firstOpen = text.indexOf('{');
            const lastClose = text.lastIndexOf('}');

            if (firstOpen !== -1 && lastClose !== -1) {
                text = text.substring(firstOpen, lastClose + 1);
            }

            let data;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.error("JSON Parse Failure. Raw Text:", text);
                throw new Error("Invalid JSON response from AI");
            }

            await ctx.runMutation(api.articles.updateAI, {
                id: args.id,
                aiSummary: data.summary,
                aiTags: data.tags,
                updatedContent: data.rewrittenContent,
                seoScore: data.seo?.score,
                seoAnalysis: data.seo,
            });

            return { success: true };
        } catch (error: any) {
            console.error("Gemini Error:", error);
            throw new Error("Failed to process with AI: " + error.message);
        }
    },
});
