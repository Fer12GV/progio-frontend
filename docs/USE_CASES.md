# PROGIO — Casos de Uso y Flujos de Solución (Mermaid)

> Fuente única de los diagramas Mermaid del proyecto. Se mantienen sincronizados entre `progio-backend/docs/USE_CASES.md` y `progio-frontend/docs/USE_CASES.md`.
>
> Cada diagrama puede pegarse en https://mermaid.live para exportarlo como PNG/SVG.

## Convenciones

- **Backend (FastAPI)**: contenedor `api` detrás de `nginx`.
- **Frontend (React)**: SPA en contenedor `frontend` (Nginx Alpine).
- **Roles**: `admin_general`, `admin_contrato`, `coordinador_operaciones`, `supervisor`, `operario`, `interventor`.
- **Estados de servicio**: `Pendiente`, `En Proceso`, `En Espera`, `Finalizado`, `Cancelado`, `Reprocesado`, `Bloqueado`.

---

## 1. Arquitectura general (alto nivel)

```mermaid
flowchart LR
    subgraph Cliente["Cliente (Navegador / Tablet / Móvil)"]
        UI["PROGIO Frontend<br/>React 18 + Vite<br/>Nginx Alpine (prod)"]
        LS[("LocalStorage<br/>refresh_token<br/>cola offline")]
    end

    subgraph Edge["Edge / Reverse proxy"]
        NGINX["Nginx<br/>:9001"]
    end

    subgraph Backend["PROGIO Backend"]
        API["FastAPI<br/>:8000<br/>(async)"]
        WORKER["Celery Worker<br/>(siigo_send,<br/>report_export,<br/>offline_sync)"]
    end

    subgraph Datos["Datos"]
        PG[("PostgreSQL<br/>multi-tenant<br/>service_event<br/>audit_log<br/>(INSERT-only)")]
        REDIS[("Redis<br/>cache<br/>sesiones<br/>rate-limit<br/>broker Celery")]
    end

    subgraph Externo["Servicios externos"]
        SIIGO["Siigo<br/>(REST/JSON,<br/>asíncrono)"]
    end

    UI <-->|HTTPS / JWT| NGINX
    UI <-.->|persiste| LS
    NGINX --> API
    API <--> PG
    API <--> REDIS
    API -->|encola| REDIS
    REDIS -->|consume| WORKER
    WORKER <--> PG
    WORKER -->|httpx async| SIIGO

    classDef frontend fill:#e0f2fe,stroke:#0369a1,color:#0c4a6e
    classDef backend fill:#dcfce7,stroke:#15803d,color:#14532d
    classDef data fill:#fef3c7,stroke:#a16207,color:#713f12
    classDef ext fill:#fce7f3,stroke:#be185d,color:#831843
    classDef edge fill:#f3e8ff,stroke:#7e22ce,color:#581c87

    class UI,LS frontend
    class API,WORKER backend
    class PG,REDIS data
    class SIIGO ext
    class NGINX edge
```

---

## 2. Diagrama de casos de uso (actores y permisos)

