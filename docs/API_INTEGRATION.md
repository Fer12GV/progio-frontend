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
| POST | `/auth/login` | `{ email, password, tenant_slug? }` → tokens + `user`. `email` = correo **completo** (p. ej. seed `admin.general@example.com`). `tenant_slug` opcional (default en servidor, p. ej. `inverjam`). |
| POST | `/auth/refresh` | `{refresh_token}` → mismos campos |
| POST | `/auth/logout` | Invalida refresh en server |
| GET | `/auth/me` | Perfil del usuario autenticado |
| GET | `/auth/validate` | `{valid, user?, detail?}` para hidratar al cargar la app |

**Usuarios seed (POC):** el admin usa **`EMAIL_USERNAME`** en el backend (correo completo o local + `SEED_EMAIL_DOMAIN`); el resto son `{local}@{SEED_EMAIL_DOMAIN}`. Contraseña: **`SEED_DEMO_PASSWORD`** (sólo backend). En el frontend, **`VITE_LOGIN_EMAIL`** puede rellenar el correo en `/login`; **nunca** pongas la contraseña en `VITE_*` (el bundle es público). Ver `progio-backend/memory/bug_seed_email_domain.md` si hay 422 por dominio mal formado.

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

**Frontend:** `src/api/contracts.js` (`listContracts`), `src/api/assets.js` (`listAssets`), `src/api/users.js` (`listUsers` para modales de servicio). `GET /sites` puede añadirse como `src/api/sites.js` cuando haga falta en UI.

## Servicios + Eventos (núcleo)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/services` | Listar (filtros: status, asset_id, contract_id, site_id, fechas). **Roadmap:** query `operator_id` / `assigned_to` para «mis servicios» server-side; la GUI (`OperatorPanelPage`) filtra en cliente con `getServiceOperatorId` hasta entonces. |
| POST | `/services` | Crear (Pendiente) |
| GET | `/services/{id}` | Detalle (incluye `events[]` y `prebill?`) |
| POST | `/services/{id}/assign` | Asignar operador — body: `{ "assigned_user_id": "<uuid>" }` |
| POST | `/services/{id}/start` | Iniciar (Pendiente → En Proceso) |
| POST | `/services/{id}/pause` | Pausar (En Proceso → En Espera) |
| POST | `/services/{id}/resume` | Reanudar (En Espera → En Proceso) |
| POST | `/services/{id}/inputs` | Registrar insumos — body POC GUI: `{ "items": [{ "description", "quantity", "unit" }] }` (ajustar al contrato definitivo) |
| POST | `/services/{id}/supervise` | Supervisión |
| POST | `/services/{id}/close` | Cerrar (En Proceso → Finalizado, **requiere prefactura válida**) |
| POST | `/services/{id}/cancel` | Cancelar |
| POST | `/services/{id}/reprocess` | Reproceso (con motivo obligatorio) |
| GET | `/services/{id}/events` | Eventos del servicio (read-only, inmutables) |
| POST | `/services/{id}/events/sync` | **Sincronización offline** (lote con `client_event_id`) |

**Estado API (2026-05-12):** el backend ya expone estas rutas (prefijo `/api/v1` en `VITE_API_PREFIX`). **`close`** puede responder **422** mientras no exista **`prebill_id`** en servidor (**POC.5** backend). Cuerpos **`inputs`** / **`supervise`**: JSON flexible según OpenAPI.

**Frontend:** `src/api/services.js`, `src/api/events.js`, `src/api/users.js` (`listUsers`). Hooks: `useServices`, `useService`, `useEvents`. UI: `ServicesPage`, `ServiceDetailPage` + `EventTimeline.jsx` + `ServiceActionBar.jsx` + modales (`AssignOperatorModal`, `RegisterInputsModal`, `CancelModal`, `ReprocessModal`) + `common/Modal.jsx`.

**Errores típicos:**

- **409 Conflict** — transición no permitida → `<ServiceActionBar>` debe mostrar sólo acciones válidas.
- **422 Unprocessable Entity** — cupo excedido, payload inválido.
- **403 Forbidden** — RBAC.

## Prefacturación

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/services/{id}/prebill` | Prefactura del servicio (si el backend la expone; p. ej. POC.5); si no existe, la GUI usa `GET /services/{id}` + `GET /prebills/{prebill_id}` vía `getPrebillByService` |
| GET | `/prebills` | Listar |
| GET | `/prebills/{id}` | Detalle |
| POST | `/prebills/{id}/retry-siigo` | Reintento manual (admin) |

**Frontend:** `src/api/prebills.js` — `listPrebills`, `getPrebill`, **`getPrebillByService(serviceId)`**, `retryPrebillSiigo`.

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
