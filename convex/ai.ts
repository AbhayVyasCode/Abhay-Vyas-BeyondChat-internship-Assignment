"use node";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as cheerio from "cheerio";

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
    console.error("GOOGLE_API_KEY is not set. Use `npx convex env set GOOGLE_API_KEY <key>`");
}

const genAI = new GoogleGenerativeAI(apiKey || "dummy_key");

// Helper: Delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Retry logic with model fallback
async function generateWithRetry(prompt: string, modelsToTry: string[] = ["gemini-2.5-flash", "gemini-2.5-pro"]) {
    let lastError;

    for (const modelName of modelsToTry) {
        console.log(`Attempting generation with model: ${modelName}`);
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
        });

        // Retry up to 3 times for the SAME model (for 429s)
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text(); // Success!
            } catch (error: any) {
                lastError = error;
                console.warn(`Model ${modelName} (Attempt ${attempt}) failed: ${error.message}`);

                // If Rate Limit (429) or Overloaded (503), wait and retry
                if (error.message?.includes("429") || error.message?.includes("503") || error.message?.includes("Quota")) {
                    console.log(`Rate limit hit. Waiting ${attempt * 3000}ms...`);
                    await delay(attempt * 3000);
                    continue;
                }

                // If 404 (Model Not Found) or 400 (Bad Request), break to next model immediately
                if (error.message?.includes("404") || error.message?.includes("400")) {
                    break;
                }

                // Other errors, wait small amount and retry
                await delay(1000);
            }
        }
    }

    throw lastError || new Error("All AI models and retries failed.");
}

