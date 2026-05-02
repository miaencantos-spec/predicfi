# 🔐 Protocolo de Seguridad - PredicFi

La seguridad de los fondos y la integridad de los mercados son nuestra máxima prioridad. PredicFi utiliza una arquitectura de contratos inteligentes inmutables y sistemas de pausa de emergencia.

## 🛡️ Medidas On-Chain
- **Circuit Breaker (Emergency Stop):** La `MarketFactory` cuenta con una función `setPaused()` que permite al administrador detener la creación de nuevos mercados y apuestas en caso de detectar una anomalía.
- **Custodia Descentralizada:** El protocolo nunca tiene acceso directo a las claves privadas de los usuarios. Los fondos (USDC) se bloquean en el contrato de cada mercado y solo se liberan bajo las reglas predefinidas de resolución.
- **Clones EIP-1167:** Al utilizar proxies de clones, aseguramos que la lógica de cada mercado sea idéntica y haya sido verificada previamente, eliminando errores de despliegue individual.

## 🔑 Gestión de Privilegios
- **Admin Role:** El rol de administrador está limitado a funciones de mantenimiento (pausa y resolución de disputas). 
- **Plan de Transición:** Para la V2, el rol de Admin se transferirá a un **Multi-Sig (Gnosis Safe)** para eliminar puntos únicos de falla.

## ⚠️ Reporte de Vulnerabilidades
Si has encontrado un fallo de seguridad, por favor no lo hagas público. Envía un reporte a `security@predicfi.com` (o vía mensaje directo al equipo técnico). 

### Alcance de Auditoría Sugerido:
1. Lógica de `claim()` en `PredictionMarket.sol`.
2. Integridad del flujo de `Permit` (EIP-2612).
3. Mecanismo de re-entrancia en la distribución de comisiones.

---
*Estado: Smart Contracts desplegados en Base Sepolia. Auditoría externa pendiente.*
