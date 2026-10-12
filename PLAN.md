# Coffee Log — Plan técnico

> Nombre de trabajo: **coffee-log** (cambiar cuando haya uno mejor).
> Creado: 2026-10-10 · Estado: planificación, sin código todavía.

## 1. Objetivo

PWA personal para registrar los cafés que pruebo. El flujo principal: **tomar una foto del empaque → la IA propone nombre, tostador, origen, proceso y tostión → confirmo/edito → queda guardado** con foto y review. Luego busco y filtro lo que he tomado.

Doble propósito:
1. **Uso real diario** en mi iPhone 17e (sin Mac, desarrollo en Windows, costo ~$0).
2. **Proyecto de portafolio** alineado con mi objetivo de rol (Platform/Data Engineer, ver `career/europe_plan.md`): pipeline de IA **con evaluación medida**, Postgres bien modelado con RLS, CI/CD e infraestructura como código.

### No-objetivos (para no sobredimensionar)
- No es una red social, no hay usuarios múltiples reales (el esquema sí es multiusuario por RLS, por buena práctica).
- No hay app nativa ni App Store.
- No hay recomendaciones con ML en v1.

---

## 2. Decisiones de arquitectura

| Decisión | Elección | Por qué / alternativa descartada |
|---|---|---|
| Plataforma | **PWA** instalada desde Safari ("Agregar a pantalla de inicio") | App nativa requiere Mac o cuenta Apple Developer pagada; sideloading caduca cada 7 días |
| Frontend | **Vite + React + TypeScript** (SPA) | Next.js complica la PWA/service worker y no aporta SSR útil aquí |
| PWA | `vite-plugin-pwa` (Workbox) | Manifest + service worker + caché offline del app shell |
| UI | Tailwind CSS + shadcn/ui | Rápido, accesible, se ve profesional |
| Formularios / validación | react-hook-form + **Zod** | El mismo schema Zod valida el formulario y la salida de la IA (compartido) |
| Datos remotos | **Supabase** (Postgres + Storage + Auth + Edge Functions), plan gratuito | Una sola plataforma; Postgres real (full-text, RLS, migraciones SQL) suma para perfil Data |
| Caché / estado servidor | TanStack Query + persistencia en IndexedDB | Lista y detalle disponibles sin conexión |
| Cola offline | IndexedDB (Dexie) para capturas pendientes | Si saco la foto sin señal, se sube y extrae al reconectar |
| Extracción IA | **Supabase Edge Function** `extract-coffee` | La API key vive en el servidor, nunca en el teléfono |
| Proveedor IA | Interfaz `Extractor` con 2 implementaciones: **Claude** y **Gemini** | Permite comparar con datos (sección 5) y cambiar sin tocar el resto |
| Hosting frontend | **Vercel** (Hobby, gratis) | HTTPS (obligatorio para cámara/PWA), previews por PR |
| Infra como código | **Terraform** (providers de Supabase y Vercel) — fase 5 | Cierra la brecha "IaC" del plan Europa |
| CI/CD | GitHub Actions | Lint, typecheck, tests, migraciones y deploy de funciones |

### Diagrama

```
 iPhone (PWA en Safari)
 ├─ <input capture> → comprimir (canvas, JPEG ~1600px)
 ├─ IndexedDB: caché de consultas + cola offline
 │
 ├──► Supabase Storage  (bucket privado coffee-photos/{user_id}/{uuid}.jpg)
 ├──► Edge Function extract-coffee ──► Claude API / Gemini API
 │        └─ registra en tabla extractions (proveedor, modelo, latencia, costo, JSON)
 └──► Postgres (coffees, tastings, roasters) con RLS
```

---

## 3. Modelo de datos (Postgres)

> **Actualizado 2026-10-11:** el modelo vigente está en [`docs/specs/phase-1.md`](docs/specs/phase-1.md). `coffees`/`tastings` se reemplazan por **`bags`** (bolsas de casa, con veredicto), **`cups`** (tazas: rápidas "+1" o catas) y **`cafe_visits`** (visitas a cafeterías, con tabla `cafes`). En la Fase 2, `extractions.coffee_id` pasa a ser `bag_id`. El SQL de abajo queda como referencia histórica.

