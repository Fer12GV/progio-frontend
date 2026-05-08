# PROGIO Frontend — Catálogo de Componentes (objetivo)

Este documento es la guía de los componentes a construir en el frontend, agrupados por dominio. Se completa a medida que avanzan las fases del `DEVPLAN.md`.

## Convenciones

- Componentes funcionales con hooks; un componente default por archivo.
- Nombres `PascalCase.jsx`; CSS `PascalCase.module.css` colocalizado.
- Props con destructuring + JSDoc para props no obvias.
- Sin estilos inline (excepto valores dinámicos).
- Tamaño orientativo: ~150 líneas — dividir si crece.

## Comunes (`src/components/common/`)

| Componente | Props clave | Notas |
|-----------|-------------|-------|
| `Button` | `variant`, `size`, `loading`, `disabled`, `onClick` | Variantes: `primary`, `secondary`, `danger`, `ghost`, `link` |
| `Card` | `title`, `actions`, `children` | Estructura base de tarjetas |
| `Modal` | `isOpen`, `onClose`, `title`, `size` | Focus trap + cerrar con ESC |
| `Spinner` | `size`, `color` | Para loading states |
| `Toast` | hook `useToast()` | Sistema centralizado |
| `Alert` | `variant`, `dismissible` | Info / success / warning / error |
| `Badge` | `variant`, `children` | Estados, roles, contadores |
| `Input`, `Textarea`, `Select`, `Checkbox`, `Radio` | `name`, `label`, `error`, `hint` | Form fields con a11y |
| `Table` | `columns`, `rows`, `onRowClick`, `loading`, `empty` | Paginación + ordenación opcional |
| `Pagination` | `page`, `perPage`, `total`, `onChange` | Estándar |
| `EmptyState` | `icon`, `title`, `description`, `action` | Para listas vacías |
| `ConfirmDialog` | `title`, `message`, `confirmLabel`, `onConfirm` | Para acciones destructivas |

## Layout (`src/components/layout/`)

| Componente | Notas |
|-----------|--------|
| `AppLayout` | Shell con sidebar colapsable (desktop), drawer móvil (`matchMedia` ≤767px), `Outlet`, nav + **Salir**. |

## Auth (`src/components/auth/`)

- `LoginForm` — formulario email + password + manejo 423 (bloqueo).
- `ProtectedRoute` — wrapper que redirige a `/login` si no hay sesión — **implementado** (`src/components/auth/ProtectedRoute.jsx`).
- `RoleGuard` — render condicional por rol — **implementado** (`src/components/auth/RoleGuard.jsx`); `useRole` en `src/hooks/useRole.js`.

## Dashboard (`src/components/dashboard/`)

- `DashboardOperario` — vista mobile-first con servicios asignados + acciones rápidas.
- `DashboardSupervisor` — servicios bajo supervisión + alertas de calidad.
- `DashboardCoordinador` — turnos + productividad + servicios activos en tiempo real (polling).
- `DashboardAdmin` — KPIs generales + accesos a gestión.

## Servicios (`src/components/services/`)

- `ServiceCard` — tarjeta resumida (estado, asset, operador, contrato).
- `ServiceList` — lista paginada con filtros.
- `ServiceFilters` — fecha, estado, contrato, asset, operador.
- `EventTimeline` — línea de tiempo read-only de eventos del servicio.
- `StateBadge` — badge con color por estado (Pendiente, En Proceso, En Espera, Finalizado, Cancelado, Reprocesado, Bloqueado).
- `ServiceActionBar` — botones de acción según estado + RBAC.
- `AssignOperatorModal` — asignar operador.
- `RegisterInputsModal` — registrar insumos (volumen, costes).
- `SupervisionModal` — registrar supervisión.
- `ReprocessModal` — reproceso con motivo obligatorio.
- `CloseServiceConfirm` — confirma cierre tras validar prefactura.

## Activos (`src/components/assets/`)

- `AssetCard`, `AssetList`, `AssetForm`, `AssetFilters`.

## Contratos (`src/components/contracts/`)

- `ContractCard`, `ContractList`, `ContractForm`, `ContractQuotaWidget` (visualiza cupo restante).

## Sedes (`src/components/sites/`)

- `SiteCard`, `SiteList`, `SiteForm`.

## Usuarios (`src/components/users/`)

- `UserCard`, `UserList`, `UserForm` (con selección de roles), `RoleSelector`.

## Tenants (`src/components/tenants/`) — sólo super-admin

- `TenantList`, `TenantForm`.

## Prefacturación (`src/components/prebill/`)

- `PrebillView` — vista detallada de la prefactura asociada al servicio.
- `PrebillItemList` — items con cantidad, costo unitario (visible según rol).
- `Totals` — total de la prefactura (visible según rol).
- `RetrySiigoButton` — admin only.
- `PrebillStatusBadge` — `draft|valid|sent|confirmed|failed`.

## Reportes (`src/components/reports/`)

- `KpiCard` — KPI individual con valor + delta.
- `EnvironmentalReport` — huella hídrica + CO2 + benchmark.
- `EconomicReport` — margen, costes imputados, productividad (RBAC sensible).
- `ReportFilters` — fecha, contrato, cliente, sede, tipo vehículo.
- `ExportButton` — encolar export y mostrar progreso/descarga.
- `ChartLine`, `ChartBar` — wrappers ligeros sobre la librería elegida (a definir).

## Auditoría (`src/components/audit/`)

- `AuditFilters` — usuario, entidad, fechas.
- `AuditTable` — read-only.

## Conexión / Offline (`src/components/connection/`)

- `OfflineBanner` — banner superior cuando `!isOnline`.
- `OfflineQueueIndicator` — contador discreto de eventos pendientes.

## Layouts

- `AppLayout` — layout principal con NavBar lateral (desktop) / drawer (móvil).
- `OperarioLayout` — layout simplificado mobile-first para `operario`.
- `AuthLayout` — layout sin NavBar para `/login`.

## Notas

- Los componentes de **dashboards** y **reportes** son los más sensibles a latencia — aplicar `React.memo` + `useMemo` y, si se renderizan listas largas, considerar virtualización.
- El **Panel del Operario** debe priorizar tap targets grandes, tipografía legible, contraste alto y carga ultrarrápida (incluso offline).
- Los modales de acciones del servicio deben validar campos obligatorios y mostrar errores claros del backend (`detail`).
