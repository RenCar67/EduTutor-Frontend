/**
 * ============================================================================
 * MOCK SERVER AUXILIAR — DESARROLLO LOCAL Y SANDBOX OFFLINE (CASO 5)
 * ============================================================================
 * AVISO ARQUITECTÓNICO:
 * Este servicio Express en memoria es EXCLUSIVAMENTE una herramienta auxiliar
 * de sandbox para desarrollo frontend sin conexión a la infraestructura en AWS.
 *
 * En entornos de pruebas integradas y producción, el backend oficial está
 * desarrollado en Java / Spring Boot sobre AWS EC2 (ec2-apps), con base de
 * datos Oracle Database XE, RabbitMQ (ec2-mq) y Apache Kafka (ec2-kafka).
 * ============================================================================
 */

import { Router, type IRouter } from "express";
import {
  CreateSessionBody,
  ListAuditEventsQueryParams,
  ListAuditEventsResponse,
  ListServicesResponse,
  ListSessionsQueryParams,
  ListSessionsResponse,
  GetReportKpisResponse,
  GetTopServicesResponse,
  TransitionSessionBody,
  TransitionSessionParams,
} from "@workspace/api-zod";

// SOLICITADA -> CONFIRMADA -> ASIGNADA -> EN_CURSO -> REALIZADA, o CANCELADA
// desde cualquier estado previo a EN_CURSO (calca ms-edututor-sessions real).
type SessionStatus =
  | "SOLICITADA"
  | "CONFIRMADA"
  | "ASIGNADA"
  | "EN_CURSO"
  | "REALIZADA"
  | "CANCELADA";

const services = [
  {
    id: "svc-001",
    nombre: "Álgebra y cálculo",
    descripcion:
      "Acompañamiento práctico para dominar funciones, límites y resolución de problemas.",
    categoria: "Matemáticas",
    tutorNombre: "Valentina Soto",
    precioHora: 24,
    duracionMinutos: 60,
    estado: "ACTIVO" as const,
    cupoTotal: 10,
    cupoDisponible: 6,
    bloqueHorario: "Lun-Mié 15:00-16:00",
  },
  {
    id: "svc-002",
    nombre: "Inglés conversacional",
    descripcion:
      "Sesiones enfocadas en fluidez, confianza y vocabulario para contextos reales.",
    categoria: "Idiomas",
    tutorNombre: "Tomás Rojas",
    precioHora: 20,
    duracionMinutos: 45,
    estado: "ACTIVO" as const,
    cupoTotal: 12,
    cupoDisponible: 8,
    bloqueHorario: "Mar-Jue 13:00-13:45",
  },
  {
    id: "svc-003",
    nombre: "Programación desde cero",
    descripcion:
      "Aprende a pensar como desarrollador y construye tus primeros proyectos en JavaScript.",
    categoria: "Tecnología",
    tutorNombre: "Camila Pérez",
    precioHora: 32,
    duracionMinutos: 60,
    estado: "ACTIVO" as const,
    cupoTotal: 8,
    cupoDisponible: 3,
    bloqueHorario: "Vie 17:00-18:00",
  },
  {
    id: "svc-004",
    nombre: "Química universitaria",
    descripcion:
      "Revisión guiada de estequiometría, equilibrio químico y preparación de evaluaciones.",
    categoria: "Ciencias",
    tutorNombre: "Diego Muñoz",
    precioHora: 28,
    duracionMinutos: 60,
    estado: "ACTIVO" as const,
    cupoTotal: 10,
    cupoDisponible: 5,
    bloqueHorario: "Lun-Vie 09:00-10:00",
  },
  {
    id: "svc-005",
    nombre: "Escritura académica",
    descripcion:
      "Estructura tus ensayos, mejora tus argumentos y cita tus fuentes con claridad.",
    categoria: "Humanidades",
    tutorNombre: "Javiera Vidal",
    precioHora: 22,
    duracionMinutos: 45,
    estado: "ACTIVO" as const,
    cupoTotal: 9,
    cupoDisponible: 7,
    bloqueHorario: "Mié-Vie 16:00-16:45",
  },
];

