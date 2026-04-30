import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// 1. Configuración de Clientes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Nodo RPC estable (usaremos el público pero con reintentos)
const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org");

// 2. ABIs
const factoryABI = [
  "event MarketCreated(address indexed market, address indexed creator, string question)",
  "function isMarket(address) view returns (bool)"
];

const marketABI = [
  "function endTime() view returns (uint256)",
  "function question() view returns (string)",
  "event SharesBought(address indexed user, bool outcome, uint256 amount, uint256 shares)",
  "event MarketSettled(bool outcome, uint8 confidence)"
];

const factoryAddress = "0x7b402f2dd4fbce6b9f3c8152d257dab80631202e";
const factoryContract = new ethers.Contract(factoryAddress, factoryABI, provider);

// 3. Procesador de Mercados
async function handleMarketCreated(marketAddress, creator, question) {
  const normalizedAddress = marketAddress.toLowerCase();
  
  try {
    const marketContract = new ethers.Contract(marketAddress, marketABI, provider);
    const endTime = await marketContract.endTime();

    const { error } = await supabase
      .from('markets')
      .upsert({
        market_address: normalizedAddress,
        creator_address: creator.toLowerCase(),
        question: question,
        category: 'General',
        ends_at: new Date(Number(endTime) * 1000).toISOString(),
        status: 'active',
        total_yes: 0,
        total_no: 0
      }, { onConflict: 'market_address' });

    if (error) {
      console.error(`❌ Error en DB para ${normalizedAddress}:`, error.message);
    } else {
      console.log(`✅ Sincronizado: "${question.slice(0, 40)}..."`);
    }
  } catch (err) {
    console.error(`❌ Error RPC en mercado ${normalizedAddress}:`, err.message);
  }
}

// 4. Polling Worker (El motor del Indexer)
async function startIndexer() {
  console.log('🛰️ PREDICFI INDEXER v2.0 (MODO ROBUSTO)');
  console.log(`📍 Escuchando Factory: ${factoryAddress}`);

  let lastBlockProcessed = 0;

  // Al arrancar, ir 10,000 bloques atrás para recuperar el Bayern y otros
  const currentBlock = await provider.getBlockNumber();
  lastBlockProcessed = currentBlock - 10000;
  
  console.log(`⏳ Iniciando sync histórico desde bloque ${lastBlockProcessed}...`);

  while (true) {
    try {
      const currentBlock = await provider.getBlockNumber();
      
      if (lastBlockProcessed < currentBlock) {
        const fromBlock = lastBlockProcessed + 1;
        const toBlock = currentBlock;

        console.log(`🔍 Escaneando bloques ${fromBlock} -> ${toBlock}...`);

        // Buscar nuevos mercados
        const events = await factoryContract.queryFilter("MarketCreated", fromBlock, toBlock);
        
        for (const event of events) {
          const { market, creator, question } = event.args;
          await handleMarketCreated(market, creator, question);
        }

        // Aquí podrías añadir búsqueda de SharesBought si fuera necesario, 
        // pero por ahora priorizamos que los mercados APAREZCAN en la web.
        
        lastBlockProcessed = toBlock;
      }

      // Esperar 30 segundos antes del siguiente escaneo
      await new Promise(resolve => setTimeout(resolve, 30000));

    } catch (err) {
      console.error("⚠️ Error en el ciclo del indexer, reintentando en 10s...", err.message);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}

startIndexer();
