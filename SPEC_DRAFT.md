# 📄 SPEC_DRAFT: PollaVault.sol & Integración Supabase (Gasless Predictions)

## 1. Visión General
Esta especificación define el sistema **Pari-Mutuel (Polla Futbolera)** para PredicFi. La arquitectura permite torneos de predicción de marcadores exactos con liquidación on-chain y gestión de predicciones off-chain para optimizar costos de gas.

---

## 2. Smart Contract: `PollaVault.sol`

### Parámetros e Inmutables
- `MAX_PARTICIPANTS = 15`: Límite estricto de entrada para garantizar eficiencia.
- `TREASURY_FEE_BPS = 100`: 1% del pozo total (en puntos básicos).
- `TREASURY_SHARE = 70`: 70% de la comisión para la plataforma.
- `CREATOR_SHARE = 30`: 30% de la comisión para el creador de la polla.
- `token`: Interfaz de `MockUSDC` (Base Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`).

### Estado del Contrato
- `entryCost`: Monto fijo en USDC para participar.
- `creator`: Dirección del creador de la bóveda.
- `participants`: Array de direcciones registradas.
- `isResolved`: Booleano para evitar doble liquidación.
- `totalPool`: Suma de todos los USDC depositados.

### Funciones Clave

#### `createVault(uint256 _entryCost)`
- Inicializa la bóveda con el costo de entrada definido.
- Define al `msg.sender` como `creator`.

#### `joinTournament()`
- Transfiere `entryCost` desde el usuario al contrato.
- Requiere: `participants.length < MAX_PARTICIPANTS`.
- Emite evento `PlayerJoined(address player)`.

#### `resolveTournament(address[] calldata winners, uint256[] calldata payouts)`
- **Restricción**: Solo ejecutable por la `ADMIN_WALLET` o el Oráculo autorizado.
- **Lógica de Comisiones**:
  - Calcula `fee = totalPool * 1%`.
  - Envía el 70% del `fee` a la Tesorería de PredicFi.
  - Envía el 30% del `fee` al `creator`.
- **Distribución**: Reparte el balance restante entre los `winners` según los montos en `payouts`.
- Marca la bóveda como `isResolved`.

---

## 3. Integración Off-chain (Supabase)

Para habilitar una experiencia **Gasless**, las predicciones detalladas se gestionan fuera de la cadena.

### Flujo de Datos
1. **Registro**: Una vez que el usuario llama a `joinTournament()` on-chain, el frontend habilita el formulario de predicciones.
2. **Almacenamiento**: El usuario ingresa sus marcadores (ej. "Real Madrid 2 - 1 Barca").
3. **Firma**: El usuario firma un mensaje con sus predicciones (EIP-712 preferido).
4. **Persistencia**: El frontend envía la predicción y la firma a **Supabase**.
5. **Seguridad**: Supabase valida que la dirección del firmante haya llamado a `joinTournament()` en el contrato antes de aceptar la entrada.

### Resolución Automática
- Nuestro **AI Oracle (Gemini 1.5 Pro)** recupera los resultados reales de los partidos.
- El script de resolución procesa las predicciones en Supabase, calcula los puntajes y determina los `winners` y `payouts` proporcionales.
- Finalmente, ejecuta la transacción `resolveTournament()` en Base Sepolia.

---

## 4. Próximos Pasos (Tras aprobación)
- Implementación de `PollaVault.sol` en `ai-prediction-market/contracts/src/`.
- Configuración de la tabla `pollas_predictions` en Supabase.
- Desarrollo del script de resolución en `ai-prediction-market/oracle/`.

**¿Apruebas este documento (Approved)?**
