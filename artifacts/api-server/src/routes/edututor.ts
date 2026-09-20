import { Router, type IRouter } from "express";
import {
  CreateSessionBody,
  GetAnalyticsSummaryResponse,
  GetDailyMetricsResponse,
  GetHourlyMetricsResponse,
  ListAuditEventsQueryParams,
  ListAuditEventsResponse,
  ListServicesQueryParams,
  ListServicesResponse,
  ListSessionsQueryParams,
  ListSessionsResponse,
  TransitionSessionBody,
  TransitionSessionParams,
} from "@workspace/api-zod";

type SessionStatus =
  | "AGENDADA"
  | "CONFIRMADA"
  | "EN_CURSO"
  | "FINALIZADA"
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
    estado: "CONFIRMADA" as SessionStatus,
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
    estado: "AGENDADA" as SessionStatus,
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
    estado: "FINALIZADA" as SessionStatus,
    observaciones: "Se completó la guía de equilibrio químico.",
  },
  {
    id: "ses-1005",
    servicioId: "svc-005",
    estudianteId: "student-003",
    tutorId: "tutor-005",
    tutorNombre: "Javiera Vidal",
    servicioNombre: "Escritura académica",
    fechaHora: "2026-09-18T16:00:00.000Z",
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
    eventoTipo: "CAMBIO_ESTADO",
    origen: "ms-edututor-sessions",
    usuario: "admin@edututor.cl",
    fechaTimestamp: "2026-09-20T16:42:00.000Z",
    payloadJson: {
      sessionId: "ses-1003",
      from: "CONFIRMADA",
      to: "EN_CURSO",
    },
    resultado: "EXITOSO" as const,
  },
  {
    id: "evt-9002",
    eventoTipo: "CREACION_SESION",
    origen: "ms-edututor-bff",
    usuario: "student@edututor.cl",
    fechaTimestamp: "2026-09-20T15:10:00.000Z",
    payloadJson: {
      sessionId: "ses-1002",
      serviceId: "svc-001",
      channel: "web",
    },
    resultado: "EXITOSO" as const,
  },
  {
    id: "evt-9003",
    eventoTipo: "CANCELACION",
    origen: "ms-edututor-sessions",
    usuario: "student-003",
    fechaTimestamp: "2026-09-20T13:28:00.000Z",
    payloadJson: {
      sessionId: "ses-1005",
      reason: "Cambio de horario",
    },
    resultado: "EXITOSO" as const,
  },
  {
    id: "evt-9004",
    eventoTipo: "CAMBIO_ESTADO",
    origen: "ms-edututor-sessions",
    usuario: "tutor-002",
    fechaTimestamp: "2026-09-20T11:05:00.000Z",
    payloadJson: {
      sessionId: "ses-1003",
      from: "AGENDADA",
      to: "FINALIZADA",
      error: "IllegalStateTransitionException",
    },
    resultado: "ERROR" as const,
  },
];

const hourlyMetrics = [
  { hora: "08:00", totalSesiones: 8, tasaExito: 92 },
  { hora: "10:00", totalSesiones: 14, tasaExito: 96 },
  { hora: "12:00", totalSesiones: 11, tasaExito: 94 },
  { hora: "14:00", totalSesiones: 18, tasaExito: 97 },
  { hora: "16:00", totalSesiones: 22, tasaExito: 95 },
  { hora: "18:00", totalSesiones: 27, tasaExito: 93 },
  { hora: "20:00", totalSesiones: 16, tasaExito: 91 },
];

const dailyMetrics = [
  {
    fecha: "2026-09-14",
    servicioId: "svc-003",
    servicioNombre: "Programación desde cero",
    ingresos: 384,
    sesionesTotales: 12,
  },
  {
    fecha: "2026-09-15",
    servicioId: "svc-001",
    servicioNombre: "Álgebra y cálculo",
    ingresos: 312,
    sesionesTotales: 13,
  },
  {
    fecha: "2026-09-16",
    servicioId: "svc-002",
    servicioNombre: "Inglés conversacional",
    ingresos: 280,
    sesionesTotales: 14,
  },
  {
    fecha: "2026-09-17",
    servicioId: "svc-004",
    servicioNombre: "Química universitaria",
    ingresos: 336,
    sesionesTotales: 12,
  },
  {
    fecha: "2026-09-18",
    servicioId: "svc-005",
    servicioNombre: "Escritura académica",
    ingresos: 264,
    sesionesTotales: 12,
  },
  {
    fecha: "2026-09-19",
    servicioId: "svc-003",
    servicioNombre: "Programación desde cero",
    ingresos: 448,
    sesionesTotales: 14,
  },
  {
    fecha: "2026-09-20",
    servicioId: "svc-001",
    servicioNombre: "Álgebra y cálculo",
    ingresos: 360,
    sesionesTotales: 15,
  },
];