const sessions = [
  {
    id: "ses-1001",
    servicioId: "svc-003",
    estudianteId: "student-001",
    tutorId: "tutor-003",
    tutorNombre: "Camila Pérez",
    servicioNombre: "Programación desde cero",
    fechaHora: "2026-09-21T10:00:00.000Z",
    fechaSolicitud: "2026-09-18T10:00:00.000Z",
    estado: "ASIGNADA" as SessionStatus,
    observaciones: "Revisar arrays y funciones antes del proyecto final.",
  },
  {
    id: "ses-1002",
    servicioId: "svc-001",
    estudianteId: "student-001",
    tutorId: "tutor-001",
    tutorNombre: "Valentina Soto",
    servicioNombre: "Álgebra y cálculo",
    fechaHora: "2026-09-21T15:30:00.000Z",
    fechaSolicitud: "2026-09-19T09:00:00.000Z",
    estado: "SOLICITADA" as SessionStatus,
    observaciones: "Preparación para control de derivadas.",
  },
  {
    id: "ses-1003",
    servicioId: "svc-002",
    estudianteId: "student-002",
    tutorId: "tutor-002",
    tutorNombre: "Tomás Rojas",
    servicioNombre: "Inglés conversacional",
    fechaHora: "2026-09-20T18:00:00.000Z",
    fechaSolicitud: "2026-09-17T12:00:00.000Z",
    estado: "EN_CURSO" as SessionStatus,
    observaciones: "Role-play de entrevista laboral.",
  },
  {
    id: "ses-1004",
    servicioId: "svc-004",
    estudianteId: "student-001",
    tutorId: "tutor-004",
    tutorNombre: "Diego Muñoz",
    servicioNombre: "Química universitaria",
    fechaHora: "2026-09-19T12:00:00.000Z",
    fechaSolicitud: "2026-09-15T08:00:00.000Z",
    estado: "REALIZADA" as SessionStatus,
    observaciones: "Se completó la guía de equilibrio químico.",
  },
  {
    id: "ses-1005",
    servicioId: "svc-005",
    estudianteId: "student-003",
    tutorId: undefined as string | undefined,
    tutorNombre: undefined as string | undefined,
    servicioNombre: "Escritura académica",
    fechaHora: "2026-09-18T16:00:00.000Z",
    fechaSolicitud: "2026-09-16T08:00:00.000Z",
    estado: "CANCELADA" as SessionStatus,
    observaciones: "Cancelada por el estudiante con 24 horas de anticipación.",
  },
];

const auditEvents: Array<{
  id: string;
  eventoTipo: string;
  origen: string;
  usuario: string;
  fechaTimestamp: string;
  payloadJson: Record<string, unknown>;
  resultado: "EXITOSO" | "ERROR";
}> = [
  {
    id: "evt-9001",
    eventoTipo: "SESSION_STATE_CHANGED",
    origen: "ms-edututor-sessions",
    usuario: "student-002",
    fechaTimestamp: "2026-09-20T16:42:00.000Z",
    payloadJson: { sessionId: "ses-1003", estadoAnterior: "CONFIRMADA", estadoNuevo: "EN_CURSO", tutorId: "tutor-002" },
    resultado: "EXITOSO",
  },
  {
    id: "evt-9002",
    eventoTipo: "SESSION_CREATED",
    origen: "ms-edututor-sessions",
    usuario: "student-001",
    fechaTimestamp: "2026-09-20T15:10:00.000Z",
    payloadJson: { sessionId: "ses-1002", servicioId: "svc-001" },
    resultado: "EXITOSO",
  },
  {
    id: "evt-9003",
    eventoTipo: "SESSION_STATE_CHANGED",
    origen: "ms-edututor-sessions",
    usuario: "student-003",
    fechaTimestamp: "2026-09-20T13:28:00.000Z",
    payloadJson: { sessionId: "ses-1005", estadoAnterior: "SOLICITADA", estadoNuevo: "CANCELADA", tutorId: "" },
    resultado: "EXITOSO",
  },
];

