import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MARKETS = [
  {
    market_address: "0x1111111111111111111111111111111111111111",
    question: "[FORMAT:1X2] [1X2: Colombia vs Brasil] [SUBJECT: Futbol] ¿Quién ganará el encuentro entre Colombia y Brasil?",
    category: "SPORTS",
    ends_at: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days
    status: "active"
  },
  {
    market_address: "0x2222222222222222222222222222222222222222",
    question: "[FORMAT:POLLA] [SUBJECT: Champions] Polla VIP: Final de la Champions League",
    category: "SPORTS",
    ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
    status: "active"
  },
  {
    market_address: "0x3333333333333333333333333333333333333333",
    question: "[FORMAT:BINARY] [SUBJECT: BTC] ¿Superará Bitcoin los $100k este fin de semana?",
    category: "CRYPTO",
    ends_at: new Date(Date.now() + 86400000 * 1).toISOString(),
    status: "active"
  },
  {
    market_address: "0x4444444444444444444444444444444444444444",
    question: "[FORMAT:MULTI] [OPTIONS: $2500, $3000, $3500] [SUBJECT: ETH] ¿En qué rango cerrará Ethereum el mes?",
    category: "CRYPTO",
    ends_at: new Date(Date.now() + 86400000 * 10).toISOString(),
    status: "active"
  },
  {
    market_address: "0x5555555555555555555555555555555555555555",
    question: "[FORMAT:H2H] [H2H: OpenAI vs Google] [SUBJECT: AI] ¿Quién lanzará el modelo más potente este Q2?",
    category: "TECH",
    ends_at: new Date(Date.now() + 86400000 * 30).toISOString(),
    status: "active"
  }
];

async function inject() {
  console.log("🚀 Inyectando mercados de los 5 formatos...");
  
  for (const market of MARKETS) {
    const { error } = await supabase.from('markets').upsert({
      ...market,
      creator_address: "0x9592f1e9f8fa10ccd8380daf70596838340c16c8",
      total_yes: 0,
      total_no: 0
    }, { onConflict: 'market_address' });

    if (error) {
      console.error(`❌ Error inyectando ${market.market_address}:`, error.message);
    } else {
      console.log(`✅ Mercado inyectado: ${market.market_address}`);
    }
  }
}

inject();
