import "dotenv/config";
import { ethers } from "ethers";
import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuración de Red y Wallet
const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

// Dirección de la Factory
const FACTORY_ADDRESS = "0x7b402f2dd4fbce6b9f3c8152d257dab80631202e";
const FACTORY_ABI = [
  "function createMarket(string _question, uint256 _endTime) returns (address)"
];

async function clearOldData() {
  console.log("🧹 Limpiando datos antiguos en Supabase...");
  await supabase.from('markets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('pollas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log("✅ Tablas markets y pollas limpias.");
}

async function createMarketAndSync(question: string) {
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);
  const endTime = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7); // 1 semana
  
  console.log(`\n🚀 Creando mercado On-Chain: ${question.substring(0, 50)}...`);
  
  try {
    const tx = await factory.createMarket(question, endTime);
    const receipt = await tx.wait();
    
    // Extraer dirección del mercado del evento
    const event = receipt.logs.find((log: any) => log.topics[0] === ethers.id("MarketCreated(address,address,string)"));
    const marketAddress = ethers.getAddress(ethers.dataSlice(event.topics[1], 12));
    
    console.log(`✅ Mercado On-Chain: ${marketAddress}`);

    // Sincronizar con Supabase
    const { error } = await supabase.from('markets').insert({
        market_address: marketAddress.toLowerCase(),
        creator_address: wallet.address.toLowerCase(),
        question: question,
        ends_at: new Date(endTime * 1000).toISOString(),
        status: 'active'
    });

    if (error) throw error;
    console.log("📊 Sincronizado con Supabase.");
    
    return marketAddress;
  } catch (error) {
    console.error("❌ Error:", error);
    return null;
  }
}

async function main() {
  console.log("🛠️ --- INYECTOR ESTRATÉGICO PREDICFI (30 MERCADOS) ---");
  
  await clearOldData();

  const data = JSON.parse(fs.readFileSync("./mock_30_data.json", "utf-8"));
  
  for (const group of data) {
    console.log(`\n📦 Procesando Categoría: ${group.category}`);
    
    if (group.category === "1X2") {
      for (const m of group.matches) {
        await createMarketAndSync(m.question);
      }
    } else if (group.category === "Classic Binary" || group.category === "Head-to-Head") {
      for (const m of group.markets) {
        await createMarketAndSync(m.question);
      }
    } else if (group.category === "PollaVault") {
        for (const v of group.vaults) {
            // Mock sync para pollas (Category 2)
            await supabase.from('pollas').insert({
                vault_address: "0xmock" + Math.random().toString(16).substring(2, 10),
                creator: wallet.address,
                entry_cost: 10000000n, // 10 USDC
                status: 'open',
                events_description: v.title,
                ends_at: new Date(Date.now() + 86400000 * 7).toISOString()
            });
            console.log(`✅ Polla Mock inyectada: ${v.title}`);
        }
    } else if (group.category === "Multi-Level") {
        for (const m of group.markets) {
            // Inyectamos como mercados clásicos pero marcamos algo especial?
            // Por ahora solo como mercados en Supabase
            await createMarketAndSync(`[MULTI] ${m.title}`);
        }
    }
  }

  console.log("\n🏁 ¡Refactorización de datos mockeados completada!");
}

main().catch(console.error);