// Aproxima lo que ms-edututor-report calcula en /api/report/kpis: conteo por
// hora y gauge de estados activos, sobre el rango solicitado (no persistido,
// solo demo).
const hourlyMetrics = [
  { hora: "2026-09-21T08:00:00.000Z", creadas: 8, realizadas: 7, canceladas: 1 },
  { hora: "2026-09-21T10:00:00.000Z", creadas: 14, realizadas: 13, canceladas: 0 },
  { hora: "2026-09-21T12:00:00.000Z", creadas: 11, realizadas: 10, canceladas: 1 },
  { hora: "2026-09-21T14:00:00.000Z", creadas: 18, realizadas: 16, canceladas: 1 },
  { hora: "2026-09-21T16:00:00.000Z", creadas: 22, realizadas: 20, canceladas: 1 },
  { hora: "2026-09-21T18:00:00.000Z", creadas: 27, realizadas: 24, canceladas: 2 },
  { hora: "2026-09-21T20:00:00.000Z", creadas: 16, realizadas: 14, canceladas: 1 },
];

const topServices = [
  { servicioId: "svc-003", totalSolicitudes: 14 },
  { servicioId: "svc-001", totalSolicitudes: 13 },
  { servicioId: "svc-002", totalSolicitudes: 12 },
  { servicioId: "svc-004", totalSolicitudes: 10 },
  { servicioId: "svc-005", totalSolicitudes: 8 },
];

const allowedTransitions: Record<SessionStatus, SessionStatus[]> = {
  SOLICITADA: ["CONFIRMADA", "CANCELADA"],
  CONFIRMADA: ["ASIGNADA", "CANCELADA"],
  ASIGNADA: ["EN_CURSO", "CANCELADA"],
  EN_CURSO: ["REALIZADA"],
  REALIZADA: [],
  CANCELADA: [],
};

function createAuditEvent(eventoTipo: string, payloadJson: Record<string, unknown>) {
  auditEvents.unshift({
    id: `evt-${Date.now()}`,
    eventoTipo,
    origen: "ms-edututor-sessions",
    usuario: "demo-user",
    fechaTimestamp: new Date().toISOString(),
    payloadJson,
    resultado: "EXITOSO",
  });
}

const router: IRouter = Router();

// Log context headers injected by frontend
router.use((req, _res, next) => {
  const userId = req.headers["x-user-id"] || "ANONYMOUS";
  const userRole = req.headers["x-user-role"] || "NONE";
  const auth = req.headers["authorization"] ? "Bearer ***" : "NONE";
  // Development log to confirm RequireBffContextFilter compliance
  if (process.env.NODE_ENV !== "test") {
    console.log(`[BFF-Mock] ${req.method} ${req.originalUrl} | X-User-Id: ${userId} | X-User-Role: ${userRole} | Auth: ${auth}`);
  }
  next();
});

// ============================================================================
// 1. CATALOG CONTROLLER (/api/catalog/services)
// ============================================================================
router.get("/catalog/services", (_req, res) => {
  res.json(ListServicesResponse.parse(services));
});

// ============================================================================
// 2. SESSIONS CONTROLLER (/api/sessions/...)
// ============================================================================
router.get("/sessions", (req, res) => {
  const parsed = ListSessionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Parámetros de sesiones inválidos." });
    return;
  }

  const { status } = parsed.data;
  const filtered = sessions.filter((session) => !status || session.estado === status);
  res.json(ListSessionsResponse.parse(filtered));
});

router.post("/sessions", (req, res) => {
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Los datos de la sesión son inválidos." });
    return;
  }

  const service = services.find((item) => item.id === parsed.data.servicioId);
  if (!service) {
    res.status(404).json({ error: "No se encontró el servicio solicitado." });
    return;
  }

  const session = {
    id: `ses-${Date.now()}`,
    servicioId: service.id,
    estudianteId: parsed.data.estudianteId,
    tutorId: parsed.data.tutorId,
    tutorNombre: parsed.data.tutorId ? service.tutorNombre : undefined,
    servicioNombre: service.nombre,
    fechaHora: parsed.data.fechaHora?.toISOString() ?? new Date().toISOString(),
    fechaSolicitud: new Date().toISOString(),
    // Nace SOLICITADA sin importar si vino un tutor preferido, tal como el
    // backend real — un tutorId pre-elegido no salta la máquina de estados.
    estado: "SOLICITADA" as SessionStatus,
    observaciones: parsed.data.observaciones ?? "",
  };
  sessions.unshift(session);
  createAuditEvent("SESSION_CREATED", {
    sessionId: session.id,
    servicioId: session.servicioId,
  });
  res.status(201).json(ListSessionsResponse.element.parse(session));
});

