import { CheckCircle2, X } from 'lucide-react';
import { useState } from 'react';
import type { Sesion, Tutor } from '@workspace/api-client-react';
import { ActionButton } from '@/components/ui';
import { opcionesParaAsignar } from '@/lib/tutors';

// El coordinador elige el tutor entre los habilitados para el servicio de la
// sesión. Se sugiere el libre con menos carga; los que ya tienen otra sesión a
// esa hora aparecen deshabilitados (el backend también lo rechazaría con 409).
export function AssignTutorDialog({ session, serviceName, tutors, sessions, pending, onClose, onConfirm }: {
  session: Sesion;
  serviceName: string;
  tutors: Tutor[];
  sessions: Sesion[];
  pending: boolean;
  onClose: () => void;
  onConfirm: (tutorId: string) => void;
}) {
  const opciones = opcionesParaAsignar(session, tutors, sessions);
  const [selected, setSelected] = useState(opciones.find((o) => o.sugerido)?.tutor.id ?? '');
  const horario = session.fechaHora
    ? new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(session.fechaHora))
    : 'sin horario definido';

  return <div className="fixed inset-0 z-50 grid place-items-center bg-[hsl(var(--foreground)/.35)] p-4 backdrop-blur-sm" data-testid="dialog-assign-tutor">
    <div className="w-full max-w-md rounded-2xl border border-card-border bg-card p-6 shadow-2xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-primary">Asignar tutor</p>
          <h3 className="mt-1 font-display text-xl font-bold">{serviceName}</h3>
          <p className="mt-1 text-xs text-muted-foreground">Sesión {session.id} · {horario}</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" data-testid="button-close-assign"><X size={17} /></button>
      </div>

      {opciones.length === 0
        ? <p className="mt-6 rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground" data-testid="text-no-tutors">No hay tutores habilitados para este servicio. Un administrador puede agregarlos en la sección Tutores.</p>
        : <div className="mt-5 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {opciones.map(({ tutor, carga, ocupado, sugerido }) => {
            const active = selected === tutor.id;
            return <button key={tutor.id} disabled={ocupado} onClick={() => setSelected(tutor.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'} ${ocupado ? 'cursor-not-allowed opacity-50' : ''}`}
              data-testid={`option-tutor-${tutor.id}`}>
              <span>
                <span className="block text-sm font-semibold">{tutor.nombre}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {ocupado ? 'Ocupado a esa hora' : `${carga} ${carga === 1 ? 'sesión activa' : 'sesiones activas'}`}
                </span>
              </span>
              {sugerido && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">Sugerido</span>}
              {active && !sugerido && <CheckCircle2 size={16} className="text-primary" />}
            </button>;
          })}
        </div>}

      <div className="mt-6 flex justify-end gap-2">
        <ActionButton variant="quiet" onClick={onClose} testId="button-cancel-assign">Cancelar</ActionButton>
        <ActionButton disabled={!selected || pending} onClick={() => onConfirm(selected)} testId="button-confirm-assign">{pending ? 'Asignando...' : 'Asignar tutor'}</ActionButton>
      </div>
    </div>
  </div>;
}
