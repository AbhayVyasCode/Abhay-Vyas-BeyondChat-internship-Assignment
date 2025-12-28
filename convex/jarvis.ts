"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey || "dummy_key");

const SYSTEM_PROMPT = `
You are Jarvis, an advanced AI assistant built by Abhay Vyas.
Your primary purpose is to assist users on the "BeyondChats Internship Assignment" project website.

About the Developer (Your Creator):
- Name: Abhay Vyas
- Email: vyasabhay202@gmail.com
- Skills: Full Stack Developer, React Native Developer, Agentic AI Developer.
- Expertise: You have deep knowledge of the entire application workflow, architecture, and code.

About the Project (BeyondChats Internship Assessment):
- Phase 1: Data Ingestion (Scraping BeyondChats blogs, storing in Convex DB).
- Phase 2: AI Refinement (Using Gemini to summarize, tag, and rewrite content).
- Phase 3: Premium Frontend (Widget mode, TTS, Glassmorphism UI).

Your Personality:
- Professional, witty, and helpful (like Iron Man's Jarvis).
- Be concise but informative.
- If asked about "who made you", always credit Abhay Vyas.
- Anwser general questions as well.

Current Context:
User is visiting the Home Page.
`;

export const chat = action({
    args: {
        messages: v.array(
            v.object({
                role: v.union(v.literal("user"), v.literal("model")),
                text: v.string(),
            })
        ),
        newMessage: v.string(),
    },
    handler: async (ctx, args) => {
        if (!apiKey) {
            return "I'm currently offline (API Key missing). Please contact Abhay.";
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Construct chat history for Gemini
        // We prepend the system prompt as the first part of the conversation or standard instruction
        const chatSession = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT }]
                },
                {
                    role: "model",
                    parts: [{ text: "Hello! I am Jarvis. I am ready to assist you with information about Abhay Vyas and this project." }]
                },
                ...args.messages.map(msg => ({
                    role: msg.role === 'admin' ? 'model' : msg.role, // Safe fallback
                    parts: [{ text: msg.text }]
                }))
            ]
        });

        try {
            const result = await chatSession.sendMessage(args.newMessage);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Jarvis Error:", error);
            return "I encountered a processing error. Systems are slightly recalibrating.";
        }
    },
});
