# Demo en la interfaz (GUI) — Paso a paso explicado

Este documento apoya la tarea **POC.7.2** del plan (`docs/DEVPLAN.md`): recorrer el **ciclo de vida de un servicio** en el navegador, con la API real del backend.

La guía orientada a API y script está en el repo backend: `progio-backend/docs/DEMO_GUIDE.md`. **Aquí** solo hablamos de **clics, pantallas y credenciales** desde el frontend.

---

## 1. Qué estamos intentando demostrar

En una demo comercial quieres mostrar, sin trampas:

1. Un **administrador** prepara el trabajo: elige un servicio en estado inicial y **asigna un operario**.
2. El **operario** ejecuta en campo (o simulación): **inicia** el servicio, puede **registrar insumos** y al final **cierra** el servicio cuando la **prefactura** está en regla.
3. El **administrador** vuelve a entrar y **ve el servicio finalizado** y la **prefactura** asociada.

Eso encaja con el producto PROGIO: multi-tenant (el tenant va en el JWT, no lo eliges a mano en cada pantalla), RBAC (el operario no ve lo mismo que el admin en temas financieros) y **eventos inmutables** (la línea de tiempo solo crece; no se “editan” eventos viejos).

---

## 2. Cómo encajan las piezas (mentalidad de red)

Piensa en **dos servidores distintos** en tu máquina:

| Pieza | Qué es | URL típica | Rol |
|--------|--------|------------|-----|
| **Frontend (Vite)** | La SPA React: pantallas, formularios, llamadas HTTP al backend. | `http://localhost:3300/` | Lo abres en el **navegador**. |
| **Backend (API)** | FastAPI detrás de Nginx: login, servicios, prefactura, etc. | `http://localhost:9001/` | El frontend lo usa vía `VITE_API_BASE_URL`. |

**Importante:** el puerto **8000** es interno dentro de Docker del contenedor `api`. En el navegador y en `.env` del frontend debes usar el puerto **público** del Nginx del backend (en la documentación del proyecto suele ser **9001**). Si mezclas puertos, verás errores de red o CORS.

Flujo de una petición al listar servicios:

`Navegador` → `localhost:3300` (Vite sirve el JS) → ese JS hace `GET http://localhost:9001/api/v1/services` con cabecera `Authorization: Bearer …`.

Si **no** arrancas Vite (`npm run dev`) o el contenedor del frontend, al abrir `localhost:3300` obtendrás **“conexión rechazada”**: no hay nadie escuchando en ese puerto; no es un bug de React, es que falta levantar el servidor.

---

## 3. Antes de empezar — checklist

Marca mentalmente cada ítem:

1. **Repositorio backend** clonado y con `.env` válido (`JWT_SECRET_KEY`, `DATABASE_URL` o variables Postgres alineadas con `docker-compose`, `REDIS_URL`, `SEED_DEMO_PASSWORD`, `EMAIL_USERNAME`, `SEED_EMAIL_DOMAIN` sin `@` en el valor del dominio).
2. **Migraciones** aplicadas (el contenedor `api` suele ejecutar `alembic upgrade head` al arrancar). Para la prefactura POC hacen falta migraciones **0005** y **0006** (nombres exactos en el backend).
3. **Seed** ejecutado tras el `up` (el target `make demo` del backend hace compose + espera salud + seed).
4. **Repositorio frontend** con `npm install` hecho al menos una vez.
5. Archivo **`progio-frontend/.env`** con al menos:
   - `VITE_API_BASE_URL=http://localhost:9001` (o el puerto real de tu Nginx).
   - `VITE_API_PREFIX=/api/v1`
6. **CORS** del backend: debe incluir el origen desde el que sirves la GUI (p. ej. `http://localhost:3300`). Si cambias el puerto del frontend, actualiza `CORS_ORIGINS` en el backend.

---

## 4. Cómo se construyen los usuarios de prueba (emails)

El backend crea usuarios **seed** de forma idempotente. La regla general es:

- El usuario **admin_general** usa el valor de **`EMAIL_USERNAME`** en el `.env` del backend:
  - Si incluye **`@`**, ese string **completo** es el correo (ej. `jubileosoft@gmail.com`).
  - Si **no** incluye `@`, se concatena `@{SEED_EMAIL_DOMAIN}` (ej. `admin.general` + `@` + `example.com`).
- El resto de roles usan una **parte local fija** + `@` + **`SEED_EMAIL_DOMAIN`**:

| Rol (sistema) | Parte local del correo | Ejemplo si `SEED_EMAIL_DOMAIN=example.com` |
|---------------|------------------------|-----------------------------------------------|
| admin_contrato | `admin.contrato` | `admin.contrato@example.com` |
| coordinador_operaciones | `coordinador` | `coordinador@example.com` |
| supervisor | `supervisor` | `supervisor@example.com` |
| operario | `operario` | `operario@example.com` |

La **contraseña** de todos los seed suele ser la misma: **`SEED_DEMO_PASSWORD`** en el `.env` del backend.

El campo **`tenant_slug`** en el login es **opcional** en esta GUI: si no lo envías, el backend usa el tenant por defecto configurado (`TENANCY_DEFAULT_TENANT_SLUG` / semilla).

---

## 5. Terminal A — Backend (datos y API)

En la carpeta del backend:

```bash
cd /ruta/a/progio-backend
make demo
```

Qué hace eso en concepto: levanta contenedores (API, DB, Redis, Nginx…), espera a que la API responda en salud y ejecuta el **seed** para que existan contratos, activos, usuarios y **tres servicios demo** (pendiente, en proceso, finalizado).

Comprobación rápida desde otra terminal:

```bash
curl -s http://localhost:9001/health
```

Deberías ver JSON con `"status":"ok"` (o equivalente documentado).