Separación clave: **coffee** (la bolsa/producto) ≠ **tasting** (cada vez que lo tomo). Un mismo café puede tener varias catas (distintos métodos, días, lugares).

```sql
-- enums
create type process_t as enum ('washed','natural','honey','anaerobic','wet_hulled','other');
create type roast_t   as enum ('light','medium_light','medium','medium_dark','dark');
create type method_t  as enum ('espresso','v60','chemex','aeropress','french_press',
                               'moka','cold_brew','filter_machine','cafe_order','other');

create table roasters (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  country     text,
  city        text,
  website     text,
  unique (user_id, name)
);

create table coffees (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  roaster_id     uuid references roasters on delete set null,
  name           text not null,
  origin_country text,
  origin_region  text,
  farm           text,
  varieties      text[] default '{}',
  process        process_t,
  roast_level    roast_t,
  altitude_m     int check (altitude_m between 0 and 3500),
  label_notes    text[] default '{}',   -- notas de cata impresas en el empaque
  photo_path     text,                   -- ruta en Storage
  search         tsvector,               -- mantenido por trigger (ver abajo)
  created_at     timestamptz not null default now()
);

create table tastings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  coffee_id       uuid not null references coffees on delete cascade,
  tasted_at       timestamptz not null default now(),
  method          method_t,
  place           text,                  -- casa / nombre de la cafetería
  rating          numeric(2,1) check (rating between 0 and 5),
  flavor_tags     text[] default '{}',   -- lo que YO sentí
  notes           text,
  would_buy_again boolean
);

-- log de cada extracción: base del eval "en producción"
create table extractions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  coffee_id       uuid references coffees on delete set null,  -- se llena al guardar
  photo_path      text not null,
  provider        text not null,         -- 'anthropic' | 'google'
  model           text not null,
  prompt_version  text not null,
  output          jsonb,                 -- lo que propuso la IA
  final           jsonb,                 -- lo que guardé tras editar
  latency_ms      int,
  input_tokens    int,
  output_tokens   int,
  est_cost_usd    numeric(10,6),
  error           text,
  created_at      timestamptz not null default now()
);
```

- **RLS** en todas las tablas: `using (user_id = auth.uid())` para select/insert/update/delete. Storage con política equivalente por prefijo `{user_id}/`.
- **Búsqueda:** trigger que arma `search` con `unaccent` + config `spanish` sobre nombre, tostador, origen, región, variedades y notas (`setweight` A para nombre/tostador, B para origen, C para notas). Índice GIN. Además `pg_trgm` sobre `coffees.name` para tolerar errores de tipeo ("etiopia" → "Etiopía").
- **Vista** `coffee_summary`: café + tostador + nº de catas + rating promedio + última cata → alimenta la lista y las estadísticas.
- Comparar `extractions.output` vs `extractions.final` da la **precisión real por campo** con el uso diario (sección 5).

---

## 4. Extracción con IA

### Contrato (schema Zod compartido)
```ts
CoffeeExtraction = {
  name: string | null,
  roaster: string | null,
  origin_country: string | null,
  origin_region: string | null,
  farm: string | null,
  varieties: string[],
  process: ProcessEnum | null,
  roast_level: RoastEnum | null,
  altitude_m: number | null,
  label_notes: string[],
  confidence: Record<field, 'high' | 'low'>   // la UI resalta los 'low'
}
```
Regla del prompt: **null si no aparece en el empaque; nunca inventar.** Normalizar país en español.

### Flujo en la Edge Function `extract-coffee`
1. Recibe `photo_path` (la foto ya subida a Storage); verifica que pertenezca al usuario (JWT).
2. Descarga la imagen, la manda al proveedor configurado con **salida estructurada** (JSON schema).
3. Valida con Zod; si falla, un reintento; si vuelve a fallar, devuelve campos vacíos (el formulario manual siempre funciona).
4. Inserta fila en `extractions` (tokens, latencia, costo estimado, prompt_version).
5. Límite simple: máx. N extracciones/día por usuario (protege la API key si la URL se filtra).

