import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getListServicesQueryKey,
  getListTutorsQueryKey,
  useCreateTutor,
  useListServices,
  useUpdateTutor,
} from '@workspace/api-client-react';
import type { Servicio, Tutor } from '@workspace/api-client-react';
import { useWorkspace } from '@/components/app-shell';
import { ActionButton, EmptyState, TextField } from '@/components/ui';
import { useTutors } from '@/hooks/use-tutors';
import { useToast } from '@/hooks/use-toast';
import { PageIntro } from '@/pages/console';

// Directorio de tutores (solo ADMIN): quién puede dictar cada servicio. De aquí
// salen las opciones cuando un coordinador asigna una sesión.
export function TutorsPage() {
  const { mockMode, services: localServices, createLocalTutor, updateLocalTutor } = useWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tutors = useTutors();
  const servicesQuery = useListServices({ query: { enabled: !mockMode, queryKey: getListServicesQueryKey() } });
  const services: Servicio[] = mockMode ? localServices : (Array.isArray(servicesQuery.data) ? servicesQuery.data : []);
  const createMutation = useCreateTutor();
  const updateMutation = useUpdateTutor();
  const [editing, setEditing] = useState<Tutor | 'new' | null>(null);

  const nombreServicio = (id: string) => services.find((s) => s.id === id)?.nombre ?? `Servicio ${id}`;
  const refresh = () => void queryClient.invalidateQueries({ queryKey: getListTutorsQueryKey() });
  const fail = (error: any, title: string) => toast({
    title,
    description: error?.data?.message || error?.data?.error || error?.message || 'No se pudo completar la operación.',
    variant: 'destructive',
  });

  const save = (data: { nombre: string; servicioIds: string[] }) => {
    if (editing === 'new') {
      if (mockMode) {
        createLocalTutor(data);
        setEditing(null);
        toast({ title: 'Tutor agregado', description: `${data.nombre} ya aparece en el directorio de demostración.` });
        return;
      }
      createMutation.mutate({ data }, {
        onSuccess: () => { setEditing(null); refresh(); toast({ title: 'Tutor agregado', description: `${data.nombre} ya puede ser asignado a sesiones.` }); },
        onError: (error) => fail(error, 'Error al agregar tutor'),
      });
    } else if (editing) {
      if (mockMode) {
        updateLocalTutor(editing.id, data);
        setEditing(null);
        toast({ title: 'Tutor actualizado', description: data.nombre });
        return;
      }
      updateMutation.mutate({ id: editing.id, data }, {
        onSuccess: () => { setEditing(null); refresh(); toast({ title: 'Tutor actualizado', description: data.nombre }); },
        onError: (error) => fail(error, 'Error al actualizar tutor'),
      });
    }
  };

  const toggleActivo = (tutor: Tutor) => {
    const activo = !tutor.activo;
    if (mockMode) {
      updateLocalTutor(tutor.id, { activo });
      return;
    }
    updateMutation.mutate({ id: tutor.id, data: { activo } }, {
      onSuccess: () => { refresh(); toast({ title: activo ? 'Tutor activado' : 'Tutor desactivado', description: tutor.nombre }); },
      onError: (error) => fail(error, 'Error al cambiar el estado'),
    });
  };

  return <div className="space-y-7">
    <PageIntro eyebrow="Administración · Tutores" title="Quién dicta cada servicio." detail="El directorio define qué tutores pueden atender cada asignatura. Los coordinadores eligen entre ellos al asignar una sesión."
      action={<ActionButton onClick={() => setEditing('new')} testId="button-new-tutor"><Plus size={15} /> Nuevo tutor</ActionButton>} />

    {tutors.length === 0
      ? <EmptyState title="Aún no hay tutores" detail="Agrega el primero para poder asignar sesiones." />
      : <div className="overflow-hidden rounded-2xl border border-card-border bg-card">
        {tutors.map((tutor) => <div key={tutor.id} className="grid gap-3 border-b border-border/60 px-5 py-4 last:border-b-0 md:grid-cols-[1.1fr_2.4fr_.7fr_1fr] md:items-center" data-testid={`row-tutor-${tutor.id}`}>
          <p className={`text-sm font-semibold ${tutor.activo ? '' : 'text-muted-foreground line-through'}`}>{tutor.nombre}</p>
          <div className="flex flex-wrap gap-1.5">
            {tutor.servicioIds.length === 0
              ? <span className="text-xs text-muted-foreground">Sin servicios habilitados</span>
              : tutor.servicioIds.map((id) => <span key={id} className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-foreground/75">{nombreServicio(id)}</span>)}
          </div>
          <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${tutor.activo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{tutor.activo ? 'Activo' : 'Inactivo'}</span>
          <div className="flex gap-3 text-[11px] font-bold">
            <button onClick={() => setEditing(tutor)} className="text-primary hover:underline" data-testid={`button-edit-tutor-${tutor.id}`}>Editar</button>
            <button onClick={() => toggleActivo(tutor)} disabled={updateMutation.isPending} className="text-muted-foreground hover:text-foreground hover:underline" data-testid={`button-toggle-tutor-${tutor.id}`}>{tutor.activo ? 'Desactivar' : 'Activar'}</button>
          </div>
        </div>)}
      </div>}

    {editing && <TutorDialog tutor={editing === 'new' ? null : editing} services={services} pending={createMutation.isPending || updateMutation.isPending} onClose={() => setEditing(null)} onSave={save} />}
  </div>;
}

function TutorDialog({ tutor, services, pending, onClose, onSave }: { tutor: Tutor | null; services: Servicio[]; pending: boolean; onClose: () => void; onSave: (data: { nombre: string; servicioIds: string[] }) => void }) {
  const [nombre, setNombre] = useState(tutor?.nombre ?? '');
  const [selected, setSelected] = useState<string[]>(tutor?.servicioIds ?? []);
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  const valido = nombre.trim().length > 0;

  return <div className="fixed inset-0 z-50 grid place-items-center bg-[hsl(var(--foreground)/.35)] p-4 backdrop-blur-sm" data-testid="dialog-tutor">
    <div className="w-full max-w-md rounded-2xl border border-card-border bg-card p-6 shadow-2xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-primary">Directorio</p>
          <h3 className="mt-1 font-display text-xl font-bold">{tutor ? 'Editar tutor' : 'Nuevo tutor'}</h3>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" data-testid="button-close-tutor"><X size={17} /></button>
      </div>
      <div className="mt-5 space-y-4">
        <TextField label="Nombre" value={nombre} onChange={setNombre} placeholder="Ej. Valentina Ruiz" testId="input-tutor-nombre" />
        <div>
          <span className="mb-1.5 block font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">Servicios que puede dictar</span>
          <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
            {services.map((service) => <label key={service.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/60">
              <input type="checkbox" checked={selected.includes(service.id)} onChange={() => toggle(service.id)} data-testid={`check-tutor-service-${service.id}`} />
              <span className="flex-1">{service.nombre}</span>
              <span className="text-[10px] text-muted-foreground">{service.categoria}</span>
            </label>)}
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <ActionButton variant="quiet" onClick={onClose} testId="button-cancel-tutor">Cancelar</ActionButton>
        <ActionButton disabled={!valido || pending} onClick={() => onSave({ nombre: nombre.trim(), servicioIds: selected })} testId="button-save-tutor">{pending ? 'Guardando...' : 'Guardar'}</ActionButton>
      </div>
    </div>
  </div>;
}