```mermaid
flowchart LR
    %% Actores
    AG((["admin_general"]))
    AC((["admin_contrato"]))
    CO((["coordinador_<br/>operaciones"]))
    SV((["supervisor"]))
    OP((["operario"]))
    IN((["interventor"]))

    %% Casos de uso por dominio
    subgraph IdAuth["Identidad / Auth"]
        UC_LOGIN["Iniciar sesión"]
        UC_VAL["Validar sesión"]
        UC_LOGOUT["Cerrar sesión"]
    end

    subgraph Tenancy["Tenants / Usuarios"]
        UC_TENANT["Gestionar tenants<br/>(super-admin)"]
        UC_USERS["Gestionar usuarios<br/>(por tenant)"]
        UC_ROLES["Asignar roles"]
    end

    subgraph Contrato["Contratos / Activos"]
        UC_CONTRACT["Gestionar contratos<br/>+ cupos"]
        UC_SITE["Gestionar sedes"]
        UC_ASSET["Gestionar activos"]
    end

    subgraph Servicios["Operación de servicio"]
        UC_CREATE["Crear servicio"]
        UC_ASSIGN["Asignar operario"]
        UC_START["Iniciar servicio"]
        UC_PAUSE["Pausar / Reanudar"]
        UC_INPUTS["Registrar insumos"]
        UC_SUPER["Supervisar / validar"]
        UC_CLOSE["Cerrar servicio<br/>(requiere prefactura)"]
        UC_CANCEL["Cancelar servicio"]
        UC_REPROC["Reprocesar (motivo<br/>obligatorio)"]
    end

    subgraph PreFact["Prefactura / Siigo"]
        UC_PREBILL["Generar prefactura"]
        UC_RETRY["Reintentar envío Siigo"]
    end

    subgraph Audit["Auditoría / Reportes"]
        UC_AUDIT["Consultar auditoría<br/>(read-only)"]
        UC_TIMELINE["Ver línea de tiempo<br/>de un servicio"]
        UC_REPORT["Reportes y KPIs<br/>(operativos / ambientales /<br/>económicos)"]
        UC_EXPORT["Exportar PDF/Excel"]
    end

    subgraph Offline["Offline"]
        UC_OFF_CAP["Capturar evento<br/>sin conexión"]
        UC_OFF_SYNC["Sincronizar al<br/>recuperar conexión"]
    end

    %% Relaciones (todos hacen login/logout)
    AG --> UC_LOGIN
    AC --> UC_LOGIN
    CO --> UC_LOGIN
    SV --> UC_LOGIN
    OP --> UC_LOGIN
    IN --> UC_LOGIN
    AG --> UC_LOGOUT
    AC --> UC_LOGOUT
    CO --> UC_LOGOUT
    SV --> UC_LOGOUT
    OP --> UC_LOGOUT
    IN --> UC_LOGOUT

    %% Tenants (super-admin)
    AG --> UC_TENANT
    AG --> UC_USERS
    AC --> UC_USERS
    AG --> UC_ROLES
    AC --> UC_ROLES

    %% Contratos
    AG --> UC_CONTRACT
    AC --> UC_CONTRACT
    AG --> UC_SITE
    AC --> UC_SITE
    AG --> UC_ASSET
    AC --> UC_ASSET

    %% Servicios
    AG --> UC_CREATE
    AC --> UC_CREATE
    CO --> UC_CREATE
    CO --> UC_ASSIGN
    AC --> UC_ASSIGN
    OP --> UC_START
    OP --> UC_PAUSE
    OP --> UC_INPUTS
    OP --> UC_CLOSE
    SV --> UC_SUPER
    CO --> UC_CANCEL
    AC --> UC_CANCEL
    AG --> UC_REPROC
    AC --> UC_REPROC
    CO --> UC_REPROC

    %% Prefactura
    AG --> UC_PREBILL
    AC --> UC_PREBILL
    AG --> UC_RETRY
    AC --> UC_RETRY

    %% Auditoría / reportes
    AG --> UC_AUDIT
    AC --> UC_AUDIT
    IN --> UC_AUDIT
    AG --> UC_TIMELINE
    AC --> UC_TIMELINE
    CO --> UC_TIMELINE
    SV --> UC_TIMELINE
    OP --> UC_TIMELINE
    IN --> UC_TIMELINE
    AG --> UC_REPORT
    AC --> UC_REPORT
    CO --> UC_REPORT
    IN --> UC_REPORT
    AG --> UC_EXPORT
    AC --> UC_EXPORT
    CO --> UC_EXPORT

    %% Offline (operario en campo)
    OP --> UC_OFF_CAP
    OP --> UC_OFF_SYNC

    classDef actor fill:#fde68a,stroke:#a16207,color:#713f12
    class AG,AC,CO,SV,OP,IN actor
```

---

## 3. Máquina de estados del servicio

```mermaid
stateDiagram-v2
    [*] --> Pendiente: crear servicio
    Pendiente --> EnProceso: asignar + iniciar
    Pendiente --> Cancelado: cancelar
    EnProceso --> EnEspera: pausar
    EnEspera --> EnProceso: reanudar
    EnProceso --> Finalizado: cerrar (requiere prefactura válida)
    EnProceso --> Cancelado: cancelar
    EnEspera --> Cancelado: cancelar
    EnProceso --> Bloqueado: bloquear (incidencia)
    EnEspera --> Bloqueado: bloquear
    Bloqueado --> EnProceso: desbloquear (admin)
    Bloqueado --> Cancelado: cancelar
    Finalizado --> Reprocesado: reproceso (motivo obligatorio)
    Cancelado --> Reprocesado: reproceso (motivo obligatorio)

    note right of Finalizado
        INSERT-only en service_event
        + audit_log
        Encola Celery siigo_send
    end note

    note right of Reprocesado
        Es un evento NUEVO,
        no edita el original
    end note
```

