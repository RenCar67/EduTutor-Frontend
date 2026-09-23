import { Activity, ArrowUpRight, BarChart3, CalendarClock, CheckCircle2, ChevronDown, Download, Filter, MoreHorizontal, Plus, Search, Sparkles, Target, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetReportKpisQueryKey,
  getGetTopServicesQueryKey,
  getListAuditEventsQueryKey,
  getListServicesQueryKey,
  getListSessionsQueryKey,
  useCreateSession,
  useGetReportKpis,
  useGetTopServices,
  useListAuditEvents,
  useListServices,
  useListSessions,
  useTransitionSession,
} from '@workspace/api-client-react';
import type { EstadoSesion, Servicio, Sesion, SesionInput } from '@workspace/api-client-react';
import { useWorkspace, lifecycle } from '@/components/app-shell';
import { useToast } from '@/hooks/use-toast';
import { ActionButton, ArrowLink, EmptyState, ErrorState, MetricCard, SectionHeading, SelectField, SkeletonRows, StatusPill } from '@/components/ui';

const statusLabels: Record<string, string> = { SOLICITADA: 'Solicitadas', CONFIRMADA: 'Confirmadas', ASIGNADA: 'Asignadas', EN_CURSO: 'En curso', REALIZADA: 'Realizadas', CANCELADA: 'Canceladas' };

// ms-edututor-sessions no conoce el catálogo ni un directorio de tutores —
// el nombre del servicio se resuelve aquí contra lo que ya se tiene cargado.
function resolveServicioNombre(session: Sesion, services: Servicio[]): string {
  return session.servicioNombre || services.find((s) => s.id === session.servicioId)?.nombre || 'Servicio';
}
function resolveTutorNombre(session: Sesion): string {
  return session.tutorNombre || session.tutorId || 'Sin asignar';
}
const money = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const dateTime = (value: string) => new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));

function PageIntro({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: React.ReactNode }) {
  return <div className="mb-8 flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-primary">{eyebrow}</p><h2 className="mt-2 max-w-3xl font-display text-[30px] font-bold leading-[1.05] tracking-tight md:text-[38px]">{title}</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{detail}</p></div>{action}</div>;
}

// El BFF restringe /api/report/* a ADMIN/AUDITOR y /api/sessions a
// ADMIN/COORDINADOR/ESTUDIANTE — ningún rol tiene ambos. El Dashboard, que ven
// todos al entrar, no puede depender por completo de ninguno de los dos: cada
// sección se muestra solo si su fuente de datos está disponible para el rol.
function isForbidden(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && (error as { status?: number }).status === 403;
}

