import type {
  EventoAuditoria,
  EstadoSesion,
  ReportKpis,
  TopServicio,
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
    cupoTotal: 10,
    cupoDisponible: 4,
    bloqueHorario: 'Lun-Mié 15:00-16:00',
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
    cupoTotal: 12,
    cupoDisponible: 7,
    bloqueHorario: 'Mar-Jue 13:00-13:45',
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
    cupoTotal: 8,
    cupoDisponible: 2,
    bloqueHorario: 'Vie 17:00-18:00',
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
    cupoTotal: 10,
    cupoDisponible: 5,
    bloqueHorario: 'Lun-Vie 09:00-10:00',
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
    cupoTotal: 9,
    cupoDisponible: 6,
    bloqueHorario: 'Mié-Vie 16:00-16:50',
  },
];

const now = new Date();
const at = (days: number, hour: number, minute = 0) => {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

// Estados reales de ms-edututor-sessions: SOLICITADA -> CONFIRMADA -> ASIGNADA
// -> EN_CURSO -> REALIZADA, o CANCELADA antes de EN_CURSO.
export const demoSessions: Sesion[] = [
  { id: 'SES-1048', servicioId: 'svc-calculo', estudianteId: 'STU-204', tutorId: 'T-18', tutorNombre: 'Valentina Ruiz', servicioNombre: 'Cálculo diferencial', fechaHora: at(0, 10, 30), estado: 'ASIGNADA', observaciones: 'Repasar regla de la cadena antes del parcial.' },
  { id: 'SES-1047', servicioId: 'svc-ingles', estudianteId: 'STU-118', tutorId: 'T-09', tutorNombre: 'Andrés Molina', servicioNombre: 'Inglés conversacional', fechaHora: at(0, 13), estado: 'EN_CURSO', observaciones: 'Simulación de entrevista laboral.' },
  { id: 'SES-1046', servicioId: 'svc-quimica', estudianteId: 'STU-311', tutorId: 'T-23', tutorNombre: 'Sofía Benítez', servicioNombre: 'Química orgánica', fechaHora: at(-1, 17), estado: 'REALIZADA', observaciones: 'Excelente progreso en nomenclatura.' },
  { id: 'SES-1045', servicioId: 'svc-estadistica', estudianteId: 'STU-087', tutorId: 'T-41', tutorNombre: 'Diego Serra', servicioNombre: 'Estadística aplicada', fechaHora: at(-1, 9), estado: 'REALIZADA', observaciones: 'Entregó avance del proyecto.' },
  { id: 'SES-1044', servicioId: 'svc-redaccion', estudianteId: 'STU-191', tutorId: 'T-33', tutorNombre: 'Camila Torres', servicioNombre: 'Redacción académica', fechaHora: at(1, 16), estado: 'CONFIRMADA', observaciones: 'Primera revisión del ensayo.' },
  { id: 'SES-1043', servicioId: 'svc-calculo', estudianteId: 'STU-142', tutorId: 'T-18', tutorNombre: 'Valentina Ruiz', servicioNombre: 'Cálculo diferencial', fechaHora: at(-2, 11), estado: 'CANCELADA', observaciones: 'Reprogramar por examen universitario.' },
  { id: 'SES-1042', servicioId: 'svc-ingles', estudianteId: 'STU-263', tutorId: undefined, tutorNombre: undefined, servicioNombre: 'Inglés conversacional', fechaHora: at(2, 18), estado: 'SOLICITADA', observaciones: 'Foco: presentaciones y networking.' },
];

// Refleja la forma real de GET /api/report/kpis?range=... (ms-edututor-report).
export const demoKpis: ReportKpis = {
  range: 'last24h',
  tasaAsistencia: 0.942,
  estadosActivos: {
    SOLICITADA: 4,
    CONFIRMADA: 6,
    ASIGNADA: 5,
    EN_CURSO: 3,
    REALIZADA: 146,
    CANCELADA: 9,
  },
  sesionesPorHora: [
    { hora: at(0, 8), creadas: 4, realizadas: 4, canceladas: 0 },
    { hora: at(0, 9), creadas: 8, realizadas: 7, canceladas: 1 },
    { hora: at(0, 10), creadas: 13, realizadas: 12, canceladas: 0 },
    { hora: at(0, 11), creadas: 10, realizadas: 9, canceladas: 1 },
    { hora: at(0, 12), creadas: 6, realizadas: 5, canceladas: 0 },
    { hora: at(0, 13), creadas: 8, realizadas: 8, canceladas: 0 },
    { hora: at(0, 14), creadas: 12, realizadas: 11, canceladas: 1 },
    { hora: at(0, 15), creadas: 15, realizadas: 14, canceladas: 0 },
    { hora: at(0, 16), creadas: 18, realizadas: 17, canceladas: 0 },
    { hora: at(0, 17), creadas: 15, realizadas: 14, canceladas: 1 },
    { hora: at(0, 18), creadas: 11, realizadas: 10, canceladas: 0 },
    { hora: at(0, 19), creadas: 7, realizadas: 6, canceladas: 1 },
  ],
};

// Refleja GET /api/report/top-services?range=... — el ingreso ($) se calcula
// en el frontend como totalSolicitudes * precioHora del servicio, ya que el
// backend real solo trackea conteos, no montos.
export const demoTopServices: TopServicio[] = [
  { servicioId: 'svc-calculo', totalSolicitudes: 22 },
  { servicioId: 'svc-ingles', totalSolicitudes: 24 },
  { servicioId: 'svc-quimica', totalSolicitudes: 25 },
  { servicioId: 'svc-estadistica', totalSolicitudes: 23 },
  { servicioId: 'svc-redaccion', totalSolicitudes: 21 },
];

export const demoAudit: EventoAuditoria[] = [
  { id: 'AUD-8842', eventoTipo: 'SESSION_STATE_CHANGED', origen: 'ms-edututor-sessions', usuario: 'STU-118', fechaTimestamp: at(0, 9, 42), payloadJson: { sessionId: 'SES-1047', estadoAnterior: 'CONFIRMADA', estadoNuevo: 'EN_CURSO', tutorId: 'T-09' }, resultado: 'EXITOSO' },
  { id: 'AUD-8841', eventoTipo: 'SESSION_CREATED', origen: 'ms-edututor-sessions', usuario: 'STU-204', fechaTimestamp: at(0, 9, 16), payloadJson: { sessionId: 'SES-1048', servicioId: 'svc-calculo' }, resultado: 'EXITOSO' },
  { id: 'AUD-8840', eventoTipo: 'SESSION_CREATED', origen: 'ms-edututor-sessions', usuario: 'STU-311', fechaTimestamp: at(0, 8, 51), payloadJson: { sessionId: 'SES-1046', servicioId: 'svc-quimica' }, resultado: 'EXITOSO' },
  { id: 'AUD-8839', eventoTipo: 'SESSION_STATE_CHANGED', origen: 'ms-edututor-sessions', usuario: 'STU-087', fechaTimestamp: at(-1, 18, 12), payloadJson: { sessionId: 'SES-1045', estadoAnterior: 'EN_CURSO', estadoNuevo: 'REALIZADA', tutorId: 'T-41' }, resultado: 'EXITOSO' },
  { id: 'AUD-8838', eventoTipo: 'SESSION_STATE_CHANGED', origen: 'ms-edututor-sessions', usuario: 'STU-142', fechaTimestamp: at(-1, 17, 3), payloadJson: { sessionId: 'SES-1043', estadoAnterior: 'SOLICITADA', estadoNuevo: 'CANCELADA', tutorId: '' }, resultado: 'EXITOSO' },
];

export const lifecycle: Record<EstadoSesion, EstadoSesion[]> = {
  SOLICITADA: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['ASIGNADA', 'CANCELADA'],
  ASIGNADA: ['EN_CURSO', 'CANCELADA'],
  EN_CURSO: ['REALIZADA'],
  REALIZADA: [],
  CANCELADA: [],
};