### Proveedores
| | Claude (Anthropic) | Gemini (Google) |
|---|---|---|
| Modelo | `claude-opus-5-5` por defecto (más preciso); `claude-haiku-5-5` como opción barata a evaluar | Modelo Flash vigente del nivel gratuito |
| Imágenes + salida estructurada | Sí (`output_config.format` con JSON schema) | Sí (`responseSchema`) |
| Costo aprox. por foto* | Opus 5.5: ~US$0,01–0,02 · Haiku 5.5: ~US$0,0005 | $0 dentro de los límites del nivel gratuito |
| Nota | Requiere cargar crédito prepago en la consola | Límites del nivel gratuito cambian; datos pueden usarse para entrenamiento en el plan gratuito — revisar términos |

\*Estimado con la foto reducida a ~1600px (~1.500–2.000 tokens de entrada) y ~300–600 de salida, a precios de octubre 2026. A ~30 fotos/mes: Opus ≈ US$0,50/mes, Haiku ≈ US$0,02/mes, Gemini $0. **Verificar precios antes de elegir.** La elección final la decide el eval (sección 5), no la intuición.

Implementación Claude: SDK oficial `@anthropic-ai/sdk` en la Edge Function (Deno soporta paquetes npm). En Opus 5.5 el thinking no se puede desactivar: usar `effort: "low"` para extracción.

---

## 5. Evaluación (el diferenciador del proyecto)

**Eval offline (antes de elegir proveedor/prompt):**
1. Dataset: 30–50 fotos reales de empaques (las mías + de tostadores locales), con un `expected.json` por foto etiquetado a mano. Guardado en `eval/dataset/` (fotos fuera de git si pesan → Supabase Storage o Git LFS).
2. Script `pnpm eval --provider claude --model ... --prompt v2` corre todas las fotos y produce:
   - Exactitud por campo (match exacto normalizado para enums/país; similitud difusa para nombre/tostador).
   - % de alucinaciones: campos llenos cuando el esperado es null (**la métrica más importante**).
   - Latencia p50/p95 y costo total.
3. Resultados en `eval/results/<fecha>-<proveedor>-<prompt>.json` + tabla comparativa en el README.
4. Workflow de GitHub Actions con `workflow_dispatch` (manual, porque cuesta dinero), nunca en cada push.

**Eval online (uso real):** consulta SQL sobre `extractions` → % de campos que tuve que corregir, por proveedor y versión de prompt. Una vista `extraction_accuracy` y un gráfico en la página de estadísticas.

Historia para entrevistas: *"comparé dos proveedores y N versiones de prompt con un dataset etiquetado; elegí X porque tenía Y% de exactitud y Z% de alucinación a W costo; además medí la precisión real en producción comparando lo propuesto vs lo guardado."*

---

## 6. Frontend (pantallas)

> **Actualizado 2026-10-11:** pantallas de la Fase 1 en [`docs/specs/phase-1.md`](docs/specs/phase-1.md) §3 (Inicio = historial + "Abiertas ahora", Cafés, Cafeterías, "¿Ya terminaste?").

1. **Capturar** (botón principal, grande): abre cámara → preview → sube → muestra formulario pre-llenado con campos `low` resaltados → guardar café + primera cata.
2. **Lista / búsqueda**: barra de búsqueda (full-text), filtros (origen, proceso, tostión, rating ≥, método), orden por fecha/rating. Tarjetas con miniatura.
3. **Detalle del café**: foto, datos, historial de catas, "agregar cata".
4. **Estadísticas**: orígenes más tomados, rating promedio por proceso/origen, cafés por mes, precisión de la IA.
5. **Ajustes**: exportar todo a JSON/CSV (respaldo propio), cerrar sesión.

