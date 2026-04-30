import "dotenv/config";
import { ethers } from "ethers";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const { PRIVATE_KEY, GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

const FACTORY_ADDRESS = "0x7b402f2dd4fbce6b9f3c8152d257dab80631202e";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const MARKET_ADDRESS = "0x64D0d106B2c41B567893d751799df5bb2BdAfEc4";

const FACTORY_ABI = ["function settleMarket(address _market, bool _outcome, uint8 _confidence) external"];
const MARKET_ABI = ["function claim() external", "function resolved() view returns (bool)"];
const ERC20_ABI = ["function balanceOf(address account) external view returns (uint256)"];

async function finish() {
    console.log(`🏁 FINALIZANDO MERCADO: ${MARKET_ADDRESS}\n`);
    
    try {
        const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);
        const market = new ethers.Contract(MARKET_ADDRESS, MARKET_ABI, wallet);
        const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);

        // 1. Consultar Gemini
        console.log("🧠 Consultando Gemini (Reintento)...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const question = "¿Quién ganó el Oscar a Mejor Película en 2024? (SÍ=Oppenheimer)";
        const prompt = `Responde SOLO JSON: {"outcome": 1, "reason": "..."} para: ${question}. 1=SÍ, 2=NO.`;
        
        const result = await model.generateContent(prompt);
        const aiVeredict = JSON.parse(result.response.text().match(/\{.*\}/s)![0]);
        const finalOutcome = aiVeredict.outcome === 1;
        console.log(`🎯 Veredicto: ${finalOutcome ? "SÍ" : "NO"} | Razón: ${aiVeredict.reason}`);

        // 2. Resolver On-Chain
        console.log("\n⛓️ Resolviendo On-Chain...");
        const tx = await factory.settleMarket(MARKET_ADDRESS, finalOutcome, 100);
        await tx.wait();
        console.log("✅ Mercado resuelto.");

        // 3. Claim
        console.log("\n🏆 Reclamando premio...");
        const before = await usdc.balanceOf(wallet.address);
        const claimTx = await market.claim();
        await claimTx.wait();
        const after = await usdc.balanceOf(wallet.address);
        
        console.log(`✨ ÉXITO. Ganancia neta: ${ethers.formatUnits(after - before, 6)} USDC`);
        
        // 4. Actualizar DB
        await supabase.from('markets').update({ 
            status: 'resolved', 
            outcome: finalOutcome,
            resolution_reason: aiVeredict.reason
        }).eq('market_address', MARKET_ADDRESS.toLowerCase());

    } catch (e: any) {
        console.error("❌ Fallo final:", e.message);
    }
}

finish();
