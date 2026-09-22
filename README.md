# EduTutor Dashboard — Consola de Operaciones

Plataforma web oficial para la gestión, reserva, supervisión y analítica de tutorías académicas correspondiente al **Caso 5 - EduTutor: Plataforma de Tutorías Distribuida**.

---

## 🏛️ Arquitectura del Sistema (Caso 5)

La plataforma EduTutor opera bajo una arquitectura distribuida de microservicios basada en eventos (Event-Driven & CQRS), desplegada en AWS:

```plaintext
[Cliente Web (artifacts/edututor)]
       │  HTTPS + Bearer JWT (Azure AD) + X-User-Id + X-User-Role
       ▼
[AWS API Gateway - JWT Authorizer]  (IDaaS: Azure AD / Microsoft Entra ID)
       │  VPC Link Privado
       ▼
[ms-edututor-bff]  (Spring Boot Resource Server · Puerto 8080 en AWS ec2-apps)
   ├───> [ms-edututor-catalog]   (Spring Boot · Oracle Database XE)
   ├───> [ms-edututor-sessions]  (Spring Boot · Oracle Database XE)
   │        │
   │        ├──> [RabbitMQ (ec2-mq)]   ──> [ms-edututor-notify] (Email/Push/Tickets)
   │        └──> [Kafka (ec2-kafka)]   ──> [ms-edututor-audit]  (Oracle XE)
   │                                   ──> [ms-edututor-report] (Oracle XE)
```

### 1. Backend Oficial Productivo
- **Lenguaje y Framework:** Java / Spring Boot 3.x.
- **Base de Datos:** **Oracle Database XE** con esquemas desacoplados por microservicio de dominio.
- **Infraestructura AWS EC2:**
  - `ec2-apps`: `ms-edututor-bff`, `ms-edututor-catalog`, `ms-edututor-sessions`, `ms-edututor-notify`, `ms-edututor-audit`, `ms-edututor-report`.
  - `ec2-mq`: Clúster de RabbitMQ (colas `q.cmd.email`, `q.cmd.session`, `q.cmd.certificate` y DLQs correspondientes).
  - `ec2-kafka`: Clúster de Apache Kafka + Zookeeper (`sessions.events`, `audit.timeline` y DLTs).
- **Seguridad e Identidad:** Azure AD (IDaaS) con flujo PKCE y AWS API Gateway con JWT Authorizer.

### 2. Frontend Oficial (`artifacts/edututor`)
- **Tecnologías:** React 19, Vite, Tailwind CSS v4, Wouter, TanStack Query v5, Lucide Icons, Framer Motion.
- **Consumo Exclusivo:** El frontend se comunica **únicamente** con el BFF (`ms-edututor-bff`).
- **Filtro de Contexto downstream (`RequireBffContextFilter`):** Toda petición hacia el BFF inyecta obligatoriamente:
  - `X-User-Id`: Identificador del usuario en sesión (ej. `student-001`, `tutor-003`, `admin-001`).
  - `X-User-Role`: Rol activo en mayúsculas canónicas (`ESTUDIANTE`, `TUTOR`, `ADMIN`).
  - `Authorization`: `Bearer <token>` (JWT de Azure AD / Entra ID).

### 3. Mock Server y Herramientas Locales (`artifacts/api-server` & `lib/db`)
> [!NOTE]
> Los módulos `artifacts/api-server` (Express 5) y `lib/db` (PostgreSQL / Drizzle) son **herramientas auxiliares de mocking y sandbox**.
> Su propósito exclusivo es permitir el desarrollo de la interfaz de usuario de forma aislada y sin conexión a AWS, simulando los 4 controladores del BFF de Spring Boot.

---

## 📁 Estructura del Monorepo

