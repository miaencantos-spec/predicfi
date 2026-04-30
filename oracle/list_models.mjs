import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_VAR || "");

async function listModels() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY_VAR}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log("Modelos disponibles:");
        data.models.forEach(m => console.log("- " + m.name));
    } catch (e) {
        console.error("Error listando modelos:", e);
    }
}

listModels();
