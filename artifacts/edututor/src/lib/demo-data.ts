import type {
  AnalyticsSummary,
  EventoAuditoria,
  EstadoSesion,
  MetricaHora,
  MetricaServicioDia,
  Servicio,
  Sesion,
} from '@workspace/api-client-react';

export const demoServices: Servicio[] = [
  {
    id: 'svc-calculo',
    nombre: 'Cálculo diferencial',
    descripcion: 'Acompañamiento para dominar límites, derivadas y aplicaciones con práctica guiada.',
    categoria: 'Matemáticas',
    tutorNombre: 'Valentina Ruiz',
    precioHora: 28,
    duracionMinutos: 60,
    estado: 'ACTIVO',
  },
  {
    id: 'svc-ingles',
    nombre: 'Inglés conversacional',
    descripcion: 'Sesiones de conversación enfocadas en fluidez, pronunciación y confianza.',
    categoria: 'Idiomas',
    tutorNombre: 'Andrés Molina',
    precioHora: 24,
    duracionMinutos: 45,
    estado: 'ACTIVO',
  },
  {
    id: 'svc-quimica',
    nombre: 'Química orgánica',
    descripcion: 'Resuelve problemas complejos con mapas visuales y explicaciones paso a paso.',
    categoria: 'Ciencias',
    tutorNombre: 'Sofía Benítez',
    precioHora: 31,
    duracionMinutos: 60,
    estado: 'ACTIVO',
  },
  {
    id: 'svc-estadistica',
    nombre: 'Estadística aplicada',
    descripcion: 'De los datos a las decisiones: probabilidad, regresión y lectura crítica.',
    categoria: 'Matemáticas',
    tutorNombre: 'Diego Serra',
    precioHora: 26,
    duracionMinutos: 60,
    estado: 'ACTIVO',
  },
  {
    id: 'svc-redaccion',
    nombre: 'Redacción académica',
    descripcion: 'Estructura argumentos claros y edita trabajos con criterio y precisión.',
    categoria: 'Humanidades',
    tutorNombre: 'Camila Torres',
    precioHora: 22,
    duracionMinutos: 50,
    estado: 'ACTIVO',
  },
];

