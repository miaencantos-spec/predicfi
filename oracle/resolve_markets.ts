import "dotenv/config";
import { ethers } from "ethers";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// Verificación de seguridad
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ ERROR: Faltan variables de entorno");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const FACTORY_ADDRESS = "0x7b402f2dd4fbce6b9f3c8152d257dab80631202e";
const FACTORY_ABI = ["function settleMarket(address _market, bool _outcome, uint8 _confidence) external"];
const MARKET_ABI = ["function resolved() view returns (bool)"];
const VAULT_ABI = [
  "function resolveTournament(address[] winners, uint256[] payouts) external",
  "function totalPool() view returns (uint256)",
  "function resolved() view returns (bool)",
  "function FEE_BPS() view returns (uint256)"
];

async function resolvePollas() {
  console.log("\n--- 🏟️ PROCESANDO POLLAS FUTBOLERAS ---");
  try {
    const { data: pendingPollas, error } = await supabase
      .from('pollas')
      .select('*')
      .eq('status', 'locked');

    if (error) throw error;
    if (!pendingPollas || pendingPollas.length === 0) return;

    for (const polla of pendingPollas) {
      console.log(`\n🏟️ Resolviendo Polla: ${polla.vault_address}`);
      const { data: predictions } = await supabase.from('pollas_predictions').select('*').eq('vault_address', polla.vault_address);
      
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const resultsPrompt = `Identifica resultados: ${polla.events_description}. JSON: {"match1": "2-1", ...}`;
      const res = await model.generateContent(resultsPrompt);
      const actualResults = JSON.parse(res.response.text().match(/\{.*\}/s)![0]);

      const scoringPrompt = `Juez: Real: ${JSON.stringify(actualResults)}, Preds: ${JSON.stringify(predictions)}. JSON: {"winners": ["0x..."], "payout_weights": [50, 50], "reason": "..."}`;
      const scoreRes = await model.generateContent(scoringPrompt);
      const verdict = JSON.parse(scoreRes.response.text().match(/\{.*\}/s)![0]);

      const vaultContract = new ethers.Contract(polla.vault_address, VAULT_ABI, wallet);
      const netPool = (await vaultContract.totalPool() * (10000n - await vaultContract.FEE_BPS())) / 10000n;
      const payouts = verdict.payout_weights.map((w: number) => (netPool * BigInt(w)) / 100n);

      const tx = await vaultContract.resolveTournament(verdict.winners, payouts);
      await tx.wait();

      await supabase.from('pollas').update({ status: 'resolved', results_json: actualResults, winners_json: verdict, resolved_at: new Date().toISOString() }).eq('vault_address', polla.vault_address);
      console.log("✅ Polla resuelta.");
    }
  } catch (e: any) { console.error("❌ Error en pollas:", e.message); }
}

