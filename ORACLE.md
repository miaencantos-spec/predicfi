# 🤖 Oráculo de IA: Gemini 2.5 Flash

PredicFi utiliza Inteligencia Artificial de vanguardia para resolver mercados de forma autónoma, imparcial y basada en datos en tiempo real.

## 🧠 Lógica de Resolución (Automatizada)
El sistema cuenta con un **Oracle Worker** en Node.js que monitorea la base de datos cada 60 segundos. Cuando un mercado expira:

1. **Inyección de Contexto:** El script inyecta la fecha y hora actual dinámicamente en el prompt para asegurar que Gemini tenga noción temporal precisa.
2. **Investigación Factográfica:** La IA investiga si el evento ocurrió basándose en el contexto de abril de 2026.
3. **Ejecución On-chain:** Si el veredicto es claro, el oráculo llama a `settleMarket` en la `MarketFactory` desde la cuenta administradora.
4. **Sincronización:** El Indexador detecta el evento de resolución y actualiza la UI para todos los usuarios.

## 📝 Protocolo de Verdad
> "Hoy es [FECHA_ACTUAL]. Investiga si ocurrió: [PREGUNTA]. Determina resultado SÍ/NO y justifica técnicamente."

## ⚖️ Transparencia y Datos
Para cada resolución, PredicFi guarda en Supabase:
- **`outcome`:** El resultado final (SÍ/NO).
- **`resolution_reason`:** La explicación detallada generada por Gemini.
- **`status`:** Actualizado automáticamente a `resolved`.

## 🛡️ Seguridad
- **Solo Factory:** Los mercados solo pueden ser resueltos por la Factory, que a su vez solo acepta llamadas del Oráculo Autorizado (Admin).
- **Detección de Re-resolución:** El oráculo verifica on-chain si el mercado ya está cerrado antes de intentar enviar una transacción redundante.

---
*Tecnología: Google Gemini 2.5 Flash + Node.js Worker + Ethers.js v6.*
