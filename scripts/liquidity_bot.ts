/**
 * @file liquidity_bot.ts
 * @description Bot de Market Making simulado para PredicFi.
 * Mantiene la liquidez en los mercados Pro inyectando MockUSDC.
 */

// Arrays simulados de mercados activos
const cryptoMarkets = [
  { id: "0xMarketBTC", title: "¿Llegará Bitcoin a $100k?", yesVolume: 1000, noVolume: 800 },
  { id: "0xMarketETH", title: "¿Ethereum cerrará sobre $4000?", yesVolume: 500, noVolume: 750 },
  { id: "0xMarketSOL", title: "¿Llegará Solana a $250?", yesVolume: 200, noVolume: 150 }
];

const INJECTION_AMOUNT = 50; // MockUSDC a inyectar por iteración
const DELAY_MS = 10000; // 10 segundos estables para evitar rate limits

/**
 * Función helper para pausar la ejecución
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Bucle principal de inyección de liquidez
 */
async function runLiquidityBot() {
  console.log("=== 🤖 Iniciando PredicFi Liquidity Bot ===");
  console.log(`Inyectando ${INJECTION_AMOUNT} MockUSDC cada ${DELAY_MS / 1000}s para ajustar el spread.`);
  
  let iteration = 1;

  while (true) {
    console.log(`\n[Iteración #${iteration}]`);

    for (const market of cryptoMarkets) {
      // Simular decisión algorítmica simple: inyectar al lado con menos liquidez
      const injectYes = market.yesVolume <= market.noVolume;
      const targetSide = injectYes ? "SÍ" : "NO";
      
      console.log(`⚡ Inyectando liquidez en: ${market.title}`);
      
      // Simulación de la transacción
      if (injectYes) {
        market.yesVolume += INJECTION_AMOUNT;
      } else {
        market.noVolume += INJECTION_AMOUNT;
      }

      console.log(`   -> +${INJECTION_AMOUNT} USDC al lado [${targetSide}]. Nuevo Volumen -> SÍ: ${market.yesVolume} | NO: ${market.noVolume}`);
    }

    console.log(`⏳ Esperando ${DELAY_MS / 1000} segundos (Rate limit protection)...`);
    await delay(DELAY_MS);
    iteration++;
  }
}

// Iniciar ejecución
if (require.main === module) {
  runLiquidityBot().catch(console.error);
}
