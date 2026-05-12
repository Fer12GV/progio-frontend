# Instrucciones para agentes (Cursor / IA) — PROGIO Frontend

Este archivo es el **ancla de arranque** del proyecto. Equivale en espíritu al flujo `/continuar` de Claude Code y se complementa con las reglas `.cursor/rules/*.mdc` (capa 1), los documentos en `docs/` (capa 2) y `memory/` (capa 3).

**No sustituye** leer el plan ni el estado local; obliga a **hacerlo en orden**.

## Puertos en el host (no adivinar)

Antes de fijar `FRONTEND_PORT` o asumir `VITE_API_BASE_URL`, comprobar que los puertos **no estén en uso** en el host (muchos proyectos en la misma máquina):

```bash
ss -tlnH 'sport = :3300'
ss -tlnH 'sport = :9001'
```

Sin salida = libre. Si `LISTEN`, elegir otro puerto y actualizar `.env` del frontend y `NGINX_HTTP_PORT` / `CORS_ORIGINS` en el backend.

## URLs en desarrollo local (no confundir puertos)

> **Verificar siempre desde `.env` antes de afirmar.** Valores típicos:

| Qué | URL | Puerto |
|-----|-----|--------|
| **Frontend (esta GUI)** | http://localhost:3300/ | 3300 (`FRONTEND_PORT`) |
| **Backend (API; mismo valor que `VITE_API_BASE_URL`)** | http://localhost:9001/ | 9001 (`NGINX_HTTP_PORT` del backend) |

**No** configurar la API del navegador con **:8000**: es puerto **interno** del contenedor FastAPI; hacia fuera el backend usa **9001** vía nginx. Confirmar con `progio-frontend/.env*` y `progio-backend/.env*`.

## Retomar sesión (`/continuar`)

El comando **`/continuar`** (y seguir este `AGENTS.md` en orden) deja el contexto **al día** siempre que existan y se lean los archivos locales: **`CLAUDE.md`**, **`docs/DEVPLAN.md`** (marca **«AQUÍ ESTAMOS»**), **`memory/MEMORY.md`**, **`.env` / `.env.example`**. No depende del chat anterior: el modelo debe **abrir** esas rutas, no asumir.

- **Backend hermano** (`progio-backend/`): auth **`/api/v1/auth/*`** (POC.2 ✓); catálogo **`GET /api/v1/contracts`**, **`/sites`**, **`/assets`** paginados (POC.3 ✓). Siguiente trabajo backend planificado: **POC.4** (servicios/eventos); **no** es prerequisito para seguir el frontend en modo demo incremental.
- **Este repo:** `npm install`, `.env.example` → `.env`, `npm run dev`, login con seed del backend (`admin.general@…` + `SEED_DEMO_PASSWORD` si `SEED_EMAIL_DOMAIN=example.com`).
- **Siguiente en este repo** (prioridad **demo navegable por slices**, ver `docs/DEVPLAN.md`): **POC.5.1** (**AQUÍ ESTAMOS** — `prebills.js` / API prefactura). Hooks **POC.4.6** ya en `ServicesPage` / `ServiceDetailPage`; **[BACKEND]** POC.4 para transiciones reales.

## Cuándo aplicar

- **Chat nuevo** o tarea que no sea un cambio trivial de una línea.
- Cuando el usuario escriba: *«Sigue AGENTS.md»*, *«continúa el plan»*, *«¿dónde quedamos?»* o **`/continuar`**.

## Cómo empezar el chat en Cursor (emula `/continuar`)

**Abre siempre el workspace con la raíz en** `progio-frontend/` (esta carpeta), para que `.cursor/rules` y rutas relativas coincidan.

### Opción A — Recomendada (una línea)

Pega en el **primer mensaje** de un chat nuevo:

```text
Continúa el proyecto siguiendo AGENTS.md y el skill .cursor/skills/continuar/SKILL.md: lee los archivos indicados (incl. AQUÍ ESTAMOS en docs/DEVPLAN.md y los .env reales), resume en español el estado y la siguiente tarea del plan, y pregunta si seguimos con esa tarea.
```

### Opción B — Con @ (refuerzo)

1. En el composer/agente, escribe `@AGENTS.md` y elige el archivo del repo.
2. En la misma línea o debajo: *«Ejecuta el protocolo de continuar; no especules sobre puertos ni URLs.»*

### Opción C — Mensaje corto

```text
/continuar — aplica AGENTS.md y confirma el punto del plan con AQUÍ ESTAMOS.
```

