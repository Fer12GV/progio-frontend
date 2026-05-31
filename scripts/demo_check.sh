#!/usr/bin/env bash
# Comprueba API + GUI para la demo (no levanta servicios).
set -euo pipefail

FRONTEND_PORT="${FRONTEND_PORT:-3300}"
API_BASE="${VITE_API_BASE_URL:-http://localhost:9001}"

fail=0

if curl -sf "${API_BASE}/health" >/dev/null 2>&1; then
  echo "OK  API  ${API_BASE}/health"
else
  echo "FALTA API en ${API_BASE} — en progio-backend: make demo"
  fail=1
fi

if curl -sf "http://127.0.0.1:${FRONTEND_PORT}/" >/dev/null 2>&1; then
  echo "OK  GUI  http://localhost:${FRONTEND_PORT}/"
else
  echo "FALTA GUI en :${FRONTEND_PORT} — en progio-frontend: make dev  (o make up)"
  fail=1
fi

exit "$fail"
