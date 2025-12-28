
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.resolve(rootDir, '.env.local');

async function main() {
    try {
        let apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey && fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            const match = envContent.match(/GOOGLE_API_KEY=(.*)/);
            if (match) apiKey = match[1].trim();
        }

        if (!apiKey) {
            console.error("❌ No GOOGLE_API_KEY found in .env.local or environment.");
            return;
        }

        console.log("Found API Key. Fetching models...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", data.error.message);
            return;
        }

        if (!data.models) {
            console.log("No models found or unexpected format:", data);
            return;
        }

        console.log("\n✨ AWSOME! Here are the available Gemini Models:\n");
        const generateModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));

        generateModels.forEach(m => {
            console.log(`🔹 ID: ${m.name.replace('models/', '')}`);
            console.log(`   Name: ${m.displayName}`);
            console.log(`   Description: ${m.description.slice(0, 100)}...`);
            console.log("--------------------------------------------------");
        });

    } catch (err) {
        console.error("Script failed:", err);
    }
}

main();