async function resolveExpiredMarkets() {
  console.log("\n--- 🤖 INICIANDO CICLO DEL ORÁCULO PREDICFI ---");
  
  try {
    const now = new Date().toISOString();
    const { data: expiredMarkets, error } = await supabase
      .from('markets')
      .select('*')
      .eq('status', 'active')
      .lt('ends_at', now);

    if (error) throw error;
    if (!expiredMarkets || expiredMarkets.length === 0) {
      console.log("💤 No hay mercados expirados.");
      return;
    }

    console.log(`🔍 Encontrados ${expiredMarkets.length} mercados para resolver.`);

    for (const market of expiredMarkets) {
      console.log(`\n🧠 Procesando: "${market.question}"`);
      
      let aiVeredict = null;
      let retries = 0;
      const maxRetries = 2;
      let currentPrompt = "";

      // Detectar Formato
      const format = market.question?.match(/\[FORMAT:(.*?)\]/i)?.[1] || 'BINARY';

      while (!aiVeredict && retries <= maxRetries) {
        try {
          const actualDate = new Date().toISOString();
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          
          let formatInstructions = "";
          if (format === '1X2') {
            formatInstructions = "Determina si ganó el Local (1), hubo Empate (X) o ganó el Visitante (2). Responde { 'outcome': '1' | 'X' | '2', 'reason': '...' }";
          } else if (format === 'MULTI') {
            formatInstructions = "Determina cuál de las opciones listadas en [OPTIONS:...] es la correcta. Responde { 'outcome': 'label_ganador', 'reason': '...' }";
          } else if (format === 'H2H') {
            formatInstructions = "Determina cuál de los dos competidores ganó. Responde { 'outcome': 1 (Competidor A) o 0 (Competidor B), 'reason': '...' }";
          } else {
            formatInstructions = "Determina si el evento ocurrió (SÍ/NO). Responde { 'outcome': 1 (SÍ) o 0 (NO), 'reason': '...' }";
          }

          currentPrompt = `
          FECHA ACTUAL: ${actualDate}
          Actúa como un oráculo de predicción profesional.
          FORMATO: ${format}
          PREGUNTA: ${market.question}
          
          TAREA: ${formatInstructions}
          Responde ÚNICAMENTE con el JSON solicitado.`;

          const result = await model.generateContent(currentPrompt);
          const responseText = result.response.text();
          const jsonMatch = responseText.match(/\{.*\}/s);
          if (jsonMatch) aiVeredict = JSON.parse(jsonMatch[0]);
        } catch (err: any) {
          if (err.status === 429 || err.status === 503) {
            retries++;
            console.log(`⚠️ Gemini ocupado. Reintento ${retries} en 20s...`);
            await new Promise(r => setTimeout(r, 20000));
          } else {
            console.error("❌ Error de IA:", err.message);
            break;
          }
        }
      }

      if (aiVeredict) {
        // Mapear veredicto a booleano para el contrato actual (que solo soporta bool)
        // Nota: Si el contrato se actualiza a multivariante, esto cambiará.
        let finalOutcomeBool = false;
        if (format === '1X2') finalOutcomeBool = aiVeredict.outcome === '1';
        else if (format === 'H2H') finalOutcomeBool = aiVeredict.outcome === 1;
        else finalOutcomeBool = aiVeredict.outcome === 1 || aiVeredict.outcome === '1';

        console.log(`🎯 Veredicto [${format}]: ${aiVeredict.outcome} | Razón: ${aiVeredict.reason}`);

        try {
          const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);
          const marketContract = new ethers.Contract(market.market_address, MARKET_ABI, provider);
          
          let txHash = null;
          if (!(await marketContract.resolved())) {
            const tx = await factoryContract.settleMarket(market.market_address, finalOutcomeBool, 100);
            console.log(`⏳ Tx enviada: ${tx.hash}`);
            txHash = tx.hash;
            await tx.wait();
            console.log("✅ On-chain Success.");
          }

          // 4. Actualizar la tabla markets
          await supabase.from('markets').update({ 
            status: 'resolved', 
            outcome: finalOutcomeBool,
            resolution_reason: aiVeredict.reason,
            resolved_at: new Date().toISOString()
          }).eq('market_address', market.market_address.toLowerCase());

          // 5. 🛡️ GUARDAR EN LA CAJA NEGRA (NUEVO)
          await supabase.from('oracle_logs').insert({
            market_address: market.market_address,
            ai_prompt_used: currentPrompt,
            ai_response_raw: aiVeredict,
            tx_hash: txHash,
            error_log: null
          });
          
          console.log("💾 DB Sync Success & Logged.");
        } catch (txErr: any) {
          console.error("❌ Error resolviendo el mercado:", txErr.message);
          
          // 🛡️ GUARDAR EL ERROR EN LA CAJA NEGRA
          await supabase.from('oracle_logs').insert({
            market_address: market.market_address,
            ai_prompt_used: currentPrompt,
            ai_response_raw: aiVeredict || null,
            tx_hash: null,
            error_log: JSON.stringify(txErr)
          });
        }
      }

      // Evitar rate limits
      await new Promise(r => setTimeout(r, 5000));
    }
  } catch (error) {
    console.error("💥 Error crítico:", error);
  }
}

async function startWorker() {
  console.log(`🚀 ORACLE ACTIVE | Network: Base Sepolia | IA: Gemini 2.5 Flash`);
  while (true) {
    await resolveExpiredMarkets();
    await resolvePollas();
    await new Promise(r => setTimeout(r, 60000));
  }
}

startWorker();
