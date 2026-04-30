import { ethers } from "ethers";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

// Configuración
const RPC_URL = "https://sepolia.base.org";
const FACTORY_ADDRESS = "0x7b402f2dd4fbce6b9f3c8152d257dab80631202e";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY_VAR || "";

// Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ABIs
const FACTORY_ABI = [
    "function settleMarket(address _market, bool _outcome, uint8 _confidence) external"
];

async function runResolutionCycle() {
    console.log(`\n--- 🕒 Ciclo de Resolución Iniciado: ${new Date().toLocaleString()} ---`);
    
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        let pk = process.env.CRE_ETH_PRIVATE_KEY || "";
        if (pk && !pk.startsWith("0x")) pk = "0x" + pk;
        const wallet = new ethers.Wallet(pk, provider);
        const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);

        // 1. Buscar mercados expirados y activos en Supabase
        const nowIso = new Date().toISOString();
        const { data: expiredMarkets, error } = await supabase
            .from('markets')
            .select('*')
            .eq('status', 'active')
            .lt('ends_at', nowIso);

        if (error) throw error;
        if (!expiredMarkets || expiredMarkets.length === 0) {
            console.log("📭 No hay mercados expirados pendientes.");
            return;
        }

        console.log(`🔍 Encontrados ${expiredMarkets.length} mercados expirados.`);

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const systemPrompt = fs.readFileSync(path.join(__dirname, "prompt_gemini.txt"), "utf8");

        for (const market of expiredMarkets) {
            console.log(`⚖️ Resolviendo: "${market.question}" (${market.market_address})`);

            try {
                const dateString = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                const prompt = `Hoy es ${dateString}. Determina el resultado de este mercado basándote en datos reales: "${market.question}"\n\nFecha de expiracion: ${market.ends_at}`;
                
                const result = await model.generateContent([systemPrompt, prompt]);
                const responseText = result.response.text();
                
                const jsonMatch = responseText.match(/\{.*\}/s);
                if (!jsonMatch) throw new Error("IA no devolvió JSON válido");
                
                const data = JSON.parse(jsonMatch[0]);
                console.log(`🤖 IA: Outcome=${data.outcome}, Confidence=${data.confidence_score}%`);

                if (data.confidence_score >= 80) {
                    console.log("📤 Enviando resolución a Base Sepolia...");
                    const tx = await factory.settleMarket(market.market_address, data.outcome, data.confidence_score);
                    await tx.wait();
                    console.log(`✅ ¡Éxito! TX: ${tx.hash}`);

                    // Actualizar Supabase localmente (el indexer también lo hará)
                    await supabase.from('markets').update({
                        status: 'resolved',
                        outcome: data.outcome,
                        resolution_reason: data.reasoning
                    }).eq('market_address', market.market_address);
                } else {
                    console.log("⚠️ Confianza insuficiente. Se requiere revisión manual.");
                }
            } catch (err) {
                console.error(`❌ Error en ${market.market_address}:`, err.message);
            }
        }
    } catch (err) {
        console.error("❌ Error crítico en el ciclo de resolución:", err);
    }
}

// Loop infinito cada 10 minutos
console.log("🛰️ Oráculo PredicFi Auto-Resolution iniciado...");
runResolutionCycle();
setInterval(runResolutionCycle, 10 * 60 * 1000);

