# BeyondChats Internship Assignment

Author: Abhay Vyas
Status: Completed

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

### Phase 2: Intelligent AI Refinement (Agent)

The core "brain" of the application, transforming raw scraped data into structured intelligence.

*   **Google Gemini Integration (`convex/ai.ts`)**:
    *   Uses `gemini-2.5-flash` model for high-speed, cost-effective processing.
    *   **Prompt Engineering**: Instructs the AI to act as an "elite content editor" to sanitize and upgrade content.
    *   **Structured Output**: Forces JSON response correctly parsed to extraction:
        *   **2-Sentence Summary**: For quick preview cards.
        *   **SEO Analysis**: Generates a score (0-100), readability grade, and actionable critiques.
        *   **Tags**: Auto-generates relevant hashtags.
        *   **Rewritten Content**: Formats the article into clean Markdown.
*   **Convex Actions**:
    *   `transformArticle`: The server-side action that securely calls Google AI, parses the JSON response, and updates the database via `internalMutation`.

### Phase 3: Premium Frontend Interaction

A high-fidelity consumption experience with a focus on "Widgetization."

*   **Immersive Blog Experience (`Phase3Page.jsx`)**:
    *   **Spotlight Effect**: Custom cursor-tracking radial gradient overlay.
    *   **TTS (Text-to-Speech)**: Built-in audio player to listen to articles with speed control (1x, 1.5x, 2x).
    *   **Article Modal**: Full-screen, glassmorphic overlay for reading content without leaving the page.
*   **Widget Mode**:
    *   A simulated mobile/sidebar widget view.
    *   Activated via "Try Widget View" in the Navbar.
    *   **Features**:
        *   Branded Header with Logo (AV).
        *   Compact Card Layout.
        *   **Dedicated Exit Button**: A large, gesture-friendly exit trigger on the left side of the screen.

---

## Technical Implementation Details

### 1. The Scraper (Phase 1)
We moved beyond simple `fetch()`. The scraper in `convex/actions.ts`:
1.  **Crawls** the source URL.
2.  **Follows Redirects** to ensure validity.
3.  **Parses HTML** using `cheerio` to extract the H1 title and main content textual data.
4.  **Dedupes** URLs to prevent redundant processing.

### 2. The AI Pipeline (Phase 2)
The transformation is atomic:
1.  User clicks "Analyze" on Dashboard.
2.  Frontend calls `api.ai.transformArticle`.
3.  Backend hydrates the prompt with the raw content.
4.  Gemini returns a JSON string.
5.  Backend cleans markdown code blocks (```json ... ```) from the response.
6.  DB is updated with `seoScore`, `aiSummary`, etc.

### 3. The UI Engine (Phase 3)
*   **Framework**: React + Vite.
*   **Styling**: Tailwind CSS + `framer-motion` for shared layout animations (`layoutId`).
*   **State**: URL-driven routing for pages, but local state for Widget Mode to demonstrate conditional rendering without full page reloads.

### 4. Feature Spotlight: Jarvis AI Assistant (Home Screen)
A conversational interface bridging the gap between the user and the developer.

*   **Architecture**:
    *   **Backend (`convex/jarvis.ts`)**: Initializes a dedicated chat session with Gemini. It injects a "System Prompt" containing the developer's resume (Abhay Vyas) and the project's technical architecture.
    *   **Frontend (`JarvisChat.jsx`)**: A floating, glassmorphic chat widget.
*   **Capabilities**:
    *   Answers questions about the developer (Skills: React Native, Agentic AI, etc.).
    *   Explains the project phases (Data Ingestion, AI Refinement).
    *   General chatbot capabilities (Math, General Knowledge).

---

## Future Improvements

*   **Auth**: Add user accounts to save favorite articles.
*   **Vector Search**: Use Convex Vector Search for semantic querying of articles.