---

## 4. Flujo de Login + Auth + RBAC

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario (operario)
    participant FE as Frontend (React)
    participant NX as Nginx :9001
    participant API as FastAPI :8000
    participant DB as PostgreSQL
    participant RE as Redis (lockout)

    U->>FE: email + password
    FE->>NX: POST /api/v1/auth/login
    NX->>API: forward
    API->>RE: chequear contador de intentos
    API->>DB: buscar user (tenant_id, hashed_pwd, roles)
    alt password OK + user activo
        API->>API: emitir access_token (~30 min) + refresh_token (~7d)<br/>claims: sub, tenant_id, roles[]
        API-->>FE: 200 { access_token, refresh_token, user }
        FE->>FE: access en memoria, refresh en localStorage
        FE->>U: redirige a /dashboard
    else password inválido
        API->>RE: incrementa contador (TTL)
        API-->>FE: 401 / 423 si bloqueado
        FE->>U: mensaje claro
    end

    Note over FE,API: Cualquier request → Authorization: Bearer access_token
    Note over FE,API: 401 → interceptor /auth/refresh<br/>(rotación de refresh)
    Note over FE: <RoleGuard> oculta acciones<br/>según roles[] del JWT
```

---

## 5. Ciclo de vida del servicio — feliz path (operario)

```mermaid
sequenceDiagram
    autonumber
    actor OP as Operario
    participant FE as Frontend
    participant API as FastAPI
    participant DB as PostgreSQL
    participant CE as Celery
    participant SI as Siigo

    OP->>FE: abre /services/{id}
    FE->>API: GET /services/{id}
    API->>DB: SELECT (filtro tenant_id)
    DB-->>API: service + events
    API-->>FE: 200 service + timeline

    OP->>FE: click "Iniciar"
    FE->>API: POST /services/{id}/start
    API->>API: validar transición + RBAC
    API->>DB: INSERT service_event(inicio)
    API->>DB: INSERT audit_log
    API->>DB: UPDATE service.status = EnProceso
    API-->>FE: 200 service actualizado
    FE-->>OP: refresca timeline

    OP->>FE: click "Registrar insumos"
    FE->>API: POST /services/{id}/inputs (volumen, costos)
    API->>DB: INSERT service_event(insumos)
    API->>DB: INSERT audit_log
    API-->>FE: 200

    OP->>FE: click "Cerrar"
    FE->>API: POST /services/{id}/close
    API->>API: calcular prefactura (items, total)
    API->>DB: INSERT prebill (status=valid)
    API->>DB: INSERT service_event(cierre)
    API->>DB: INSERT audit_log
    API->>DB: UPDATE service.status = Finalizado
    API->>CE: encola siigo_send(prebill_id)
    API-->>FE: 200 prebill (valid) + service (Finalizado)
    FE-->>OP: muestra prefactura

    Note over CE,SI: Asíncrono — no bloquea al operario
    CE->>SI: POST /v1/invoices (httpx async)
    alt OK
        SI-->>CE: 201 { siigo_transaction_id }
        CE->>DB: UPDATE prebill.status = sent + siigo_transaction_id
    else error transitorio
        CE->>CE: backoff exponencial + retry
    else error permanente
        CE->>DB: UPDATE prebill.status = failed
        CE-->>API: alerta admin
    end
