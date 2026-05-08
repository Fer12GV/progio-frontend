# PROGIO — Endpoints consumidos por el Frontend

> Mantener sincronizado con `progio-backend/docs/API_INTEGRATION.md`. Cualquier cambio en el contrato debe replicarse aquí (regla `feedback_update_both_projects.md`).

## Convenciones (recordatorio)

- **Base URL**: `import.meta.env.VITE_API_BASE_URL` (en este proyecto: `http://localhost:9001`).
- **Prefijo**: `import.meta.env.VITE_API_PREFIX` (típicamente `/api/v1`).
- **Auth**: `Authorization: Bearer <access_token>` — el `apiClient` recibe el header vía interceptor de petición en `AuthContext` cuando hay sesión (no enviar `tenant_id` en query/body).
- **Error format**: `{ detail: string }`.
- **Paginación**: `{ items, total, page, per_page }`.
- **Timestamps**: ISO 8601 UTC.
- **IDs**: UUID v4.

## Autenticación

| Método | Ruta | Notas |
|--------|------|-------|
| POST | `/auth/login` | `{email, password}` → `{access_token, refresh_token, user: {id, email, full_name, tenant_id, roles[], is_active}}` |
| POST | `/auth/refresh` | `{refresh_token}` → mismos campos |
| POST | `/auth/logout` | Invalida refresh en server |
| GET | `/auth/me` | Perfil del usuario autenticado |
| GET | `/auth/validate` | `{valid, user?, detail?}` para hidratar al cargar la app |

**Usuarios seed (POC):** mismos correos y `SEED_DEMO_PASSWORD` que documenta el backend; patrón `{local}@{SEED_EMAIL_DOMAIN}` donde **`SEED_EMAIL_DOMAIN` es solo el dominio** (sin `@`, ej. `example.com`). Ver `progio-backend/memory/bug_seed_email_domain.md` si hay 422 en login.

**Errores típicos:** 401 (credenciales inválidas), 423 (cuenta bloqueada), 422 (payload inválido).

## Gestión

| Dominio | Endpoints principales |
|---------|----------------------|
| **Tenants** (super-admin) | `GET/POST/GET{id}/PATCH{id} /tenants` |
| **Users** | `GET/POST/GET{id}/PATCH{id}/DELETE{id} /users` (filtros: search, role, is_active, page, per_page) |
| **Contracts** | `GET /contracts` (lista paginada POC.3); `POST/GET/PATCH…` en roadmap |
| **Sites** | `GET /sites` (lista + filtro `contract_id`); resto en roadmap |
| **Assets** | `GET /assets` (filtros: `contract_id`, `vehicle_type`, `fuel_type`) — POST/PATCH/detalle en roadmap |

## Catálogo (POC.3)

El backend expone listados paginados: `GET /contracts`, `GET /sites`, `GET /assets` con `page` y `per_page`. Filtros opcionales: en `sites` → `contract_id`; en `assets` → `contract_id`, `vehicle_type`, `fuel_type`. Alta/edición/detalle por id aún no disponibles en API.

**Frontend:** `src/api/contracts.js` (`listContracts`), `src/api/assets.js` (`listAssets`). `GET /sites` puede añadirse como `src/api/sites.js` cuando haga falta en UI.

## Servicios + Eventos (núcleo)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/services` | Listar (filtros: status, asset_id, contract_id, site_id, fechas) |
| POST | `/services` | Crear (Pendiente) |
| GET | `/services/{id}` | Detalle (incluye `events[]` y `prebill?`) |
| POST | `/services/{id}/assign` | Asignar operador |
| POST | `/services/{id}/start` | Iniciar (Pendiente → En Proceso) |
| POST | `/services/{id}/pause` | Pausar (En Proceso → En Espera) |
| POST | `/services/{id}/resume` | Reanudar (En Espera → En Proceso) |
| POST | `/services/{id}/inputs` | Registrar insumos |
| POST | `/services/{id}/supervise` | Supervisión |
| POST | `/services/{id}/close` | Cerrar (En Proceso → Finalizado, **requiere prefactura válida**) |
| POST | `/services/{id}/cancel` | Cancelar |
| POST | `/services/{id}/reprocess` | Reproceso (con motivo obligatorio) |
| GET | `/services/{id}/events` | Eventos del servicio (read-only, inmutables) |
| POST | `/services/{id}/events/sync` | **Sincronización offline** (lote con `client_event_id`) |

**Frontend:** `src/api/services.js`, `src/api/events.js` (`listServiceEvents`, `syncServiceEvents`). UI: `ServicesPage` (lista), `ServiceDetailPage` + `components/services/EventTimeline.jsx` (detalle + eventos inmutables).

**Errores típicos:**

- **409 Conflict** — transición no permitida → `<ServiceActionBar>` debe mostrar sólo acciones válidas.
- **422 Unprocessable Entity** — cupo excedido, payload inválido.
- **403 Forbidden** — RBAC.

## Prefacturación

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/prebills` | Listar |
| GET | `/prebills/{id}` | Detalle |
| POST | `/prebills/{id}/retry-siigo` | Reintento manual (admin) |

## Auditoría (read-only)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/audit` | Listado paginado con filtros (user_id, entity, fechas) |

## Reportes

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/reports/kpis` | KPIs operativos |
| GET | `/reports/environmental` | Huella hídrica + CO2 + benchmark |
| GET | `/reports/economic` | Margen, costes, productividad |
| POST | `/reports/export` | Encolar export PDF/Excel → `{task_id}` |
| GET | `/reports/export/{task_id}` | Estado + URL firmada |

## Tareas async

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/tasks/{task_id}` | Estado Celery (`PENDING/STARTED/SUCCESS/FAILURE/RETRY`) — usar con `useTaskStatus` |

## Health

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | `{status: "ok"}` (sin auth) |

## Códigos HTTP esperados (manejo en el frontend)

| Código | Manejo |
|--------|--------|
| 200 / 201 / 202 / 204 | OK |
| 400 | Toast con `detail` |
| 401 | Interceptor intenta refresh → si falla, redirect a `/login` |
| 403 | Toast "Sin permisos para esta acción" |
| 404 | Toast o pantalla "No encontrado" |
| 409 | Toast con `detail` (transición no permitida, duplicado) |
| 422 | Errores de formulario inline (Pydantic detail puede ser estructurado) |
| 423 | LoginForm muestra mensaje de cuenta bloqueada |
| 429 | Toast "Demasiados intentos, espera unos segundos" |
| 5xx | Toast genérico + reintento manual |

## Reglas para el frontend

1. **NUNCA** enviar `tenant_id` en query/body.
2. **NUNCA** llamar `axios` directamente desde componentes — siempre vía `src/api/<dominio>.js`.
3. **SIEMPRE** soportar `signal` en hooks que hagan polling.
4. **NUNCA** hardcodear la URL del backend (usar `import.meta.env.VITE_API_BASE_URL`).
5. Tras introducir un endpoint nuevo: medir latencia con `curl` y actualizar este archivo + el del backend.

## Cambios en el contrato → checklist

1. Actualizar este archivo.
2. Actualizar `progio-backend/docs/API_INTEGRATION.md`.
3. Actualizar el módulo `src/api/<dominio>.js`.
4. Actualizar componentes consumidores.
5. `npm run lint` + `npm run build` + medir latencia.
6. Actualizar `docs/DEVPLAN.md` y memoria (`memory/feedback_update_both_projects.md`).
