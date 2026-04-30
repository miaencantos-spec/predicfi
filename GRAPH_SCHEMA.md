# 📈 Esquema para Historial de Gráficas (Supabase)

Para que las gráficas de PredicFi sean dinámicas y muestren la evolución de las probabilidades, necesitamos registrar cada cambio de estado (Tick).

## Tabla: `market_ticks`
Esta tabla registra cada transacción de compra de shares para generar la serie de tiempo.

| Columna | Tipo | Descripción |
|--- |--- |--- |
| `id` | BigInt (PK) | Identificador único. |
| `market_address` | Text | FK al mercado correspondiente. |
| `price_yes` | Float8 | Precio del SÍ en ese momento (0.0 a 1.0). |
| `price_no` | Float8 | Precio del NO en ese momento (0.0 a 1.0). |
| `total_volume` | BigInt | Volumen total acumulado en USDC. |
| `transaction_hash` | Text | Hash de la tx en Base Sepolia. |
| `created_at` | Timestamp | Fecha y hora exacta del tick. |

---

## 🤖 Lógica del Sincronizador (Indexer Lite)
El frontend o un worker debe realizar lo siguiente tras cada apuesta:
1. Calcular el nuevo precio: `price_yes = total_yes / (total_yes + total_no)`.
2. Insertar una nueva fila en `market_ticks`.
3. El componente de la gráfica hará:
   ```sql
   SELECT price_yes, created_at 
   FROM market_ticks 
   WHERE market_address = '0x...' 
   ORDER BY created_at ASC;
   ```
