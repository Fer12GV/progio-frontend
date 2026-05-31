# Demo comercial PROGIO — Guía por objetivos (cliente)

> **Uso:** ensayo y presentación. **No avances** al siguiente objetivo hasta cumplir **todos** los criterios de aceptación del actual. Si algo falla, corrígelo (bug o datos) y **reinicia ese objetivo desde el paso 1**.

**Duración orientativa:** 25–35 minutos (5 objetivos + cierre).

**Qué es esta versión:** **POC demostrable** (no el producto V1.1 completo). Lo que sí está listo para mostrar: login multi-rol, ciclo de servicio, eventos inmutables, prefactura mock, RBAC (operario sin precios), panel operario móvil.

**Qué NO prometas en esta demo:** reportes/KPIs, pantallas de contratos/activos completas, auditoría en GUI, operación offline, integración Siigo real, crear tenants desde UI.

---

## Reglas del ensayo (obligatorias)

1. **Un objetivo a la vez.** Termina y marca ✓ antes de seguir.
2. **Un paso a la vez** dentro del objetivo. Si el paso actual falla, no hagas el siguiente.
3. **Si hay bug o mejora necesaria:** detén la demo, anótalo, arregla en código, vuelve al **paso 1 del objetivo** afectado.
4. **Antes de cada ensayo importante:** reinicia datos (ver § Preparación).

---

## Preparación (30 min antes de la reunión)

### Terminal A — Backend

```bash
cd progio-backend
make demo          # stack + seed (rápido si ya tienes volúmenes)
# O, si la demo anterior dejó datos incoherentes:
# make demo-fresh  # borra volúmenes DB y vuelve a sembrar (más lento, más limpio)
```

### Terminal B — Frontend

```bash
cd progio-frontend
make dev           # http://localhost:3300 — dejar terminal abierta
# Alternativa sin Vite: make up
```

### Comprobación

```bash
cd progio-frontend
make demo-check    # debe mostrar OK API y OK GUI
```

### Credenciales (lee tu `progio-backend/.env`)

| Rol | Correo (patrón) | Contraseña |
|-----|-------------------|------------|
| **Admin general** | Valor de `EMAIL_USERNAME` (ej. `tu-correo@gmail.com`) | `SEED_DEMO_PASSWORD` |
| **Operario** | `operario@{SEED_EMAIL_DOMAIN}` | misma contraseña |
| **Admin contrato** | `admin.contrato@{SEED_EMAIL_DOMAIN}` | misma |
| **Coordinador** | `coordinador@{SEED_EMAIL_DOMAIN}` | misma |
| **Supervisor** | `supervisor@{SEED_EMAIL_DOMAIN}` | misma |

**Mensaje al cliente:** «Cada usuario ve solo lo que su rol permite; el tenant viene en el token, no se elige a mano en cada pantalla.»

---

## Mensaje de valor (30 segundos de apertura)

«PROGIO conecta la operación en campo con el control administrativo y la prefactura: cada acción queda en una **línea de tiempo que no se borra ni se edita**; si hay corrección, se registra un **reproceso**. Hoy verán el flujo completo: planificar → ejecutar en campo → cerrar con prefactura válida → revisar como administración.»

---

# OBJETIVO 0 — La plataforma responde

**Historia de usuario:** Como responsable de TI quiero confirmar que la solución está viva antes de mostrar procesos de negocio.

| Paso | Acción | Qué debe pasar |
|------|--------|----------------|
| 0.1 | Abrir `http://localhost:3300/` | Pantalla de login PROGIO (no «conexión rechazada»). |
| 0.2 | Abrir DevTools → pestaña Red (opcional) | Sin errores rojos masivos al cargar. |
| 0.3 | `curl -s http://localhost:9001/health` (terminal) | JSON con `"status":"ok"`. |

### Criterios de aceptación (todos ✓ para pasar)

- [ ] GUI carga en menos de ~2 s percibidos.
- [ ] API `/health` OK.
- [ ] Sabes qué comando levanta GUI si se cae (`make dev`).

**Si falla:** `ERR_CONNECTION_REFUSED` → ejecuta `make dev` en frontend. API caída → `make demo` en backend.

---

# OBJETIVO 1 — Acceso seguro y perfiles (RBAC entrada)

