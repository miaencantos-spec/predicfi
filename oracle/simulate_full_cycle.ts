import "dotenv/config";
import { ethers } from "ethers";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const {
  PRIVATE_KEY,
  GEMINI_API_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
} = process.env;

const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

const FACTORY_ADDRESS = "0x7b402f2dd4fbce6b9f3c8152d257dab80631202e";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)"
];

const FACTORY_ABI = [
  "function createMarket(string memory _question, uint256 _endTime) external returns (address)",
  "function settleMarket(address _market, bool _outcome, uint8 _confidence) external"
];

const MARKET_ABI = [
  "function buyShares(bool _outcome, uint256 _amount) external",
  "function claim() external",
  "function resolved() view returns (bool)",
  "function finalOutcome() view returns (bool)"
];

async function main() {
  console.log("🔥 INICIANDO CICLO COMPLETO: APUESTAS + ORÁCULO\n");

  try {
    // 1. Crear Mercado
    const question = "¿Quién ganó el Oscar a Mejor Película en 2024?";
    const endTime = Math.floor(Date.now() / 1000) + 60; // Expira en 60 segundos para permitir apuestas
    
    console.log("1️⃣ Creando mercado...");
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);
    const createTx = await factory.createMarket(question, endTime);
    const receipt = await createTx.wait();
    const event = receipt.logs.find((log: any) => log.topics[0] === ethers.id("MarketCreated(address,address,string)"));
    const marketAddress = ethers.getAddress(ethers.dataSlice(event.topics[1], 12));
    console.log(`   ✅ Mercado: ${marketAddress}`);

    // Sincronizar con DB
    await supabase.from('markets').insert({
        market_address: marketAddress.toLowerCase(),
        question,
        ends_at: new Date(endTime * 1000).toISOString(),
        status: 'active'
    });

    // 2. Hacer Apuestas
    console.log("\n2️⃣ Realizando apuestas (Simulación)...");
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);
    const market = new ethers.Contract(marketAddress, MARKET_ABI, wallet);

    const betAmount = ethers.parseUnits("1", 6); // 1 USDC
    
    console.log("   🔓 Aprobando USDC...");
    const appTx = await usdc.approve(marketAddress, betAmount * 10n); // Aprobamos de más por si acaso
    console.log(`   ⏳ Esperando confirmación de aprobación (Hash: ${appTx.hash})...`);
    await appTx.wait(2); // Esperamos 2 confirmaciones para estar seguros en Base Sepolia

    console.log("   💰 Apostando 1 USDC al SÍ...");
    const betYesTx = await market.buyShares(true, betAmount);
    await betYesTx.wait();

    console.log("   💰 Apostando 1 USDC al NO...");
    const betNoTx = await market.buyShares(false, betAmount);
    await betNoTx.wait();

    // 3. Esperar a que expire
    console.log("\n3️⃣ Esperando a que el mercado expire (aprox 40s)...");
    while (Math.floor(Date.now() / 1000) <= endTime) {
        process.stdout.write(".");
        await new Promise(r => setTimeout(r, 5000));
    }
    console.log("\n   ⌛ Mercado expirado.");

    // 4. Oráculo Gemini
    console.log("\n4️⃣ Invocando Gemini para resolución...");
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const prompt = `Responde SOLO JSON: {"outcome": 1, "reason": "..."} para: ${question}. 1=Oppenheimer (SÍ), 2=Otros (NO).`;
    const result = await model.generateContent(prompt);
    const aiVeredict = JSON.parse(result.response.text().match(/\{.*\}/s)![0]);
    const finalOutcome = aiVeredict.outcome === 1;
    
    console.log(`   🎯 Veredicto: ${finalOutcome ? "SÍ (Oppenheimer)" : "NO"}`);

    // 5. Resolver On-Chain
    console.log("\n5️⃣ Enviando resolución a la Blockchain...");
    const settleTx = await factory.settleMarket(marketAddress, finalOutcome, 100);
    await settleTx.wait();
    console.log("   ✅ Mercado resuelto.");

    // 6. Reclamar Premios
    console.log("\n6️⃣ Reclamando premios para el ganador...");
    const balanceBefore = await usdc.balanceOf(wallet.address);
    const claimTx = await market.claim();
    await claimTx.wait();
    const balanceAfter = await usdc.balanceOf(wallet.address);
    
    console.log(`   🏆 Premio reclamado. Diferencia de balance: ${ethers.formatUnits(balanceAfter - balanceBefore, 6)} USDC`);
    console.log("\n✨ PRUEBA E2E COMPLETA FINALIZADA CON ÉXITO.");

  } catch (error: any) {
    console.error("\n❌ ERROR:", error);
  }
}

main();
