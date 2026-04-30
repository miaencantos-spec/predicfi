import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function injectTestMarket() {
  const pastDate = new Date(Date.now() - 3600000).toISOString(); // Hace 1 hora
  const futureDate = new Date(Date.now() + 3600000).toISOString();

  const testMarket = {
    market_address: "0x000000000000000000000000000000000000test",
    question: "¿Ganó el Bayern Munich su último partido de Bundesliga antes del 27 de abril de 2026?",
    ends_at: pastDate,
    status: "active",
    creator_address: "0x0000000000000000000000000000000000000000",
    image_url: "https://example.com/test.png",
    category: "Sports"
  };

  const { data, error } = await supabase.from('markets').insert(testMarket).select();
  
  if (error) {
    console.error("❌ Error inyectando mercado:", error);
  } else {
    console.log("✅ Mercado de prueba inyectado:", data);
  }
}

injectTestMarket();