export function DashboardPage() {
  const { mockMode, kpis: localKpis, sessions: localSessions, services } = useWorkspace();
  const kpisQuery = useGetReportKpis(undefined, { query: { enabled: !mockMode, queryKey: getGetReportKpisQueryKey(), retry: false } });
  const sessionsQuery = useListSessions(undefined, { query: { enabled: !mockMode, queryKey: getListSessionsQueryKey(), retry: false } });
  const kpis = mockMode ? localKpis : kpisQuery.data;
  const sessions = mockMode ? localSessions : Array.isArray(sessionsQuery.data) ? sessionsQuery.data : [];
  const active = sessions.filter((session) => ['SOLICITADA', 'CONFIRMADA', 'ASIGNADA', 'EN_CURSO'].includes(session.estado)).slice(0, 5);
  const kpisForbidden = !mockMode && isForbidden(kpisQuery.error);
  const sessionsForbidden = !mockMode && isForbidden(sessionsQuery.error);
  if (!mockMode && (kpisQuery.isLoading || sessionsQuery.isLoading)) return <><PageIntro eyebrow="Resumen operativo" title="El pulso de tus operaciones." detail="Una vista tranquila para saber qué necesita atención y qué está avanzando bien." /><SkeletonRows count={5} /></>;
  if (!mockMode && kpisQuery.isError && !kpisForbidden && sessionsQuery.isError && !sessionsForbidden) return <ErrorState onRetry={() => { void kpisQuery.refetch(); void sessionsQuery.refetch(); }} />;
  const showKpis = Boolean(kpis) && !kpisForbidden;
  const showSessions = !sessionsForbidden;
  if (!showKpis) {
    return <div className="space-y-8">
      <PageIntro eyebrow="Resumen operativo" title="El pulso de tus operaciones." detail="Una vista tranquila para saber qué necesita atención y qué está avanzando bien." action={<Link href="/sessions" className="group inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-[0_6px_18px_hsl(var(--primary)/.2)] transition hover:-translate-y-0.5" data-testid="link-dashboard-new-session"><Plus size={15} /> Nueva sesión</Link>} />
      {kpisForbidden && <div className="rounded-2xl border border-card-border bg-card p-4 text-xs text-muted-foreground">Tu rol no tiene acceso a las métricas agregadas (solo Admin y Auditor). Puedes seguir operando sesiones abajo.</div>}
      {!kpisForbidden && !mockMode && kpisQuery.isError && <ErrorState onRetry={() => void kpisQuery.refetch()} />}
      {showSessions ? <section><SectionHeading eyebrow="Seguimiento inmediato" title="Lo que requiere contexto" detail="Las próximas sesiones que están en movimiento" action={<Link href="/sessions" className="text-xs font-bold text-primary" data-testid="link-dashboard-sessions">Ver todas <ArrowLink> </ArrowLink></Link>} /><div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{active.map((session) => <SessionMiniCard key={session.id} session={session} services={services} />)}</div></section> : <div className="rounded-2xl border border-card-border bg-card p-4 text-xs text-muted-foreground">Tu rol no tiene acceso a la operación de sesiones (Admin, Coordinador o Estudiante).</div>}
      <section><SectionHeading eyebrow="Acceso rápido" title="Módulos de trabajo" /><div className="grid gap-3 md:grid-cols-3"><ModuleCard href="/catalog" icon={<BookOpenIcon />} number="01" title="Explorar catálogo" detail="Encuentra el acompañamiento correcto y agenda en minutos." /><ModuleCard href="/sessions" icon={<CalendarClock size={19} />} number="02" title="Operar sesiones" detail="Mueve cada sesión con claridad, desde solicitada hasta realizada." /><ModuleCard href="/analytics" icon={<BarChart3 size={19} />} number="03" title="Entender resultados" detail="Lee la demanda y convierte actividad en decisiones." /></div></section>
    </div>;
  }
  if (!kpis) return null;
  const hourly = kpis.sesionesPorHora;
  const maxHour = Math.max(...hourly.map((item) => item.creadas), 1);
  const peak = hourly.reduce((best, item) => (item.creadas > best.creadas ? item : best), hourly[0]);
  const estados = kpis.estadosActivos;
  const activeSessions = (estados.SOLICITADA ?? 0) + (estados.CONFIRMADA ?? 0) + (estados.ASIGNADA ?? 0) + (estados.EN_CURSO ?? 0);
  const completedSessions = estados.REALIZADA ?? 0;
  const cancelledSessions = estados.CANCELADA ?? 0;
  const totalSessions = activeSessions + completedSessions + cancelledSessions;
  const successRate = Math.round(kpis.tasaAsistencia * 1000) / 10;
  const donutSegments: Array<{ estado: string; pct: number; color: string }> = totalSessions === 0 ? [] : [
    { estado: 'REALIZADA', pct: (completedSessions / totalSessions) * 100, color: 'bg-primary' },
    { estado: 'EN_CURSO', pct: ((estados.EN_CURSO ?? 0) / totalSessions) * 100, color: 'bg-chart-5' },
    { estado: 'En espera', pct: (((estados.SOLICITADA ?? 0) + (estados.CONFIRMADA ?? 0) + (estados.ASIGNADA ?? 0)) / totalSessions) * 100, color: 'bg-accent' },
    { estado: 'CANCELADA', pct: (cancelledSessions / totalSessions) * 100, color: 'bg-destructive' },
  ];
  let acc = 0;
  const gradientStops = donutSegments.map((seg) => { const from = acc; acc += seg.pct; return `hsl(var(--${seg.color === 'bg-primary' ? 'primary' : seg.color === 'bg-chart-5' ? 'chart-5' : seg.color === 'bg-accent' ? 'accent' : 'destructive'})) ${from}% ${acc}%`; }).join(', ');
  return <div className="space-y-8">
    <PageIntro eyebrow="Resumen operativo" title="El pulso de tus operaciones." detail="Una vista tranquila para saber qué necesita atención y qué está avanzando bien." action={<Link href="/sessions" className="group inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-[0_6px_18px_hsl(var(--primary)/.2)] transition hover:-translate-y-0.5" data-testid="link-dashboard-new-session"><Plus size={15} /> Nueva sesión</Link>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Sesiones activas" value={String(activeSessions)} detail="solicitadas + confirmadas + en curso" tone="teal" />
      <MetricCard label="Realizadas" value={String(completedSessions)} detail={`en el rango ${kpis.range}`} tone="gold" />
      <MetricCard label="Tasa de asistencia" value={`${successRate}%`} detail="realizadas / creadas" tone="navy" />
      <MetricCard label="Cancelaciones" value={String(cancelledSessions)} detail={`en el rango ${kpis.range}`} tone="red" />
    </div>
    <div className="grid gap-5 xl:grid-cols-[1.6fr_.9fr]">
      <section className="rounded-2xl border border-card-border bg-card p-5 shadow-[0_8px_26px_hsl(var(--foreground)/.025)] md:p-6">
        <SectionHeading eyebrow="Ritmo de demanda" title="Sesiones por hora" detail="Sesiones creadas durante el rango" action={<button className="rounded-lg p-2 text-muted-foreground hover:bg-muted" data-testid="button-demand-options"><MoreHorizontal size={17} /></button>} />
        <div className="flex h-[220px] items-end gap-2 border-b border-border/70 pb-0 pt-5 sm:gap-3">{hourly.map((item, index) => <div key={item.hora} className="group flex h-full flex-1 flex-col justify-end gap-2"><div className="relative flex-1"><div className="absolute bottom-0 left-1/2 w-full -translate-x-1/2 rounded-t-lg bg-[hsl(var(--primary)/.13)] transition-all duration-300 group-hover:bg-[hsl(var(--primary)/.27)]" style={{ height: `${Math.max(9, item.creadas / maxHour * 100)}%` }}><span className="absolute -top-6 left-1/2 -translate-x-1/2 font-mono-ui text-[9px] text-primary opacity-0 transition group-hover:opacity-100">{item.creadas}</span></div></div><span className={`text-center font-mono-ui text-[9px] ${index % 2 === 0 ? 'text-foreground/65' : 'text-muted-foreground/40'}`}>{new Date(item.hora).getHours()}h</span></div>)}</div>
        <div className="mt-4 flex items-center gap-4 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Sesiones creadas</span>{peak && <span className="ml-auto font-mono-ui text-[10px]">pico · {new Date(peak.hora).getHours()}h — {peak.creadas} sesiones</span>}</div>
      </section>
      <section className="rounded-2xl border border-card-border bg-card p-5 shadow-[0_8px_26px_hsl(var(--foreground)/.025)] md:p-6">
        <SectionHeading eyebrow="Salud del flujo" title="Distribución de estados" detail="Sobre el total de sesiones del rango" />
        <div className="mt-1 flex items-center gap-6"><div className="relative grid h-36 w-36 shrink-0 place-items-center rounded-full" style={{ background: totalSessions === 0 ? 'hsl(var(--muted))' : `conic-gradient(${gradientStops})` }}><div className="grid h-24 w-24 place-items-center rounded-full bg-card"><p className="font-display text-2xl font-bold">{totalSessions}</p><p className="font-mono-ui text-[9px] uppercase tracking-wider text-muted-foreground">sesiones</p></div></div><div className="min-w-0 flex-1 space-y-3">{donutSegments.map((seg) => <div key={seg.estado} className="flex items-center justify-between gap-2 text-[11px]"><span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${seg.color}`} />{statusLabels[seg.estado] ?? seg.estado}</span><span className="font-mono-ui text-muted-foreground">{Math.round(seg.pct)}%</span></div>)}</div></div>
      </section>
    </div>
    {showSessions && <section><SectionHeading eyebrow="Seguimiento inmediato" title="Lo que requiere contexto" detail="Las próximas sesiones que están en movimiento" action={<Link href="/sessions" className="text-xs font-bold text-primary" data-testid="link-dashboard-sessions">Ver todas <ArrowLink> </ArrowLink></Link>} /><div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{active.map((session) => <SessionMiniCard key={session.id} session={session} services={services} />)}</div></section>}
    <section><SectionHeading eyebrow="Acceso rápido" title="Módulos de trabajo" /><div className="grid gap-3 md:grid-cols-3"><ModuleCard href="/catalog" icon={<BookOpenIcon />} number="01" title="Explorar catálogo" detail="Encuentra el acompañamiento correcto y agenda en minutos." /><ModuleCard href="/sessions" icon={<CalendarClock size={19} />} number="02" title="Operar sesiones" detail="Mueve cada sesión con claridad, desde solicitada hasta realizada." /><ModuleCard href="/analytics" icon={<BarChart3 size={19} />} number="03" title="Entender resultados" detail="Lee la demanda y convierte actividad en decisiones." /></div></section>
  </div>;
}

function BookOpenIcon() { return <span className="font-display text-[22px] leading-none">01</span>; }

function SessionMiniCard({ session, services }: { session: Sesion; services: Servicio[] }) {
  const tutorNombre = resolveTutorNombre(session);
  const servicioNombre = resolveServicioNombre(session, services);
  return <div className="group flex items-center gap-3 rounded-2xl border border-card-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted font-display text-sm font-bold text-primary">{tutorNombre.split(' ').map((name) => name[0]).join('').slice(0, 2)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-bold">{servicioNombre}</p><StatusPill status={session.estado} /></div><p className="mt-1 truncate text-[11px] text-muted-foreground">{session.fechaHora ? dateTime(session.fechaHora) : 'Sin horario'} · {tutorNombre}</p></div><span className="font-mono-ui text-[10px] text-muted-foreground">{session.id}</span></div>;
}

function ModuleCard({ href, icon, number, title, detail }: { href: string; icon: React.ReactNode; number: string; title: string; detail: string }) {
  return <Link href={href} className="group relative overflow-hidden rounded-2xl border border-card-border bg-card p-5 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_14px_28px_hsl(var(--foreground)/.07)]" data-testid={`link-module-${number}`}><div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--primary)/.1)] text-primary">{icon}</span><span className="font-mono-ui text-[10px] text-muted-foreground/60">{number}</span></div><h3 className="mt-8 font-display text-lg font-bold">{title}</h3><p className="mt-1.5 max-w-[250px] text-xs leading-relaxed text-muted-foreground">{detail}</p><span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-primary transition group-hover:gap-2">Abrir módulo <ArrowUpRight size={14} /></span></Link>;
}

export function CatalogPage() {
  const { mockMode, services: localServices, createLocalSession } = useWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateSession();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const servicesQuery = useListServices({ query: { enabled: !mockMode, queryKey: getListServicesQueryKey() } });
  const services = (mockMode ? localServices : (Array.isArray(servicesQuery.data) ? servicesQuery.data : [])).filter((service) => service.estado === 'ACTIVO' && (!search || `${service.nombre} ${service.descripcion}`.toLowerCase().includes(search.toLowerCase())) && (!category || service.categoria === category) && (!maxPrice || service.precioHora <= Number(maxPrice)));
  const categories = [...new Set(localServices.map((service) => service.categoria))];
  const create = (input: SesionInput) => {
    if (mockMode) {
      createLocalSession(input);
      setSelected(null);
      toast({
        title: 'Sesión agendada localmente',
        description: 'La sesión se reservó en el workspace de demostración.',
      });
      return;
    }
    createMutation.mutate({ data: input }, {
      onSuccess: () => {
        setSelected(null);
        toast({
          title: 'Sesión confirmada en BFF',
          description: 'La sesión fue transmitida al microservicio de sesiones en AWS.',
        });
        void queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
      },
      onError: (error: any) => {
        const errorDetail =
          error?.data?.error ||
          error?.data?.message ||
          error?.message ||
          'No se pudo registrar la sesión en el catálogo del BFF.';
        toast({
          title: 'Error al agendar sesión',
          description: errorDetail,
          variant: 'destructive',
        });
      },
    });
  };
  return <div className="space-y-7">
    <PageIntro eyebrow="Descubrir · Catálogo" title="El acompañamiento correcto, sin fricción." detail="Explora servicios activos por disciplina, precio y tutor. Cuando encuentres el encaje, deja la sesión encaminada desde aquí." action={<Link href="/sessions" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-bold transition hover:border-primary/40 hover:text-primary" data-testid="link-catalog-sessions"><CalendarClock size={15} /> Ver sesiones</Link>} />
    <div className="rounded-2xl border border-card-border bg-card p-4 shadow-[0_8px_26px_hsl(var(--foreground)/.025)] md:p-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-end"><label className="block flex-1"><span className="mb-1.5 block font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">Buscar servicio o tutor</span><div className="relative"><Search size={16} className="absolute left-3 top-3 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ej. cálculo, conversación..." className="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground/65 focus:border-primary focus:ring-2 focus:ring-primary/10" data-testid="input-catalog-search" /></div></label><div className="flex gap-2"><button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition ${showFilters ? 'border-primary/40 bg-[hsl(var(--primary)/.06)] text-primary' : 'border-border bg-background hover:border-primary/40'}`} data-testid="button-catalog-filters"><Filter size={14} /> Filtros <ChevronDown size={13} className={showFilters ? 'rotate-180 transition' : 'transition'} /></button><button onClick={() => { setSearch(''); setCategory(''); setMaxPrice(''); }} className="rounded-xl px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted" data-testid="button-clear-filters">Limpiar</button></div></div>{showFilters && <div className="mt-4 grid gap-3 border-t border-border/70 pt-4 sm:grid-cols-2"><SelectField label="Categoría" value={category} onChange={setCategory} options={categories.map((item) => ({ label: item, value: item }))} testId="select-catalog-category" /><label><span className="mb-1.5 block font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">Precio máximo / hora</span><input type="number" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Sin límite" className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" data-testid="input-catalog-price" /></label></div>}</div>
    {!mockMode && servicesQuery.isLoading ? <SkeletonRows count={5} /> : !mockMode && servicesQuery.isError ? <ErrorState onRetry={() => void servicesQuery.refetch()} /> : services.length === 0 ? <EmptyState title="No encontramos ese encaje" detail="Prueba con otra disciplina o amplía el precio máximo por hora." /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{services.map((service, index) => <ServiceCard key={service.id} service={service} index={index} onSchedule={() => setSelected(service.id)} />)}</div>}
    {selected && <ScheduleDialog service={services.find((service) => service.id === selected) ?? localServices.find((service) => service.id === selected)!} onClose={() => setSelected(null)} onCreate={create} pending={createMutation.isPending} />}
  </div>;
}

function ServiceCard({ service, index, onSchedule }: { service: import('@workspace/api-client-react').Servicio; index: number; onSchedule: () => void }) {
  const colors = ['bg-[hsl(var(--primary)/.11)] text-primary', 'bg-[hsl(var(--accent)/.2)] text-[hsl(31_55%_34%)]', 'bg-[hsl(var(--chart-5)/.16)] text-[hsl(195_42%_34%)]'];
  return <article className="group flex flex-col rounded-2xl border border-card-border bg-card p-5 transition hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_14px_30px_hsl(var(--foreground)/.07)]" data-testid={`card-service-${service.id}`}><div className="flex items-start justify-between"><span className={`grid h-11 w-11 place-items-center rounded-2xl font-display text-lg font-bold ${colors[index % colors.length]}`}>{service.nombre.split(' ').slice(0, 2).map((word) => word[0]).join('')}</span><StatusPill status={service.estado} /></div><div className="mt-5 flex-1"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">{service.categoria}</p><h3 className="mt-1.5 font-display text-[20px] font-bold tracking-tight">{service.nombre}</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{service.descripcion}</p></div><div className="mt-5 flex items-end justify-between border-t border-border/70 pt-4"><div><p className="font-display text-xl font-bold">${service.precioHora}<span className="font-sans text-[11px] font-normal text-muted-foreground"> / hora</span></p><p className="mt-0.5 text-[10px] text-muted-foreground">{service.duracionMinutos} min · {service.tutorNombre}</p></div><ActionButton testId={`button-schedule-${service.id}`} onClick={onSchedule}>Agendar <ArrowUpRight size={14} /></ActionButton></div></article>;
}

function ScheduleDialog({ service, onClose, onCreate, pending }: { service: import('@workspace/api-client-react').Servicio; onClose: () => void; onCreate: (input: SesionInput) => void; pending: boolean }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [student, setStudent] = useState('STU-204');
  const [notes, setNotes] = useState('');
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[hsl(var(--foreground)/.35)] p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-card-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-primary">Nueva sesión</p><h3 className="mt-1 font-display text-xl font-bold">{service.nombre}</h3><p className="mt-1 text-xs text-muted-foreground">{service.tutorNombre} · ${service.precioHora}/hora</p></div><button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" data-testid="button-close-schedule"><X size={17} /></button></div><div className="mt-6 space-y-4"><label className="block"><span className="mb-1.5 block font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">Estudiante</span><input value={student} onChange={(event) => setStudent(event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" data-testid="input-schedule-student" /></label><div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">Fecha</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" data-testid="input-schedule-date" /></label><label><span className="mb-1.5 block font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">Hora</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" data-testid="input-schedule-time" /></label></div><label className="block"><span className="mb-1.5 block font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">Contexto opcional</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="¿Qué necesita preparar el tutor?" className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" data-testid="input-schedule-notes" /></label></div><div className="mt-6 flex justify-end gap-2"><ActionButton variant="quiet" onClick={onClose} testId="button-cancel-schedule">Cancelar</ActionButton><ActionButton disabled={!date || !time || !student || pending} onClick={() => onCreate({ servicioId: service.id, estudianteId: student, fechaHora: new Date(`${date}T${time}`).toISOString(), observaciones: notes })} testId="button-confirm-schedule">{pending ? 'Guardando...' : 'Confirmar agenda'} <CheckCircle2 size={14} /></ActionButton></div></div></div>;
}

export function SessionsPage() {
  const { mockMode, sessions: localSessions, services: localServices, createLocalSession, transitionLocalSession } = useWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sessionsQuery = useListSessions(undefined, { query: { enabled: !mockMode, queryKey: getListSessionsQueryKey() } });
  const servicesQuery = useListServices({ query: { enabled: !mockMode, queryKey: getListServicesQueryKey() } });
  const services = mockMode ? localServices : (Array.isArray(servicesQuery.data) ? servicesQuery.data : []);
  const transitionMutation = useTransitionSession();
  const createMutation = useCreateSession();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const allSessions = mockMode ? localSessions : (Array.isArray(sessionsQuery.data) ? sessionsQuery.data : []);
  const filtered = allSessions.filter((session) => (!status || session.estado === status) && (!search || `${session.id} ${resolveServicioNombre(session, services)} ${resolveTutorNombre(session)}`.toLowerCase().includes(search.toLowerCase())));
  const transition = (session: Sesion, next: EstadoSesion) => {
    if (mockMode) {
      try {
        transitionLocalSession(session.id, next);
        toast({
          title: 'Estado actualizado',
          description: `La sesión ${session.id} ahora está en estado ${statusLabels[next]}.`,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido al mover estado.';
        toast({
          title: 'Regla de negocio infringida (409 Conflict)',
          description: errorMsg,
          variant: 'destructive',
        });
      }
    } else {
      transitionMutation.mutate(
        { id: session.id, data: { status: next } },
        {
          onSuccess: () => {
            toast({
              title: 'Estado sincronizado con BFF',
              description: `La sesión ${session.id} cambió a ${statusLabels[next]} en Oracle XE.`,
            });
            void queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
          },
          onError: (error: any) => {
            const serverMessage =
              error?.data?.error ||
              error?.data?.message ||
              error?.message ||
              'Transición de estado rechazada por la máquina de estados de Spring Boot.';
            toast({
              title: error?.status === 409 || error?.status === 400
                ? 'Regla de negocio infringida (Spring Boot 409)'
                : 'Error en la transición de sesión',
              description: serverMessage,
              variant: 'destructive',
            });
          },
        },
      );
    }
  };
  const create = (input: SesionInput) => {
    if (mockMode) {
      createLocalSession(input);
      setShowCreate(false);
      toast({
        title: 'Sesión creada localmente',
        description: 'La sesión se agregó al workspace de demostración.',
      });
      return;
    }
    createMutation.mutate(
      { data: input },
      {
        onSuccess: () => {
          setShowCreate(false);
          toast({
            title: 'Sesión creada en BFF',
            description: 'La sesión fue persistida y emitida a RabbitMQ / Kafka.',
          });
          void queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
        },
        onError: (error: any) => {
          const serverMessage =
            error?.data?.error ||
            error?.data?.message ||
            error?.message ||
            'Error al crear la sesión en el BFF.';
          toast({
            title: 'Error al crear sesión',
            description: serverMessage,
            variant: 'destructive',
          });
        },
      },
    );
  };
  return <div className="space-y-7">
    <PageIntro eyebrow="Operación · Sesiones" title="Cada encuentro, en contexto." detail="Sigue el ciclo completo de tus sesiones. Los cambios de estado quedan visibles para todo el equipo." action={<ActionButton onClick={() => setShowCreate(true)} testId="button-new-session"><Plus size={15} /> Nueva sesión</ActionButton>} />
    <div className="flex flex-col gap-3 rounded-2xl border border-card-border bg-card p-4 shadow-[0_8px_26px_hsl(var(--foreground)/.025)] md:flex-row md:items-center"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-3 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por ID, servicio o tutor..." className="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary" data-testid="input-sessions-search" /></div><div className="flex items-center gap-2"><SelectField label="" value={status} onChange={setStatus} options={Object.keys(statusLabels).map((item) => ({ value: item, label: statusLabels[item] }))} testId="select-session-status" /><span className="hidden font-mono-ui text-[10px] text-muted-foreground sm:block">{filtered.length} registros</span></div></div>
    {!mockMode && sessionsQuery.isLoading ? <SkeletonRows count={6} /> : !mockMode && sessionsQuery.isError ? <ErrorState onRetry={() => void sessionsQuery.refetch()} /> : filtered.length === 0 ? <EmptyState title="No hay sesiones con esos filtros" detail="Ajusta la búsqueda o agenda una nueva sesión para empezar." action={<ActionButton onClick={() => setShowCreate(true)} testId="button-empty-new-session"><Plus size={14} /> Nueva sesión</ActionButton>} /> : <div className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-[0_8px_26px_hsl(var(--foreground)/.025)]"><div className="hidden grid-cols-[1.1fr_1.4fr_1.1fr_1fr_1fr_.55fr] gap-3 border-b border-border/70 bg-muted/40 px-5 py-3 font-mono-ui text-[9px] uppercase tracking-[.13em] text-muted-foreground md:grid"><span>Sesión</span><span>Servicio</span><span>Tutor</span><span>Fecha</span><span>Estado</span><span /></div>{filtered.map((session) => <SessionRow key={session.id} session={session} services={services} onTransition={(next) => transition(session, next)} pending={transitionMutation.isPending && transitionMutation.variables?.id === session.id} />)}</div>}
    {showCreate && <CreateSessionDialog services={services} onClose={() => setShowCreate(false)} onCreate={create} pending={createMutation.isPending} />}
  </div>;
}

function SessionRow({ session, services, onTransition, pending }: { session: Sesion; services: Servicio[]; onTransition: (status: EstadoSesion) => void; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const next = lifecycle[session.estado] ?? [];
  const servicioNombre = resolveServicioNombre(session, services);
  const tutorNombre = resolveTutorNombre(session);
  return <div className="relative grid gap-3 border-b border-border/60 px-5 py-4 last:border-b-0 md:grid-cols-[1.1fr_1.4fr_1.1fr_1fr_1fr_.55fr] md:items-center" data-testid={`row-session-${session.id}`}><div><p className="font-mono-ui text-[11px] font-medium text-primary">{session.id}</p><p className="mt-1 text-[10px] text-muted-foreground">estudiante · {session.estudianteId}</p></div><div><p className="text-sm font-semibold">{servicioNombre}</p><p className="mt-1 text-[10px] text-muted-foreground">{session.observaciones || 'Sin observaciones'}</p></div><p className="text-xs text-foreground/75"><span className="mr-1 text-muted-foreground md:hidden">Tutor ·</span>{tutorNombre}</p><p className="text-xs text-foreground/75"><span className="mr-1 text-muted-foreground md:hidden">Cuándo ·</span>{session.fechaHora ? dateTime(session.fechaHora) : 'Sin horario'}</p><div><StatusPill status={session.estado} />{next.length > 0 && <div className="relative mt-2"><button onClick={() => setOpen(!open)} disabled={pending} className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline" data-testid={`button-transition-${session.id}`}>{pending ? 'Guardando...' : 'Mover estado'} <ChevronDown size={12} /></button>{open && <div className="absolute left-0 top-6 z-10 w-36 rounded-xl border border-border bg-popover p-1.5 shadow-xl">{next.map((item) => <button key={item} onClick={() => { onTransition(item); setOpen(false); }} className="block w-full rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold hover:bg-muted" data-testid={`button-transition-${session.id}-${item}`}>→ {statusLabels[item]}</button>)}</div>}</div>}</div><button className="hidden place-items-center rounded-lg p-2 text-muted-foreground hover:bg-muted md:grid" data-testid={`button-session-menu-${session.id}`}><MoreHorizontal size={16} /></button></div>;
}

function CreateSessionDialog({ services, onClose, onCreate, pending }: { services: import('@workspace/api-client-react').Servicio[]; onClose: () => void; onCreate: (input: SesionInput) => void; pending: boolean }) {
  const [service, setService] = useState(services[0]?.id ?? '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [student, setStudent] = useState('STU-204');
  const [notes, setNotes] = useState('');
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[hsl(var(--foreground)/.35)] p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-card-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-primary">Operación</p><h3 className="mt-1 font-display text-xl font-bold">Agendar una sesión</h3></div><button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" data-testid="button-close-create-session"><X size={17} /></button></div><div className="mt-6 space-y-4"><SelectField label="Servicio" value={service} onChange={setService} options={services.map((item) => ({ value: item.id, label: `${item.nombre} · ${item.tutorNombre}` }))} testId="select-create-service" /><label className="block"><span className="mb-1.5 block font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">Estudiante</span><input value={student} onChange={(event) => setStudent(event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" data-testid="input-create-student" /></label><div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">Fecha</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" data-testid="input-create-date" /></label><label><span className="mb-1.5 block font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">Hora</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" data-testid="input-create-time" /></label></div><label className="block"><span className="mb-1.5 block font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">Observaciones</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" data-testid="input-create-notes" /></label></div><div className="mt-6 flex justify-end gap-2"><ActionButton variant="quiet" onClick={onClose} testId="button-cancel-create">Cancelar</ActionButton><ActionButton disabled={!date || !time || !service || pending} onClick={() => onCreate({ servicioId: service, estudianteId: student, fechaHora: new Date(`${date}T${time}`).toISOString(), observaciones: notes })} testId="button-submit-create">{pending ? 'Guardando...' : 'Crear sesión'} <CheckCircle2 size={14} /></ActionButton></div></div></div>;
}

export function AnalyticsPage() {
  const { mockMode, kpis: localKpis, topServices: localTopServices, services: localServices } = useWorkspace();
  const kpisQuery = useGetReportKpis(undefined, { query: { enabled: !mockMode, queryKey: getGetReportKpisQueryKey() } });
  const topServicesQuery = useGetTopServices(undefined, { query: { enabled: !mockMode, queryKey: getGetTopServicesQueryKey() } });
  const servicesQuery = useListServices({ query: { enabled: !mockMode, queryKey: getListServicesQueryKey() } });
  const kpis = mockMode ? localKpis : kpisQuery.data;
  const topServices = mockMode ? localTopServices : (Array.isArray(topServicesQuery.data) ? topServicesQuery.data : []);
  const services = mockMode ? localServices : (Array.isArray(servicesQuery.data) ? servicesQuery.data : []);
  // El backend real solo trackea conteos, no montos — el ingreso se estima
  // aquí como solicitudes x precioHora del servicio en el catálogo actual.
  const ranked = topServices
    .map((item) => {
      const service = services.find((s) => s.id === item.servicioId);
      return { servicioId: item.servicioId, nombre: service?.nombre ?? item.servicioId, totalSolicitudes: item.totalSolicitudes, ingresos: (service?.precioHora ?? 0) * item.totalSolicitudes };
    })
    .sort((a, b) => b.totalSolicitudes - a.totalSolicitudes);
  const totalRevenue = ranked.reduce((sum, item) => sum + item.ingresos, 0);
  const maxRevenue = Math.max(...ranked.map((item) => item.ingresos), 1);
  const topPick = ranked[0];
  const exportCsv = () => { const content = ['servicio,solicitudes,ingresos_estimados', ...ranked.map((item) => `${item.nombre},${item.totalSolicitudes},${item.ingresos}`)].join('\n'); const url = URL.createObjectURL(new Blob([content], { type: 'text/csv' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'edututor-analytics.csv'; anchor.click(); URL.revokeObjectURL(url); };
  if (!mockMode && (kpisQuery.isLoading || topServicesQuery.isLoading || servicesQuery.isLoading)) return <><PageIntro eyebrow="Insights · Analítica" title="La operación también cuenta una historia." detail="Encuentra los patrones que ayudan a tu equipo a tomar mejores decisiones." /><SkeletonRows count={6} /></>;
  if (!mockMode && (kpisQuery.isError || topServicesQuery.isError || servicesQuery.isError)) return <ErrorState onRetry={() => { void kpisQuery.refetch(); void topServicesQuery.refetch(); void servicesQuery.refetch(); }} />;
  if (!kpis) return null;
  const hourly = kpis.sesionesPorHora;
  const estados = kpis.estadosActivos;
  const activeSessions = (estados.SOLICITADA ?? 0) + (estados.CONFIRMADA ?? 0) + (estados.ASIGNADA ?? 0) + (estados.EN_CURSO ?? 0);
  const completedSessions = estados.REALIZADA ?? 0;
  const successRate = Math.round(kpis.tasaAsistencia * 1000) / 10;
  const peak = hourly.reduce((best, item) => (item.creadas > best.creadas ? item : best), hourly[0]);
  const maxHourCreadas = Math.max(...hourly.map((item) => item.creadas), 1);
  return <div className="space-y-8">
    <PageIntro eyebrow="Insights · Analítica" title="La operación también cuenta una historia." detail="Encuentra los patrones que ayudan a tu equipo a tomar mejores decisiones." action={<ActionButton onClick={exportCsv} variant="outline" testId="button-export-analytics"><Download size={14} /> Exportar CSV</ActionButton>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Tasa de asistencia" value={`${successRate}%`} detail="realizadas / creadas" /><MetricCard label="Ingresos estimados" value={money(totalRevenue)} detail="solicitudes × precio/hora del catálogo" tone="gold" /><MetricCard label="Sesiones activas" value={String(activeSessions)} detail={`rango ${kpis.range}`} tone="navy" /><MetricCard label="Realizadas" value={String(completedSessions)} detail={`rango ${kpis.range}`} tone="teal" /></div>
    <div className="grid gap-5 xl:grid-cols-[1.35fr_.95fr]"><section className="rounded-2xl border border-card-border bg-card p-5 md:p-6"><SectionHeading eyebrow="Demanda horaria" title="¿Cuándo necesita ayuda la comunidad?" detail="Sesiones creadas y realizadas por hora" /><div className="mt-6 space-y-3">{hourly.map((item) => <div key={item.hora} className="grid grid-cols-[42px_1fr_60px] items-center gap-3 text-xs"><span className="font-mono-ui text-[10px] text-muted-foreground">{new Date(item.hora).getHours()}h</span><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${item.creadas / maxHourCreadas * 100}%` }} /></div><span className="text-right font-mono-ui text-[10px] text-muted-foreground">{item.creadas} · {item.realizadas} ok</span></div>)}</div></section><section className="rounded-2xl border border-card-border bg-card p-5 md:p-6"><SectionHeading eyebrow="Lectura rápida" title="Puntos de atención" detail={`Señales del rango ${kpis.range}`} /><div className="space-y-3">{peak && <Insight icon={<Target size={16} />} title="Ventana de mayor demanda" detail={`${new Date(peak.hora).getHours()}h concentra ${peak.creadas} sesiones creadas.`} tone="teal" />}{topPick && <Insight icon={<ArrowUpRight size={16} />} title="Servicio más solicitado" detail={`${topPick.nombre} con ${topPick.totalSolicitudes} solicitudes (${money(topPick.ingresos)} estimado).`} tone="gold" />}<Insight icon={<Activity size={16} />} title="Cancelaciones en el rango" detail={`${estados.CANCELADA ?? 0} sesiones canceladas de un total de ${activeSessions + completedSessions + (estados.CANCELADA ?? 0)}.`} tone="navy" /></div></section></div>
    <section className="rounded-2xl border border-card-border bg-card p-5 md:p-6"><SectionHeading eyebrow="Servicios más solicitados" title="Servicios que mueven la operación" detail="Solicitudes e ingresos estimados por servicio" /><div className="mt-6 grid gap-3 md:grid-cols-5">{ranked.map((item) => <div key={item.servicioId} className="group min-w-0"><div className="flex h-36 items-end justify-center rounded-xl bg-muted/55 p-3"><div className="w-full rounded-lg bg-primary/75 transition-all duration-300 group-hover:bg-primary" style={{ height: `${Math.max(10, item.ingresos / maxRevenue * 100)}%` }} /></div><p className="mt-2 truncate text-center font-mono-ui text-[10px] text-muted-foreground">{item.nombre}</p><p className="mt-1 text-center text-xs font-bold">{money(item.ingresos)}</p><p className="mt-0.5 text-center text-[10px] text-muted-foreground">{item.totalSolicitudes} solicitudes</p></div>)}</div>{topPick && <div className="mt-5 border-t border-border/70 pt-4 text-[11px] text-muted-foreground">Mayor aporte: <span className="font-semibold text-foreground">{topPick.nombre}</span> · {money(topPick.ingresos)} · {topPick.totalSolicitudes} solicitudes</div>}</section>
  </div>;
}

function Insight({ icon, title, detail, tone }: { icon: React.ReactNode; title: string; detail: string; tone: 'teal' | 'gold' | 'navy' }) {
  const styles = { teal: 'bg-[hsl(var(--primary)/.1)] text-primary', gold: 'bg-[hsl(var(--accent)/.2)] text-[hsl(31_55%_34%)]', navy: 'bg-[hsl(var(--chart-3)/.12)] text-[hsl(var(--chart-3))]' };
  return <div className="flex gap-3 rounded-xl bg-muted/60 p-3.5"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${styles[tone]}`}>{icon}</span><div><p className="text-xs font-bold">{title}</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{detail}</p></div></div>;
}

export function AuditPage() {
  const { mockMode, audit: localAudit } = useWorkspace();
  const [eventType, setEventType] = useState('');
  const [limit, setLimit] = useState('50');
  const [expanded, setExpanded] = useState<string | null>(null);
  const params = useMemo(() => ({ tipo: eventType || undefined }), [eventType]);
  const auditQuery = useListAuditEvents(params, { query: { enabled: !mockMode, queryKey: getListAuditEventsQueryKey(params) } });
  const events = (mockMode ? localAudit : (Array.isArray(auditQuery.data) ? auditQuery.data : [])).filter((event) => !eventType || event.eventoTipo === eventType).slice(0, Number(limit));
  const types = [...new Set(localAudit.map((event) => event.eventoTipo))];
  return <div className="space-y-7">
    <PageIntro eyebrow="Control · Auditoría" title="Todo cambio deja una señal." detail="Consulta la historia operativa del workspace con contexto suficiente para investigar, entender y actuar." action={<div className="flex items-center gap-2 rounded-xl bg-[hsl(var(--primary)/.1)] px-3 py-2.5 text-[11px] font-semibold text-primary"><ShieldCheckIcon /> Registro íntegro</div>} />
    <div className="flex flex-col gap-3 rounded-2xl border border-card-border bg-card p-4 md:flex-row md:items-end"><SelectField label="Tipo de evento" value={eventType} onChange={setEventType} options={types.map((type) => ({ value: type, label: type.replaceAll('_', ' ') }))} testId="select-audit-event" /><SelectField label="Registros" value={limit} onChange={setLimit} options={['25', '50', '100'].map((value) => ({ value, label: value }))} testId="select-audit-limit" /><button onClick={() => { setEventType(''); setLimit('50'); }} className="mb-0.5 rounded-xl px-3 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted" data-testid="button-clear-audit">Limpiar filtros</button></div>
    {!mockMode && auditQuery.isLoading ? <SkeletonRows count={5} /> : !mockMode && auditQuery.isError ? <ErrorState onRetry={() => void auditQuery.refetch()} /> : events.length === 0 ? <EmptyState title="No hay eventos para mostrar" detail="Cambia los filtros para ampliar la ventana de auditoría." /> : <div className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-[0_8px_26px_hsl(var(--foreground)/.025)]"><div className="hidden grid-cols-[1fr_1.8fr_1fr_1.2fr_1fr_.4fr] gap-3 border-b border-border/70 bg-muted/40 px-5 py-3 font-mono-ui text-[9px] uppercase tracking-[.13em] text-muted-foreground md:grid"><span>Evento</span><span>Origen</span><span>Usuario</span><span>Fecha</span><span>Resultado</span><span /></div>{events.map((event) => <div key={event.id} className="border-b border-border/60 last:border-b-0"><div className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_1.8fr_1fr_1.2fr_1fr_.4fr] md:items-center"><div><p className="font-mono-ui text-[10px] text-primary">{event.id}</p><p className="mt-1 text-[11px] font-bold">{event.eventoTipo.replaceAll('_', ' ')}</p></div><p className="text-xs text-muted-foreground">{event.origen}</p><p className="text-xs">{event.usuario}</p><p className="text-xs text-muted-foreground">{dateTime(event.fechaTimestamp)}</p><StatusPill status={event.resultado} /><button onClick={() => setExpanded(expanded === event.id ? null : event.id)} className="flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted" data-testid={`button-expand-audit-${event.id}`}><ChevronDown size={15} className={expanded === event.id ? 'rotate-180 transition' : 'transition'} /></button></div>{expanded === event.id && <div className="mx-5 mb-4 rounded-xl bg-[hsl(var(--foreground)/.94)] p-4 text-[11px] text-[hsl(var(--background))]"><pre className="overflow-auto whitespace-pre-wrap font-mono-ui leading-relaxed">{JSON.stringify(event.payloadJson, null, 2)}</pre></div>}</div>)}</div>}
    <p className="font-mono-ui text-[10px] uppercase tracking-[.13em] text-muted-foreground">Mostrando {events.length} de la ventana seleccionada · UTC−06:00</p>
  </div>;
}

function ShieldCheckIcon() { return <CheckCircle2 size={14} />; }