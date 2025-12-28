
import { convexToJson, ConvexHttpClient } from "convex/browser"; // convex/browser is compatible with Node
import { api } from "../convex/_generated/api.js";
import * as dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";
import { search } from "google-sr";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// Setup Env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Config
const CONVEX_URL = process.env.VITE_CONVEX_URL;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!CONVEX_URL) {
    console.error("❌ Missing VITE_CONVEX_URL in .env.local");
    process.exit(1);
}
if (!GOOGLE_API_KEY) {
    console.error("❌ Missing GOOGLE_API_KEY in .env.local");
    process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Helper: Scrape content from a URL
async function scrapeContent(url) {
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            timeout: 5000
        });
        const $ = cheerio.load(data);

        // Remove script, style, nav, footer to get main content
        $('script, style, nav, footer, header, aside, .ads, .comments').remove();

        // Try to find the main article body
        let content = $('article').text() || $('main').text() || $('body').text();
        return content.replace(/\s+/g, ' ').slice(0, 3000); // Limit to 3000 chars
    } catch (e) {
        console.warn(`⚠️ Failed to scrape ${url}: ${e.message}`);
        return "";
    }
}

async function main() {
    console.log("🚀 Starting AI Enhancement Script...");

    // 1. Fetch all articles
    const articles = await client.query(api.articles.list);
    // Filter for articles that haven't been enhanced yet (checking for empty 'citations' which is our new flag for this advanced process)
    const pending = articles.filter(a => !a.citations || a.citations.length === 0);

    console.log(`Found ${pending.length} articles to enhance.`);

    for (const article of pending) {
        console.log(`\n--------------------------------------------------`);
        console.log(`Processing: "${article.title}"`);

        // 2. Google Search
        console.log(`🔍 Searching Google for: "${article.title}"...`);
        let searchResults = [];
        try {
            searchResults = await search({ query: article.title });
        } catch (e) {
            console.error(`❌ Search failed: ${e.message}`);
            continue;
        }

        // Filter valid links (ignore the original site 'beyondchats.com' and non-http)
        const competitorLinks = searchResults
            .filter(r => r.link && r.link.startsWith('http') && !r.link.includes('beyondchats.com'))
            .slice(0, 2); // Top 2

        if (competitorLinks.length === 0) {
            console.log("⚠️ No valid competitor links found. Skipping.");
            continue;
        }

        console.log(`Found competitors:`);
        competitorLinks.forEach(l => console.log(`   - ${l.link}`));

        // 3. Scrape Competitors
        let competitorContext = "";
        for (const link of competitorLinks) {
            process.stdout.write(`   🕷️ Scraping ${link.link.slice(0, 30)}... `);
            const content = await scrapeContent(link.link);
            if (content) {
                competitorContext += `\n--- SOURCE: ${link.link} ---\n${content}\n`;
                console.log("✅");
            } else {
                console.log("❌");
            }
        }

        if (!competitorContext) {
            console.log("⚠️ Could not scrape any content. Skipping.");
            continue;
        }

        // 4. LLM Synthesis
        console.log(`🧠 Synthesizing new article with Gemini...`);
        const prompt = `
        You are a professional technical writer.
        Task: Rewrite the following article to verify and improve its accuracy, depth, and formatting using insights from competitor articles.
        
        ORIGINAL TITLE: ${article.title}
        
        ORIGINAL CONTENT:
        ${article.originalContent.slice(0, 2000)}

        COMPETITOR CONTENT (Validation & Enrichment):
        ${competitorContext}

        INSTRUCTIONS:
        1. Write a comprehensive, engaging, and professional blog post based on the above.
        2. Use Markdown formatting (H1, H2, lists, bold).
        3. Ensure the content is original (do not copy-paste), but factual.
        4. At the very bottom, add a "References" section listing the competitor URLs provided.

        Output ONLY the markdown content.
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const enhancedContent = response.text();

            // 5. Update Database
            console.log(`💾 Saving to database...`);

            // Generate summary/tags/SEO
            const analysisPrompt = `
            Analyze this text: "${enhancedContent.slice(0, 3000)}"
            
            Return a JSON object with:
            1. "summary" (2 sentences)
            2. "tags" (array of 3 strings)
            3. "seo" (object with: "score" (0-100 number), "critique" (array of 3 short strings))
            `;

            const analysisResult = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });

            const analysisJson = analysisResult.response.text();
            let analysis = { summary: "AI Generated", tags: [], seo: { score: 0, critique: [] } };
            try { analysis = JSON.parse(analysisJson); } catch (e) { console.error("JSON Parse Error", e); }

            await client.mutation(api.articles.updateAI, {
                id: article._id,
                updatedContent: enhancedContent,
                aiSummary: analysis.summary,
                aiTags: analysis.tags,
                seoScore: analysis.seo?.score,
                seoAnalysis: analysis.seo,
                citations: competitorLinks.map(l => l.link)
            });

            console.log(`✅ Successfully enhanced "${article.title}"`);

        } catch (e) {
            console.error(`❌ LLM/Save failed: ${e.message}`);
        }

        // Wait a bit to avoid rate limits
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log("\n🎉 All Done!");
}

main();
