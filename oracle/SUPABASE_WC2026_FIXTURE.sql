-- 1. Crear tabla de Equipos (WC 2026)
CREATE TABLE IF NOT EXISTS wc2026_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  group_letter VARCHAR(1) NOT NULL,
  flag_code VARCHAR(2) NOT NULL -- ISO 2-letter code para la bandera (ej. 'ar' para Argentina)
);

-- 2. Crear tabla de Partidos (WC 2026)
CREATE TABLE IF NOT EXISTS wc2026_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team_id UUID REFERENCES wc2026_teams(id) ON DELETE CASCADE,
  away_team_id UUID REFERENCES wc2026_teams(id) ON DELETE CASCADE,
  group_letter VARCHAR(1) NOT NULL,
  match_date TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Habilitar lectura pública
ALTER TABLE wc2026_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc2026_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of wc2026_teams" ON wc2026_teams FOR SELECT USING (true);
CREATE POLICY "Allow public read of wc2026_matches" ON wc2026_matches FOR SELECT USING (true);

-- Limpiar tablas si se re-ejecuta
TRUNCATE TABLE wc2026_matches CASCADE;
TRUNCATE TABLE wc2026_teams CASCADE;

-- 3. Inyectar Equipos Simulados (Dado que no están definidos aún en la vida real, usamos proyecciones)
INSERT INTO wc2026_teams (name, group_letter, flag_code) VALUES
-- Grupo A
('México', 'A', 'mx'), ('Polonia', 'A', 'pl'), ('Angola', 'A', 'ao'), ('Omán', 'A', 'om'),
-- Grupo B
('Canadá', 'B', 'ca'), ('Suiza', 'B', 'ch'), ('Malí', 'B', 'ml'), ('Nueva Zelanda', 'B', 'nz'),
-- Grupo C
('Estados Unidos', 'C', 'us'), ('Colombia', 'C', 'co'), ('Senegal', 'C', 'sn'), ('Uzbekistán', 'C', 'uz'),
-- Grupo D
('Argentina', 'D', 'ar'), ('Suecia', 'D', 'se'), ('Argelia', 'D', 'dz'), ('Emiratos Árabes', 'D', 'ae'),
-- Grupo E
('Francia', 'E', 'fr'), ('Ecuador', 'E', 'ec'), ('Sudáfrica', 'E', 'za'), ('Irak', 'E', 'iq'),
-- Grupo F
('Inglaterra', 'F', 'gb'), ('Uruguay', 'F', 'uy'), ('RD Congo', 'F', 'cd'), ('Jamaica', 'F', 'jm'),
-- Grupo G
('Brasil', 'G', 'br'), ('Serbia', 'G', 'rs'), ('Egipto', 'G', 'eg'), ('Bahréin', 'G', 'bh'),
-- Grupo H
('España', 'H', 'es'), ('Perú', 'H', 'pe'), ('Costa de Marfil', 'H', 'ci'), ('Honduras', 'H', 'hn'),
-- Grupo I
('Portugal', 'I', 'pt'), ('Chile', 'I', 'cl'), ('Marruecos', 'I', 'ma'), ('Panamá', 'I', 'pa'),
-- Grupo J
('Bélgica', 'J', 'be'), ('Venezuela', 'J', 've'), ('Nigeria', 'J', 'ng'), ('El Salvador', 'J', 'sv'),
-- Grupo K
('Países Bajos', 'K', 'nl'), ('Paraguay', 'K', 'py'), ('Camerún', 'K', 'cm'), ('Haití', 'K', 'ht'),
-- Grupo L
('Alemania', 'L', 'de'), ('Bolivia', 'L', 'bo'), ('Ghana', 'L', 'gh'), ('Costa Rica', 'L', 'cr');

-- 4. Script anónimo para generar los 72 partidos dinámicamente usando los IDs insertados
DO $$
DECLARE
  grp VARCHAR;
  teams UUID[];
  match_day TIMESTAMP;
  offset_days INT := 0;
BEGIN
  -- Iterar sobre cada grupo del A al L
  FOR grp IN SELECT unnest(ARRAY['A','B','C','D','E','F','G','H','I','J','K','L']) LOOP
    -- Obtener los 4 equipos del grupo ordenados alfabéticamente (por predictibilidad)
    SELECT array_agg(id ORDER BY name) INTO teams FROM wc2026_teams WHERE group_letter = grp;
    
    -- Fecha base: 11 Junio 2026 15:00 UTC, más los días de offset por grupo
    match_day := '2026-06-11 15:00:00+00'::TIMESTAMP + (offset_days || ' days')::INTERVAL;
    
    -- J1: Eq1 vs Eq2 / Eq3 vs Eq4
    INSERT INTO wc2026_matches (home_team_id, away_team_id, group_letter, match_date) VALUES 
      (teams[1], teams[2], grp, match_day),
      (teams[3], teams[4], grp, match_day + '4 hours'::INTERVAL);
      
    -- J2: Eq1 vs Eq3 / Eq2 vs Eq4
    INSERT INTO wc2026_matches (home_team_id, away_team_id, group_letter, match_date) VALUES 
      (teams[1], teams[3], grp, match_day + '5 days'::INTERVAL),
      (teams[2], teams[4], grp, match_day + '5 days 4 hours'::INTERVAL);
      
    -- J3: Eq1 vs Eq4 / Eq2 vs Eq3
    INSERT INTO wc2026_matches (home_team_id, away_team_id, group_letter, match_date) VALUES 
      (teams[1], teams[4], grp, match_day + '10 days'::INTERVAL),
      (teams[2], teams[3], grp, match_day + '10 days 4 hours'::INTERVAL);
      
    offset_days := offset_days + 1;
    -- Reiniciar offset si pasan de 3 días para agrupar partidos
    IF offset_days > 3 THEN offset_days := 0; END IF;
  END LOOP;
END $$;