const allowedTransitions: Record<SessionStatus, SessionStatus[]> = {
  AGENDADA: ["CONFIRMADA", "CANCELADA"],
  CONFIRMADA: ["EN_CURSO", "CANCELADA"],
  EN_CURSO: ["FINALIZADA"],
  FINALIZADA: [],
  CANCELADA: [],
};

function createAuditEvent(eventoTipo: string, payloadJson: Record<string, unknown>) {
  auditEvents.unshift({
    id: `evt-${Date.now()}`,
    eventoTipo,
    origen: "ms-edututor-bff",
    usuario: "demo-user",
    fechaTimestamp: new Date().toISOString(),
    payloadJson,
    resultado: "EXITOSO",
  });
}

const router: IRouter = Router();

router.get("/v1/services", (req, res) => {
  const parsed = ListServicesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Parámetros de catálogo inválidos." });
    return;
  }

  const { search, category, maxPrice } = parsed.data;
  const normalizedSearch = search?.toLowerCase();
  const filtered = services.filter((service) => {
    const matchesSearch =
      !normalizedSearch ||
      `${service.nombre} ${service.descripcion} ${service.tutorNombre}`
        .toLowerCase()
        .includes(normalizedSearch);
    const matchesCategory = !category || service.categoria === category;
    const matchesPrice =
      maxPrice === undefined || service.precioHora <= Number(maxPrice);
    return matchesSearch && matchesCategory && matchesPrice;
  });

  res.json(ListServicesResponse.parse(filtered));
});

router.get("/v1/sessions", (req, res) => {
  const parsed = ListSessionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Parámetros de sesiones inválidos." });
    return;
  }

  const { status, studentId } = parsed.data;
  const filtered = sessions.filter(
    (session) =>
      (!status || session.estado === status) &&
      (!studentId || session.estudianteId === studentId),
  );
  res.json(ListSessionsResponse.parse(filtered));
});

router.post("/v1/sessions", (req, res) => {
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
    tutorNombre: service.tutorNombre,
    servicioNombre: service.nombre,
    fechaHora: parsed.data.fechaHora.toISOString(),
    estado: "AGENDADA" as SessionStatus,
    observaciones: parsed.data.observaciones ?? "",
  };
  sessions.unshift(session);
  createAuditEvent("CREACION_SESION", {
    sessionId: session.id,
    serviceId: session.servicioId,
  });
  res.status(201).json(ListSessionsResponse.element.parse(session));
});

router.patch("/v1/sessions/:id/status", (req, res) => {
  const params = TransitionSessionParams.safeParse(req.params);
  const body = TransitionSessionBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "La transición solicitada es inválida." });
    return;
  }

  const session = sessions.find((item) => item.id === params.data.id);
  if (!session) {
    res.status(404).json({ error: "No se encontró la sesión." });
    return;
  }

  if (!allowedTransitions[session.estado].includes(body.data.estado)) {
    res.status(409).json({
      error: `IllegalStateTransitionException: no se puede pasar de ${session.estado} a ${body.data.estado}.`,
    });
    return;
  }

  const previousStatus = session.estado;
  session.estado = body.data.estado;
  createAuditEvent("CAMBIO_ESTADO", {
    sessionId: session.id,
    from: previousStatus,
    to: session.estado,
  });
  res.json(ListSessionsResponse.element.parse(session));
});

router.get("/v1/analytics/summary", (_req, res) => {
  res.json(
    GetAnalyticsSummaryResponse.parse({
      activeSessions: sessions.filter((s) =>
        ["AGENDADA", "CONFIRMADA", "EN_CURSO"].includes(s.estado),
      ).length,
      completedSessions: 48,
      cancelledSessions: sessions.filter((s) => s.estado === "CANCELADA").length,
      weeklyRevenue: dailyMetrics.reduce((sum, metric) => sum + metric.ingresos, 0),
      successRate: 94.6,
      sessionsChange: 12.8,
      revenueChange: 8.4,
    }),
  );
});

router.get("/v1/analytics/hourly", (_req, res) => {
  res.json(GetHourlyMetricsResponse.parse(hourlyMetrics));
});

router.get("/v1/analytics/daily", (_req, res) => {
  res.json(GetDailyMetricsResponse.parse(dailyMetrics));
});

router.get("/v1/audit-events", (req, res) => {
  const parsed = ListAuditEventsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Parámetros de auditoría inválidos." });
    return;
  }

  const { eventType, limit } = parsed.data;
  const filtered = auditEvents
    .filter((event) => !eventType || event.eventoTipo === eventType)
    .slice(0, limit ?? 50);
  res.json(ListAuditEventsResponse.parse(filtered));
});

export default router;