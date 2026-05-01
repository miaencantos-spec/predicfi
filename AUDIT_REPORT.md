# 🕵️ PredicFi - Vibe Coding Sanity Check (Audit Report)

**Fecha:** 1 de Mayo de 2026
**Auditor:** Antigravity AI

Este reporte detalla los hallazgos críticos detectados en la base de código actual de PredicFi frente a los estándares definidos, la seguridad y la arquitectura del sistema.

---

## 1. Archivos Monolíticos (Spaghetti) 🍝
Se detectaron archivos que superan holgadamente las 300 líneas y mezclan responsabilidades (UI, Estado, Web3, IA).

*   **`frontend/src/app/create/page.tsx` (389 líneas)**
    *   **Problema:** Centraliza toda la lógica de formularios, llamadas on-chain a contratos, validación con Gemini IA y un UI bastante complejo en un solo archivo.
    *   **Sugerencia de Modularización:** Extraer la lógica de IA a un hook (`useAIGatekeeper`), el manejo on-chain a (`useMarketCreation`), y desglosar la UI en componentes más pequeños (ej. `MarketFormatSelector`, `DynamicMarketFields`).
*   **`frontend/src/app/market/[address]/page.tsx` (400 líneas)**
    *   **Problema:** Mezcla fetching de Supabase, cálculos de estado derivado, renderizado condicional por formatos y UI pesada.
    *   **Sugerencia de Modularización:** Separar el UI en componentes funcionales como `MarketHeader`, `LiveFeedPanel`, `AIVerdictPanel`, y aislar la lógica de DB en un hook u abstracción.
*   **`frontend/src/lib/mockMarkets.ts` (340 líneas)**
    *   **Problema:** Extenso archivo de datos hardcodeados.
    *   **Sugerencia de Modularización:** Mover la data a archivos JSON estáticos o consolidarla en la base de datos de pruebas (Supabase seed).

---

## 2. Casos Borde y Manejo de Errores (Edge Cases) ⚠️

*   **Rechazo de Transacción en Wallet (Frontend):**
    *   **Hallazgo:** En componentes críticos como `create/page.tsx` y `BetModal.tsx`, los errores del SDK (`error: any`) se atrapan y se envían directo a `toast.error(error.message)` o se muestran errores genéricos ("Error al procesar la transacción").
    *   **Impacto:** Si un usuario rechaza la firma en su wallet (código 4001 / `UserRejectedRequestError`), verá un mensaje técnico y poco amigable o un string incomprensible.
*   **Caída / Timeout del Oráculo Gemini 2.5 Flash:**
    *   **Hallazgo:** En `create/page.tsx`, la función `validateWithAI` tiene un bloque `catch` que, ante un fallo de la API de Gemini (saturación o timeout), retorna `fallback = { valid: true, ... }`.
    *   **Impacto:** Permite silenciosamente hacer *bypass* del AI Gatekeeper. Un atacante (o un error genuino) podría crear un mercado malformado si logra que el servicio dé timeout, inyectando basura on-chain.

---

## 3. Seguridad Básica 🔒

*   **Credenciales "Hardcodeadas":**
    *   **Hallazgo:** En `frontend/src/components/layout/Navbar.tsx` (línea 18), la URL del RPC de Alchemy está expuesta en texto plano: `rpc: "https://base-sepolia.g.alchemy.com/v2/nn0ydHbZ0QvA9S53B6CnX"`.
    *   **Riesgo:** Posible abuso de la cuota de Alchemy por parte de terceros. Debe migrarse a una variable de entorno `NEXT_PUBLIC_ALCHEMY_RPC_URL`.
*   **Políticas Supabase (RLS):**
    *   **Hallazgo:** Al revisar `supabase/schema_draft.sql` y el repositorio en general, **no existen políticas RLS (Row Level Security)** definidas ni versionadas (`CREATE POLICY...`).
    *   **Riesgo:** Cualquier persona con la clave pública anónima de Supabase podría manipular, borrar o alterar los registros de mercados y apuestas directamente.

---

## 4. Caos de Dependencias 📦

*   **Redundancia Web3 en `package.json`:**
    *   **Hallazgo:** Están instaladas las librerías `wagmi` y `viem`.
    *   **Violación del Stack:** Según el documento `.agents/stack.md`, el SDK oficial del proyecto es **Thirdweb v5**. Thirdweb ya incluye su propio manejo de wallets y transacciones bajo el capó.
    *   **Riesgo:** Tener Wagmi/Viem y Thirdweb simultáneamente infla el bundle del frontend, genera confusión en el equipo sobre qué hooks usar, y puede causar colisiones de estado en las sesiones de wallet. Se recomienda remover `wagmi` y `viem`.

---

## 5. Alineación de Arquitectura (PariMutuel vs AMMFactory) 🏗️

*   **Lógica Mezclada y Errónea en la Creación de Mercados:**
    *   **Hallazgo:** La arquitectura exige dos fábricas separadas: `MarketFactory` (Mercados Pro AMM) y `VaultFactory` (Pollas/Bóvedas sociales).
    *   **El Problema:** En `frontend/src/app/create/page.tsx` (aprox. línea 157), el frontend **siempre** llama a `factoryContract.createMarket(...)` apuntando a `FACTORY_ADDRESS`, sin importar si el usuario seleccionó el formato `'POLLA'`.
    *   **Impacto:** Nunca se despliegan bóvedas aisladas usando `VaultFactory.createVault()`. Las Pollas se están creando erróneamente como mercados estándar dentro del AMM, rompiendo la arquitectura dual del protocolo. El contrato `VaultFactory` es actualmente ignorado por la UI de creación.

---

### Siguientes Pasos
Esperando confirmación del equipo para iniciar la refactorización y resolución de los puntos encontrados.
