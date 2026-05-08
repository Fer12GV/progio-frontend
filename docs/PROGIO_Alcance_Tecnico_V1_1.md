# PROYECTO PROGIO (V1.1)
# Alcance Técnico y Funcional Definitivo

Este documento constituye la base técnica, operativa y contractual para el desarrollo del sistema PROGIO, diseñado para operar bajo un modelo 100% remoto de JubileoSoft.

---

# MÓDULO 1 — ARQUITECTURA, DATOS Y MODELO DE NEGOCIO

## 1.1 Arquitectura del Sistema

### Paradigma
- Sistema 100% online
- Arquitectura Stateless
- Arquitectura orientada a eventos (Event-Driven)

### Stack Tecnológico

#### Backend
- FastAPI (Python)

#### Frontend
- React

#### Base de Datos
- PostgreSQL

#### Infraestructura
- Docker
- Arquitectura desacoplada y escalable

### Modelo Multi-Tenant

El sistema implementará:

- Aislamiento lógico de datos por empresa/contrato
- Backend compartido y escalable
- Restricción estricta entre tenants
- Gestión centralizada de infraestructura

---

## 1.2 Gestión de Contratos y Sedes

### Contratos In-House (Flotas)

El sistema debe:

- Validar automáticamente límites de servicios por vehículo
- Bloquear servicios excedidos
- Parametrizar cupos por periodo contractual

### Puntos de Servicio Físicos

Control de costes asociados a:

- Arriendo
- Servicios públicos
- Nómina
- Costes administrativos

### Multi-Sede

Capacidades:

- Gestión centralizada
- Supervisión multiubicación
- Reportes consolidados
- Operación distribuida

---

# MÓDULO 2 — SEGURIDAD, ROLES (RBAC) Y AUDITORÍA

## 2.1 Matriz de Roles y Funciones

| Rol | Funciones Principales | Acceso Sensible |
|---|---|---|
| Administrador General | Control total, contratos, sedes y usuarios | Sí |
| Administrador de Contrato | Gestión de activos y personal | Sí (solo su contrato) |
| Coordinador de Operaciones | Supervisión, turnos y productividad | Sí |
| Supervisor | Calidad y validación operativa | Parametrizable |
| Operario | Registro operativo en tiempo real | No |
| Interventor | Auditoría externa de cumplimiento | Solo reportes |

---

## 2.2 Seguridad y Autenticación

### Implementación

- JWT (JSON Web Tokens)
- Refresh Tokens
- Expiración configurable

### Controles de Seguridad

- Usuario y contraseña
- Bloqueo tras intentos fallidos
- Revocación inmediata de accesos
- Restricción por tenant y contrato

### Restricción de Información Sensible

Datos protegidos:

- Márgenes
- Precios
- Indicadores financieros
- Prefacturación

---

## 2.3 Auditoría e Inmutabilidad

### Registro Obligatorio

Toda acción relevante debe registrar:

- Usuario
- Fecha y hora
- Entidad afectada
- Estado anterior
- Estado posterior

### Inmutabilidad

Reglas obligatorias:

- No se eliminan registros históricos
- No se editan eventos anteriores
- Correcciones mediante eventos de reproceso

---

# MÓDULO 3 — CICLO DE VIDA DEL SERVICIO Y OPERACIÓN

## 3.1 Estados del Servicio

Estados válidos:

- Pendiente
- En Proceso
- En Espera
- Finalizado
- Cancelado
- Reprocesado
- Bloqueado

---

## 3.2 Modelo de Eventos

Cada servicio funciona como una línea de tiempo de eventos inmutables.

### Eventos Obligatorios

- Inicio
- Asignación de operador
- Pausas
- Reanudación
- Registro de insumos
- Supervisión
- Cierre

### Datos por Evento

- Usuario responsable
- Fecha/hora
- Rol ejecutor
- Impacto operativo
- Impacto ambiental

---

## 3.3 Operación Offline

### Captura Local

El navegador almacenará eventos usando:

- LocalStorage

Eventos soportados offline:

- Inicio
- Pausa
- Finalización

### Sincronización

Al recuperar conexión:

- Detección vía navigator.onLine
- Sincronización automática
- Reenvío en segundo plano al backend FastAPI

### Restricciones Offline

No disponibles offline:

- Reportes históricos
- Indicadores financieros
- Consultas complejas

---

## 3.4 Interfaces Operativas

### Panel del Operario

Características:

