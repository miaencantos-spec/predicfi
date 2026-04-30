# 🛠️ PredicFi Agent Skills Framework

## 1. @auditor: `Foundry_Stress_Test`
- **Comandos permitidos:** `forge test`, `forge coverage`, `forge build`.
- **Uso:** Simular transacciones masivas y ataques de reentrada en `PollaVault.sol` y `MarketFactory.sol`.

## 2. @architect: `Supabase_Schema_Sync`
- **Comandos permitidos:** `supabase status`, `supabase db push`, `npx supabase gen types typescript --local > src/types/supabase.ts`.
- **Uso:** Mantener la base de datos alineada con el frontend sin romper el tipado.

## 3. @web3_dev: `Thirdweb_Component_Deploy`
- **Comandos permitidos:** Creación de archivos `.tsx` en `src/components/`, instalación de dependencias npm de UI.
- **Uso:** Conectar componentes de Next.js con `inAppWallet` y hooks de Thirdweb.

## 4. @ai_engineer: `Flash_Fast_Execution`
- **Comandos permitidos:** `npx ts-node src/scripts/oracle_ping.ts`.
- **Uso:** Realizar pruebas de latencia y precisión de prompts utilizando el modelo Gemini 2.5 Flash para asegurar que los resultados de partidos/precios lleguen en JSON perfectos.

## 5. @market_maker: `Grid_Bot_Simulator`
- **Comandos permitidos:** `npx ts-node src/scripts/liquidity_bot.ts`.
- **Uso:** Simular estrategias de grid trading en la testnet, inyectando MockUSDC en los mercados Pro para mantener los spreads atractivos.

## 6. @growth_lead: `Resend_Form_Capture`
- **Comandos permitidos:** Edición de vistas en `src/app/` e integración de endpoints en `src/app/api/`.
- **Uso:** Construir formularios interactivos anti-waiting-list conectados a la API de Resend para correos transaccionales automáticos.
