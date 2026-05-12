# PROGIO Frontend — Arquitectura + Integración con Backend

> Fuente de verdad funcional: `docs/PROGIO_Alcance_Tecnico_V1_1.md`. Este documento describe cómo se construye el frontend React y cómo se integra con la API FastAPI (`progio-backend/`).
>
> **Diagramas en Mermaid (arquitectura, casos de uso, flujos)**: ver `docs/USE_CASES.md`. Cualquier cambio de flujo crítico debe reflejarse allí en ambos repos.

## Vista general

```
+---------------------------+         HTTPS/JWT          +-------------------+
|  Navegador / Tablet /     | <------------------------> | Backend FastAPI   |
|  Móvil (operario)         |     (vía Nginx 9001)       | (progio-backend)  |
|                           |                            +-------------------+
|  PROGIO Frontend          |
|  React 18 + Vite          |         + LocalStorage:    +-------------------+
|  Nginx (Alpine) en prod   |         - refresh_token    |  PostgreSQL multi |
|                           |         - cola offline     |  Redis            |
+---------------------------+                            |  Celery           |
                                                         |  Siigo (asíncr.)  |
                                                         +-------------------+
```

## Capas de la aplicación

### 1. UI — `src/components/`

- `common/` — primitivos (Button, Card, Modal, Spinner, Toast, Table, Badge, Form fields).
- `auth/` — `LoginForm`, `ProtectedRoute`, `RoleGuard`.
- `services/` — `ServiceCard`, `EventTimeline`, `StateBadge`, `ServiceActionBar`, modales de transición.
- `prebill/` — `PrebillView`, `ItemList`, `Totals`, `RetrySiigoButton`.
- `reports/` — KPIs, charts (librería ligera), filtros, export.
- `dashboard/` — vistas por rol (Operario, Supervisor, Coordinador, Admin).

### 2. Páginas — `src/pages/`

Una por ruta principal: `LoginPage`, `DashboardPage`, `ServicesPage`, `ServiceDetailPage`, `ContractsPage`, `AssetsPage`, `PrebillsPage`, `ReportsPage`, `UsersPage`, `AuditPage`.

### 3. Routing — `src/router/AppRouter.jsx`

- Rutas protegidas con `<ProtectedRoute>` (auth obligatoria).
- Rutas con restricción adicional por rol con `<RoleGuard roles={[...]}>`.
- `lazy` + `<Suspense>` para páginas grandes (Reports, Audit).

### 4. Estado global — `src/context/`

- `AuthContext`:
  - `accessToken` (memoria — NUNCA localStorage).
  - `refreshToken` (localStorage — única excepción).
  - `user` (`{ id, email, full_name, tenant_id, roles[], is_active }`).
  - `login`, `logout`, `refresh`, `validate`.
- `ConnectionContext`:
  - `isOnline` (`navigator.onLine`).
  - `pendingCount` (eventos pendientes de sincronizar).
  - `flush()` (forzar sync).

Sin Redux. Si en V2 se necesita más, se reconsidera.

### 5. Hooks — `src/hooks/`

- `useAuth`, `useRole` (`hasAny`, `hasAll`).
- `useServices`, `useService`, `useEvents` — datos de servicios + timeline con `AbortController` (**implementados** en POC.4.6); `usePrebills`, etc. en roadmap.
- `useTaskStatus(taskId)` para polling de tareas Celery (export, Siigo retry).
- `useOfflineSync()` para captura local + flush al volver online.
- `useToast()` para notificaciones unificadas.

### 6. API — `src/api/`

- `client.js` — Axios + interceptores (request: token; response: auto-refresh 401).
- Un módulo por dominio: `auth.js`, `tenants.js`, `users.js`, `contracts.js`, `sites.js`, `assets.js`, `services.js`, `events.js`, `prebills.js`, `audit.js`, `reports.js`, `tasks.js`.

### 7. Estilos — `src/styles/`

- `tokens.css` — design system (colores, espaciado, tipografía, breakpoints, gradientes).
- `global.css` — reset + estilos base.
- Componentes con `*.module.css` colocalizado.

### 8. i18n — `src/i18n/`

- `es.json` (default V1.1).
- Helper `t(key)` o librería ligera (a decidir; preferir nativo si basta).

## Multi-tenant en la GUI

- El `tenant_id` viene del JWT y vive en `AuthContext`.
- La UI **nunca** envía `tenant_id` en queries/body — el backend lo deriva del JWT.
- Si el usuario es `admin_general` super-admin y debe operar en otro tenant, se hace via re-login o refresh con un nuevo `tenant_id`.

