# BeyondChats Internship Assignment

Author: Abhay Vyas
Status: In Progress

## Project Overview

This project is a sophisticated React application designed to demonstrate full-stack capabilities using Convex as the backend-as-a-service. It orchestrates a complete workflow:

1. Phase 1 (Data Ingestion): scraping content from external sources.
2. Phase 2 (AI Agent): processing that content (planned).
3. Phase 3 (Frontend): displaying it in a premium UI (planned).

The application features a modern, cyber-professional aesthetic with glassmorphism, animated backgrounds, and full dark/light mode support.

---

## Technology Stack

* Frontend: React (Vite), Tailwind CSS, Framer Motion, React Router DOM.
* Backend: Convex (Real-time Database, Server Functions).
* Scraping: Cheerio (Server-side DOM parsing).
* Icons: Lucide React.
* Styling: Custom Spotlight effects, gradients, and backdrop blurs.

---

## Implemented Features

### Core Foundation

* Premium Design System:
    * AnimatedBackground: Mouse-tracking spotlight effect over a grid pattern.
    * Global Navbar and Footer with social links and theme toggle.
    * Seamless Dark/Light mode switching.
* Home Page:
    * Typewriter entry animation.
    * Interactive cards linking to project phases.

### Phase 1: Data Ingestion (Dashboard)

A fully functional dashboard for managing scraped content.

* Server-Side Scraper (convex/actions.ts):
    * Custom Convex Action fetchNewArticle that crawls https://beyondchats.com/blogs/.
    * Smart Selection: Randomly selects an article, verifies it hasn't been scraped yet using seenUrls.
    * Robust Parsing: Fetches the actual article page to extract the Real Title (H1), fixing common link text bugs, and content.
* Dashboard UI (Phase1Page.jsx):
    * Split-View Layout: Searchable article list on the left, detailed inspector on the right.
    * Real-time Search: Filters articles by title or content instantly.
    * CRUD Operations: Delete articles, manually trigger new fetch jobs.
    * Metrics: Displays Word Count, Character Count, and Crawl Depth.
    * Visual Feedback: Loading spinners, success/warning badges for processing status.

---

## Project Structure

convex/
    schema.ts         # Database Schema (Articles table)
    articles.ts       # Mutations/Queries (CRUD)
    actions.ts        # Node.js Server Actions (Scraper Logic)

src/
    components/
        HomePage.jsx    # Landing Page
        Phase1Page.jsx  # Data Dashboard
    App.jsx           # Routing & Layout
    index.css         # Tailwind & GLobal Styles
    main.jsx          # Entry point (ConvexProvider)

README.md

---

## Setup & Installation

1. Install Dependencies:
   npm install

2. Start Backend (Convex):
   npx convex dev

3. Start Frontend:
   npm run dev

4. View App:
   Open http://localhost:5173

---

## Troubleshooting & Fixes Applied

* Title Bug: Fixed by updating the scraper to follow the link and scrape the H1 tag from the destination page instead of relying on the anchor text.
* Layout Issues: Refactored Phase 1 from a hidden Sidebar to a permanent Split-View for better UX.

---

## Next Steps: Phase 2 (AI Agent)

* Integrate LLM to analyze scraped content.
* Implement Chat with Data feature.
