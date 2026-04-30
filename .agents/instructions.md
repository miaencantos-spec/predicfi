# 🎮 Orquestación de PredicFi (/startcycle)

Sigue esta secuencia ante cualquier solicitud de nueva funcionalidad:

1. **Arquitectura (@architect)**: Redacta la spec y el **Plan de Pruebas (UAT)** (ej. Test del Novato vs Test del Degen).
   - 🛑 **PAUSA**: Esperar "Approved".
2. **Desarrollo (@web3_dev)**:
   - Modificar Smart Contracts (si aplica).
   - Actualizar el Indexador (Supabase).
   - Implementar UI/UX en Frontend.
3. **Auditoría (@auditor)**: Ejecuta los UAT definidos en la Fase 1. Especial atención a la seguridad del flujo de fondos.
4. **Despliegue (@infra)**: Actualiza scripts de migración y variables de entorno.