router.put("/sessions/:id/status", (req, res) => {
  const params = TransitionSessionParams.safeParse(req.params);
  const body = TransitionSessionBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message: "La transición solicitada es inválida.",
      path: req.originalUrl,
    });
    return;
  }

  const session = sessions.find((item) => item.id === params.data.id);
  if (!session) {
    res.status(404).json({
      status: 404,
      error: "Not Found",
      message: "No se encontró la sesión solicitada.",
      path: req.originalUrl,
    });
    return;
  }

  if (body.data.status === "ASIGNADA" && body.data.tutorId) {
    session.tutorId = body.data.tutorId;
  }

  // Invariante real de ms-edututor-sessions: no se puede pasar a EN_CURSO sin tutor asignado.
  if (body.data.status === "EN_CURSO" && !session.tutorId) {
    res.status(409).json({
      status: 409,
      error: "Conflict",
      message: "IllegalStateTransitionException: No se puede iniciar una sesión sin tutor previamente asignado y confirmado.",
      path: req.originalUrl,
    });
    return;
  }

  if (!allowedTransitions[session.estado].includes(body.data.status)) {
    res.status(409).json({
      status: 409,
      error: "Conflict",
      message: `IllegalStateTransitionException: No se puede pasar del estado ${session.estado} al estado ${body.data.status}.`,
      path: req.originalUrl,
    });
    return;
  }

  const estadoAnterior = session.estado;
  session.estado = body.data.status;
  createAuditEvent("SESSION_STATE_CHANGED", {
    sessionId: session.id,
    estadoAnterior,
    estadoNuevo: session.estado,
    tutorId: session.tutorId ?? "",
  });
  res.json(ListSessionsResponse.element.parse(session));
});

// ============================================================================
// 3. REPORT CONTROLLER (/api/report/...)
// ============================================================================
router.get("/report/kpis", (req, res) => {
  const range = typeof req.query.range === "string" ? req.query.range : "last24h";
  const creadas = hourlyMetrics.reduce((sum, item) => sum + item.creadas, 0);
  const realizadas = hourlyMetrics.reduce((sum, item) => sum + item.realizadas, 0);
  res.json(
    GetReportKpisResponse.parse({
      range,
      sesionesPorHora: hourlyMetrics,
      tasaAsistencia: creadas === 0 ? 0 : realizadas / creadas,
      estadosActivos: {
        SOLICITADA: sessions.filter((s) => s.estado === "SOLICITADA").length,
        CONFIRMADA: sessions.filter((s) => s.estado === "CONFIRMADA").length,
        ASIGNADA: sessions.filter((s) => s.estado === "ASIGNADA").length,
        EN_CURSO: sessions.filter((s) => s.estado === "EN_CURSO").length,
        REALIZADA: sessions.filter((s) => s.estado === "REALIZADA").length,
        CANCELADA: sessions.filter((s) => s.estado === "CANCELADA").length,
      },
    }),
  );
});

router.get("/report/top-services", (_req, res) => {
  res.json(GetTopServicesResponse.parse(topServices));
});

// ============================================================================
// 4. AUDIT CONTROLLER (/api/audit/timeline)
// ============================================================================
router.get("/audit/timeline", (req, res) => {
  const parsed = ListAuditEventsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Parámetros de auditoría inválidos." });
    return;
  }

  const { usuario, tipo } = parsed.data;
  const filtered = auditEvents.filter(
    (event) => (!tipo || event.eventoTipo === tipo) && (!usuario || event.usuario === usuario),
  );
  res.json(ListAuditEventsResponse.parse(filtered));
});

export default router;
