import axios from 'axios';
import * as cheerio from 'cheerio';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const CONVEX_URL = process.env.VITE_CONVEX_URL;

if (!CONVEX_URL) {
    console.error("Error: VITE_CONVEX_URL is not defined in .env.local");
    process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function scrapeArticles() {
    console.log("Starting scraper...");
    console.log(`Connecting to Convex at: ${CONVEX_URL}`);

    try {
        const { data } = await axios.get('https://beyondchats.com/blogs/');
        const $ = cheerio.load(data);

        // Scraper logic refined based on debug analysis
        const articles = [];
        const seenUrls = new Set();

        $('a').each((i, el) => {
            let href = $(el).attr('href');
            const title = $(el).text().trim();

            if (!href) return;

            // Normalize URL
            if (!href.startsWith('http')) {
                href = `https://beyondchats.com${href}`;
            }

            // Filter Logic
            const isBlog = href.includes('/blogs/');
            const isTag = href.includes('/tag/');
            const isPage = href.includes('/page/');
            const isAuthor = href.includes('/author/');
            const isRoot = href === 'https://beyondchats.com/blogs/' || href === 'https://beyondchats.com/blogs';
            const isTitleValid = title.length > 5; // Skip "Read this blog" or empty titles if possible, but we check duplicates

            if (isBlog && !isTag && !isPage && !isAuthor && !isRoot && !seenUrls.has(href)) {
                // Heuristic: If title is short (e.g. empty or just "Image"), it might be the image link.
                // We prefer links with text. But sometimes the image link comes first.
                // We will dedup by URL.

                if (isTitleValid) {
                    articles.push({
                        title,
                        url: href,
                        originalContent: "Pending fetch...",
                    });
                    seenUrls.add(href);
                }
            }
        });

        console.log(`Found ${articles.length} valid articles.`);

        // Get 5 articles from the end (oldest) - logic: slice(-5)
        // If fewer than 5, take all.
        const count = Math.min(articles.length, 5);
        const oldestArticles = articles.reverse().slice(0, count); // Reverse to get "oldest" if they are listed new->old
        // Wait, typically blogs list Newest first. So "Oldest" would be at the BOTTOM of the list.
        // So if the array is [Newest, ..., Oldest], then `slice(-5)` gives the last 5 (Oldest).
        // Let's stick to slice(-5).

        // Correction: `slice(-5)` gives the last 5 items.
        // If the list is [Article 1 (New), Article 2, ..., Article 20 (Old)], then slice(-5) is [Article 16... Article 20].
        // Yes, this is correct for "oldest entries on THIS page".

        const targetArticles = articles.slice(-5);

        for (const article of targetArticles) {
            console.log(`Scraping content for: ${article.title}`);
            try {
                const { data: pageData } = await axios.get(article.url);
                const $$ = cheerio.load(pageData);

                // Extract content: Main content usually in a specific div, but p tags are safe fallback
                let content = "";
                $$('p').each((i, el) => {
                    const text = $$(el).text().trim();
                    // Filter out navigational short text if possible
                    if (text.length > 20) {
                        content += text + "\n\n";
                    }
                });

                article.originalContent = content.trim();

                if (article.originalContent.length > 0) {
                    const id = await client.mutation(api.articles.create, {
                        title: article.title,
                        url: article.url,
                        originalContent: article.originalContent,
                    });
                    console.log(`Saved to Convex: ${id}`);
                } else {
                    console.log("Skipping empty content");
                }

            } catch (err) {
                console.error(`Failed to scrape ${article.url}:`, err.message);
            }
        }

        console.log("Scraping completed.");

    } catch (error) {
        console.error("Scraping failed:", error);
    }
}

scrapeArticles();
