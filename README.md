# PROGIO Frontend

Interfaz web **PROGIO V1.1** (React 18 + Vite 5). Consume la API del backend en el repo hermano `progio-backend/`.

## Requisitos

- Node **20 LTS** + npm
- Backend levantado y seed aplicado (ver README del backend)

## Configuración

```bash
cp .env.example .env
# Ajustar VITE_API_BASE_URL y VITE_API_PREFIX si tu backend no usa los valores por defecto.
npm install
npm run dev
```

Abrir **http://localhost:3300** (o el puerto definido en `FRONTEND_PORT` / `VITE_DEV_PORT`).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo Vite |
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
