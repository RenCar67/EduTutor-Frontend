# Reglas Arquitectónicas de Caso 5 - EduTutor

## Principios Obligatorios

1. **Backend Oficial Productivo:**
   - La arquitectura oficial del backend está desarrollada en **Java con Spring Boot**.
   - La base de datos oficial es **Oracle Database XE**, desplegada en instancias dedicadas AWS EC2 (`ec2-apps`).
   - El ecosistema de mensajería utiliza **RabbitMQ** (tareas y comandos puntuales en `ec2-mq`) y **Apache Kafka** (eventos de dominio y auditoría en `ec2-kafka`).
   - La capa de seguridad e identidad está basada en **Azure AD (Microsoft Entra ID)** como IDaaS y **AWS API Gateway** con JWT Authorizer.

2. **Frontend Web Oficial (`artifacts/edututor`):**
   - El cliente web oficial es una SPA desarrollada en React 19 + Vite + Tailwind CSS v4.
   - Se comunica **exclusivamente con el BFF (`ms-edututor-bff`)**, típicamente en puerto `8080` o a través del API Gateway en AWS.
   - En producción, la variable de entorno `VITE_API_BASE_URL` define el endpoint del BFF.
   - **Propagación de Contexto Mandatoria:** Toda petición downstream hacia el BFF debe adjuntar:
     - `X-User-Id`: ID del usuario activo (ej. `student-001`, `tutor-003`, `admin-001`).
     - `X-User-Role`: Rol activo en mayúsculas canónicas (`ESTUDIANTE`, `TUTOR`, `ADMIN`).
     - `Authorization`: `Bearer <token>` (JWT de Azure AD).

3. **Propósito de `artifacts/api-server` y `lib/db`:**
   - Son componentes auxiliares estrictamente para **sandbox local, mocking de desarrollo y pruebas aisladas de UI**.
   - No representan la arquitectura productiva ni deben exponerse como tal.

4. **Máquina de Estados de Sesiones:**
   - Flujo: `SOLICITADA / AGENDADA` $\rightarrow$ `CONFIRMADA` $\rightarrow$ `ASIGNADA` $\rightarrow$ `EN_CURSO` $\rightarrow$ `FINALIZADA / REALIZADA` (y `CANCELADA` previo a inicio).
   - Invariante: Una sesión **NO** puede pasar a `EN_CURSO` sin tutor asignado previamente. Cualquier violación arroja `IllegalStateTransitionException` (HTTP 400/409).