---

## 6. Terminal B — Frontend (la web que ves en el navegador)

En la carpeta del frontend:

```bash
cd /ruta/a/progio-frontend
npm run dev
```

En la consola debe aparecer algo como **Local: http://localhost:3300/**. Abre esa URL.

Si ves **ERR_CONNECTION_REFUSED**, casi siempre significa: **no está corriendo** `npm run dev` (o el puerto cambió y sigues abriendo el antiguo).

---

## 7. Guion de la demo en pantalla (POC.7.2)

### Parte 1 — Administrador

1. Inicia sesión con el usuario **admin_general** (tu `EMAIL_USERNAME` completo o compuesto, según el `.env` del backend).
2. Ve a **Servicios** (menú lateral).
3. Opcional: filtra por estado **Pendiente**. Los valores de filtro deben coincidir con la API (`pendiente`, `en_proceso`, etc.); las etiquetas en pantalla pueden decir “Pendiente” en español pero el valor enviado debe ser el del backend.
4. Abre el detalle del servicio demo **pendiente** (en el seed suele estar asociado al activo con placa **ABC123** y **sin** operario asignado todavía).
5. Usa **Asignar operador** y elige el usuario **operario** de la lista.
6. **Cierra sesión** (logout).

**Nota:** En la POC actual **no** hay un botón “Crear servicio nuevo” en la lista; el plan usa el **servicio ya sembrado** en estado pendiente. Eso es suficiente para demostrar asignación + ciclo.

### Parte 2 — Operario

7. Inicia sesión con **`operario@TU_DOMINIO_SEED`** (sustituye por tu `SEED_EMAIL_DOMAIN`) y la misma **`SEED_DEMO_PASSWORD`**.
8. Entra al **Panel del operario** (`/operator`) o abre de nuevo el **detalle del mismo servicio** (debe aparecer en “solo asignados a mí” si usas ese filtro).
9. Pulsa **Iniciar** (el servicio pasa a **en proceso** y se registra un evento en la línea de tiempo).
10. Opcional pero recomendable para la demo: **Registrar insumos** (modal) para dejar constancia en la línea de tiempo.
11. Revisa el bloque de **prefactura** en la misma pantalla: el **Cerrar** suele estar bloqueado hasta que la prefactura esté en estado **válido** (`valid`), según las reglas de la POC.
12. Cuando corresponda, pulsa **Cerrar** y confirma si la UI muestra el modal post-cierre con resumen de prefactura.

### Parte 3 — Vuelta al administrador

13. Cierra sesión e inicia de nuevo como **admin_general**.
14. Abre el **mismo servicio**: debería estar **finalizado**, con la **línea de tiempo** completa y la **prefactura** visible. Como admin, verás información que el rol **operario** no debe ver (importes / detalle financiero según lo implementado en RBAC).

---

## 8. Cómo saber si POC.7.2 “pasó”

- Sin errores bloqueantes en consola de red (pestaña **Network** del navegador).
- Transiciones coherentes: pendiente → en proceso → … → finalizado.
- Prefactura visible para admin tras el cierre; operario sin datos financieros que no le correspondan.
- Si algo devuelve **409**, lee el mensaje: suele ser una **transición no permitida** por la máquina de estados (es comportamiento esperado si se hace clic fuera de orden).

Cuando lo hayas ejecutado tú (humano) con éxito, en el plan se marca **POC.7.2** como hecho y se avanza a **POC.7.3** (latencia por página/endpoint), **POC.7.4** (probar explícitamente el refresh en 401) y **POC.7.5** (bundle).

---

## 9. Cómo funciona el refresh en 401 (contexto para POC.7.4)

No hace falta entender el código para la demo, pero ayuda a confiar en el sistema:

- El **access token** vive en **memoria** (React). Cada petición Axios lleva `Authorization: Bearer …` si hay sesión.
- Si el backend responde **401** (token caducado), el interceptor en `AuthContext.jsx` intenta **una vez** llamar a `POST /auth/refresh` con el **refresh token** guardado en `localStorage`, actualiza la sesión y **repite** la petición original.
- Si el refresh falla, se limpia la sesión y volverás al login.

Para **probar** POC.7.4 de forma manual, una técnica típica es forzar un access token inválido en memoria (solo en entorno de desarrollo) o esperar a que expire el access token y disparar una acción en la UI; eso queda documentado en el plan como verificación explícita.

---

## 10. Qué viene después en el roadmap de demo

| Orden | Tarea (frontend) | Qué significa en lenguaje llano |
|-------|------------------|--------------------------------|
| 1 | **POC.7.2** | Este documento: ciclo manual en GUI. |
| 2 | **POC.7.3** | Medir tiempos: cada pantalla debe sentirse rápida; cada API usada no debe dispararse en bucles que bloqueen el navegador. |
| 3 | **POC.7.4** | Comprobar que al caducar el access token la app se recupera sola con refresh. |
| 4 | **POC.7.5** | `npm run build` y revisar que el JS inicial no se haya inflado de más. |
| 5 | **POC.8.x** | Demo “cerrada”: compose que levante todo, guía/capturas/checklist para reunión con cliente. |

El backend en paralelo puede seguir su propio `docs/DEVPLAN.md` (capturas API, checklist); lo **bloqueante** para la demo comercial sigue siendo que **esta GUI** complete el **POC.7.2**.

---

## Referencias cruzadas

- Plan frontend: `docs/DEVPLAN.md` (sección FASE POC, **POC.7.2**).
- Plan backend: `../progio-backend/docs/DEVPLAN.md`.
- Guía API + `make demo`: `../progio-backend/docs/DEMO_GUIDE.md`.
- Contrato HTTP: `docs/API_INTEGRATION.md` (este repo) y el equivalente en backend.
