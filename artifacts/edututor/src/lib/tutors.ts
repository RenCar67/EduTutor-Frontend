import type { Sesion, Tutor } from '@workspace/api-client-react';

// Una sesión "ocupa" la agenda del tutor mientras está asignada o en curso.
// Mismo criterio que ms-edututor-sessions: se cruzan si distan menos de 1 hora.
const OCUPAN_AGENDA = ['ASIGNADA', 'EN_CURSO'];
const VENTANA_MS = 60 * 60 * 1000;

export type OpcionTutor = { tutor: Tutor; carga: number; ocupado: boolean; sugerido: boolean };

export function tutoresElegibles(servicioId: string, tutores: Tutor[]): Tutor[] {
  return tutores.filter((t) => t.activo && t.servicioIds.includes(servicioId));
}

export function cargaDe(tutorId: string, sesiones: Sesion[]): number {
  return sesiones.filter((s) => s.tutorId === tutorId && OCUPAN_AGENDA.includes(s.estado)).length;
}

export function ocupadoA(tutorId: string, sesion: Sesion, sesiones: Sesion[]): boolean {
  if (!sesion.fechaHora) return false;
  const t = new Date(sesion.fechaHora).getTime();
  return sesiones.some((o) => o.id !== sesion.id && o.tutorId === tutorId && OCUPAN_AGENDA.includes(o.estado)
    && !!o.fechaHora && Math.abs(new Date(o.fechaHora).getTime() - t) < VENTANA_MS);
}

// Elegibles para el servicio de la sesión, con su carga y disponibilidad; el
// sugerido es el libre con menos sesiones activas (desempata por nombre).
export function opcionesParaAsignar(sesion: Sesion, tutores: Tutor[], sesiones: Sesion[]): OpcionTutor[] {
  const opciones = tutoresElegibles(sesion.servicioId, tutores).map((tutor) => ({
    tutor,
    carga: cargaDe(tutor.id, sesiones),
    ocupado: ocupadoA(tutor.id, sesion, sesiones),
    sugerido: false,
  }));
  const libres = opciones.filter((o) => !o.ocupado)
    .sort((a, b) => a.carga - b.carga || a.tutor.nombre.localeCompare(b.tutor.nombre));
  if (libres.length > 0) libres[0].sugerido = true;
  return opciones.sort((a, b) => Number(a.ocupado) - Number(b.ocupado) || a.carga - b.carga || a.tutor.nombre.localeCompare(b.tutor.nombre));
}

// El backend guarda solo el id del tutor; el nombre sale del directorio. Si el
// id no está (sesiones antiguas con texto libre) se muestra tal cual.
export function nombreDeTutor(sesion: Sesion, tutores: Tutor[]): string {
  return tutores.find((t) => t.id === sesion.tutorId)?.nombre || sesion.tutorNombre || sesion.tutorId || 'Sin asignar';
}
