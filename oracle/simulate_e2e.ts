import "dotenv/config";
import { ethers } from "ethers";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// Configuración de Entorno
const {
  PRIVATE_KEY,
  GEMINI_API_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
} = process.env;

if (!PRIVATE_KEY || !GEMINI_API_KEY || !NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Faltan variables de entorno criticas (.env)");
  process.exit(1);
}

// Inicialización
const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const FACTORY_ADDRESS = "0x7b402f2dd4fbce6b9f3c8152d257dab80631202e";
const FACTORY_ABI = [
  "function createMarket(string memory _question, uint256 _endTime) external returns (address)",
  "function settleMarket(address _market, bool _outcome, uint8 _confidence) external"
];

async function runE2ESimulation() {
  console.log("🚀 INICIANDO SIMULACIÓN E2E PREDICFI\n");

  // 1. CREAR MERCADO ON-CHAIN
  const question = "[FORMAT:1X2] [1X2: Real Madrid vs BVB] Final de la Champions League 2024. ¿Ganó el Real Madrid?";
  const endTime = Math.floor(Date.now() / 1000) - 3600; // Finalizado hace 1 hora

  console.log(`📝 Paso 1: Creando mercado On-Chain...`);
  console.log(`   Pregunta: ${question}`);
  
  try {
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);
    const tx = await factory.createMarket(question, endTime);
    console.log(`   ⏳ Transacción enviada: ${tx.hash}`);
    const receipt = await tx.wait();
    
    // Extraer dirección del mercado del evento (MarketCreated)
    // El evento es: MarketCreated(address indexed market, address indexed creator, string question)
    const event = receipt.logs.find((log: any) => log.topics[0] === ethers.id("MarketCreated(address,address,string)"));
    const marketAddress = ethers.getAddress(ethers.dataSlice(event.topics[1], 12));

    console.log(`   ✅ Mercado creado en: ${marketAddress}`);

    // 2. INYECTAR EN SUPABASE
    console.log(`\n🗄️ Paso 2: Sincronizando con Supabase...`);
    const { error: dbError } = await supabase.from('markets').insert({
      market_address: marketAddress.toLowerCase(),
      question: question,
      ends_at: new Date(endTime * 1000).toISOString(),
      status: 'active',
      creator_address: wallet.address.toLowerCase(),
      category: 'Sports',
      image_url: 'https://img.freepik.com/premium-vector/soccer-football-stadium-night-background_43040-302.jpg'
    });

    if (dbError) throw new Error(`Error Supabase: ${dbError.message}`);
    console.log(`   ✅ Sincronización exitosa.`);

    // 3. EJECUTAR ORÁCULO GEMINI
    console.log(`\n🧠 Paso 3: Invocando Oráculo Gemini 2.5 Flash...`);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      FECHA ACTUAL: ${new Date().toISOString()}
      Actúa como un oráculo de predicción profesional.
      PREGUNTA: ${question}
      
      TAREA: Investiga y determina si el evento ocurrió (SÍ/NO). 
      Responde ÚNICAMENTE con este JSON: {"outcome": 1, "reason": "explicación corta"}. 
      (1=SÍ, 2=NO)`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{.*\}/s);
    
    if (!jsonMatch) throw new Error("No se pudo obtener JSON de Gemini");
    const aiVeredict = JSON.parse(jsonMatch[0]);
    const finalOutcomeBool = aiVeredict.outcome === 1;

    console.log(`   🎯 Veredicto Gemini: ${finalOutcomeBool ? 'SÍ' : 'NO'}`);
    console.log(`   💬 Razón: ${aiVeredict.reason}`);

    // 4. RESOLVER ON-CHAIN
    console.log(`\n⛓️ Paso 4: Resolviendo On-Chain vía Factory...`);
    const settleTx = await factory.settleMarket(marketAddress, finalOutcomeBool, 100);
    console.log(`   ⏳ Transacción de resolución: ${settleTx.hash}`);
    await settleTx.wait();
    console.log(`   ✅ Mercado resuelto On-Chain.`);

    // 5. ACTUALIZAR DB FINAL
    await supabase.from('markets').update({ 
      status: 'resolved', 
      outcome: finalOutcomeBool,
      resolution_reason: aiVeredict.reason,
      resolved_at: new Date().toISOString()
    }).eq('market_address', marketAddress.toLowerCase());
    
    console.log(`\n🎉 SIMULACIÓN COMPLETADA CON ÉXITO.`);
    console.log(`🔗 Ver en Explorer: https://sepolia.basescan.org/address/${marketAddress}`);

  } catch (error: any) {
    console.error(`\n❌ ERROR EN LA SIMULACIÓN:`, error.message);
  }
}

runE2ESimulation();
