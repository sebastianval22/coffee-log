# Spec — Fase 1: MVP manual

> Estado: aprobado (grilling 2026-10-11). Fuente de verdad para los tickets de la Fase 1.
> Objetivo: **usar la app a diario** desde el iPhone (PWA) y verla bien en el computador. Sin IA todavía.

## 1. Conceptos del dominio

| Concepto | Qué es | Evento que lo crea |
|---|---|---|
| **Bolsa** (`bags`) | Una bolsa de café que abro en casa. Tiene una foto (del empaque) y mi veredicto. | Abrir una bolsa nueva |
| **Taza** (`cups`) | Una taza tomada de una bolsa. Puede ser *rápida* (solo fecha, botón "+1") o *cata* (con método, rating, tags o notas). | "+1 taza" o "Agregar cata" |
| **Visita** (`cafe_visits`) | Un café que tomé en una cafetería. Foto propia (de la taza), sin bolsa. | Registrar visita |
| **Tostador** (`roasters`) | Quien tostó el café. Compartido por bolsas y visitas. | Autocompletar / crear al vuelo |
| **Cafetería** (`cafes`) | Lugar donde tomé café. | Autocompletar / crear al vuelo |

Una taza es una **cata** si tiene al menos uno de: método, rating, tags, notas. Si no, es **rápida**.

## 2. Modelo de datos

```sql
create type process_t as enum ('washed','natural','honey','anaerobic','wet_hulled','other');
create type roast_t   as enum ('light','medium_light','medium','medium_dark','dark');
create type method_t  as enum ('espresso','v60','chemex','aeropress','french_press','moka',
                               'cold_brew','filter_machine',
                               'latte','cappuccino','flat_white','cortado','other');

roasters    (id, user_id, name, country, city, website, created_at)   unique (user_id, lower(name))
cafes       (id, user_id, name, city, address, created_at)            unique (user_id, lower(name), coalesce(city,''))

bags (
  id, user_id,
  name            text not null,
  photo_path      text not null,          -- {user_id}/bags/{id}/full.jpg (thumb.jpg al lado)
  roaster_id      → roasters on delete set null,
  origin_country, origin_region, farm, varieties text[], process process_t, roast_level roast_t,
  altitude_m      int check 0..3500,
  label_notes     text[],                  -- notas impresas en el empaque
  opened_at       timestamptz not null default now(),
  finished_at     timestamptz check (finished_at >= opened_at),
  finish_prompt_snoozed_until timestamptz,
  rating          numeric(2,1) check (rating between 0 and 5 and rating*2 = floor(rating*2)),
  flavor_tags     text[], notes text, would_buy_again boolean,
  search          tsvector,                -- trigger
  created_at, updated_at
)

cups (
  id, user_id,
  bag_id          → bags on delete cascade, not null,
  drunk_at        timestamptz not null default now(),
  method method_t, rating numeric(2,1), flavor_tags text[], notes text,
  created_at
)

cafe_visits (
  id, user_id,
  cafe_id         → cafes on delete restrict, not null,
  drink           method_t not null,
  photo_path      text not null,           -- {user_id}/visits/{id}/full.jpg
  visited_at      timestamptz not null default now(),
  rating numeric(2,1), flavor_tags text[], notes text,
  coffee_name text, roaster_id → roasters on delete set null, origin_country text, process process_t,
  search          tsvector,
  created_at, updated_at
)
```

- **RLS** en todas las tablas: `user_id = auth.uid()` para select/insert/update/delete; `user_id default auth.uid()`. Sin "auto-expose": `GRANT` explícitos a `authenticated` en la migración (local y nube se comportan igual).
- **Storage:** bucket privado `photos`, políticas por prefijo `{auth.uid()}/`. Dos archivos por foto: `full.jpg` (~1600px lado mayor, JPEG ~0.8) y `thumb.jpg` (~400px). Lectura con signed URLs.
- **Búsqueda:** `unaccent` + config `spanish`. Bolsas: nombre y tostador (A), origen/región/finca/variedades (B), notas/tags (C). Visitas: cafetería, nombre del café, tostador (A), origen, bebida (B), notas/tags (C). Índice GIN + `pg_trgm` sobre nombres para errores de tipeo.
- **Vistas** (con `security_invoker = true`):
  - `bag_summary`: bolsa + tostador + nº de tazas + nº de catas + última taza.
  - `history_feed`: unión de eventos `bag_opened` (bags.opened_at), `bag_finished` (bags.finished_at), `tasting` (cups que son catas), `cafe_visit`. Columnas comunes: `kind, occurred_at, bag_id, cup_id, visit_id, title, subtitle, photo_path, rating`.
