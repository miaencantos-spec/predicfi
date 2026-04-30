
import "dotenv/config";
import { ethers } from "ethers";
import { GoogleGenerativeAI } from "@google/generative-ai";

const { PRIVATE_KEY, GEMINI_API_KEY } = process.env;

const provider = new ethers.JsonRpcProvider("https://sepolia.base.org"); // Volvemos al oficial con manejo de errores
const adminWallet = new ethers.Wallet(PRIVATE_KEY!, provider);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

const FACTORY_ADDRESS = "0x7b402f2dd4fbce6b9f3c8152d257dab80631202e";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)"
];

const FACTORY_ABI = [
  "function createMarket(string memory _question, uint256 _endTime) external returns (address)",
  "function settleMarket(address _market, bool _outcome, uint8 _confidence) external",
  "function houseTreasury() view returns (uint256)",
  "function pendingIncentives(address creator) view returns (uint256)",
  "function withdrawHouseFees() external",
  "function withdrawCreatorIncentives() external"
];

const MARKET_ABI = [
  "function buyShares(bool _outcome, uint256 _amount) external",
  "function claim() external",
  "function resolved() view returns (bool)"
];

async function main() {
  console.log("🚀 SIMULACIÓN PREDICFI: ADMIN (miaencantos) vs USUARIO NUEVO\n");

  // 1. Crear Usuario Nuevo (Wallet temporal)
  const userWallet = ethers.Wallet.createRandom().connect(provider);
  console.log(`👤 Usuario Nuevo Creado: ${userWallet.address}`);

  // 2. Financiar al Usuario Nuevo (Transferir 0.001 ETH y 5 USDC desde Admin)
  console.log("\n🏦 Admin (miaencantos) financiando al nuevo usuario...");
  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, adminWallet);
  
  const ethTx = await adminWallet.sendTransaction({
    to: userWallet.address,
    value: ethers.parseEther("0.002") // Suficiente para varios gas fees
  });
  await ethTx.wait();
  console.log("   ✅ ETH enviado.");

  const usdcTx = await usdc.transfer(userWallet.address, ethers.parseUnits("5", 6));
  await usdcTx.wait();
  console.log("   ✅ 5 USDC enviados.");

  // 3. Usuario Nuevo crea un Mercado
  console.log("\n🏗️  Usuario Nuevo creando un mercado...");
  const factoryUser = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, userWallet);
  const question = "¿Bitcoin superará los $100k para finales de 2024?";
  const endTime = Math.floor(Date.now() / 1000) + 40; 

  const createTx = await factoryUser.createMarket(question, endTime);
  const receipt = await createTx.wait();
  const event = receipt.logs.find((log: any) => log.topics[0] === ethers.id("MarketCreated(address,address,string)"));
  const marketAddress = ethers.getAddress(ethers.dataSlice(event.topics[1], 12));
  console.log(`   ✅ Mercado creado por Usuario en: ${marketAddress}`);

  // 4. El Admin apuesta en el mercado del Usuario
  console.log("\n💰 Admin (miaencantos) apostando 2 USDC al SÍ...");
  const marketAdmin = new ethers.Contract(marketAddress, MARKET_ABI, adminWallet);

  const appTx = await usdc.approve(marketAddress, ethers.parseUnits("2", 6));
  await appTx.wait(2); // Esperamos confirmación real
  await (await marketAdmin.buyShares(true, ethers.parseUnits("2", 6))).wait(1);
  console.log("   ✅ Apuesta realizada por Admin.");

  // 5. Esperar expiración
  console.log("\n⌛ Esperando a que el mercado expire...");
  while (Math.floor(Date.now() / 1000) <= endTime) {
    process.stdout.write(".");
    await new Promise(r => setTimeout(r, 5000));
  }
  console.log("\n   🏁 Mercado expirado.");

  // 6. Admin (miaencantos) resuelve con Gemini 2.5 Flash
  console.log("\n🤖 Admin invocando Oráculo Gemini 2.5 Flash...");
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `Responde SOLO JSON: {"outcome": 1, "reason": "..."} para: ${question}. 1=SÍ, 2=NO.`;
  const result = await model.generateContent(prompt);
  const aiVeredict = JSON.parse(result.response.text().match(/\{.*\}/s)![0]);
  const finalOutcome = aiVeredict.outcome === 1;
  console.log(`   🎯 Veredicto Gemini: ${finalOutcome ? "SÍ" : "NO"}`);

  const factoryAdmin = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, adminWallet);
  const settleTx = await factoryAdmin.settleMarket(marketAddress, finalOutcome, 100);
  await settleTx.wait(2); // Esperamos 2 bloques para total certeza
  console.log("   ✅ Mercado resuelto por Admin.");

  // 7. Admin reclama sus ganancias
  console.log("\n🏆 Admin reclamando premio...");
  const balanceBefore = await usdc.balanceOf(adminWallet.address);
  
  // Pequeño check preventivo
  const marketInstance = new ethers.Contract(marketAddress, MARKET_ABI, provider);
  const isResolved = await marketInstance.resolved();
  console.log(`   🔍 Verificación de estado: ¿Resuelto? ${isResolved}`);

  await (await marketAdmin.claim()).wait(1);
  const balanceAfter = await usdc.balanceOf(adminWallet.address);
  console.log(`   💰 Premio recibido neto por Admin: ${ethers.formatUnits(balanceAfter - balanceBefore, 6)} USDC`);

  // 8. VERIFICACIÓN DE REPARTO DE COMISIONES
  console.log("\n📊 ESTADO FINAL DE COMISIONES EN PREDICFI:");
  
  const houseTreasury = await factoryAdmin.houseTreasury();
  const userIncentives = await factoryAdmin.pendingIncentives(userWallet.address);

  console.log(`   💎 Tesorería Admin (70%): ${ethers.formatUnits(houseTreasury, 6)} USDC`);
  console.log(`   🎁 Incentivo Creador (30%): ${ethers.formatUnits(userIncentives, 6)} USDC`);

  // 9. Retirar Fondos
  console.log("\n💸 Ejecutando retiros...");
  await (await factoryUser.withdrawCreatorIncentives()).wait();
  console.log("   ✅ Usuario Nuevo retiró sus incentivos.");
  
  await (await factoryAdmin.withdrawHouseFees()).wait();
  console.log("   ✅ Admin (miaencantos) retiró la tesorería.");

  console.log("\n✨ SIMULACIÓN FINALIZADA CON ÉXITO.");
}

main().catch(console.error);