(Las reglas `.mdc` con `alwaysApply: true` + este texto disparan el protocolo equivalente, aunque el modelo no tenga un comando nativo `/continuar`.)

### Después del primer mensaje

Cuando ya tengas el resumen y confirmes la tarea, escribe concretamente qué quieres (ej. *«Implementa la fase 4.X: …»*) para que el siguiente paso sea accionable.

## Para humanos: para qué sirve este archivo

En un **chat nuevo**, el modelo no tiene memoria de sesiones anteriores. Este archivo define **en qué orden** debe cargar el contexto del repo para:

- Conocer **alcance**, **plan**, **arquitectura**, **reglas** y **memoria**.
- Saber **exactamente** en qué tarea continuar (marcador en `docs/DEVPLAN.md`).
- **No especular** sobre puertos, URLs ni configuración (leyendo `.env` y código real).

No reemplaza el contenido de `CLAUDE.md`, `docs/` ni `memory/`; **ordena** la lectura de esos archivos.

## Obligatorio al iniciar una conversación nueva o retomar trabajo

1. **Este archivo (`AGENTS.md`)** define el protocolo; a continuación leer en orden:
2. **`CLAUDE.md`** (raíz): stack, convenciones, API consumida, bloque «Estado Actual del Proyecto» al final.
3. **`docs/PROGIO_Alcance_Tecnico_V1_1.md`**: alcance contractual de PROGIO V1.1 (multi-tenant, eventos, RBAC, offline, métricas, reportes).
4. **`docs/SCOPE.md`**: alcance del frontend traducido a fases técnicas y qué queda fuera.
5. **`docs/DEVPLAN.md`**: localizar **`### AQUÍ ESTAMOS`** y las tareas `[ ]` pendientes.
6. **`docs/ARCHITECTURE.md`**: arquitectura del frontend + integración con el backend.
7. **`docs/API_INTEGRATION.md`**: endpoints consumidos (sincronizado con backend).
8. **`memory/MEMORY.md`** y los fragmentos enlazados (`memory/*.md`) que apliquen (bugs, features, feedback, decisiones).
9. **Archivos reales** antes de afirmar datos técnicos:
   - `.env` y `.env.example` **de este repo** (raíz `progio-frontend/`).
   - Si el cambio afecta al API: `.env` del backend en `progio-backend/`.
10. Reglas por área: **`.cursor/rules/*.mdc`** (`architecture`, `react`, `performance`, `environment`, `docker`, `multitenant-rbac`, `offline-localstorage`, `audit-events`, `project-memory`, `continuar-bootstrap`, `agents-bootstrap`).

## Reglas que no se pueden violar

- **No especular**: puertos, URLs y variables → sólo después de leer `.env` / `docker-compose` / código.
- **Latencia profesional**: cada página debe cargar en **<1 s** en local con datos normales; cada endpoint **<2 s**. Si una solución empeora la latencia, **descártala** y busca otra. Detalle: `.cursor/rules/performance.mdc` y `memory/feedback_low_latency_first.md`.
- **Polling seguro**: `AbortController` + `fetchingRef` siempre.
- **Definition of done**: si una tarea cierra trabajo compartido con el backend, actualizar estado en **ambos** repositorios (ver `memory/feedback_update_both_projects.md`).
- **Tras cambios**: como mínimo `npm run lint` y `npm run build`; si aplica, Docker y curl de endpoints (ver `memory/feedback_mandatory_testing.md`).
- **Multi-tenant**: el frontend nunca envía `tenant_id` libre; siempre se lee del JWT (claim).
- **Eventos inmutables**: la GUI no permite editar/borrar eventos pasados; sólo permite reproceso.
- **Datos sensibles** (precios, márgenes): respetar visibilidad por rol; no asumir que el backend filtra todo — la GUI también debe ocultar lo que el rol no debe ver.

## Atajos equivalentes

- Comando Cursor: **`/continuar`** → `.cursor/commands/continuar.md`.
- Comando Cursor: **`/cierre`** → `.cursor/commands/cierre.md` (sincroniza las 3 capas en backend **y** frontend).
- Skills: `.cursor/skills/continuar/SKILL.md` y `.cursor/skills/cierre/SKILL.md`.

## Backend hermano

API FastAPI (no está en este repo): `/home/fernando/Escritorio/PROJECTS/CARLOS/INVERJAM SAS/progio-backend/`.

Cuando una tarea afecte la integración (consumo de endpoint nuevo, cambio de schema, fase compartida, bug cruzado), **debes actualizar el estado y la memoria de ambos repositorios**. Detalle: `memory/feedback_update_both_projects.md`.
