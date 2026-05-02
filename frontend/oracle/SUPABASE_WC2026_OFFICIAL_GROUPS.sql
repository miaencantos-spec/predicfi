-- 1. Limpieza de datos anteriores
TRUNCATE TABLE wc2026_matches, wc2026_teams CASCADE;

-- 2. Insertar Equipos Oficiales WC 2026
INSERT INTO wc2026_teams (name, group_letter, flag_code) VALUES
-- Grupo A
('México', 'A', 'mx'), ('Sudáfrica', 'A', 'za'), ('Rep. Corea', 'A', 'kr'), ('Rep. Checa', 'A', 'cz'),
-- Grupo B
('Canadá', 'B', 'ca'), ('Bosnia', 'B', 'ba'), ('Catar', 'B', 'qa'), ('Suiza', 'B', 'ch'),
-- Grupo C
('Brasil', 'C', 'br'), ('Marruecos', 'C', 'ma'), ('Haití', 'C', 'ht'), ('Escocia', 'C', 'gb'),
-- Grupo D
('EE.UU.', 'D', 'us'), ('Paraguay', 'D', 'py'), ('Australia', 'D', 'au'), ('Turquía', 'D', 'tr'),
-- Grupo E
('Alemania', 'E', 'de'), ('Curaçao', 'E', 'cw'), ('Costa de Marfil', 'E', 'ci'), ('Ecuador', 'E', 'ec'),
-- Grupo F
('Países Bajos', 'F', 'nl'), ('Japón', 'F', 'jp'), ('Suecia', 'F', 'se'), ('Túnez', 'F', 'tn'),
-- Grupo G
('Bélgica', 'G', 'be'), ('Egipto', 'G', 'eg'), ('Irán', 'G', 'ir'), ('Nueva Zelanda', 'G', 'nz'),
-- Grupo H
('España', 'H', 'es'), ('Cabo Verde', 'H', 'cv'), ('Arabia Saudita', 'H', 'sa'), ('Uruguay', 'H', 'uy'),
-- Grupo I
('Francia', 'I', 'fr'), ('Senegal', 'I', 'sn'), ('Irak', 'I', 'iq'), ('Noruega', 'I', 'no'),
-- Grupo J
('Argentina', 'J', 'ar'), ('Argelia', 'J', 'dz'), ('Austria', 'J', 'at'), ('Jordania', 'J', 'jo'),
-- Grupo K
('Portugal', 'K', 'pt'), ('RD Congo', 'K', 'cd'), ('Uzbekistán', 'K', 'uz'), ('Colombia', 'K', 'co'),
-- Grupo L
('Inglaterra', 'L', 'gb'), ('Croacia', 'L', 'hr'), ('Ghana', 'L', 'gh'), ('Panamá', 'L', 'pa');

-- 3. Regenerar Partidos dinámicamente
DO $$
DECLARE
  grp VARCHAR;
  teams UUID[];
  match_day TIMESTAMP;
  offset_days INT := 0;
BEGIN
  -- Iterar sobre cada grupo del A al L
  FOR grp IN SELECT unnest(ARRAY['A','B','C','D','E','F','G','H','I','J','K','L']) LOOP
    -- Obtener los 4 equipos del grupo ordenados alfabéticamente
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
    IF offset_days > 3 THEN offset_days := 0; END IF;
  END LOOP;
END $$;