**Historia de usuario:** Como empresa multi-rol necesito que cada persona entre con su identidad y vea solo su espacio.

| Paso | Acción | Qué debe pasar |
|------|--------|----------------|
| 1.1 | Login como **admin general** | Entra al panel; nombre y roles visibles. |
| 1.2 | Menú lateral | Ves **Inicio** y **Servicios** (y no «Panel operario»). |
| 1.3 | Tarjeta «Tu perfil» / badges | Aparece rol administrador. |
| 1.4 | **Salir** | Vuelve a login. |
| 1.5 | Login como **operario** | Entra; en menú aparece **Panel operario**. |
| 1.6 | Intentar ir a `/services` como operario | Puede ver servicios asignados (OK); anota si algo administrativo se cuela. |
| 1.7 | **Salir** | Vuelve a login. |

### Criterios de aceptación

- [ ] Dos logins distintos funcionan sin error 401/422.
- [ ] Menú distinto entre admin y operario.
- [ ] Logout limpia sesión (no quedas «logueado» al volver a `/login`).

**Mensaje al cliente:** «El mismo sistema, distintas capacidades según el rol — sin cuentas compartidas.»

---

# OBJETIVO 2 — Planificación: preparar el trabajo (administrador)

**Historia de usuario:** Como administrador de contrato asigno un operario a un servicio pendiente sobre un activo del cliente.

**Datos:** activo demo placa **ABC123** (seed) o cualquier activo al crear servicio nuevo.

| Paso | Acción | Qué debe pasar |
|------|--------|----------------|
| 2.1 | Login **admin general** | Panel cargado. |
| 2.2 | Ir a **Servicios** | Tabla con al menos un registro (o lista vacía si acabas de resetear). |
| 2.3a | **Opción A (recomendada si ya hiciste la demo antes):** pulsar **Nuevo servicio (demo)** | Crea servicio en **pendiente** y abre su detalle. |
| 2.3b | **Opción B (primera vez / tras `make demo-fresh`):** filtro estado **Pendiente**, abrir servicio seed `…000001` (activo ABC123) | Detalle con estado pendiente, sin operario. |
| 2.4 | **Asignar operador** → elegir **operario** en la lista (no UUID manual) | Toast éxito; operario queda asignado. |
| 2.5 | Revisar **línea de tiempo** | Aparece evento de asignación; **no** hay botones editar/borrar eventos. |
| 2.6 | **Salir** | Login cerrado. |

### Criterios de aceptación

- [ ] Lista de operadores carga (no solo «introducir UUID»).
- [ ] Asignación guardada sin error.
- [ ] Timeline solo lectura.
- [ ] Servicio sigue en **pendiente** (aún no iniciado en campo).

**Si falla lista de usuarios:** backend debe exponer `GET /users` (recreate `api` tras actualizar). **Si 409:** lee el mensaje; no fuerces transiciones.

---

# OBJETIVO 3 — Ejecución en campo (operario, móvil)

**Historia de usuario:** Como operario inicio el servicio, registro insumos y preparo el cierre con trazabilidad.

| Paso | Acción | Qué debe pasar |
|------|--------|----------------|
| 3.1 | Login **operario** | Panel operario accesible. |
| 3.2 | **Panel operario** o detalle del **mismo servicio** del objetivo 2 | El servicio asignado aparece en la lista. |
| 3.3 | Abrir detalle | Botones grandes (modo táctil). |
| 3.4 | **Iniciar** | Estado **en proceso**; evento **inicio** en timeline. |
| 3.5 | **Registrar insumos** (modal, datos de ejemplo) | Toast OK; evento en timeline. |
| 3.6 | Bloque **prefactura** | Se muestra; estado **valid** (o equivalente) para permitir cierre. |
| 3.7 | Botón **Cerrar** | Habilitado cuando prefactura válida (si deshabilitado, lee el banner). |
| 3.8 | **Cerrar** → confirmar modal post-cierre si aparece | Estado **finalizado**; modal/resumen de cierre. |
| 3.9 | Revisar timeline | Cadena creación → asignación → inicio → insumos → cierre (sin editar). |
| 3.10 | **Salir** | — |

### Criterios de aceptación