## RBAC en la GUI

Detalle: `.cursor/rules/multitenant-rbac.mdc`. Resumen:

- `useRole()` y `<RoleGuard>` para mostrar/ocultar acciones, columnas y campos sensibles.
- Datos sensibles (precios, márgenes, financieros): UI los oculta para `operario` y otros roles sin acceso, además del filtrado en backend.

## Eventos inmutables — UX

Detalle: `.cursor/rules/audit-events.mdc`. Resumen:

- `EventTimeline` es read-only.
- No hay botones de "editar" o "borrar" eventos.
- "Reproceso" es la única corrección, con motivo obligatorio.

## Operación offline

Detalle: `.cursor/rules/offline-localstorage.mdc`. Resumen:

- `ConnectionContext` con `navigator.onLine` + listeners.
- Cola en `localStorage` (clave `progio_offline_queue`) con `client_event_id` (UUID).
- `useOfflineSync()` hace flush al volver online (`POST /api/v1/services/{id}/events/sync`).
- Eventos soportados: Inicio, Pausa, Reanudación, Registro de insumos, Cierre.
- No disponibles offline: reportes, dashboards, indicadores financieros.

## Latencia y performance

Detalle: `.cursor/rules/performance.mdc` y `memory/feedback_low_latency_first.md`. Reglas:

- **<1 s carga de página** en local.
- **<2 s endpoint** consumido.
- Polling siempre con `AbortController` + `fetchingRef`.
- Llamadas múltiples en paralelo con `Promise.all`.
- Bundle inicial **<200 KB gzip** (objetivo orientativo).
- Lazy loading de páginas grandes (Reports, Audit).
- Si una solución empeora la latencia, se descarta y se busca otra.

## Integración con el backend

### Auth flow

```
LoginPage
  └─ POST /api/v1/auth/login → { access_token, refresh_token, user }
        │
        ├─ accessToken en AuthContext (memoria)
        ├─ refreshToken en localStorage
        ├─ user en AuthContext
        └─ navigate(/dashboard)

Cualquier request → Authorization: Bearer <accessToken>

401 → interceptor:
  └─ POST /api/v1/auth/refresh → nuevo access (y rotación de refresh)
        ├─ OK: reintenta la request original
        └─ FAIL: limpia tokens + redirige a /login

App init (useEffect en App.jsx):
  └─ GET /api/v1/auth/validate
        ├─ valid: hidrata user en AuthContext
        └─ invalid: redirige a /login
```

### CORS

El backend permite los orígenes definidos en `CORS_ORIGINS` (`progio-backend/.env`). En desarrollo: `http://localhost:3300`. En producción: la URL real del frontend.

### Polling de tareas Celery

Para operaciones largas (export reportes, retry Siigo):

```
POST /api/v1/reports/export → { task_id }
        │
        └─ useTaskStatus(task_id):
              setInterval(VITE_POLLING_INTERVAL_MS):
                GET /api/v1/tasks/{task_id}
                  ├─ PENDING/STARTED/RETRY → continuar polling
                  ├─ SUCCESS → mostrar URL de descarga firmada
                  └─ FAILURE → toast con detalle
              cleanup: AbortController + fetchingRef + clearInterval
```

### Sincronización offline

```
Operario en /services/{id} (offline):
  └─ Click "Pausar"
        ├─ recordEventLocally(serviceId, "pausa", payload)
        ├─ Toast: "Evento guardado localmente, se sincronizará al volver online"
        └─ UI muestra estado optimista (En Espera) — nota: confirmar política con usuario

Vuelta online (evento `online` o intervalo):
  └─ useOfflineSync.flush():
        └─ POST /api/v1/services/{id}/events/sync (lote agrupado por service)
              ├─ accepted[] → eliminar de la cola
              └─ rejected[] → mostrar al usuario y marcar para reproceso
```

## Despliegue

- **Local**: `docker compose up --build -d` o `npm run dev`.
- **Producción**: imagen multi-stage (Node build → Nginx serve). Nginx termina TLS si aplica, sirve `dist/` y hace `try_files` para SPA.
- **Variables `VITE_*`**: incrustadas en build time → cambio requiere rebuild.
- **Multi-entorno**: mismo `docker-compose.yml`; cambia sólo `.env`.

Detalle: `docs/DEPLOYMENT.md`.
