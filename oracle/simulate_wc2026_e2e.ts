import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

/**
 * 🏆 SIMULACIÓN E2E: MUNDIAL 2026 - FASE DE GRUPOS
 * 
 * Este script simula un ciclo completo con los datos reales inyectados:
 * 1. Obtiene 3 partidos reales de la DB (Grupo A, B y C).
 * 2. Simula predicciones de 3 tipos de usuarios.
 * 3. Genera resultados reales simulados.
 * 4. Usa Gemini para arbitrar y calcular el ranking de ganadores.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function simulateE2E() {
  console.log("🚀 INICIANDO SIMULACIÓN E2E: MUNDIAL 2026\n");

  try {
    // 1. Obtener una muestra de partidos reales del fixture inyectado
    console.log("1️⃣ Consultando fixture oficial en Supabase...");
    const { data: matches, error } = await supabase
      .from('wc2026_matches')
      .select(`
        id,
        group_letter,
        home:home_team_id(name),
        away:away_team_id(name)
      `)
      .limit(3);

    if (error || !matches || matches.length < 3) {
      throw new Error("No se encontraron suficientes partidos en la DB. Ejecuta el script SQL primero.");
    }

    const matchSample = matches.map((m: any) => ({
      id: m.id,
      description: `${m.home.name} vs ${m.away.name} (Grupo ${m.group_letter})`
    }));

    matchSample.forEach(m => console.log(`   - ${m.description}`));

    // 2. Simular Predicciones de Usuarios
    console.log("\n2️⃣ Generando predicciones para 3 usuarios...");
    const users = [
      { name: "Usuario_Experto", preds: [
        { match: matchSample[0].description, score: "2-1" },
        { match: matchSample[1].description, score: "1-0" },
        { match: matchSample[2].description, score: "3-1" }
      ]},
      { name: "Usuario_Novato", preds: [
        { match: matchSample[0].description, score: "1-1" },
        { match: matchSample[1].description, score: "0-0" },
        { match: matchSample[2].description, score: "1-2" }
      ]},
      { name: "Usuario_Arriesgado", preds: [
        { match: matchSample[0].description, score: "0-3" },
        { match: matchSample[1].description, score: "2-2" },
        { match: matchSample[2].description, score: "0-0" }
      ]}
    ];

    users.forEach(u => {
      console.log(`   👤 ${u.name}: ${u.preds.map(p => p.score).join(" | ")}`);
    });

    // 3. Simular Resultados Reales (Simulados para el oráculo)
    console.log("\n3️⃣ Generando resultados reales oficiales...");
    const realResults = [
      { match: matchSample[0].description, score: "2-1" }, // Experto acierta exacto
      { match: matchSample[1].description, score: "1-1" }, // Novato acierta exacto
      { match: matchSample[2].description, score: "3-1" }  // Experto acierta exacto
    ];

    realResults.forEach(r => console.log(`   📌 ${r.match}: ${r.score}`));

    // 4. Resolución vía AI Oracle (Gemini)
    console.log("\n4️⃣ Invocando Oráculo Gemini para resolución...");
    
    const prompt = `
      Actúa como el Oráculo Oficial de PredicFi para el Mundial 2026.
      
      TAREA: Evaluar las predicciones de los usuarios contra los resultados reales y calcular un ranking.
      
      REGLAS DE PUNTUACIÓN:
      - Marcador Exacto: 5 puntos (ej: predijo 2-1, quedó 2-1).
      - Ganador/Empate Correcto (pero no marcador): 2 puntos (ej: predijo 1-0, quedó 2-1).
      - Error Total: 0 puntos.

      RESULTADOS REALES:
      ${realResults.map(r => `${r.match}: ${r.score}`).join("\n")}

      PREDICCIONES DE USUARIOS:
      ${users.map(u => `${u.name}: ${u.preds.map(p => `${p.match}: ${p.score}`).join(", ")}`).join("\n")}

      GENERA UN VEREDICTO EN FORMATO JSON:
      {
        "ranking": [
          { "user": "nombre", "total_points": 0, "breakdown": "detalle de puntos por partido" }
        ],
        "summary": "Breve comentario sobre quién ganó y por qué."
      }
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const veredict = JSON.parse(jsonMatch[0]);
      console.log("\n🤖 VEREDICTO DEL ORÁCULO GEMINI:");
      console.log("----------------------------------");
      console.table(veredict.ranking);
      console.log(`\n📝 Resumen: ${veredict.summary}`);
    } else {
      console.log("Error al procesar el veredicto de la IA.");
      console.log(text);
    }

    console.log("\n✅ SIMULACIÓN E2E COMPLETADA.");

  } catch (error) {
    console.error("\n❌ ERROR EN LA SIMULACIÓN:", error);
  }
}

simulateE2E();
