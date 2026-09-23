import { AlertTriangle, ArrowRight, Check, ChevronRight, Clock3, LoaderCircle, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

export function SectionHeading({ eyebrow, title, detail, action }: { eyebrow?: string; title: string; detail?: string; action?: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div>{eyebrow && <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-primary">{eyebrow}</p>}<h2 className="mt-1 font-display text-[22px] font-bold tracking-tight text-foreground">{title}</h2>{detail && <p className="mt-1 text-[12px] text-muted-foreground">{detail}</p>}</div>{action}</div>;
}

export function StatusPill({ status }: { status: string }) {
  const labels: Record<string, string> = { SOLICITADA: 'Solicitada', CONFIRMADA: 'Confirmada', ASIGNADA: 'Asignada', EN_CURSO: 'En curso', REALIZADA: 'Realizada', CANCELADA: 'Cancelada', EXITOSO: 'Exitoso', ERROR: 'Error', ACTIVO: 'Activo', INACTIVO: 'Inactivo' };
  const classes: Record<string, string> = { SOLICITADA: 'bg-[hsl(var(--accent)/.18)] text-[hsl(31_55%_34%)]', CONFIRMADA: 'bg-[hsl(var(--chart-5)/.17)] text-[hsl(195_42%_34%)]', ASIGNADA: 'bg-[hsl(var(--chart-5)/.17)] text-[hsl(195_42%_34%)]', EN_CURSO: 'bg-[hsl(var(--primary)/.13)] text-primary', REALIZADA: 'bg-[hsl(var(--primary)/.1)] text-primary', CANCELADA: 'bg-[hsl(var(--destructive)/.12)] text-destructive', EXITOSO: 'bg-[hsl(var(--primary)/.1)] text-primary', ERROR: 'bg-[hsl(var(--destructive)/.12)] text-destructive', ACTIVO: 'bg-[hsl(var(--primary)/.1)] text-primary', INACTIVO: 'bg-muted text-muted-foreground' };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono-ui text-[10px] font-medium ${classes[status] ?? 'bg-muted text-muted-foreground'}`} data-testid={`status-${status.toLowerCase()}`}>{(status === 'EN_CURSO' || status === 'EXITOSO') && <span className="h-1.5 w-1.5 rounded-full bg-current" />}{labels[status] ?? status}</span>;
}

export function SkeletonRows({ count = 4 }: { count?: number }) {
  return <div className="space-y-3">{Array.from({ length: count }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-xl bg-muted/70" />)}</div>;
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-[hsl(var(--destructive)/.04)] p-8 text-center"><AlertTriangle size={25} className="text-destructive" /><h3 className="mt-3 font-display text-base font-bold">No pudimos cargar este módulo</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">Revisa tu conexión y vuelve a intentarlo. El resto del workspace sigue disponible.</p>{onRetry && <button onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-xs font-semibold text-destructive shadow-sm" data-testid="button-retry"><RefreshCw size={13} /> Reintentar</button>}</div>;
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-muted text-muted-foreground"><Clock3 size={19} /></div><h3 className="mt-3 font-display text-base font-bold">{title}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{detail}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

export function ActionButton({ children, onClick, variant = 'primary', testId, disabled = false }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'outline' | 'quiet'; testId: string; disabled?: boolean }) {
  const styles = variant === 'primary' ? 'bg-primary text-primary-foreground hover:brightness-105 shadow-[0_5px_14px_hsl(var(--primary)/.16)]' : variant === 'outline' ? 'border border-border bg-card text-foreground hover:border-primary/40 hover:text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground';
  return <button onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${styles}`} data-testid={testId}>{children}</button>;
}

export function MetricCard({ label, value, trend, detail, tone = 'teal' }: { label: string; value: string; trend?: string; detail?: string; tone?: 'teal' | 'gold' | 'red' | 'navy' }) {
  const dots = { teal: 'bg-primary', gold: 'bg-accent', red: 'bg-destructive', navy: 'bg-[hsl(var(--chart-3))]' };
  return <div className="rounded-2xl border border-card-border bg-card p-4 shadow-[0_8px_26px_hsl(var(--foreground)/.025)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_hsl(var(--foreground)/.07)]"><div className="flex items-center justify-between"><p className="font-mono-ui text-[10px] uppercase tracking-[.13em] text-muted-foreground">{label}</p><span className={`h-2 w-2 rounded-full ${dots[tone]}`} /></div><div className="mt-3 flex items-end justify-between gap-2"><p className="font-display text-[27px] font-bold tracking-tight">{value}</p>{trend && <span className={`font-mono-ui text-[10px] font-medium ${trend.startsWith('-') ? 'text-destructive' : 'text-primary'}`}>{trend}</span>}</div>{detail && <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>}</div>;
}

export function ArrowLink({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 text-xs font-bold text-primary transition group-hover:gap-2">{children}<ArrowRight size={14} /></span>;
}

export function SelectField({ label, value, onChange, options, testId }: { label: string; value: string; onChange: (value: string) => void; options: { label: string; value: string }[]; testId: string }) {
  return <label className="block"><span className="mb-1.5 block font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" data-testid={testId}><option value="">Todos</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

export function LoadingInline() {
  return <span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle size={14} className="animate-spin" />Cargando datos</span>;
}

export function CheckIcon() { return <Check size={14} />; }
export function ChevronIcon() { return <ChevronRight size={14} />; }