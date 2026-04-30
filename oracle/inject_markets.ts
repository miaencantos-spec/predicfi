import "dotenv/config";
import { ethers } from "ethers";

// Configuración de Red y Wallet
const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

// Dirección de la Factory (Base Sepolia)
const FACTORY_ADDRESS = "0x7b402f2dd4fbce6b9f3c8152d257dab80631202e";

// ABI mínimo para crear mercado
const FACTORY_ABI = [
  "function createMarket(string _question, uint256 _endTime) returns (address)"
];

async function createMarket(question: string, delayMinutes: number) {
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);
  
  // Calcular timestamp: ahora + retraso
  const endTime = Math.floor(Date.now() / 1000) + (delayMinutes * 60);
  
  console.log(`\n🚀 Inyectando Mercado...`);
  console.log(`📝 Pregunta: ${question}`);
  console.log(`⏱️ Cierra en: ${delayMinutes} minutos (Timestamp: ${endTime})`);

  try {
    const tx = await factory.createMarket(question, endTime);
    console.log(`⏳ Transacción enviada: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Mercado Creado con éxito en el bloque ${receipt.blockNumber}`);
  } catch (error) {
    console.error("❌ Error al crear mercado:", error);
  }
}

// Ejecutar creación de los 3 mercados
async function main() {
  console.log("🛠️ --- TERMINAL DE INYECCIÓN PREDICFI ---");
  
  // 1. Mercado Cripto (5 min para test rápido)
  await createMarket(
    "[SUBJECT: BTC/USDT] [METRIC: Close Price 1m] [THRESHOLD: 70000] [SOURCE: Binance Spot] [TIME: 15:30 GMT] ¿Cerrará BTC/USDT por encima de $70,000 en Binance Spot a las 15:30 GMT?",
    5
  );

  // 2. Mercado Tech (10 min)
  await createMarket(
    "[SUBJECT: NVDA] [METRIC: Price Action] [THRESHOLD: +2.0%] [SOURCE: NASDAQ] [TIME: 15:45 GMT] ¿Subirá NVIDIA más de un 2% en la próxima hora?",
    10
  );

  // 3. Mercado Sports (15 min)
  await createMarket(
    "[SUBJECT: Man Utd vs Brentford] [METRIC: Victory] [THRESHOLD: Utd Win] [SOURCE: EPL Official] [TIME: 16:00 GMT] ¿Ganará el Manchester United hoy?",
    15
  );
}

main().catch(console.error);