export const transformArticle = action({
    args: {
        id: v.id("articles"),
        useResearch: v.optional(v.boolean()),
        tone: v.optional(v.string()),
        keywords: v.optional(v.array(v.string())),
        customPrompt: v.optional(v.string()), // New Feature: Custom Instructions
        // Ext Set 2
        targetLanguage: v.optional(v.string()),
        readabilityLevel: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        const article = await ctx.runQuery(api.articles.get, { id: args.id });

        if (!article) throw new Error("Article not found");
        if (!article.originalContent) throw new Error("Article has no content to analyze");

        // --- Feature: Version History (Save current state before verify) ---
        if (article.updatedContent) {
            const historyItem = {
                timestamp: Date.now(),
                summary: article.aiSummary,
                tags: article.aiTags,
                updatedContent: article.updatedContent,
                seoAnalysis: article.seoAnalysis
            };

            // Limit history to 10 items
            const newHistory = [historyItem, ...(article.versionHistory || [])].slice(0, 10);

            // Save history explicitly
            article.versionHistory = newHistory;
        }


        // 1. Research Phase
        let researchContext = "";
        const citations = [];

        if (args.useResearch && article.researchCandidates) {
            console.log("Research mode active. Fetching external sources...");
            const approved = article.researchCandidates.filter((c: any) => c.status === 'approved');

            // Limit to 3 sources to avoid Token Limits
            for (const candidate of approved.slice(0, 3)) {
                try {
                    console.log(`Scraping source: ${candidate.title}`);
                    const res = await fetch(candidate.url);
                    const html = await res.text();
                    const $ = cheerio.load(html);

                    let text = $('article, main, .content, body').text();
                    text = text.replace(/\s+/g, ' ').slice(0, 2000); // Reduce context size per source

                    researchContext += `\n\n--- Source: ${candidate.title} ---\n${text}\n`;
                    citations.push(candidate.url);
                } catch (e) {
                    console.error(`Failed to scrape ${candidate.url}:`, e);
                }
            }
        }

        // --- Feature: Smart Interlinking (Fetch other articles) ---
        const existingArticles = await ctx.runQuery(api.articles.list);
        let internalLinksContext = "";
        if (existingArticles && existingArticles.length > 0) {
            const links = existingArticles
                .filter(a => a._id !== args.id && a.status === 'processed')
                .slice(0, 50) // Limit to 50 recent
                .map(a => `- Title: "${a.title}", URL: "${a.url}"`)
                .join("\n");

            if (links) {
                internalLinksContext = `\n=== EXISTING ARTICLES (For Interlinking) ===\n${links}\n`;
            }
        }

        // Construct System Instructions
        const toneInstruction = args.tone
            ? `Your tone must be: ${args.tone}.`
            : "Use a professional, engaging tone.";

        const keywordInstruction = args.keywords && args.keywords.length > 0
            ? `You MUST naturally integrate the following keywords: ${args.keywords.join(", ")}.`
            : "";

        const customInstruction = args.customPrompt
            ? `USER OVERRIDE INSTRUCTIONS: ${args.customPrompt}`
            : "";

        // Ext Set 2: Localization & Readability
        const languageInstruction = args.targetLanguage && args.targetLanguage !== "English (Default)"
            ? `TRANSLATION REQUIRED: The ENTIRE JSON response (including "summary", "rewrittenContent", "tags", and "seo.competitorGapAnalysis") MUST be written in ${args.targetLanguage}. Adapt cultural references and idioms for this audience.`
            : "";

        let readabilityInstruction = "";
        if (args.readabilityLevel !== undefined) {
            const level = args.readabilityLevel;
            let desc = "Standard";
            if (level <= 30) desc = "Simple, 'Explain Like I'm 5', short sentences, basic vocabulary";
            else if (level <= 70) desc = "General Audience, clear and engaging";
            else desc = "Academic/Expert, high-level vocabulary, dense information";

            readabilityInstruction = `READABILITY TARGET: Level ${level}/100 (${desc}). Adjust sentence structure and vocabulary accordingly.`;
        }

        const prompt = `
        You are an elite content editor and researcher.
        ${toneInstruction}
        ${keywordInstruction}
        ${languageInstruction}
        ${readabilityInstruction}
        ${customInstruction}

        Task: Rewrite the "Original Article" below.

        ${researchContext ? `Use the provided "Research Context" to verify facts, add depth, and enhance the content.` : ""}

        === ORIGINAL ARTICLE ===
        ${article.originalContent.slice(0, 4000)}

        ${researchContext ? `=== RESEARCH CONTEXT ===${researchContext}` : ""}

        ${internalLinksContext}

        Instructions:
        1. Generate a concise 2-sentence summary ${args.targetLanguage ? `(in ${args.targetLanguage})` : ''}.
        2. Extract 3-5 relevant hashtags/tags.
        3. Rewrite the content to be high-quality, structured with Markdown.
           - Feature: Intelligent Citations. If using information from Research Context, strictly add footnotes like [1], [2] corresponding to the source order.
           - Feature: Smart Interlinking. Check the "EXISTING ARTICLES" list. If a topic matches, strictly add a Markdown link to that article (e.g., [Title](URL)). Do not force it if not relevant.
        4. Analyze the content for SEO (Search Engine Optimization).
           - Feature: Competitor Gap Analysis. Compare Original vs Research Context. What did the user miss?

        Return your response in JSON format:
        {
            "summary": "...",
            "tags": ["..."],
            "rewrittenContent": "...",
            "seo": {
                "score": 0-100, 
                "readability": "Grade Level", 
                "critique": ["Point 1", "Point 2"],
                "keywords": ["Start with provided keywords if any"],
                "competitorGapAnalysis": ["Missed topic A", "Weak argument B"]
            }
        }
        `;

        try {
            // Use the Retry/Fallback logic
            let text = await generateWithRetry(prompt, ["gemini-2.5-flash", "gemini-2.5-pro"]);

            // Clean up JSON markdown
            text = text.replace(/```json/g, "").replace(/```/g, "").trim();
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
                throw new Error("Invalid JSON response from AI. The model output was not valid JSON.");
            }

            await ctx.runMutation(api.articles.updateAI, {
                id: args.id,
                aiSummary: data.summary,
                aiTags: data.tags,
                updatedContent: data.rewrittenContent,
                seoScore: data.seo?.score,
                seoAnalysis: data.seo,
                citations: citations.length > 0 ? citations : undefined,

                // Save Extensions
                customPrompt: args.customPrompt,
                versionHistory: article.versionHistory // Pass back the updated history array
            });

            return { success: true };
        } catch (error: any) {
            console.error("Gemini Error:", error);
            throw new Error("AI Processing Failed: " + error.message);
        }
    },
});

export const listModels = action({
    args: {},
    handler: async () => {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) throw new Error("API Key not found");

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const data = await response.json();
            return data.models?.filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
                .map((m: any) => ({ name: m.name, displayName: m.displayName }));
        } catch (error: any) {
            throw new Error("Failed to list models: " + error.message);
        }
    }
});
