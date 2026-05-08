# PROGIO Frontend — Despliegue

## Modelo

- Mismo `docker-compose.yml` para local, staging, VPS, producción.
- Sólo cambia `.env`.
- Imagen multi-stage: Node 20 build → Nginx Alpine serve.

## Producción (VPS) — flujo recomendado

1. **Local**: hacer cambios, `npm run lint` + `npm run build` + `docker compose up --build -d` para validar.
2. Commit + push a la rama de despliegue (típicamente `master` o `main`).
3. **VPS** (vía SSH):
   ```bash
   cd /opt/.../progio-frontend
   git pull
   docker compose down
   docker compose up --build -d
   ```
4. Validar `curl -sSf http://<host>:<FRONTEND_PORT>` y abrir en navegador.

> **Sólo archivos en `.gitignore` (`.env`, `logs/`, `node_modules/`) pueden editarse directamente en VPS.** Todo cambio de código va por git flow para mantener idempotencia.

## Variables `VITE_*` en producción

- Se incrustan en build time → cambiar `VITE_API_BASE_URL` requiere rebuild.
- En `docker-compose.yml`, pasar `build.args` con las variables y reflejarlas en `Dockerfile` con `ARG VITE_API_BASE_URL`.

```yaml
# docker-compose.yml (extracto)
services:
  frontend:
    build:
      context: .
      args:
        VITE_API_BASE_URL: ${VITE_API_BASE_URL}
        VITE_APP_NAME: ${VITE_APP_NAME}
        VITE_APP_ENV: ${VITE_APP_ENV}
    ports:
      - "${FRONTEND_PORT:-3300}:80"
    env_file: .env
```

## Performance budget (objetivo)

- Chunk inicial JS gzip: **<200 KB** (medir con `npm run build` y revisar `dist/assets/*.js.gz` o el output de Vite).
- LCP (Largest Contentful Paint) en local: **<1 s**.
- TTI (Time To Interactive): **<1.5 s** en local.
- Si una nueva dependencia o feature empuja el bundle por encima del budget, **medir** y reconsiderar (regla `performance.mdc`).

## Hardening (FASE 11)

- **A11y**: navegación por teclado, ARIA, focus visible. Verificar con axe DevTools.
- **HTTP headers** en Nginx: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, CSP razonable.
- **Cache**: assets con hash → `Cache-Control: public, immutable, max-age=31536000`. `index.html` → `no-cache`.
- **TLS**: terminar TLS en el nginx del VPS (no en este contenedor) o configurar Let's Encrypt según infra.

## Rollback rápido

- Si un release rompe producción:
  ```bash
  cd /opt/.../progio-frontend
  git reset --hard <commit-anterior>
  docker compose up --build -d
  ```
- Documentar el incidente en `memory/bug_*.md` con causa raíz y fix.

## Sincronización con backend

- Confirmar que `VITE_API_BASE_URL` apunta a la URL pública correcta del backend.
- Confirmar que `CORS_ORIGINS` del backend incluye el origen del frontend (sin trailing slash).
- Cualquier cambio de variable que afecte la integración (puerto, host, CORS) → actualizar **ambos** `.env.example` y avisar al usuario.
