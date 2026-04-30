console.log("🛠️ Cargando script...");
import { ethers } from "ethers";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../.env") });
// Configuración
const RPC_URL = "https://base-sepolia.g.alchemy.com/v2/nn0ydHbZ0QvA9S53B6CnX";
const FACTORY_ADDRESS = "0x7B402f2DD4FbcE6B9f3c8152d257DAB80631202E";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY_VAR || "";
// ABIs mínimas
const FACTORY_ABI = [
    "function settleMarket(address _market, bool _outcome, uint8 _confidence) external",
    "event MarketCreated(address indexed market, address indexed creator, string question)"
];
const MARKET_ABI = [
    "function question() external view returns (string)",
    "function endTime() external view returns (uint256)",
    "function resolved() external view returns (bool)"
];
async function resolve() {
    console.log("🚀 Iniciando Oráculo PredicFi...");
    if (!GEMINI_API_KEY) {
        console.error("❌ Error: GEMINI_API_KEY_VAR no encontrada en .env");
        return;
    }
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);
    // 1. Obtener mercados creados (vía logs para este ejemplo)
    console.log("🔍 Buscando mercados activos...");
    const filter = factory.filters.MarketCreated();
    const events = await factory.queryFilter(filter, -10000); // Últimos 10k bloques
    console.log(`📊 Encontrados ${events.length} mercados para revisar.`);
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const systemPrompt = fs.readFileSync(path.join(__dirname, "prompt_gemini.txt"), "utf8");
    for (const event of events) {
        const marketAddr = event.args.market;
        const market = new ethers.Contract(marketAddr, MARKET_ABI, provider);
        const [question, endTime, resolved] = await Promise.all([
            market.question(),
            market.endTime(),
            market.resolved()
        ]);
        const now = Math.floor(Date.now() / 1000);
        if (!resolved && now >= Number(endTime)) {
            console.log(`⚖️ Resolviendo: "${question}" (${marketAddr})`);
            const prompt = `Pregunta del Mercado: "${question}"\nFecha de expiración (Unix): ${endTime}\nFecha actual (Unix): ${now}\n\nDetermina el resultado basándote en datos reales.`;
            try {
                const result = await model.generateContent([systemPrompt, prompt]);
                const responseText = result.response.text();
                // Limpiar JSON si Gemini añade markdown
                const jsonMatch = responseText.match(/\{.*\}/s);
                if (!jsonMatch)
                    throw new Error("No se encontró JSON en la respuesta");
                const data = JSON.parse(jsonMatch[0]);
                console.log(`🤖 Gemini dice: Outcome=${data.outcome}, Confidence=${data.confidence_score}%`);
                console.log(`📝 Razonamiento: ${data.reasoning}`);
                if (data.confidence_score >= 80) {
                    console.log("📤 Enviando resolución a la blockchain...");
                    const tx = await factory.settleMarket(marketAddr, data.outcome, data.confidence_score);
                    await tx.wait();
                    console.log(`✅ Mercado ${marketAddr} resuelto con éxito! Tx: ${tx.hash}`);
                }
                else {
                    console.log("⚠️ Confianza insuficiente para resolución automática.");
                }
            }
            catch (err) {
                console.error(`❌ Error procesando mercado ${marketAddr}:`, err);
            }
        }
        else if (resolved) {
            // console.log(`ℹ️ Mercado ${marketAddr} ya esta resuelto.`);
        }
        else {
            console.log(`⏳ Mercado "${question}" aun no expira (faltan ${Math.floor((Number(endTime) - now) / 60)} min).`);
        }
    }
}
resolve().catch(console.error);
