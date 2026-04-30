import "dotenv/config";
import { ethers } from "ethers";
import * as fs from "fs";

// Configuración de Red y Wallet
const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

// Dirección de la Factory (Base Sepolia)
const FACTORY_ADDRESS = "0x7b402f2dd4fbce6b9f3c8152d257dab80631202e";

// ABI mínimo para crear mercado
const FACTORY_ABI = [
  "function createMarket(string _question, uint256 _endTime) returns (address)"
];

const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);

async function createMarket(question: string, dateStr: string) {
  // El endTime debe ser después del partido. 
  // Por defecto, ponemos el final del día del partido + 4 horas (en segundos)
  const matchDate = new Date(dateStr);
  const endTime = Math.floor(matchDate.getTime() / 1000) + (24 * 3600); // 24h después del inicio del día

  console.log(`🚀 Creando Mercado: ${question.substring(0, 50)}...`);

  try {
    const tx = await factory.createMarket(question, endTime);
    console.log(`⏳ TX: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ Creado.`);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

async function main() {
  const matches = JSON.parse(fs.readFileSync("./world_cup_2026_matches.json", "utf-8"));
  const BATCH_SIZE = 20;
  
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Saldo actual: ${ethers.formatEther(balance)} ETH`);
  
  if (balance === 0n) {
    console.error("❌ No tienes saldo en Base Sepolia para pagar el gas.");
    return;
  }

  console.log(`🏆 Iniciando inyección de ${matches.length} mercados del Mundial 2026 en bloques de ${BATCH_SIZE}...`);
  
  for (let i = 0; i < matches.length; i += BATCH_SIZE) {
    const chunk = matches.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 Procesando Bloque ${Math.floor(i / BATCH_SIZE) + 1} (${i + 1} a ${Math.min(i + BATCH_SIZE, matches.length)})...`);
    
    for (const match of chunk) {
      await createMarket(match.question, match.date);
      // Delay entre transacciones
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (i + BATCH_SIZE < matches.length) {
      console.log(`⏳ Esperando 10 segundos antes del siguiente bloque para evitar rate limits...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  console.log("\n🏁 ¡Todos los mercados han sido inyectados con éxito!");
}

main().catch(console.error);
