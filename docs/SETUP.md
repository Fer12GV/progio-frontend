# PROGIO Frontend — Setup local

## Requisitos

- **Docker + Docker Compose** (modo recomendado).
- (Opcional) **Node.js 20+** si prefieres desarrollar sin Docker.
- **Git** + acceso al repositorio.

## Setup rápido (con Docker)

```bash
git clone <repo-url> progio-frontend
cd progio-frontend
cp .env.example .env
# editar .env con valores reales (ver tabla más abajo)
docker compose up --build -d
# abrir http://localhost:3300
```

## Setup local sin Docker

```bash
npm install
cp .env.example .env
npm run dev
# abrir http://localhost:3300 (o el valor de FRONTEND_PORT / VITE_DEV_PORT en .env; ver vite.config.js)
```

> Nota: el puerto del dev server lo define `vite.config.js` (por defecto **3300** vía `FRONTEND_PORT` en `.env`). El **3300** en Docker es el mapeo host del contenedor Nginx (`FRONTEND_PORT`).

## Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `VITE_API_PREFIX` | Prefijo API (debe coincidir con backend) | `/api/v1` |
| `VITE_APP_NAME` | Nombre de la app | `PROGIO` |
| `VITE_APP_ENV` | `development` / `production` | `development` |
| `VITE_POLLING_INTERVAL_MS` | Polling tareas Celery | `5000` |
| `VITE_OFFLINE_SYNC_INTERVAL_MS` | Chequeo cola offline | `30000` |
| `VITE_DEFAULT_LANG` | Idioma por defecto | `es` |
| `FRONTEND_PORT` | Puerto host (Docker) | `3300` |

## Backend hermano

Para que la app funcione, el backend debe estar levantado:

```bash
cd ../progio-backend
docker compose up --build -d
# health: curl http://localhost:9001/health
```

Confirmar que `VITE_API_BASE_URL` del frontend coincide con `NGINX_HTTP_PORT` del backend (en este proyecto: **9001**; comprobar con `ss -tln` que el puerto sigue libre).

## Verificación POC.1.10 (build + Docker + API)

Checklist antes de dar por cerrada la infra mínima (`docs/DEVPLAN.md`):

1. **Backend en marcha** en la URL de `VITE_API_BASE_URL` (ej. `curl -sf http://localhost:9001/health`).
2. **Sin Docker:** `npm run verify` (requiere `.env` con `VITE_API_BASE_URL` y `VITE_API_PREFIX`; equivale a `lint` + `build`).
3. **Imagen:** `docker compose build` (usa los defaults del `docker-compose.yml` si no hay `.env`).
4. **GUI servida:** `docker compose up --build -d` y abrir `http://localhost:${FRONTEND_PORT:-3300}` — debe cargar la SPA (login).
5. **Login real:** en el navegador, iniciar sesión con un usuario seed del backend (`SEED_EMAIL_DOMAIN` + `SEED_DEMO_PASSWORD` en `progio-backend/.env`). Si las credenciales no coinciden con el ejemplo de `.env.example`, usar las de tu backend local.

**CI:** el workflow `.github/workflows/ci.yml` ejecuta `npm ci`, `lint`, `build` (con `VITE_*` de ejemplo) y `docker compose build` en cada push/PR a `main`/`master`.

## Comandos esenciales

```bash
npm run dev       # Vite dev server
npm run build     # build producción → dist/
npm run preview   # preview del build
npm run lint      # ESLint
npm run verify    # lint + build (necesita .env con VITE_*)
```

## Estructura tras el primer build

```
progio-frontend/
├── dist/                 # generado por npm run build
├── node_modules/
├── public/
├── src/
└── ...
```

## Troubleshooting

- **`VITE_API_BASE_URL` no funciona en producción**: las variables `VITE_*` se incrustan en build time. Cambiar el valor → **rebuild** del contenedor (`docker compose up --build -d`).
- **CORS error**: verificar que el origen `http://localhost:3300` está en `CORS_ORIGINS` del backend.
- **401 al cargar la app**: `refresh_token` expirado o inválido — limpiar `localStorage` y volver a login.
- **Latencia alta**: medir endpoint con `curl -w '%{time_total}s'`. Si supera 2 s, coordinar con backend (regla `performance.mdc`).
