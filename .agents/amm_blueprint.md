# 📈 AI Market Maker (AMM) - Especificación Técnica V1.1

## Misión:
El AMM (`oracle/amm_worker.ts`) asegura que PredicFi siempre tenga mercados frescos y con liquidez inicial.

## Flujo Operativo Actualizado:
1. **Detección**: Escaneo de tendencias vía Gemini 1.5.
2. **Creación**: Llama a `Factory.createMarket()` usando la cuenta `oracle`.
3. **Siembra de Liquidez**:
   - Inyección inicial de USDC (10 SÍ / 10 NO).
   - Establece el precio base en 0.50 USDC por share.
4. **Validación**: Registro automático del mercado en Supabase con estado `active`.

## Seguridad:
- El Admin puede usar el botón **"OVERRIDE_IA"** en el Admin Panel para corregir cualquier error del AMM durante las primeras 24 horas.
- Máximo de 5 mercados creados por el bot al día.
