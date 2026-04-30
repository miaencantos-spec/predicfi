import "dotenv/config";
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const FACTORY_ADDRESS = "0x7b402f2dd4fbce6b9f3c8152d257dab80631202e";
const FACTORY_ABI = ["function createMarket(string _question, uint256 _endTime) returns (address)"];

async function inject(question: string, dateStr: string) {
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);
  const endTime = Math.floor(new Date(dateStr).getTime() / 1000);
  
  console.log(`\n📅 Programando: ${dateStr}`);
  console.log(`📝 ${question.split('] ').pop()}`);

  try {
    const tx = await factory.createMarket(question, endTime);
    console.log(`⏳ Tx: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ Inyectado.`);
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

async function main() {
  console.log("🔴 --- TERMINAL BAYERN MÚNICH: OPERACIÓN MAYO 2026 ---");

  // 1. UCL Semis (Ida)
  await inject(
    "[SUBJECT: PSG vs Bayern] [METRIC: Final Result] [THRESHOLD: Bayern Win or Draw] [SOURCE: UEFA Official] [TIME: 21:00 GMT] ¿Evitará el Bayern la derrota en el Parque de los Príncipes ante el PSG (Ida Semifinales)?",
    "2026-04-28T22:00:00Z"
  );

  // 2. Bundesliga: Heidenheim
  await inject(
    "[SUBJECT: Bayern vs Heidenheim] [METRIC: Final Score] [THRESHOLD: Bayern Win] [SOURCE: Bundesliga Official] [TIME: 15:30 GMT] ¿Ganará el Bayern Múnich al FC Heidenheim en el Allianz Arena?",
    "2026-05-02T17:30:00Z"
  );

  // 3. UCL Semis (Vuelta)
  await inject(
    "[SUBJECT: Bayern vs PSG] [METRIC: Qualification] [THRESHOLD: Bayern Qualifies] [SOURCE: UEFA Official] [TIME: 21:00 GMT] ¿Clasificará el FC Bayern Múnich a la Gran Final de la Champions League?",
    "2026-05-06T23:00:00Z"
  );

  // 4. Bundesliga: Wolfsburg
  await inject(
    "[SUBJECT: Wolfsburg vs Bayern] [METRIC: Final Result] [THRESHOLD: Bayern Win] [SOURCE: Bundesliga Official] [TIME: 15:30 GMT] ¿Vencerá el Bayern al Wolfsburg como visitante?",
    "2026-05-09T17:30:00Z"
  );

  // 5. Bundesliga: Köln
  await inject(
    "[SUBJECT: Bayern vs Köln] [METRIC: Final Result] [THRESHOLD: Bayern Win] [SOURCE: Bundesliga Official] [TIME: 15:30 GMT] ¿Logrará el Bayern los 3 puntos ante el FC Köln?",
    "2026-05-16T17:30:00Z"
  );

  // 6. FINAL DFB-POKAL
  await inject(
    "[SUBJECT: Bayern vs Stuttgart] [METRIC: Trophy Winner] [THRESHOLD: Bayern Wins Cup] [SOURCE: DFB Official] [TIME: 20:00 GMT] ¿Se proclamará el Bayern Múnich campeón de la DFB-Pokal ante el Stuttgart?",
    "2026-05-23T22:30:00Z"
  );
}

main();
