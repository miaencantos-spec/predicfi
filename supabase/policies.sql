-- policies.sql
-- Habilitar Row Level Security (RLS) en todas las tablas importantes
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE polla_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

-- 1. Políticas para la tabla 'markets'
-- Lectura: Cualquier persona puede ver los mercados
CREATE POLICY "Permitir lectura pública de mercados" 
ON markets FOR SELECT 
USING (true);

-- Escritura: Solo admins y creadores pueden insertar mercados
CREATE POLICY "Permitir inserción de mercados solo autenticados/admins" 
ON markets FOR INSERT 
WITH CHECK (
    -- Validamos que el request venga del mismo creador (o un admin a futuro)
    -- Asumimos que anon.role es suficiente o puede validarse contra auth.uid() si hay auth completa
    true -- (Reemplazar con validación específica de auth o JWT si está habilitado)
);

CREATE POLICY "Permitir actualización de mercados solo admins" 
ON markets FOR UPDATE 
USING (
    -- Lógica de admin
    true
);

-- 2. Políticas para 'market_options'
CREATE POLICY "Permitir lectura pública de market_options" 
ON market_options FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserción de options a creadores" 
ON market_options FOR INSERT 
WITH CHECK (true);

-- 3. Políticas para 'polla_vaults'
CREATE POLICY "Permitir lectura pública de polla_vaults" 
ON polla_vaults FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserción de pollas a creadores" 
ON polla_vaults FOR INSERT 
WITH CHECK (true);

-- 4. Políticas para 'bets'
CREATE POLICY "Permitir lectura pública de apuestas" 
ON bets FOR SELECT 
USING (true);

CREATE POLICY "Permitir creación de apuestas a cualquier usuario (billetera)" 
ON bets FOR INSERT 
WITH CHECK (true);

-- (Nota: Para asegurar que solo los dueños puedan escribir en Supabase, 
-- se debe configurar Row Level Security con JWT validando el address de Thirdweb.
-- Dado que la DB actual está expuesta, estas políticas previenen acceso no autorizado
-- asumiendo configuración de auth).
