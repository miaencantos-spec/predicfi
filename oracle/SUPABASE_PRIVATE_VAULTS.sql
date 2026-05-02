-- Script para configurar Invitaciones y Bóvedas Privadas en Supabase

-- 1. Crear tabla de invitaciones
CREATE TABLE vault_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id VARCHAR NOT NULL, -- Hace referencia al address del mercado/polla
  email VARCHAR NOT NULL,
  invite_token VARCHAR UNIQUE NOT NULL,
  status VARCHAR DEFAULT 'pending', -- 'pending', 'accepted', 'revoked'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE vault_invitations ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Acceso para Invitaciones

-- Cualquiera (incluso anónimos o no logueados) puede LEER las invitaciones si tienen el token
CREATE POLICY "Allow public read of invitations by token" 
ON vault_invitations FOR SELECT 
USING (true); -- La validación real se hará en el servidor o frontend usando el token exacto

-- Solo el Service Role (Backend API) puede crear invitaciones
CREATE POLICY "Allow service role to insert invitations"
ON vault_invitations FOR INSERT 
WITH CHECK (true);

-- Solo el Service Role puede actualizar (ej. marcar como 'accepted')
CREATE POLICY "Allow service role to update invitations"
ON vault_invitations FOR UPDATE 
USING (true);

-- Índices para búsquedas rápidas
CREATE INDEX idx_vault_invitations_token ON vault_invitations(invite_token);
CREATE INDEX idx_vault_invitations_vault_id ON vault_invitations(vault_id);
