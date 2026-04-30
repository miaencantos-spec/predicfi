import "dotenv/config";
import { ethers } from "ethers";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// Configuración de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const VAULT_ABI = [
  "function resolveTournament(address[] winners, uint256[] payouts) external",
  "function totalPool() view returns (uint256)",
  "function resolved() view returns (bool)",
  "function FEE_BPS() view returns (uint256)"
];

/**
 * 🤖 resolvePollas
 * Busca pollas que han terminado sus eventos y calcula ganadores.
 */
async function resolvePollas() {
  console.log("\n--- 🤖 PROCESANDO POLLAS FUTBOLERAS (Pari-Mutuel) ---");

  try {
    const now = new Date().toISOString();
    
    // 1. Obtener pollas que deben resolverse (status 'locked')
    const { data: pendingPollas, error: pollaError } = await supabase
      .from('pollas')
      .select('*')
      .eq('status', 'locked');

    if (pollaError) throw pollaError;
    if (!pendingPollas || pendingPollas.length === 0) {
      console.log("💤 No hay pollas listas para resolución.");
      return;
    }

    for (const polla of pendingPollas) {
      console.log(`\n🏟️ Resolviendo Polla: ${polla.vault_address}`);

      // 2. Obtener predicciones de los usuarios
      const { data: predictions, error: predError } = await supabase
        .from('pollas_predictions')
        .select('*')
        .eq('vault_address', polla.vault_address);

      if (predError) throw predError;

      // 3. Obtener resultados reales usando Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const resultsPrompt = `
        Identifica los resultados finales de los siguientes eventos deportivos:
        ${polla.events_description}
        
        Responde ÚNICAMENTE en formato JSON plano:
        {"match1": "2-1", "match2": "0-0"}
      `;
      
      const result = await model.generateContent(resultsPrompt);
      const actualResults = JSON.parse(result.response.text().match(/\{.*\}/s)![0]);
      console.log("✅ Resultados Reales:", actualResults);

      // 4. Calcular puntajes y ganadores (Gemini ayuda con la lógica de comparación)
      const scoringPrompt = `
        Actúa como un juez de apuestas.
        RESULTADOS REALES: ${JSON.stringify(actualResults)}
        PREDICCIONES DE USUARIOS: ${JSON.stringify(predictions.map(p => ({ user: p.user_address, pred: p.predictions_json })))}
        
        REGLAS DE PUNTUACIÓN:
        - Marcador exacto: 3 puntos.
        - Ganador/Empate correcto (pero marcador incorrecto): 1 punto.
        - Incorrecto: 0 puntos.
        
        Calcula el puntaje total por usuario y determina quiénes tienen el puntaje más alto.
        Responde ÚNICAMENTE con este JSON:
        {
          "winners": ["0xAddress1", "0xAddress2"],
          "payout_weights": [50, 50],
          "reason": "explicación"
        }
        (payout_weights debe sumar 100)
      `;

      const scoreResult = await model.generateContent(scoringPrompt);
      const verdict = JSON.parse(scoreResult.response.text().match(/\{.*\}/s)![0]);
      console.log("🏆 Veredicto de Ganadores:", verdict);

      // 5. Ejecutar resolución On-Chain
      const vaultContract = new ethers.Contract(polla.vault_address, VAULT_ABI, wallet);
      
      const totalPool = await vaultContract.totalPool();
      const feeBps = await vaultContract.FEE_BPS();
      const netPool = (totalPool * (10000n - feeBps)) / 10000n;

      const winners = verdict.winners;
      const payouts = verdict.payout_weights.map((weight: number) => 
        (netPool * BigInt(weight)) / 100n
      );

      console.log(`⏳ Enviando resolución a la cadena...`);
      const tx = await vaultContract.resolveTournament(winners, payouts);
      await tx.wait();
      console.log(`✅ On-chain Success! Tx: ${tx.hash}`);

      // 6. Actualizar DB
      await supabase.from('pollas').update({ 
        status: 'resolved',
        results_json: actualResults,
        winners_json: verdict,
        resolved_at: new Date().toISOString()
      }).eq('vault_address', polla.vault_address);

      console.log("💾 DB Actualizada.");
    }
  } catch (error) {
    console.error("❌ Error en resolvePollas:", error);
  }
}

// Ejecutar cada 5 minutos
setInterval(resolvePollas, 300000);
resolvePollas();