```plaintext
EduTutor-Dashboard/
├── artifacts/
│   ├── edututor/          # ⭐ CLIENTE WEB OFICIAL (React 19 + Vite + Tailwind v4)
│   ├── api-server/        # 🛠️ MOCK SERVER AUXILIAR (Express local para desarrollo offline)
│   └── mockup-sandbox/    # 🎨 Sandbox visual de maquetación y diseño de componentes
├── lib/
│   ├── api-spec/          # Contrato OpenAPI (fuente de verdad alineada con los 4 controladores BFF)
│   ├── api-zod/           # Validaciones Zod tipadas autogeneradas (Orval)
│   ├── api-client-react/  # Cliente HTTP e interceptor con inyección de cabeceras de contexto
│   └── db/                # Sandbox de base de datos local para el Mock Server
├── docs/                  # Especificaciones del Caso 5 y Documento de Arquitectura
└── scripts/               # Utilidades de compilación y verificación
```

---

## ⚙️ Configuración y Variables de Entorno

Para configurar el cliente web oficial hacia el entorno correspondiente:

```bash
# artifacts/edututor/.env.local (o variables de entorno del sistema)

# 1. Conexión al BFF Spring Boot:
# Producción / AWS (conecta directamente al BFF Spring Boot o API Gateway):
VITE_API_BASE_URL=http://ec2-apps:8080/api

# 2. Autenticación Institucional con Azure AD / Microsoft Entra ID (OIDC + PKCE):
VITE_AZURE_CLIENT_ID=00000000-0000-0000-0000-000000000000
VITE_AZURE_TENANT_ID=00000000-0000-0000-0000-000000000000
VITE_AZURE_REDIRECT_URI=http://localhost:5173
VITE_AZURE_BFF_SCOPE=api://00000000-0000-0000-0000-000000000000/access_as_user
```

### Modos de Autenticación Soportados
1. **Azure AD / Microsoft Entra ID**: Inicia sesión vía OAuth 2.0 / OpenID Connect con PKCE. Extrae claims (`oid`/`sub` como `userId`, `roles` de aplicación de Azure como `ESTUDIANTE`, `TUTOR`, `ADMIN`) y adquiere tokens de acceso para la cabecera `Authorization: Bearer <token>`.
2. **Modo de Evaluación (Mock)**: En la pantalla de login (`/login`) permite ingresar instantáneamente como **Estudiante**, **Tutor** o **Administrador** con un solo clic, sin requerir credenciales activas de Microsoft en el Tenant.

---

## 🚀 Instalación y Ejecución Local

### 1. Instalar Dependencias
```bash
npx pnpm install
```

### 2. Levantar el Frontend Oficial EduTutor
```bash
npx pnpm --filter @workspace/edututor run dev
```
Disponible en: `http://localhost:5173`.
Incluye conmutador en tiempo real de **Mock Mode** (`ON` para datos locales, `OFF` para sincronización con BFF) y selector de roles (`Estudiante`, `Tutor`, `Administrador`) que actualiza dinámicamente las cabeceras `X-User-Id` y `X-User-Role`.

### 3. (Opcional) Levantar el Mock Server Auxiliar
```bash
npx pnpm --filter @workspace/api-server run dev
```
Servidor Express en puerto `5000` con respuestas simuladas de los 4 controladores BFF.

### 4. Compilación y Validación de Tipos
```bash
# Validar tipado TypeScript en todo el monorepo
npx pnpm run typecheck

# Compilar todos los artefactos para producción
npx pnpm run build
```

---

## 📋 Controladores Expuestos por el BFF (`ms-edututor-bff`)

1. **Catálogo (`/api/v1/catalog/...`):** Consulta y administración de asignaturas, tutores y bloques horarios.
2. **Sesiones (`/api/v1/sessions/...`):** Agendamiento y transiciones de la máquina de estados (`AGENDADA` $\rightarrow$ `CONFIRMADA` $\rightarrow$ `EN_CURSO` $\rightarrow$ `FINALIZADA` / `CANCELADA`). Invariante: no se puede iniciar sesión sin tutor asignado previo (`IllegalStateTransitionException` mapeada a HTTP 409).
3. **Reportería (`/api/v1/report/...`):** Métricas analíticas alimentadas por streaming de Kafka (`EstadoGauge`, `MetricaHora`, `MetricaServicioDia`).
4. **Auditoría (`/api/v1/audit/...`):** Bitácora inmutable de eventos de dominio (`EventoAuditoria`).
