export const EVENT_LABELS: Record<string, string> = { SESSION_CREATED: 'Sesión solicitada', SESSION_STATE_CHANGED: 'Cambio de estado de una sesión' };
export const STATE_LABELS: Record<string, string> = { SOLICITADA: 'Solicitada', CONFIRMADA: 'Confirmada', ASIGNADA: 'Asignada', EN_CURSO: 'En curso', REALIZADA: 'Realizada', CANCELADA: 'Cancelada' };

export const humanize = (value: string) => {
  const text = value.replaceAll('_', ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const eventLabel = (type: string) => EVENT_LABELS[type] ?? humanize(type);

export function eventSummary(event: { eventoTipo: string; payloadJson: Record<string, unknown> }) {
  const p = event.payloadJson ?? {};
  if (event.eventoTipo === 'SESSION_STATE_CHANGED' && p.estadoAnterior && p.estadoNuevo) {
    return `Pasó de ${STATE_LABELS[String(p.estadoAnterior)] ?? p.estadoAnterior} a ${STATE_LABELS[String(p.estadoNuevo)] ?? p.estadoNuevo}`;
  }
  if (event.eventoTipo === 'SESSION_CREATED') return 'Un estudiante pidió una nueva sesión';
  return '';
}