const now = new Date();
const at = (days: number, hour: number, minute = 0) => {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

export const demoSessions: Sesion[] = [
  { id: 'SES-1048', servicioId: 'svc-calculo', estudianteId: 'STU-204', tutorId: 'T-18', tutorNombre: 'Valentina Ruiz', servicioNombre: 'Cálculo diferencial', fechaHora: at(0, 10, 30), estado: 'CONFIRMADA', observaciones: 'Repasar regla de la cadena antes del parcial.' },
  { id: 'SES-1047', servicioId: 'svc-ingles', estudianteId: 'STU-118', tutorId: 'T-09', tutorNombre: 'Andrés Molina', servicioNombre: 'Inglés conversacional', fechaHora: at(0, 13), estado: 'EN_CURSO', observaciones: 'Simulación de entrevista laboral.' },
  { id: 'SES-1046', servicioId: 'svc-quimica', estudianteId: 'STU-311', tutorId: 'T-23', tutorNombre: 'Sofía Benítez', servicioNombre: 'Química orgánica', fechaHora: at(-1, 17), estado: 'FINALIZADA', observaciones: 'Excelente progreso en nomenclatura.' },
  { id: 'SES-1045', servicioId: 'svc-estadistica', estudianteId: 'STU-087', tutorId: 'T-41', tutorNombre: 'Diego Serra', servicioNombre: 'Estadística aplicada', fechaHora: at(-1, 9), estado: 'FINALIZADA', observaciones: 'Entregó avance del proyecto.' },
  { id: 'SES-1044', servicioId: 'svc-redaccion', estudianteId: 'STU-191', tutorId: 'T-33', tutorNombre: 'Camila Torres', servicioNombre: 'Redacción académica', fechaHora: at(1, 16), estado: 'AGENDADA', observaciones: 'Primera revisión del ensayo.' },
  { id: 'SES-1043', servicioId: 'svc-calculo', estudianteId: 'STU-142', tutorId: 'T-18', tutorNombre: 'Valentina Ruiz', servicioNombre: 'Cálculo diferencial', fechaHora: at(-2, 11), estado: 'CANCELADA', observaciones: 'Reprogramar por examen universitario.' },
  { id: 'SES-1042', servicioId: 'svc-ingles', estudianteId: 'STU-263', tutorId: 'T-09', tutorNombre: 'Andrés Molina', servicioNombre: 'Inglés conversacional', fechaHora: at(2, 18), estado: 'AGENDADA', observaciones: 'Foco: presentaciones y networking.' },
];

export const demoSummary: AnalyticsSummary = {
  activeSessions: 18,
  completedSessions: 146,
  cancelledSessions: 9,
  weeklyRevenue: 4286,
  successRate: 94.2,
  sessionsChange: 12.8,
  revenueChange: 8.4,
};

export const demoHourly: MetricaHora[] = [
  { hora: '08:00', totalSesiones: 4, tasaExito: 92 },
  { hora: '09:00', totalSesiones: 8, tasaExito: 94 },
  { hora: '10:00', totalSesiones: 13, tasaExito: 96 },
  { hora: '11:00', totalSesiones: 10, tasaExito: 93 },
  { hora: '12:00', totalSesiones: 6, tasaExito: 91 },
  { hora: '13:00', totalSesiones: 8, tasaExito: 94 },
  { hora: '14:00', totalSesiones: 12, tasaExito: 95 },
  { hora: '15:00', totalSesiones: 15, tasaExito: 96 },
  { hora: '16:00', totalSesiones: 18, tasaExito: 97 },
  { hora: '17:00', totalSesiones: 15, tasaExito: 95 },
  { hora: '18:00', totalSesiones: 11, tasaExito: 94 },
  { hora: '19:00', totalSesiones: 7, tasaExito: 92 },
];

export const demoDaily: MetricaServicioDia[] = [
  { fecha: 'Lun 12', servicioId: 'svc-calculo', servicioNombre: 'Cálculo diferencial', ingresos: 624, sesionesTotales: 22 },
  { fecha: 'Mar 13', servicioId: 'svc-ingles', servicioNombre: 'Inglés conversacional', ingresos: 552, sesionesTotales: 24 },
  { fecha: 'Mié 14', servicioId: 'svc-quimica', servicioNombre: 'Química orgánica', ingresos: 744, sesionesTotales: 25 },
  { fecha: 'Jue 15', servicioId: 'svc-estadistica', servicioNombre: 'Estadística aplicada', ingresos: 598, sesionesTotales: 23 },
  { fecha: 'Vie 16', servicioId: 'svc-redaccion', servicioNombre: 'Redacción académica', ingresos: 484, sesionesTotales: 21 },
  { fecha: 'Sáb 17', servicioId: 'svc-calculo', servicioNombre: 'Cálculo diferencial', ingresos: 812, sesionesTotales: 27 },
  { fecha: 'Dom 18', servicioId: 'svc-ingles', servicioNombre: 'Inglés conversacional', ingresos: 472, sesionesTotales: 18 },
];

export const demoAudit: EventoAuditoria[] = [
  { id: 'AUD-8842', eventoTipo: 'SESSION_STATUS_CHANGED', origen: 'sessions-api', usuario: 'mariana.garcia', fechaTimestamp: at(0, 9, 42), payloadJson: { sessionId: 'SES-1047', from: 'CONFIRMADA', to: 'EN_CURSO' }, resultado: 'EXITOSO' },
  { id: 'AUD-8841', eventoTipo: 'SERVICE_SEARCHED', origen: 'catalog-ui', usuario: 'carlos.navarro', fechaTimestamp: at(0, 9, 16), payloadJson: { query: 'cálculo', results: 2 }, resultado: 'EXITOSO' },
  { id: 'AUD-8840', eventoTipo: 'SESSION_CREATED', origen: 'sessions-api', usuario: 'lucia.perez', fechaTimestamp: at(0, 8, 51), payloadJson: { sessionId: 'SES-1048', serviceId: 'svc-calculo' }, resultado: 'EXITOSO' },
  { id: 'AUD-8839', eventoTipo: 'EXPORT_REQUESTED', origen: 'analytics-ui', usuario: 'mariana.garcia', fechaTimestamp: at(-1, 18, 12), payloadJson: { range: 'last_7_days', format: 'csv' }, resultado: 'EXITOSO' },
  { id: 'AUD-8838', eventoTipo: 'SESSION_STATUS_CHANGED', origen: 'sessions-api', usuario: 'sistema', fechaTimestamp: at(-1, 17, 3), payloadJson: { sessionId: 'SES-1043', from: 'AGENDADA', to: 'CANCELADA' }, resultado: 'ERROR' },
];

export const lifecycle: Record<EstadoSesion, EstadoSesion[]> = {
  AGENDADA: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['EN_CURSO', 'CANCELADA'],
  EN_CURSO: ['FINALIZADA', 'CANCELADA'],
  FINALIZADA: [],
  CANCELADA: [],
};