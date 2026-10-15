import { Bell } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import {
  getListAuditEventsQueryKey,
  getListServicesQueryKey,
  getListSessionsQueryKey,
  useListAuditEvents,
  useListServices,
  useListSessions,
} from '@workspace/api-client-react';
import type { EventoAuditoria, Servicio, Sesion } from '@workspace/api-client-react';
import { useAuth } from '@/auth/auth-context';
import { eventLabel, eventSummary } from '@/lib/audit-format';

type Item = { key: string; title: string; detail: string };

const POLL_MS = 30_000;
const MAX_ITEMS = 6;

// Estudiante: novedades de sus propias sesiones. Coordinador: lo que espera
// acción. Administrador y Auditor: los últimos eventos de auditoría. Cada rol
// solo consulta lo que el BFF le autoriza (sesiones: ADMIN/COORDINADOR/
// ESTUDIANTE; auditoría: ADMIN/AUDITOR).
export function NotificationsBell({ mockMode, sessions: localSessions, services: localServices, audit: localAudit }: { mockMode: boolean; sessions: Sesion[]; services: Servicio[]; audit: EventoAuditoria[] }) {
  const { user } = useAuth();
  const role = user?.role;
  const userId = user?.userId ?? 'anon';
  const usesSessions = role === 'ESTUDIANTE' || role === 'COORDINADOR';
  const usesAudit = role === 'ADMIN' || role === 'AUDITOR';

  const sessionsQuery = useListSessions(undefined, { query: { enabled: !mockMode && usesSessions, refetchInterval: POLL_MS, queryKey: getListSessionsQueryKey(), retry: false } });
  const servicesQuery = useListServices({ query: { enabled: !mockMode && usesSessions, queryKey: getListServicesQueryKey(), retry: false } });
  const auditQuery = useListAuditEvents(undefined, { query: { enabled: !mockMode && usesAudit, refetchInterval: POLL_MS, queryKey: getListAuditEventsQueryKey(), retry: false } });

  const sessions = mockMode ? localSessions : (Array.isArray(sessionsQuery.data) ? sessionsQuery.data : []);
  const services = mockMode ? localServices : (Array.isArray(servicesQuery.data) ? servicesQuery.data : []);
  const audit = mockMode ? localAudit : (Array.isArray(auditQuery.data) ? auditQuery.data : []);

  const items = useMemo<Item[]>(() => {
    const serviceName = (s: Sesion) => s.servicioNombre ?? services.find((service) => service.id === s.servicioId)?.nombre ?? `servicio ${s.servicioId}`;
    const byNewest = (a: Sesion, b: Sesion) => Number(b.id.replace(/\D/g, '')) - Number(a.id.replace(/\D/g, ''));

    if (role === 'ESTUDIANTE') {
      return sessions.filter((s) => s.estudianteId === userId).sort(byNewest).slice(0, MAX_ITEMS).map((s) => {
        const name = serviceName(s);
        const base = { key: `${s.id}:${s.estado}` };
        switch (s.estado) {
          case 'SOLICITADA': return { ...base, title: 'Solicitud recibida', detail: `${name} · esperando confirmación` };
          case 'CONFIRMADA': return { ...base, title: 'Tu sesión fue confirmada', detail: `${name} · falta asignar tutor` };
          case 'ASIGNADA': return { ...base, title: 'Te asignaron un tutor', detail: `${name} · ${s.tutorNombre ?? s.tutorId ?? 'tutor por definir'}` };
          case 'EN_CURSO': return { ...base, title: 'Tu sesión está en curso', detail: name };
          case 'REALIZADA': return { ...base, title: 'Sesión realizada', detail: name };
          default: return { ...base, title: 'Sesión cancelada', detail: name };
        }
      });
    }
    if (role === 'COORDINADOR') {
      return sessions.filter((s) => s.estado === 'SOLICITADA' || s.estado === 'CONFIRMADA').sort(byNewest).slice(0, MAX_ITEMS).map((s) => ({
        key: `${s.id}:${s.estado}`,
        title: s.estado === 'SOLICITADA' ? 'Solicitud por confirmar' : 'Falta asignar tutor',
        detail: `${serviceName(s)} · ${s.estudianteId}`,
      }));
    }
    return [...audit].sort((a, b) => new Date(b.fechaTimestamp).getTime() - new Date(a.fechaTimestamp).getTime()).slice(0, MAX_ITEMS).map((event) => ({
      key: `evt:${event.id}`,
      title: eventLabel(event.eventoTipo),
      detail: [eventSummary(event), event.usuario].filter(Boolean).join(' · '),
    }));
  }, [role, sessions, services, audit, userId]);

  const storageKey = `edututor.notifications.seen.${userId}`;
  const [seen, setSeen] = useState<Set<string> | null>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<Set<string>>(new Set());
  const ready = mockMode || (usesSessions ? sessionsQuery.isSuccess : usesAudit ? auditQuery.isSuccess : false);
  const root = useRef<HTMLDivElement>(null);

  const persist = (next: Set<string>) => {
    setSeen(next);
    try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch { /* sin almacenamiento: el aviso solo dura la sesión */ }
  };

  // Primera carga de este usuario en este navegador: lo que ya existe no cuenta como novedad.
  useEffect(() => {
    if (!ready) return;
    let stored: string | null = null;
    try { stored = localStorage.getItem(storageKey); } catch { stored = null; }
    if (stored) {
      try { setSeen(new Set(JSON.parse(stored) as string[])); return; } catch { /* se reinicia abajo */ }
    }
    persist(new Set(items.map((item) => item.key)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, storageKey]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => { if (root.current && !root.current.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const unread = seen ? items.filter((item) => !seen.has(item.key)) : [];

  const toggle = () => {
    if (!open) {
      setHighlight(new Set(unread.map((item) => item.key)));
      persist(new Set([...(seen ?? []), ...items.map((item) => item.key)]));
    }
    setOpen(!open);
  };

  const footer = usesAudit
    ? { href: '/audit', label: 'Ver toda la auditoría' }
    : { href: '/sessions', label: role === 'COORDINADOR' ? 'Ir a sesiones' : 'Ver mis sesiones' };
  const heading = role === 'COORDINADOR' ? 'Pendientes' : usesAudit ? 'Actividad reciente' : 'Novedades';

  return (
    <div ref={root} className="relative">
      <button
        onClick={toggle}
        className="relative rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition hover:border-primary/40 hover:text-primary"
        aria-label={unread.length ? `Notificaciones, ${unread.length} ${unread.length === 1 ? 'nueva' : 'nuevas'}` : 'Notificaciones'}
        aria-expanded={open}
        data-testid="button-notifications"
      >
        <Bell size={17} />
        {unread.length > 0 && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" data-testid="notifications-unread-dot" />}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-card-border bg-card shadow-[0_18px_44px_hsl(var(--foreground)/.14)]" role="dialog" aria-label={heading} data-testid="notifications-panel">
          <div className="border-b border-border/70 px-4 py-3 font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">{heading}</div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">Sin novedades por ahora.</p>
          ) : (
            <ul className="max-h-[360px] divide-y divide-border/60 overflow-y-auto">
              {items.map((item) => (
                <li key={item.key} className="flex gap-3 px-4 py-3" data-testid="notification-item">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${highlight.has(item.key) ? 'bg-accent' : 'bg-transparent'}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold">{item.title}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link href={footer.href} onClick={() => setOpen(false)} className="block border-t border-border/70 px-4 py-3 text-center text-xs font-bold text-primary hover:bg-muted/50">{footer.label}</Link>
        </div>
      )}
    </div>
  );
}
