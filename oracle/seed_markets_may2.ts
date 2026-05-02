import "dotenv/config";
import { ethers } from "ethers";
import { createClient } from "@supabase/supabase-js";

/**
 * 🌱 SEED: 4 Mercados Reales - 2 de mayo de 2026
 * Formatos: 1X2, BINARY, MULTI, H2H
 * Oráculo: Gemini 2.5 Flash
 */

const {
  PRIVATE_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
} = process.env;

if (!PRIVATE_KEY || !NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Faltan variables de entorno críticas (.env)");
  process.exit(1);
}

const RPC_URL       = "https://base-sepolia.g.alchemy.com/v2/nn0ydHbZ0QvA9S53B6CnX";
const FACTORY_ADDR  = "0x7b402f2dd4fbce6b9f3c8152d257dab80631202e";
const FACTORY_ABI   = [
  "function createMarket(string memory _question, uint256 _endTime) external returns (address)",
  "event MarketCreated(address indexed market, address indexed creator, string question)"
];

const provider  = new ethers.JsonRpcProvider(RPC_URL);
const wallet    = new ethers.Wallet(PRIVATE_KEY, provider);
const supabase  = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const factory   = new ethers.Contract(FACTORY_ADDR, FACTORY_ABI, wallet);

// Helper: fecha a Unix timestamp
const toUnix = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

// ── Los 4 mercados a crear ────────────────────────────────────────────────────
const MARKETS = [
  {
    // 1. Formato 1X2 – Arsenal vs Fulham (Premier League)
    question: "[FORMAT:1X2] [1X2: Arsenal F.C. vs Fulham F.C.] ¿Cuál será el resultado del partido Arsenal F.C. vs Fulham F.C.?",
    endsAt:   "2026-05-02T16:30:00Z",   // 11:30 AM EST
    category: "Sports",
    label:    "Arsenal F.C. vs Fulham F.C. (1X2)"
  },
  {
    // 2. Formato BINARY – BTC > $80k
    question: "[FORMAT:BINARY] ¿Superará el precio de Bitcoin (BTC) los $80,000 USD el 2 de mayo de 2026 antes de la medianoche EST?",
    endsAt:   "2026-05-03T04:59:00Z",   // 23:59 EST May 2
    category: "Crypto",
    label:    "BTC > $80k (BINARY)"
  },
  {
    // 3. Formato MULTI – Goles Osasuna vs Barcelona
    question: "[FORMAT:MULTI] [OPTIONS: 0 a 1 gol, 2 a 3 goles, 4 o más goles] ¿Cuántos goles en total se marcarán en el partido CA Osasuna vs FC Barcelona?",
    endsAt:   "2026-05-02T19:00:00Z",   // 14:00 EST
    category: "Sports",
    label:    "Goles Osasuna vs Barcelona (MULTI)"
  },
  {
    // 4. Formato H2H – Valencia CF vs Villarreal CF
    question: "[FORMAT:H2H] [H2H: Valencia CF vs Villarreal CF] ¿Qué equipo anotará más goles en sus respectivos partidos el 2 de mayo de 2026: Valencia CF (vs Atlético Madrid) o Villarreal CF (vs Levante)?",
    endsAt:   "2026-05-02T12:00:00Z",   // 07:00 AM EST
    category: "Sports",
    label:    "Valencia CF vs Villarreal CF (H2H)"
  }
];

// ── Helpers ───────────────────────────────────────────────────────────────────
async function extractMarketAddress(receipt: any): Promise<string> {
  const topic = ethers.id("MarketCreated(address,address,string)");
  const log   = receipt.logs.find((l: any) => l.topics[0] === topic);
  if (!log) throw new Error("Evento MarketCreated no encontrado en receipt");
  return ethers.getAddress(ethers.dataSlice(log.topics[1], 12));
}

async function createAndRegister(m: typeof MARKETS[0], index: number) {
  console.log(`\n─────────────────────────────────────────────`);
  console.log(`📦 [${index + 1}/4] ${m.label}`);
  console.log(`   Cierre: ${m.endsAt} → ${new Date(m.endsAt).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })} CST`);

  const endTime = toUnix(m.endsAt);

  // 1. On-chain: createMarket
  console.log(`   ⛓️  Enviando tx a Base Sepolia...`);
  const tx = await factory.createMarket(m.question, endTime);
  console.log(`   📡 Tx hash: ${tx.hash}`);
  const receipt = await tx.wait();
  const marketAddress = await extractMarketAddress(receipt);
  console.log(`   ✅ Mercado en: ${marketAddress}`);

  // 2. Supabase: insert
  const { error } = await supabase.from('markets').insert({
    market_address:  marketAddress.toLowerCase(),
    question:        m.question,
    ends_at:         m.endsAt,
    status:          'active',
    creator_address: wallet.address.toLowerCase(),
    category:        m.category,
    resolution_oracle: 'gemini-2.5-flash',
  });

  if (error) {
    console.error(`   ❌ Error Supabase: ${error.message}`);
  } else {
    console.log(`   🗄️  Registrado en Supabase ✓`);
  }

  console.log(`   🔗 https://sepolia.basescan.org/address/${marketAddress}`);
  return marketAddress;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function seedMarkets() {
  console.log("🌱 SEED: 4 Mercados Reales — 2 de mayo de 2026");
  console.log(`🔑 Wallet: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance ETH: ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther("0.002")) {
    console.error("❌ Balance insuficiente para gas. Necesitas al menos 0.002 ETH en Base Sepolia.");
    process.exit(1);
  }

  const addresses: string[] = [];

  for (let i = 0; i < MARKETS.length; i++) {
    try {
      const addr = await createAndRegister(MARKETS[i], i);
      addresses.push(addr);
      // Pausa entre transacciones para evitar nonce issues
      if (i < MARKETS.length - 1) {
        console.log("   ⏳ Esperando 3s antes del siguiente...");
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (err: any) {
      console.error(`   ❌ Error en mercado ${i + 1}: ${err.message}`);
    }
  }

  console.log("\n\n🎉 SEED COMPLETADO");
  console.log("═══════════════════════════════════════════════");
  addresses.forEach((addr, i) => {
    console.log(`  ${i + 1}. ${MARKETS[i].label}`);
    console.log(`     ${addr}`);
  });
  console.log("═══════════════════════════════════════════════");
  console.log("✅ Los 4 mercados están VIVOS en PredicFi.\n");
}

seedMarkets().catch(err => {
  console.error("❌ Error fatal:", err.message);
  process.exit(1);
});
