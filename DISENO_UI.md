# Guía de Diseño UI - PredicFi

PredicFi utiliza una estrategia de diseño dual para adaptarse a diferentes perfiles de usuario y contextos.

## 🎨 Paleta de Colores Principal
- **Brand Purple:** `#A855F7` (Acentos y Admin)
- **Success Emerald:** `#10B981` (SÍ / Ganancias)
- **Danger Red:** `#EF4444` (NO / Emergencia)
- **Base Zinc:** Tonos de gris para estructura.

## 🌓 Modos de Visualización

### ⚪ Modo Claro (Default - "Apple Fintech")
- **Fondo:** `zinc-50` / `white`
- **Tarjetas:** Bordes `zinc-200`, sombras suaves `shadow-sm`, desenfoque de cristal.
- **Texto:** `zinc-900` para legibilidad máxima.
- **Objetivo:** Profesionalismo, limpieza y confianza institucional.

### ⚫ Modo Oscuro ("Cyber-Fintech")
- **Fondo:** `zinc-950`
- **Tarjetas:** Fondos `zinc-900/50`, bordes `zinc-800`, efectos neón sutiles.
- **Texto:** `zinc-200` y `white`.
- **Objetivo:** Estética futurista, inmersión tecnológica y foco en datos.

## 🌍 Internacionalización (i18n)
- **Idioma Base:** Español (ES).
- **Idioma Secundario:** Inglés (EN).
- **Implementación:** Context Provider nativo en React con diccionarios de traducción en JSON.

## 🧱 Componentes Clave
- **Navbar:** Sticky top, barra de búsqueda central, toggles de idioma y tema.
- **Market Card:** Diseño de bordes redondeados (`rounded-[2rem]`), barra de probabilidad interactiva.
- **AI Verdict Panel:** Sección con iconos de `BrainCircuit` para resaltar el análisis de Gemini.
- **Admin Console:** Sidebar colapsable, métricas en tiempo real con fuentes monoespaciadas.
