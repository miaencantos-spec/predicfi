# Tournament Vault Architecture (Polla Builder)

## Overview
El "Tournament Vault" se expande de ser solo para el Mundial 2026 a un sistema flexible ("Polla Builder") que permite:
1. Usar **Plantillas Pre-definidas** (Ej: Mundial, Champions, Copa América).
2. Crear **Ligas Personalizadas (Custom Leagues)** (Ej: Ligas locales, torneos de barrio, ligas universitarias).

## Componentes Principales

### 1. Smart Contract (VaultFactory & Vault)
El Smart Contract debe ser agnóstico al formato del torneo.
- **Configuración Genérica:** Al crear un Vault, el creador define `entryCost` y opcionalmente `maxParticipants`. No hay "fase de grupos" ni "octavos" quemados en el contrato.
- **Flexibilidad de Puntos:** El contrato almacena un registro de `participantes` y el `prizePool`.
- **Validación Final / Resolución:** Cuando el torneo termina, el oráculo autorizado (o el creador si es manual) llama a `settleVault(address[] winners, uint256[] amounts)` para distribuir el pozo de acuerdo a los puntajes acumulados off-chain.

### 2. Base de Datos (Supabase Schema Proposal)

#### Tabla: `tournament_templates`
Almacena torneos oficiales globales (de solo lectura para el usuario).
- `id` (UUID, PK)
- `name` (String) - Ej: "FIFA World Cup 2026"
- `icon_url` (String)
- `total_matches` (Int)
- `is_active` (Boolean)

#### Tabla: `custom_leagues`
Almacena la estructura de ligas creadas manualmente por usuarios.
- `id` (UUID, PK)
- `creator_address` (String)
- `name` (String) - Ej: "Liga Amateur Bogotá"
- `num_teams` (Int)
- `rounds` (Int)
- `reference_url` (String, nullable) - URL para que Gemini intente validar resultados automáticamente.

#### Tabla: `vaults` (Mercados POLLA)
La instancia de la bóveda de apuestas de un grupo de amigos.
- `vault_address` (String, PK)
- `template_id` (UUID, FK a tournament_templates, nullable)
- `custom_league_id` (UUID, FK a custom_leagues, nullable)
- `vault_title` (String)
- `group_name` (String)
- `entry_fee` (Numeric)

#### Tabla: `matches`
Partidos individuales ligados a un template o custom_league.
- `id` (UUID, PK)
- `template_id` (UUID, FK, nullable)
- `custom_league_id` (UUID, FK, nullable)
- `home_team` (String)
- `away_team` (String)
- `match_time` (Timestamp)
- `result` (String) - Actualizado por la IA o el oráculo manual.

### 3. Frontend (Flujo en `/create`)
Al seleccionar formato `POLLA` en el Terminal de Creación:
- **Selector de Modo:** `Plantilla Global` vs `Torneo Personalizado`.
- **Plantilla Global:**
  - Menú desplegable con Torneos Activos (Mundial 2026, Champions League).
  - Define detalles de la bóveda: `entryFee` y `groupName` (Ej: "Oficina Central").
- **Torneo Personalizado:**
  - Define datos de la liga: `customLeagueName`, `numTeams`, `rounds`.
  - Opción de proporcionar un `reference_url` para validación automatizada por Gemini.
  - Define detalles de la bóveda: `entryFee` y `groupName`.

### 4. Lógica de Validación (Gemini 2.5 Flash)
- **Para Plantillas:** Gemini utiliza web search incorporado y conocimiento general para resolver los partidos de torneos populares.
- **Para Custom Leagues:** Gemini puede escrapear la `reference_url` proporcionada para extraer resultados locales.
- **Fallback Manual:** Si el oráculo de IA no logra extraer datos confiables de la liga local, el creador del Vault tiene permisos de *Admin Local* para subir los resultados, lo cual activa un período de disputa de 24h para que los participantes aprueben o reporten trampa.