### Detalles específicos de iPhone / PWA
- Cámara: `<input type="file" accept="image/*" capture="environment">`. Re-codificar siempre por canvas a JPEG (normaliza HEIC y orientación EXIF, reduce tamaño).
- **Login con código OTP de 6 dígitos por email, no magic link**: en iOS el link se abre en Safari, que no comparte sesión con la PWA instalada.
- iOS puede borrar el almacenamiento local de la web → Supabase es la fuente de verdad; IndexedDB es solo caché/cola.
- Respetar `safe-area-inset` (notch / barra inferior) y `display: standalone` en el manifest.
- Probar en el iPhone real sobre el deploy de preview de Vercel (HTTPS) o con túnel (`cloudflared`) desde Windows.

---

## 7. Estructura del repo

```
coffee-log/
├─ apps/web/                 # Vite + React PWA
│  ├─ src/features/{capture,coffees,tastings,stats,auth}/
│  ├─ src/lib/{supabase,db-offline,image}.ts
│  └─ e2e/                   # Playwright (perfil WebKit/iPhone)
├─ packages/schema/          # Zod schemas + tipos compartidos (web + function + eval)
├─ supabase/
│  ├─ migrations/            # SQL versionado
│  ├─ functions/extract-coffee/
│  ├─ tests/                 # pgTAP: tests de RLS y búsqueda
│  └─ seed.sql               # datos demo
├─ eval/
│  ├─ dataset/  results/
│  └─ run.ts
├─ infra/terraform/          # fase 5
├─ .github/workflows/        # ci.yml, deploy.yml, eval.yml
└─ README.md                 # en inglés (audiencia: reclutadores UE)
```
Monorepo con **pnpm workspaces**. Desarrollo local: Supabase CLI + Docker Desktop en Windows (`supabase start` levanta Postgres, Storage, Auth y Functions localmente).

---

## 8. Testing y calidad

- **Vitest**: utilidades (compresión, normalización, mapeo extracción→formulario), schemas.
- **pgTAP** (`supabase test db`): RLS (usuario A no ve datos de B), trigger de búsqueda, constraints.
- **Playwright** con perfil WebKit/iPhone: flujo captura → guardar → buscar (IA mockeada).
- ESLint + Prettier + `tsc --noEmit`.

### CI/CD (GitHub Actions)
- `ci.yml` (cada PR): lint, typecheck, Vitest, pgTAP sobre Supabase local en el runner, Playwright.
- `deploy.yml` (push a `main`): `supabase db push` (migraciones) + `supabase functions deploy`; Vercel despliega el frontend solo.
- `eval.yml` (manual): corre el eval y sube resultados como artifact.
- Secretos en GitHub Secrets / Supabase secrets; nada en el repo.

---

## 9. Fases

### Fase 0 — Setup (½ día)
- [x] Monorepo pnpm local, Vite 8 + React 19 + TS + Tailwind 4, PWA (manifest, service worker, íconos iOS). Build OK. *(2026-10-10)*
- [x] Supabase CLI como devDependency + `supabase init`. *(2026-10-10)*
- [x] Skills de Matt Pocock instaladas como plugin a nivel de proyecto (`.claude/settings.json`). *(2026-10-10)*
- [x] Repo `coffee-log` en GitHub (público) + primer commit. *(2026-10-10)*
- [x] `pnpm db:start` con Docker Desktop abierto; copiar publishable key a `apps/web/.env.local`. *(2026-10-10)*
- [x] Proyecto Supabase gratuito en la nube (Data API on, auto-expose off, auto-RLS on). *(2026-10-10)*
- [x] Deploy en Vercel (Root `apps/web`, Node 22, env vars `VITE_SUPABASE_*`). *(2026-10-10)*
- [x] PWA en el iPhone: agregada a pantalla de inicio, Supabase configurado. *(2026-10-10)*

### Fase 1 — MVP manual (1–2 fines de semana) → **ya lo uso a diario**
Spec: [`docs/specs/phase-1.md`](docs/specs/phase-1.md) · Tickets: GitHub Issues con label `phase-1`.
- [x] Migraciones: enums, `roasters`, `cafes`, `bags`, `cups`, `cafe_visits`, RLS, bucket `photos`, búsqueda, vistas + pgTAP de RLS.
- [x] Auth con OTP por email + esqueleto de la app (router, layout, shadcn/ui, TanStack Query).
- [x] Foto: captura, compresión (full + thumb) y subida.
- [x] Bolsas: registrar, detalle, editar, borrar.
- [x] Tazas: "+1" con deshacer, "Abiertas ahora", catas con detalle.
- [x] Terminar bolsa: hoja de término + aviso "¿Ya terminaste?".
- [x] Visitas a cafeterías: registrar, detalle, editar, borrar.
- [x] Inicio: historial (`history_feed`).
- [ ] Cafés y Cafeterías: grillas, búsqueda full-text, filtros (proceso, tostión, rating, fechas), orden.
- [x] Nube: `db push`, plantilla OTP, desactivar registros.

