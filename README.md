# BeyondChats Internship Assignment

Author: Abhay Vyas
Status: Completed

## Setup & Installation

1. Install Dependencies:
   npm install

2. Configure Environment Variables (.env):
   This project uses Convex, so environment variables are managed via the dashboard or CLI.
   You must set your Google Gemini API Key:
   npx convex env set GOOGLE_API_KEY <your-gemini-key>

3. Start Backend (Convex):
   npx convex dev

4. Start Frontend:
   npm run dev

5. View App:
   Open http://localhost:5173

---

## Project Structure

convex/
    _generated/       # Convex internal files
    actions.ts        # Node.js Server Actions (Scraper Logic)
    ai.ts             # Google Gemini Integration & RAG
    articles.ts       # Mutations/Queries (CRUD)
    jarvis.ts         # Chat Assistant Logic
    research.ts       # Research Agents
    schema.ts         # Database Schema (Articles table)

src/
    assets/           # Static images/SVGs
    components/
        Footer.jsx      # Global Footer
        HomePage.jsx    # Landing Page
        JarvisChat.jsx  # Floating AI Assistant
        Navbar.jsx      # Global Navigation
        Phase1Page.jsx  # Data Dashboard
        Phase2Page.jsx  # AI Agent & Output Preview
        Phase3Page.jsx  # Knowledge Graph & Widget View
    context/
        ThemeContext.jsx # Dark/Light Mode Logic
    App.jsx           # Routing & Layout
    index.css         # Tailwind & GLobal Styles
    main.jsx          # Entry point (ConvexProvider)

README.md

---

## Project Overview

This project is a sophisticated React application designed to demonstrate full-stack capabilities using Convex as the backend-as-a-service. It orchestrates a complete workflow:

1. Phase 1 (Data Ingestion): scraping content from external sources.
2. Phase 2 (AI Agent): processing that content.
3. Phase 3 (Frontend): displaying it in a premium UI.

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
    * Seamless Dark/Light mode switching (Persisted).
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

### Phase 2: Intelligent AI Refinement (Agent)

The core "brain" of the application, transforming raw scraped data into structured intelligence.

*   Google Gemini Integration (convex/ai.ts):
    *   Uses gemini-2.5-flash model for high-speed, cost-effective processing.
    *   Prompt Engineering: Instructs the AI to act as an "elite content editor" to sanitize and upgrade content.
    *   Structured Output: Forces JSON response correctly parsed to extraction:
        *   2-Sentence Summary: For quick preview cards.
        *   SEO Analysis: Generates a score (0-100), readability grade, and actionable critiques.
        *   Tags: Auto-generates relevant hashtags.
        *   Rewritten Content: Formats the article into clean Markdown.
*   Convex Actions:
    *   transformArticle: The server-side action that securely calls Google AI, parses the JSON response, and updates the database via internalMutation.

### Phase 3: Premium Frontend Interaction

A high-fidelity consumption experience with a focus on "Widgetization."

*   Immersive Blog Experience (Phase3Page.jsx):
    *   Spotlight Effect: Custom cursor-tracking radial gradient overlay.
    *   TTS (Text-to-Speech): Built-in audio player to listen to articles with speed control (1x, 1.5x, 2x).
    *   Article Modal: Full-screen, glassmorphic overlay for reading content without leaving the page.
*   Widget Mode:
    *   A simulated mobile/sidebar widget view.
    *   Activated via "Try Widget View" in the Navbar.
    *   Features:
        *   Branded Header with Logo (AV).
        *   Compact Card Layout.
        *   Dedicated Exit Button: A large, gesture-friendly exit trigger on the left side of the screen.

*   Knowledge Graph (Galaxy View):
    *   A physics-based interactive data visualization using framer-motion and SVG.
    *   Modes:
        *   GALAXY: Organic clustering with semantic gravity (nodes attract if they share tags).
        *   GRID: Structured table-like layout.
        *   RING: Circular arrangement for overview.
    *   Features:
        *   Big Bang: Interactive physics explosion effect.
        *   Smart Connections: Glowing lines link articles sharing tags (e.g., #AI).
        *   Search & Zoom: "Fly" to a node by typing its name; Deep zoom controls (0.5x to 2x).
        *   Tag Filtering: Sidebar to toggle article visibility by hashtag.
        *   Responsive Bounds: Physics simulation adapts to mobile screens, keeping nodes contained.

### Global Enhancements

*   Responsive Design:
    *   Full mobile compatibility for all pages (Home, Dashboard, Graph).
    *   Adaptive toolbars (Stacking controls on mobile vs side-by-side on desktop).
*   Theming:
    *   Global Dark/Light mode persistence via localStorage.
    *   Custom Gradient Favicon ("AV") and Dynamic Browser Title.
*   UI Polish:
    *   Glassmorphism alerts, animated icons, and custom scrollbars.

---

## Technical Implementation Details

### 1. The Scraper (Phase 1)
We moved beyond simple fetch(). The scraper in convex/actions.ts:
1.  Crawls the source URL.
2.  Follows Redirects to ensure validity.
3.  Parses HTML using cheerio to extract the H1 title and main content textual data.
4.  Dedupes URLs to prevent redundant processing.

### 2. The AI Pipeline (Phase 2)
The transformation is atomic:
1.  User clicks "Analyze" on Dashboard.
2.  Frontend calls api.ai.transformArticle.
3.  Backend hydrates the prompt with the raw content.
4.  Gemini returns a JSON string.
5.  Backend cleans markdown code blocks (```json ... ```) from the response.
6.  DB is updated with seoScore, aiSummary, etc.

### 3. The UI Engine (Phase 3)
*   Framework: React + Vite.
*   Styling: Tailwind CSS + framer-motion for shared layout animations (layoutId).
*   State: URL-driven routing for pages, but local state for Widget Mode to demonstrate conditional rendering without full page reloads.

### 4. Feature Spotlight: Jarvis AI Assistant (Home Screen)
A conversational interface bridging the gap between the user and the developer.

*   Architecture:
    *   Backend (convex/jarvis.ts): Initializes a dedicated chat session with Gemini. It injects a "System Prompt" containing the developer's resume (Abhay Vyas) and the project's technical architecture.
    *   Frontend (JarvisChat.jsx): A floating, glassmorphic chat widget.
*   Capabilities:
    *   Answers questions about the developer (Skills: React Native, Agentic AI, etc.).
    *   Explains the project phases (Data Ingestion, AI Refinement).
    *   General chatbot capabilities (Math, General Knowledge).

---


