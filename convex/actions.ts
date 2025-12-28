"use node";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import * as cheerio from "cheerio";

export const fetchNewArticle = action({
    args: {},
    handler: async (ctx) => {
        console.log("Starting server-side scrape...");

        // 1. Fetch the main blogs page
        const response = await fetch('https://beyondchats.com/blogs/');
        const html = await response.text();
        const $ = cheerio.load(html);

        const candidates: { title: string; url: string; }[] = [];
        const seenUrls = new Set();

        // 2. Parse links (Reusing logic from local scraper)
        $('a').each((i, el) => {
            let href = $(el).attr('href');
            const title = $(el).text().trim();

            if (!href) return;
            if (!href.startsWith('http')) {
                href = `https://beyondchats.com${href}`;
            }

            const isBlog = href.includes('/blogs/');
            const isTag = href.includes('/tag/');
            const isPage = href.includes('/page/');
            const isAuthor = href.includes('/author/');
            const isRoot = href === 'https://beyondchats.com/blogs/' || href === 'https://beyondchats.com/blogs';
            const isTitleValid = title.length > 5;

            if (isBlog && !isTag && !isPage && !isAuthor && !isRoot && !seenUrls.has(href) && isTitleValid) {
                candidates.push({ title, url: href });
                seenUrls.add(href);
            }
        });

        // 3. Find one that doesn't exist yet
        // (In a real pro app, we'd batch check. Here we'll just try until we find a new one or fail)
        // We'll shuffle candidates to get a random one
        const shuffled = candidates.sort(() => 0.5 - Math.random());

        for (const candidate of shuffled) {
            // Check if exists
            // Note: Actions can't directly query efficiently in a loop without calls.
            // We'll try to insert. If it returns an ID, we're good.
            // However, our mutation logic checks for duplicates and returns existing ID.
            // But we want to fetch content ONLY if it's new.

            // Let's just fetch content for the first candidate and try to insert.
            // If it was duplicate, we just update or ignore.
            // Better: Query existing articles first to filter candidates.

            const existingArticles = await ctx.runQuery(api.articles.list);
            const existingUrls = new Set(existingArticles.map(a => a.url));

            if (!existingUrls.has(candidate.url)) {
                console.log(`Found new article: ${candidate.title}`);

                // Fetch Content
                const artResponse = await fetch(candidate.url);
                const artHtml = await artResponse.text();
                const $$ = cheerio.load(artHtml);

                // Use the H1 from the page as the real title (fixes "Get started" bug)
                const realTitle = $$('h1').first().text().trim();
                const finalTitle = realTitle && realTitle.length > 5 ? realTitle : candidate.title;

                let content = "";
                $$('p').each((i, el) => {
                    const text = $$(el).text().trim();
                    if (text.length > 20) content += text + "\n\n";
                });

                if (content.length > 0) {
                    const id = await ctx.runMutation(api.articles.create, {
                        title: finalTitle,
                        url: candidate.url,
                        originalContent: content.trim(),
                        publishedDate: new Date().toISOString().split('T')[0]
                    });
                    return id; // Success!
                }
            }
        }

        throw new Error("No new articles found to scrape! Try deleting some existing ones.");
    },
});
