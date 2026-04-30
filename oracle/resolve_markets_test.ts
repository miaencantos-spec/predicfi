import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// Verificación de seguridad
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ ERROR: Faltan variables de entorno");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function resolveTestMarket() {
  console.log("\n--- 🧪 SIMULACIÓN E2E ORÁCULO PREDICFI ---");
  
  try {
    const { data: expiredMarkets, error } = await supabase
      .from('markets')
      .select('*')
      .eq('market_address', '0x000000000000000000000000000000000000test');

    if (error) throw error;
    if (!expiredMarkets || expiredMarkets.length === 0) {
      console.log("💤 No se encontró el mercado de prueba.");
      return;
    }

    const market = expiredMarkets[0];
    console.log(`🔍 Procesando: "${market.question}"`);
      
    const actualDate = new Date().toISOString();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const currentPrompt = `
    FECHA ACTUAL: ${actualDate}
    Actúa como un oráculo de predicción profesional.
    PREGUNTA: ${market.question}
    
    TAREA: Investiga y determina si el evento ocurrió (SÍ/NO). 
    Responde ÚNICAMENTE con este JSON: {"outcome": 1, "reason": "explicación corta"}. 
    (1=SÍ, 2=NO)`;

    console.log("🧠 Llamando a Gemini...");
    const result = await model.generateContent(currentPrompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{.*\}/s);
    let aiVeredict = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (aiVeredict) {
      const finalOutcomeBool = aiVeredict.outcome === 1;
      console.log(`🎯 Veredicto: ${finalOutcomeBool ? 'SÍ' : 'NO'} | Razón: ${aiVeredict.reason}`);

      try {
        // SIMULACIÓN DE TRANSACCIÓN
        console.log("⏳ Simulando Tx enviada...");
        const fakeTxHash = "0x" + Math.random().toString(16).slice(2) + "test_hash";
        console.log(`✅ Tx simulada: ${fakeTxHash}`);

        // 4. Actualizar la tabla markets
        const { error: updErr } = await supabase.from('markets').update({ 
          status: 'resolved', 
          outcome: finalOutcomeBool,
          resolution_reason: aiVeredict.reason,
          resolved_at: new Date().toISOString()
        }).eq('market_address', market.market_address);

        if (updErr) throw updErr;

        // 5. 🛡️ GUARDAR EN LA CAJA NEGRA
        const { error: logErr } = await supabase.from('oracle_logs').insert({
          market_address: market.market_address,
          ai_prompt_used: currentPrompt,
          ai_response_raw: aiVeredict,
          tx_hash: fakeTxHash,
          error_log: null
        });

        if (logErr) throw logErr;
        
        console.log("💾 DB Sync Success & Logged.");
      } catch (txErr: any) {
        console.error("❌ Error en simulacion:", txErr.message);
        await supabase.from('oracle_logs').insert({
          market_address: market.market_address,
          ai_prompt_used: currentPrompt,
          ai_response_raw: aiVeredict || null,
          tx_hash: null,
          error_log: JSON.stringify(txErr)
        });
      }
    }
  } catch (error) {
    console.error("💥 Error crítico:", error);
  }
}

resolveTestMarket();
