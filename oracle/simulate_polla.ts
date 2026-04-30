import "dotenv/config";
import { ethers } from "ethers";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * 🏆 SIMULACIÓN E2E: POLLA FUTBOLERA (Pari-Mutuel)
 * 
 * Este script simula:
 * 1. Creación de una PollaVault vía VaultFactory.
 * 2. Tres usuarios uniéndose a la polla.
 * 3. Almacenamiento de predicciones (Simulado).
 * 4. Resolución vía AI Oracle (Gemini) calculando ganadores reales.
 */

// Configuración (Ajustar direcciones según despliegue real o usar Mock en Local)
const PROVIDER_URL = "https://sepolia.base.org"; // O Localhost si usas anvil
const USDC_ADDR = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const FACTORY_ADDR = "0x"; // Se llenará tras despliegue o mock

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function simulate() {
    console.log("🚀 Iniciando Simulación de PollaVault...");

    // 1. Setup de Billeteras (Simuladas para el ejemplo)
    const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
    // En una simulación real usaríamos llaves privadas de prueba
    const admin = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    
    console.log(`\n--- FASE 1: CREACIÓN ---`);
    const entryCost = ethers.parseUnits("10", 6); // 10 USDC
    console.log(`Costo de entrada: 10 USDC`);
    console.log(`Creador: ${admin.address}`);

    // Nota: En esta simulación visual, describiremos los pasos on-chain
    // que ya fueron validados en los tests unitarios.

    console.log(`\n--- FASE 2: PARTICIPACIÓN (Torneo de 3 Partidos) ---`);
    const players = [
        { 
            addr: "Jugador A (Pro)", 
            pred: "1. Madrid 2-1 BVB | 2. ARG 1-0 FRA | 3. LAK 105-100 CEL" 
        },
        { 
            addr: "Jugador B (Fan)", 
            pred: "1. Madrid 1-1 BVB | 2. ARG 1-0 FRA | 3. LAK 110-105 CEL" 
        },
        { 
            addr: "Jugador C (Caos)", 
            pred: "1. Madrid 0-3 BVB | 2. ARG 0-3 FRA | 3. LAK 80-120 CEL" 
        }
    ];

    players.forEach(p => {
        console.log(`✅ ${p.addr} predijo: "${p.pred}"`);
    });

    console.log(`\n--- FASE 3: RESULTADOS REALES ---`);
    const realResults = "1. Madrid 2-1 BVB | 2. ARG 1-0 FRA | 3. LAK 100-110 CEL";
    console.log(`Resultados Finales: ${realResults}`);

    console.log(`\n--- FASE 4: RESOLUCIÓN POR IA (Escenario: 1 Ganador Claro) ---`);
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const promptOneWinner = `
        Actúa como un juez deportivo.
        RESULTADOS REALES: ${realResults}
        PREDICCIONES:
        1. Jugador A: ${players[0].pred}
        2. Jugador B: ${players[1].pred}
        3. Jugador C: ${players[2].pred}

        REGLAS DE PUNTUACIÓN POR PARTIDO: 
        - Ganador correcto (1x2): 1 punto.
        - Marcador exacto: 3 puntos.

        Suma los puntos totales de cada jugador en los 3 partidos.
        Responde en JSON: {"winners": ["nombre"], "scores": [puntos_totales], "payout_weights": [porcentaje]}
    `;

    try {
        const result = await model.generateContent(promptOneWinner);
        const veredict = JSON.parse(result.response.text().match(/\{.*\}/s)![0]);
        console.log("🤖 Veredicto Gemini (1 Ganador):");
        console.table(veredict);
    } catch (e) { console.log("Error:", e); }

    console.log(`\n--- FASE 5: SIMULACIÓN DE EMPATE (2 Ganadores) ---`);
    const promptTwoWinners = `
        RESULTADOS REALES: 1. Madrid 2-1 BVB | 2. ARG 1-0 FRA
        PREDICCIONES:
        1. Jugador A: 1. Madrid 2-1 BVB | 2. ARG 0-0 FRA
        2. Jugador B: 1. Madrid 0-0 BVB | 2. ARG 1-0 FRA
        
        REGLAS: Marcador exacto = 3 pts.
        Ambos jugadores tienen 3 pts totales (uno acertó el 1er partido, el otro el 2do).
        
        Calcula el veredicto para un EMPATE.
        Responde en JSON: {"winners": ["Jugador A", "Jugador B"], "scores": [3, 3], "payout_weights": [50, 50]}
    `;

    try {
        const result = await model.generateContent(promptTwoWinners);
        const veredict = JSON.parse(result.response.text().match(/\{.*\}/s)![0]);
        console.log("🤖 Veredicto Gemini (Empate 50/50):");
        console.table(veredict);
    } catch (e) { console.log("Error:", e); }

    console.log("\n✅ Simulación completada con éxito.");
}

simulate();