- [ ] Transición pendiente → en proceso → finalizado sin 409.
- [ ] Insumos registrados visibles en timeline.
- [ ] Cierre solo con prefactura válida (regla de negocio POC).
- [ ] En prefactura/totales el operario **no** ve importes sensibles (RBAC financiero).

**Mensaje al cliente:** «Lo que pasa en campo queda registrado al segundo, con auditoría por eventos.»

---

# OBJETIVO 4 — Control administrativo y prefactura (administrador)

**Historia de usuario:** Como administrador verifico el servicio cerrado, la prefactura y la diferencia de visibilidad frente al operario.

| Paso | Acción | Qué debe pasar |
|------|--------|----------------|
| 4.1 | Login **admin general** | — |
| 4.2 | **Servicios** → filtrar **Finalizado** o abrir el mismo ID | Servicio en **finalizado**. |
| 4.3 | Tarjeta **prefactura** | Items, total, estado visible para admin. |
| 4.4 | Timeline completa | Coherente con lo hecho en objetivo 3. |
| 4.5 | (Contraste) **Salir** → login **operario** → mismo servicio | Operario ve el servicio pero **sin** precios/totales que no le correspondan. |
| 4.6 | **Salir** | — |

### Criterios de aceptación

- [ ] Admin ve importes / detalle financiero de prefactura.
- [ ] Operario no ve lo mismo (defensa en profundidad UI).
- [ ] No existen botones «editar evento» / «borrar evento».

**Mensaje al cliente:** «Finanzas y operación comparten el mismo hecho, con distinta visibilidad según el rol.»

---

# OBJETIVO 5 (opcional) — Trazabilidad e inmutabilidad

**Historia de usuario:** Como auditor quiero ver que el historial no se manipula y que las correcciones son nuevos eventos.

| Paso | Acción | Qué debe pasar |
|------|--------|----------------|
| 5.1 | Admin abre servicio **finalizado** seed (tercer servicio demo) o el del objetivo 4 | Timeline con varios eventos. |
| 5.2 | Buscar acciones de editar/borrar en eventos | **No deben existir**. |
| 5.3 | Si hay **Reproceso** en UI | Solo con motivo obligatorio (no lo ejecutes salvo que quieras mostrar corrección formal). |

### Criterios de aceptación

- [ ] Puedes explicar: «corregir = nuevo evento, no borrar el pasado».
- [ ] Interventor/supervisor (si entras con ese rol) tiene experiencia acotada según menú.

---

## Cierre con el cliente (2 minutos)

1. Recapitular los **5 pilares mostrados:** multi-rol, planificación, ejecución móvil, prefactura al cierre, auditoría por eventos.
2. Aclarar **siguiente fase** (post-POC): reportes, Siigo, offline, pantallas de catálogo completas.
3. Acordar fecha de piloto o lista de ajustes.

---

## Checklist rápido pre-reunión (imprimible)

```
[ ] make demo (o make demo-fresh)
[ ] make dev  → http://localhost:3300
[ ] make demo-check → OK / OK
[ ] Credenciales anotadas (admin + operario)
[ ] Ensayo completo objetivos 0→4 una vez
[ ] Portátil con dos terminales o procesos en background
[ ] Navegador en ventana limpia / sin extensiones que bloqueen
```

---

## Problemas frecuentes

| Síntoma | Causa | Solución |
|---------|--------|----------|
| Conexión rechazada :3300 | GUI no levantada | `make dev` |
| Login 422 | Email/domino no coincide con seed | Revisar `EMAIL_USERNAME` y `SEED_EMAIL_DOMAIN` |
| Lista operadores vacía / UUID manual | API sin `/users` | Recrear contenedor `api` en backend |
| 409 al iniciar/cerrar | Estado incoherente | **Nuevo servicio (demo)** o `make demo-fresh` |
| Cerrar deshabilitado | Prefactura no válida | Refrescar detalle; revisar bloque prefactura |
| CORS | Origen no permitido | `CORS_ORIGINS` incluye `http://localhost:3300` |

---

## Referencias técnicas

- Detalle de clics: `docs/DEMO_GUI_PASO_A_PASO.md`
- API y seed: `../progio-backend/docs/DEMO_GUIDE.md`
- Plan: `docs/DEVPLAN.md`