### Fase 2 — IA (1 fin de semana)
- [ ] Schema Zod compartido; Edge Function con proveedor Claude.
- [ ] Formulario pre-llenado + resaltado de campos inciertos.
- [ ] Tabla `extractions` y registro de cada llamada.

### Fase 3 — Evaluación (1 fin de semana)
- [ ] Dataset de 30–50 fotos etiquetadas.
- [ ] Implementación Gemini detrás de la misma interfaz.
- [ ] Script de eval + comparación de proveedores/prompts; elegir con datos.
- [ ] Vista `extraction_accuracy` (eval online).

### Fase 4 — Calidad y offline
- [ ] Vitest, pgTAP, Playwright; `ci.yml` y `deploy.yml`.
- [ ] Cola offline de capturas (IndexedDB) + caché persistida.
- [ ] Página de estadísticas; exportar JSON/CSV.

### Fase 5 — Infra como código y pulido de portafolio
- [ ] Terraform: proyecto Vercel (env vars, dominio) + configuración Supabase; estado remoto (ej. bucket GCS o Terraform Cloud gratis).
- [ ] Modo demo: usuario demo de solo lectura con `seed.sql` para que reclutadores lo prueben.
- [ ] README en inglés: GIF del flujo, diagrama, tabla de resultados del eval, decisiones y trade-offs.
- [ ] Agregar el proyecto a `school-projects/README.md`, al portafolio y a `career/profile.md`.

---

## 10. Costos

| Servicio | Plan | Costo |
|---|---|---|
| Vercel | Hobby (uso personal, no comercial) | $0 |
| Supabase | Free (DB, 1 GB Storage aprox., Auth, Edge Functions) | $0 — **se pausa tras ~1 semana sin actividad**; con uso diario no pasa, y se reactiva desde el panel |
| GitHub + Actions | Repo público | $0 |
| IA | Gemini nivel gratuito / Claude | $0 / centavos al mes (ver sección 4) |
| Dominio propio | Opcional | Omitir; usar `*.vercel.app` |

Límites de los planes gratuitos cambian: verificar al empezar. Con fotos comprimidas (~200–400 KB), 1 GB alcanza para miles de cafés.

---

## 11. Riesgos

| Riesgo | Mitigación |
|---|---|
| La IA inventa datos | Regla "null si no aparece", confirmación obligatoria, métrica de alucinación en el eval |
| iOS borra datos locales | Supabase como fuente de verdad + exportación manual |
| Supabase pausa el proyecto | Uso diario; si pasa, reactivar; backups vía export y `pg_dump` en CI (opcional) |
| Filtración de la URL de la función → gasto en API | JWT obligatorio + límite diario por usuario + tope de gasto en la consola del proveedor |
| Sobredimensionar y no terminar | Fase 1 primero y usarla; fases 4–5 solo cuando la app ya sea útil |

---

## 12. Qué destacar en CV / entrevista (cuando esté hecho)

- *Built and use daily an offline-capable PWA (React/TypeScript, Supabase/Postgres) that extracts structured coffee data from package photos with a vision LLM.*
- *Designed an evaluation harness comparing Claude vs. Gemini and prompt versions on a hand-labeled dataset (field accuracy, hallucination rate, latency, cost), plus production accuracy tracking from user corrections.*
- *Postgres with row-level security, full-text search (unaccent + trigram), pgTAP tests; CI/CD with GitHub Actions; infrastructure managed with Terraform.*

(Solo agregar métricas reales una vez medidas; nunca inventarlas.)
