import "dotenv/config";
import { ethers } from "ethers";

/**
 * 🚀 SCRIPT: CREAR MERCADO RÁPIDO
 */

const PROVIDER_URL = "https://sepolia.base.org";
const FACTORY_ADDR = "0x7b402f2dd4fbce6b9f3c8152d257dab80631202e";

const FACTORY_ABI = [
    "function createMarket(string memory _question, uint256 _endTime) external returns (address)"
];

async function createQuickMarket() {
    const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    const factory = new ethers.Contract(FACTORY_ADDR, FACTORY_ABI, wallet);

    console.log("🛠️ Creando mercado en Base Sepolia...");
    
    const question = "¿Superará Ethereum los $4000 antes de Junio 2026? 🚀";
    const endTime = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30); // 30 días

    try {
        const tx = await factory.createMarket(question, endTime);
        console.log(`⏳ Tx enviada: ${tx.hash}`);
        const receipt = await tx.wait();
        
        // El evento MarketCreated es el primer evento (index 0) del log usualmente
        // Pero para ser rápidos, lo buscaremos en los logs
        console.log("✅ Mercado Creado exitosamente.");
        console.log("Revisa las transacciones en Basescan para obtener la dirección del clon.");
    } catch (error) {
        console.error("❌ Error creando mercado:", error);
    }
}

createQuickMarket();
