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
# abrir http://localhost:5173 (puerto Vite por defecto)
```

> Nota: el puerto en local sin Docker es el de Vite (5173 por defecto). El puerto **3300** sólo aplica al stack Docker.

## Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | URL base del backend (ej. `http://localhost:9001`) | (sin default — obligatoria) |
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

## Comandos esenciales

```bash
npm run dev       # Vite dev server
npm run build     # build producción → dist/
npm run preview   # preview del build
npm run lint      # ESLint
npm run format    # Prettier
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