- Responsive
- Optimizado para móviles/tablets
- Registro rápido de eventos
- Registro de insumos

### Consola de Supervisión

Características:

- Tiempo real
- Visualización de servicios activos
- Intervenciones y reasignaciones

---

# MÓDULO 4 — GESTIÓN DE ACTIVOS, PREFACTURACIÓN E INTEGRACIÓN

## 4.1 Caracterización de Activos

Cada activo debe registrar:

- Placa
- Cliente asociado
- Contrato
- Tipo de vehículo
- Tipo de combustible

### Validación Contractual

Antes de iniciar un servicio:

- Se validan cupos
- Se validan restricciones
- Se bloquean excesos

---

## 4.2 Prefacturación Obligatoria

### Regla Principal

Un servicio NO puede finalizar si:

- No existe una prefactura válida generada

### Contenido de Prefactura

- ID servicio
- Cliente
- Activo
- Eventos asociados
- Tarifa contractual
- Coste de insumos

---

## 4.3 Integración con Siigo

### Integración Técnica

- API REST
- JSON
- Integración asíncrona

### Flujo

1. Servicio finalizado
2. Generación prefactura
3. Transformación JSON
4. Envío a Siigo
5. Registro de ID transaccional

### Manejo de Errores

Si falla la comunicación:

- Cola de reintentos
- Alertas administrativas
- Reenvío manual

---

# MÓDULO 5 — MÉTRICAS AMBIENTALES, ECONÓMICAS Y REPORTES

## 5.1 Indicadores Ambientales

### Huella Hídrica Evitada

Cálculo de agua ahorrada en:

- Lavado en seco
- Tecnologías sin agua

### Huella de Carbono (CO2)

Variables:

- Tipo de vehículo
- Tipo de combustible

### Benchmark Ambiental

Comparativa contra:

- Recorrido estándar de 10 km

### Consumo de Insumos

Control de:

- Volumen
- Costes
- Contratos
- Sedes

---

## 5.2 Indicadores Económicos

### Margen Operativo

Ingreso por servicio menos:

- Costes operativos
- Costes de insumos

### Costes Fijos Imputados

Distribución proporcional de:

- Arriendo
- Servicios públicos
- Costes administrativos

### Productividad

Indicadores:

- Tiempo promedio
- Servicios por operador
- Rendimiento operativo

---

## 5.3 Sistema de Reportes

### Dashboards

- React
- KPIs dinámicos
- Visualización SaaS

### Filtros

- Fecha
- Contrato
- Cliente
- Sede
- Tipo de vehículo

### Exportación

- PDF
- Excel

### Acceso Basado en Roles

Visibilidad restringida según RBAC.

---

# REQUISITOS TRANSVERSALES

## Backend

- FastAPI
- REST API
- Arquitectura Event-Driven
- Arquitectura Stateless

## Frontend

- React
- Responsive Design
- Optimización móvil

## Base de Datos

- PostgreSQL
- Multi-Tenant
- Auditoría histórica
- Integridad transaccional

## Seguridad

- JWT
- RBAC
- Auditoría completa
- Restricción multi-tenant

## Infraestructura

- Docker
- Escalabilidad horizontal
- Servicios desacoplados

---

# REGLAS DE NEGOCIO CRÍTICAS

## Operación

- No se eliminan eventos
- No se editan eventos históricos
- Todo reproceso genera nuevos eventos
- Todo servicio finalizado requiere prefactura

## Contratos

- Validación automática de cupos
- Bloqueo automático por excedentes
- Restricción por contrato
- Restricción por tenant

## Auditoría

- Persistencia histórica completa
- Registro obligatorio de acciones
- Trazabilidad total

---

# DECLARACIÓN DE EXCLUSIONES (MODELO 100% REMOTO)

El alcance NO incluye:

- Configuración física de hardware
- Instalación de kioskos
- Instalación de tablets o PCs
- Redes o cableado
- Infraestructura local
- Soporte técnico presencial
- Viajes para capacitación in-situ

---

# CONCLUSIÓN

Este documento define el alcance técnico y funcional completo de PROGIO V1.1 y servirá como base para:

- Diseño de arquitectura backend
- Diseño de base de datos PostgreSQL
- Definición de endpoints FastAPI
- Diseño UX/UI en React
- Implementación del sistema multi-tenant
- Desarrollo del motor de eventos
- Construcción del sistema de auditoría
- Integración contable con Siigo
- Implementación de dashboards y reportería
- Validación contractual frente a INVERJAM SAS
