-- Script para añadir la columna 'selected_option' a la tabla 'bets'
-- Esto es necesario para soportar opciones múltiples en formatos como '1X2' 
-- y diferenciar qué opción eligió el usuario cuando el Smart Contract subyacente es binario.

ALTER TABLE bets ADD COLUMN IF NOT EXISTS selected_option text;

-- Si decides actualizar filas existentes para no tener nulos, puedes usar:
-- UPDATE bets SET selected_option = 'YES' WHERE is_yes = true AND selected_option IS NULL;
-- UPDATE bets SET selected_option = 'NO' WHERE is_yes = false AND selected_option IS NULL;
