# 🗄️ Esquema de Base de Datos para Pollas (Supabase)

Para soportar el sistema de **Polla Futbolera (Pari-Mutuel)**, se requieren las siguientes tablas en Supabase.

## 1. Tabla `pollas`
Almacena la configuración general de cada torneo/bóveda.

| Columna | Tipo | Descripción |
|--- |--- |--- |
| `id` | UUID | PK |
| `vault_address` | Text (Unique) | Dirección del contrato `PollaVault` desplegado. |
| `creator` | Text | Dirección del creador de la polla. |
| `entry_cost` | BigInt | Costo de entrada en unidades USDC (6 decimales). |
| `status` | Text | `open` (unirse), `locked` (juego en curso), `resolved` (pagado). |
| `events_description` | Text | Descripción de los partidos (ej. "Final UCL: Madrid vs BVB"). |
| `results_json` | JSONB | Resultados reales detectados por Gemini. |
| `winners_json` | JSONB | Ganadores y pesos de pago calculados. |
| `created_at` | Timestamp | Fecha de creación. |
| `ends_at` | Timestamp | Fecha en que se bloquean las predicciones. |

## 2. Tabla `pollas_predictions`
Almacena las predicciones "Gasless" de los usuarios.

| Columna | Tipo | Descripción |
|--- |--- |--- |
| `id` | UUID | PK |
| `vault_address` | Text | FK a `pollas.vault_address`. |
| `user_address` | Text | Dirección del participante. |
| `predictions_json` | JSONB | Marcadores predichos (ej: `{"match1": "2-1"}`). |
| `signature` | Text | Firma EIP-712 del usuario para validar integridad. |
| `created_at` | Timestamp | Fecha de envío. |

---

## 🚀 Flujo de Resolución
1. El Oracle busca pollas con `status = 'locked'`.
2. Gemini obtiene resultados reales de la web.
3. Gemini compara `results_json` contra todas las `predictions_json` de esa polla.
4. El Oracle ejecuta `resolveTournament` en el contrato.
5. El Oracle marca la polla como `resolved` en DB.