- Borrar una bolsa borra sus tazas y sus fotos en Storage. Borrar una visita borra su foto.

## 3. Pantallas y flujos

Navegación inferior (móvil) / lateral o superior (desktop): **Inicio · Cafés · Cafeterías** + botón principal **Registrar** (elige "Abrí una bolsa" o "Estoy en una cafetería").

### 3.1 Login
Email → código OTP de 6 dígitos → sesión persistida. Sin magic link (no comparte sesión con la PWA en iOS).

### 3.2 Inicio (Historial)
- **"Abiertas ahora"** arriba: bolsas con `finished_at is null`, miniatura + contador de tazas + botón **+1**. Al tocar +1: crea taza rápida y muestra aviso "Taza registrada · Deshacer" (~5 s).
- **"¿Ya terminaste?"** en la tarjeta de una bolsa abierta cuando (`now - opened_at ≥ 14 días` **o** `now - última taza ≥ 7 días`, contando desde `opened_at` si no hay tazas) **y** `now ≥ finish_prompt_snoozed_until`. Botones: "Sí, terminé" → hoja de término; "Todavía no" → `snoozed_until = now + 7 días`. Constantes en un solo módulo.
- Debajo: `history_feed` paginado, más reciente primero. Las tazas rápidas no aparecen.

### 3.3 Registrar bolsa
Foto (obligatoria; `capture="environment"`, en desktop permite archivo) → formulario: nombre (obligatorio), tostador (combobox con crear), origen, región, finca, variedades, proceso, tostión, altitud, notas del empaque, fecha de apertura (default ahora). Opcional en la misma pantalla, colapsado: rating/tags/notas. Guardar → detalle.

### 3.4 Detalle de bolsa
Foto grande, datos, veredicto, lista de tazas (catas con detalle; rápidas agrupadas como contador), botones **+1**, **Agregar cata**, **Terminé esta bolsa** (o "Reabrir" si está terminada), Editar, Borrar (confirmación).

### 3.5 Hoja de término
Fecha de término (default hoy, ≥ apertura), rating final, ¿la comprarías de nuevo? — todo opcional, prellenado con lo que ya exista.

### 3.6 Registrar / detalle de visita
Foto (obligatoria), cafetería (combobox con crear: nombre, ciudad, dirección), bebida (obligatoria), fecha (default ahora), rating, tags, notas, y colapsado "Sé qué café era": nombre, tostador, origen, proceso. Detalle con Editar y Borrar.

### 3.7 Cafés (catálogo) y Cafeterías
- **Cafés:** grilla de bolsas (`bag_summary`), pestañas Abiertas / Todas.
- **Cafeterías:** grilla de visitas, agrupable por cafetería.
- Ambas con búsqueda de texto y filtros: proceso, tostión (solo bolsas), rating mínimo, rango de fechas (apertura / visita). Orden: fecha o rating. Filtros reflejados en la URL (compartible, sobrevive a recargas).

### 3.8 Detalles comunes
- Grilla responsive: 1 columna en móvil, 2 en tablet, 3–4 en desktop; miniaturas `thumb.jpg`, detalle `full.jpg`.
- Rating: estrellas de 0 a 5 en pasos de 0,5. Tags: libres, con sugerencias de los ya usados.
- Fechas en UTC en la BD, mostradas en la zona horaria del dispositivo.
- UI en español; código en inglés. `safe-area-inset` respetado.

## 4. Stack

React Router (modo librería) · TanStack Query · shadcn/ui · react-hook-form + Zod · `@supabase/supabase-js`. Compresión de imagen por `<canvas>` (normaliza HEIC y orientación EXIF).

## 5. Calidad

- **pgTAP** (`supabase test db`): RLS en todas las tablas, vistas y Storage — usuario A no lee, edita ni borra datos de B; anónimo no ve nada.
- `pnpm build` (tsc) y lint en verde antes de cada merge.

## 6. Operación (lo corre Sebastián)

- `supabase link --project-ref <ref>` (una vez) y `supabase db push` por cada migración nueva.
- Supabase nube → Authentication: plantilla de email con `{{ .Token }}` (OTP), y después de crear su usuario desactivar "Allow new users to sign up".

## 7. Fuera de alcance (Fase 1)

IA/extracción (Fase 2) · calendario visual e insights (Fase 4) · offline/cola · exportación · vincular visita↔bolsa · crear bolsa desde visita · GPS/mapa · foto por taza · i18n.
