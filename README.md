# PROGIO Frontend

Interfaz web **PROGIO V1.1** (React 18 + Vite 5). Consume la API del backend en el repo hermano `progio-backend/`.

## Requisitos

- Node **20 LTS** + npm
- Backend levantado y seed aplicado (ver README del backend)

## Arranque (obligatorio antes de abrir el navegador)

Si ves **`ERR_CONNECTION_REFUSED`** en `http://localhost:3300`, **no hay servidor escuchando**: debes levantar la GUI (no basta con tener solo el backend en :9001).

**Opción A — desarrollo (terminal abierta):**

```bash
cp .env.example .env   # si aún no existe
npm install
make dev               # o: npm run dev
```

**Opción B — Docker (segundo plano, sin Vite):**

```bash
make up                # docker compose up --build -d
```

**Stack completo (API + datos seed):**

```bash
# Terminal 1 — backend
cd ../progio-backend && make demo

# Terminal 2 — frontend (elige A o B arriba)
cd progio-frontend && make dev    # o make up
```

Comprobar ambos puertos: `make demo-check`

Abrir **http://localhost:3300** (o el valor de `FRONTEND_PORT` en `.env`).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `make dev` | Servidor Vite en `http://localhost:3300` |
| `make up` | GUI en Docker (nginx) en segundo plano |
| `make demo` | Ejecuta `make demo` en el backend + instrucciones GUI |
| `make demo-check` | Verifica que API (:9001) y GUI (:3300) respondan |
| `npm run dev` | Igual que `make dev` |
| `npm run build` | Build de producción |
| `npm run preview` | Previsualizar build |
| `npm run lint` | ESLint |
| `npm run verify` | `lint` + `build` (necesita `.env` con `VITE_*`) |

**CI:** en cada push/PR a `main` o `master`, GitHub Actions ejecuta lint, build (con `VITE_*` de CI) y `docker compose build` (`.github/workflows/ci.yml`).

## Documentación

- Plan: `docs/DEVPLAN.md` (marca **AQUÍ ESTAMOS** para retomar).
- Contrato API: `docs/API_INTEGRATION.md` (sincronizado con el backend).
- Arranque de agentes: `AGENTS.md`.

## Login demo

Usar las cuentas seed del backend (ej. `admin.general@example.com` con `SEED_DEMO_PASSWORD` cuando `SEED_EMAIL_DOMAIN=example.com`).

## Presentación al cliente

Guía **por objetivos con criterios de aceptación** (no avanzar hasta superar cada bloque): **`docs/DEMO_CLIENTE_PRESENTACION.md`**.

```bash
make presentacion   # checklist rápido + demo-check
```