```

---

## 6. Sincronización Offline (módulo 3.3)

```mermaid
sequenceDiagram
    autonumber
    actor OP as Operario (sin conexión)
    participant FE as Frontend
    participant LS as LocalStorage
    participant API as FastAPI
    participant DB as PostgreSQL

    Note over OP,FE: navigator.onLine === false
    OP->>FE: click "Pausar"
    FE->>FE: client_event_id = crypto.randomUUID()
    FE->>LS: push { client_event_id, service_id, event_type, payload, captured_at }
    FE-->>OP: toast "Guardado localmente, se sincronizará"

    Note over OP,FE: ... más eventos offline ...

    Note over FE: evento window 'online' o intervalo VITE_OFFLINE_SYNC_INTERVAL_MS
    FE->>LS: leer cola
    FE->>FE: agrupar por service_id
    loop por cada service_id
        FE->>API: POST /services/{id}/events/sync<br/>{ events: [...] }
        API->>API: validar JWT + tenant + RBAC
        loop por cada evento
            API->>DB: SELECT por client_event_id (idempotencia)
            alt ya existe
                API->>API: marcar como aceptado (sin duplicar)
            else no existe
                API->>API: validar transición vs estado actual
                alt transición válida
                    API->>DB: INSERT service_event
                    API->>DB: INSERT audit_log
                    API->>DB: UPDATE service.status si aplica
                else transición inválida
                    API->>API: marcar como rejected (motivo)
                end
            end
        end
        API-->>FE: { accepted: [...], rejected: [...] }
        FE->>LS: eliminar accepted; mantener rejected con marca
        FE-->>OP: indicador "Sincronizando 3 eventos…" → desaparece
    end
```

---

## 7. Polling de tareas Celery (export reportes / retry Siigo)

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario (admin/coord)
    participant FE as Frontend
    participant API as FastAPI
    participant CE as Celery
    participant FS as Storage / firmas

    U->>FE: click "Exportar PDF"
    FE->>API: POST /reports/export
    API->>CE: encola report_export
    API-->>FE: 202 { task_id }

    Note over FE: useTaskStatus(task_id)<br/>setInterval VITE_POLLING_INTERVAL_MS<br/>+ AbortController + fetchingRef
    loop hasta SUCCESS / FAILURE
        FE->>API: GET /tasks/{task_id}
        API-->>FE: { status, progress }
    end
    Note over CE: Genera PDF
    CE->>FS: sube y firma URL
    CE->>API: marca SUCCESS + url
    FE->>API: GET /tasks/{task_id}
    API-->>FE: { status: SUCCESS, url }
    FE-->>U: botón "Descargar"
```

---

## 8. Flujo del agente IA (3 capas de memoria — meta)

```mermaid
flowchart TD
    START(["Chat nuevo (cualquier modelo)"]) --> R1[".cursor/rules/*.mdc<br/>alwaysApply: true<br/>(inyectadas automáticamente)"]
    R1 --> A["Lee AGENTS.md<br/>(orden obligatorio)"]
    A --> C["Lee CLAUDE.md<br/>(stack + estado actual)"]
    C --> S["Lee docs/PROGIO_Alcance_Tecnico_V1_1.md<br/>+ docs/SCOPE.md"]
    S --> D["Lee docs/DEVPLAN.md<br/>busca «AQUÍ ESTAMOS»"]
    D --> AR["Lee docs/ARCHITECTURE.md<br/>+ docs/USE_CASES.md<br/>+ docs/API_INTEGRATION.md"]
    AR --> M["Lee memory/MEMORY.md<br/>+ memory/feedback_*.md"]
    M --> ENV[".env y .env.example<br/>(no especular puertos)"]
    ENV --> RESUMEN["Resume al usuario en español:<br/>fase activa, próxima tarea,<br/>URLs verificadas, riesgos"]
    RESUMEN --> WORK["Implementa la tarea"]
    WORK --> CIERRE["/cierre o cierre de sesión:<br/>actualiza CLAUDE.md, DEVPLAN.md,<br/>memory/* en AMBOS repos<br/>(backend ↔ frontend)"]
    CIERRE --> NEXT(["Próximo chat retoma desde<br/>el nuevo «AQUÍ ESTAMOS»"])

    classDef rule fill:#e0e7ff,stroke:#4338ca
    classDef doc fill:#dcfce7,stroke:#15803d
    classDef act fill:#fde68a,stroke:#a16207

    class R1 rule
    class A,C,S,D,AR,M,ENV doc
    class RESUMEN,WORK,CIERRE act
```

---

## Notas de mantenimiento

- Cuando cambie un flujo crítico (auth, eventos, prefactura, offline), actualizar este archivo en **ambos repos** (`progio-backend/docs/USE_CASES.md` y `progio-frontend/docs/USE_CASES.md`).
- Los diagramas se renderizan automáticamente en Cursor, GitHub y previews Markdown que soporten Mermaid.
- Para PNG estático: pegar el bloque ```mermaid``` correspondiente en https://mermaid.live → Export PNG.
