# PredicFi: Mercados de Predicción con IA en Base

PredicFi es un mercado de predicción descentralizado de última generación que utiliza **Gemini 2.5 Flash** como oráculo de resolución automática y sistema de moderación. Construido sobre **Base Sepolia**, ofrece una experiencia de usuario premium con soporte multi-idioma y modo claro/oscuro.

## ✨ Características Principales
- 🌓 **Dual Theme:** Diseño "Apple Fintech" (Claro) y "Cyberpunk" (Oscuro).
- 🌍 **Multi-idioma:** Soporte nativo para Español (predeterminado) e Inglés.
- 🛡️ **AI Gatekeeper:** Validación automática de preguntas mediante IA antes de la creación del mercado.
- 💸 **UX Gasless-like:** Uso de EIP-2612 (Permit) para apuestas en un solo paso.
- 📊 **Dashboard Completo:** Gestión de apuestas, seguimiento en tiempo real y reclamo de ganancias.

## 🏗️ Arquitectura
- **Contracts:** Factory de Clones EIP-1167 para despliegues eficientes.
- **Oracle:** Integración con Google Gemini para resoluciones autónomas.
- **Frontend:** Next.js 16 (App Router), Tailwind CSS 4, Thirdweb SDK y Supabase.

## 🚀 Despliegue Actual (Base Sepolia)
- **MarketFactory:** `0x7b402f2dd4fbce6b9f3c8152d257dab80631202e`
- **Implementation:** `0xB42B1a894D608a01C11cE5CD5AAE3028B0e5E07E`
- **Mock USDC:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## 🛠️ Instalación y Uso
### Frontend
```bash
cd ai-prediction-market/frontend
npm install
npm run dev
```

### Oráculo
```bash
cd ai-prediction-market/oracle
node resolve_markets.mjs
```

### Pruebas y Simulación (E2E)
Para validar el ciclo completo de vida de un mercado (Creación -> Apuestas -> Resolución -> Claim):
```bash
# Simulación básica (On-Chain + DB + Oracle)
npx ts-node ai-prediction-market/oracle/simulate_e2e.ts

# Simulación completa (Incluye apuestas y reclamo de premios)
npx ts-node ai-prediction-market/oracle/simulate_full_cycle.ts
```

## 📄 Licencia
MIT - Bootcamp de Chainlink 2026
