# Estado del Proyecto - PredicFi (AI Prediction Market)

## 🎯 Hitos Completados
- [x] **Arquitectura Dual (Social + Pro):** Implementación de mercados binarios y sistema Pari-Mutuel (Pollas).
- [x] **Infraestructura de Pollas:** Despliegue de `VaultFactory` y `PollaVault` con soporte EIP-1167.
- [x] **UI Consistency Refactor:** Interfaz unificada bajo la guía "Apple Fintech" (Zinc + Emerald/Red).
- [x] **Motor Social (Mundial):** Componentes `MatchRow` y `TradeSlip` para predicciones deportivas.
- [x] **Motor Pro (Crypto):** `MarketCard` dual para mercados binarios y multinivel (Polymarket style).
- [x] **Oráculo de Pollas:** Implementación de `resolve_pollas.ts` con Gemini Flash.
- [x] **Vinculación Real Mundial 2026:** Integración completa de tablas `wc2026_matches` y `wc2026_teams` en el frontend.
- [x] **UX Formulario Mundial:** Implementación de auto-guardado (borradores), validación estricta y scroll automático a errores.
- [x] **Gamificación Pro:** Integración de efectos de confetti (`canvas-confetti`) para apuestas y hitos de fase completada.
- [x] **Feedback de Resultados:** Dashboard actualizado con badges de "¡GANASTE!", resultados reales de la IA y flujo de "Claim" funcional.
- [x] **Notificaciones Offline:** Sistema de detección de mercados resueltos mientras el usuario no estaba conectado.

## 📍 Direcciones de Contrato (Base Sepolia)
- **Factory (Markets Pro):** `0x7B402F2DD4FbcE6B9f3c8152d257DAB80631202E`
- **VAULT_FACTORY (Pollas):** `0x4a9C73666656E2A50370a278729852fc02f6cfBD`
- **POLLA_VAULT_IMPL:** `0xbC83ed2404EABe5c50C0541E89D980a2a4f0cfe1`
- **Mock USDC:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Admin Address:** `0x9592f1E9f8fa10ccd8380DaF70596838340C16c8`

## 🚀 Próximos Pasos
1. **Fase Final Mundial (Round of 32):** Implementar el algoritmo de "8 mejores terceros" y la generación de llaves de eliminación directa.
2. **Dashboard de Tesorería:** Crear una vista en el frontend para que el admin y los creadores retiren sus comisiones acumuladas.
3. **Farcaster Frames:** Iniciar el desarrollo del canal de distribución social.

## 📊 Métricas de Ingeniería
- **Modelos de IA:** Gemini 3 Flash / 2.5 Flash (Soportados y validados).
- **Estándar Horario:** **GMT** (Oficial del protocolo).
- **Disponibilidad:** Indexer con redundancia de polling cada 30s.
