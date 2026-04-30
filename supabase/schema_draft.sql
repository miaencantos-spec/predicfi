-- schema_draft.sql
-- Draft of tables for PredicFi 5 Market Formats

-- 1. markets: Tabla principal para todos los mercados (Crypto, Deportes, Eventos)
CREATE TABLE markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_address VARCHAR(42) NOT NULL UNIQUE,
    format_type VARCHAR(50) NOT NULL, -- '1X2', 'PollaVault', 'Binary', 'MultiLevel', 'HeadToHead'
    title TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'SPORTS', 'CRYPTO', 'POLITICS', etc.
    volume NUMERIC DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'resolved', 'cancelled'
    ends_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. market_options: Opciones específicas para cada mercado (ej. SÍ/NO, COL/BRA, $3000/$3200)
CREATE TABLE market_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL, -- 'SÍ', 'NO', 'Colombia', 'Brasil', '↑ $3,000'
    probability NUMERIC DEFAULT 0, -- Ej: 65 para 65%
    color_class VARCHAR(50), -- Tailwind classes for UI
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. polla_vaults: Datos específicos off-chain para el formato Pari-Mutuel (Polla de Oficina)
CREATE TABLE polla_vaults (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    leader_name VARCHAR(100) NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    max_participants INTEGER DEFAULT 15,
    current_participants INTEGER DEFAULT 0,
    pool_amount NUMERIC DEFAULT 0,
    entry_fee NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
