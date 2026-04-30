import "dotenv/config";
import { ethers } from "ethers";
import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Usar Service Role para escritura
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuración de Red y Wallet
const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

// Dirección de la Factory (Base Sepolia)
const FACTORY_ADDRESS = "0x7b402f2dd4fbce6b9f3c8152d257dab80631202e";

// ABI mínimo para crear mercado y detectar evento
const FACTORY_ABI = [
  "function createMarket(string _question, uint256 _endTime) returns (address)",
  "event MarketCreated(address indexed marketAddress, string question, uint256 endTime)"
];

const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);

async function createMarketAndSync(match: any) {
  const matchDate = new Date(match.date);
  const endTime = Math.floor(matchDate.getTime() / 1000) + (24 * 3600); 

  console.log(`🚀 Creando Mercado: ${match.teamA} vs ${match.teamB}...`);

  try {
    const tx = await factory.createMarket(match.question, endTime);
    console.log(`⏳ TX: ${tx.hash}`);
    const receipt = await tx.wait();
    
    // Extraer dirección del mercado del log de eventos
    const event = receipt.logs.find((log: any) => log.address.toLowerCase() === FACTORY_ADDRESS.toLowerCase());
    const decodedLog = factory.interface.parseLog(event);
    const marketAddress = decodedLog?.args[0];

    if (marketAddress) {
      console.log(`✅ Creado en: ${marketAddress}. Sincronizando con Supabase...`);
      
      const { error } = await supabase
        .from("markets")
        .upsert({
          address: marketAddress.toLowerCase(),
          question: match.question,
          end_time: endTime,
          team_a: match.teamA,
          team_b: match.teamB,
          group: match.group,
          match_date: match.date,
          category: "WORLD_CUP_2026",
          metadata: {
            matchNumber: match.matchNumber,
            homeColor: "bg-blue-500", // Default colors, can be refined
            awayColor: "bg-red-500"
          }
        });

      if (error) console.error("❌ Error Supabase:", error.message);
      else console.log("✨ Sincronizado correctamente.");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

async function main() {
  const matches = JSON.parse(fs.readFileSync("./world_cup_2026_matches.json", "utf-8"));
  const BATCH_SIZE = 10; // Reducido para mayor estabilidad con Supabase
  
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Saldo actual: ${ethers.formatEther(balance)} ETH`);
  
  if (balance === 0n) {
    console.error("❌ No tienes saldo en Base Sepolia para pagar el gas.");
    return;
  }

  console.log(`🏆 Iniciando inyección de ${matches.length} mercados con sincronización Supabase...`);
  
  for (let i = 0; i < matches.length; i += BATCH_SIZE) {
    const chunk = matches.slice(i, i + BATCH_SIZE);
    
    for (const match of chunk) {
      await createMarketAndSync(match);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log("\n🏁 ¡Inyección y sincronización completada!");
}

main().catch(console.error);
