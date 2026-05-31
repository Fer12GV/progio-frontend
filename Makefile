# PROGIO Frontend — atajos locales (demo POC).
# El backend vive en ../progio-backend (make demo allí).

BACKEND_DIR := ../progio-backend
FRONTEND_PORT ?= 3300

.PHONY: help dev up down verify demo demo-check presentacion

help:
	@echo "PROGIO Frontend — comandos:"
	@echo "  make dev          Servidor Vite (http://localhost:$(FRONTEND_PORT)) — deja la terminal abierta"
	@echo "  make up           GUI en Docker (nginx, puerto $(FRONTEND_PORT)) — en segundo plano"
	@echo "  make down         Baja contenedor frontend"
	@echo "  make verify       lint + build"
	@echo "  make demo         Backend (make demo) + comprobar que la GUI responde"
	@echo "  make demo-check   Solo comprueba puertos 9001 (API) y $(FRONTEND_PORT) (GUI)"
	@echo "  make presentacion Muestra checklist y ruta a docs/DEMO_CLIENTE_PRESENTACION.md"

dev:
	npm run dev

up:
	docker compose up --build -d
	@echo ""
	@echo "GUI: http://localhost:$(FRONTEND_PORT)/"
	@echo "API: debe estar en VITE_API_BASE_URL del .env (típico http://localhost:9001)"

down:
	docker compose down

verify:
	npm run verify

demo-check:
	@./scripts/demo_check.sh

presentacion:
	@echo "=== Demo comercial PROGIO (POC) ==="
	@echo "Guía por objetivos: docs/DEMO_CLIENTE_PRESENTACION.md"
	@echo ""
	@$(MAKE) demo-check || true
	@echo ""
	@echo "Antes de la reunión: backend → make demo | frontend → make dev"
	@echo "Credenciales: progio-backend/.env (EMAIL_USERNAME + SEED_DEMO_PASSWORD + operario@SEED_EMAIL_DOMAIN)"

demo:
	@$(MAKE) -C $(BACKEND_DIR) demo
	@echo ""
	@if ss -tlnH "sport = :$(FRONTEND_PORT)" 2>/dev/null | grep -q LISTEN; then \
		echo "GUI ya escucha en :$(FRONTEND_PORT). Abre http://localhost:$(FRONTEND_PORT)/"; \
	else \
		echo "La GUI NO está levantada. En otra terminal:"; \
		echo "  cd $$(pwd) && make dev    # desarrollo (Vite)"; \
		echo "  cd $$(pwd) && make up     # Docker (nginx, segundo plano)"; \
	fi
	@echo "Guía pantalla: docs/DEMO_GUI_PASO_A_PASO.md"
