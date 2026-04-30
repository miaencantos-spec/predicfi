import "dotenv/config";
import { ethers } from "ethers";

/**
 * 🤖 BOT DE LIQUIDEZ Y VOLUMEN (PredicFi)
 * 
 * Este script simula actividad real en los mercados Pro para generar
 * los puntos de datos necesarios para que las gráficas se muevan.
 */

const PROVIDER_URL = "https://sepolia.base.org";
const USDC_ADDR = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const MARKET_ABI = [
    "function buyShares(bool _outcome, uint256 _amount) external",
    "function totalYesShares() view returns (uint256)",
    "function totalNoShares() view returns (uint256)"
];

const USDC_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) view returns (uint256)"
];

async function simulateVolume(marketAddress: string) {
    console.log(`\n🚀 Iniciando Bot de Volumen para Mercado: ${marketAddress}`);
    
    const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    const market = new ethers.Contract(marketAddress, MARKET_ABI, wallet);
    const usdc = new ethers.Contract(USDC_ADDR, USDC_ABI, wallet);

    for (let i = 0; i < 5; i++) {
        console.log(`\n--- Tick de Volumen #${i + 1} ---`);
        
        // 1. Decidir resultado aleatorio (Probabilidades dinámicas)
        const outcome = Math.random() > 0.5;
        const amount = ethers.parseUnits((Math.random() * 5 + 1).toFixed(2), 6); // 1-6 USDC

        console.log(`Apuesta de ${ethers.formatUnits(amount, 6)} USDC al ${outcome ? 'SÍ' : 'NO'}`);

        try {
            // 2. Approve si es necesario (simplificado para el bot)
            const approveTx = await usdc.approve(marketAddress, amount);
            await approveTx.wait();

            // 3. Comprar Shares
            const tx = await market.buyShares(outcome, amount);
            console.log(`⏳ Tx enviada: ${tx.hash}`);
            await tx.wait();
            console.log(`✅ Apuesta confirmada.`);

            // 4. Ver nuevo estado del precio
            const yes = await market.totalYesShares();
            const no = await market.totalNoShares();
            const priceYes = Number(yes) / (Number(yes) + Number(no));
            console.log(`📈 Nuevo Precio del SÍ: ${priceYes.toFixed(4)}`);

        } catch (error) {
            console.error("❌ Error en el tick:", error);
        }

        // Esperar entre 10 y 30 segundos entre apuestas
        const waitTime = Math.floor(Math.random() * 20000) + 10000;
        console.log(`Dormir ${waitTime/1000}s...`);
        await new Promise(r => setTimeout(r, waitTime));
    }

    console.log("\n✅ Ciclo de volumen completado.");
}

// Ejemplo: Reemplaza con una dirección de mercado activa de tu factory
simulateVolume("0x1094f3ee1dfbc574f1774e79393a525f099182a0"); 
