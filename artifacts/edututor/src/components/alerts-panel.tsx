import { getGetAnalyticsAlertsQueryKey, useGetAnalyticsAlerts } from '@workspace/api-client-react';
import type { AlertaAnalitica, EventoAuditoria } from '@workspace/api-client-react';

const REGLAS: Record<string, string> = { CANCELACIONES_REITERADAS: 'Cancelaciones reiteradas' };
const REFRESCO_MS = 15_000;
const UMBRAL = 3;
const VENTANA_DIAS = 7;

// En modo demostración no hay broker: se aplica la misma regla que audit
// (3 cancelaciones de un estudiante en 7 días) sobre el historial local.
function alertasDemo(audit: EventoAuditoria[]): AlertaAnalitica[] {
  const desde = Date.now() - VENTANA_DIAS * 86_400_000;
  const porEstudiante = new Map<string, EventoAuditoria[]>();
  for (const e of audit) {
    const estudiante = e.payloadJson?.estudianteId;
    if (e.payloadJson?.estadoNuevo !== 'CANCELADA' || !estudiante || new Date(e.fechaTimestamp).getTime() < desde) continue;
    porEstudiante.set(String(estudiante), [...(porEstudiante.get(String(estudiante)) ?? []), e]);
  }
  return [...porEstudiante.entries()]
    .filter(([, eventos]) => eventos.length >= UMBRAL)
    .map(([estudianteId, eventos]) => ({
      id: `demo-${estudianteId}`,
      regla: 'CANCELACIONES_REITERADAS',
      severidad: eventos.length >= UMBRAL * 2 ? 'ALTA' : 'MEDIA',
      estudianteId,
      valor: eventos.length,
      umbral: UMBRAL,
      ventanaDias: VENTANA_DIAS,
      mensaje: `${estudianteId} canceló ${eventos.length} sesiones en los últimos ${VENTANA_DIAS} días`,
      detectadaEn: eventos[eventos.length - 1].fechaTimestamp,
    }));
}

function SeveridadPill({ severidad }: { severidad: string }) {
  const alta = severidad === 'ALTA';
  return (
    <span className={`rounded-full px-2 py-0.5 font-mono-ui text-[10px] font-semibold ${alta ? 'bg-red-500/10 text-red-700' : 'bg-amber-500/15 text-amber-700'}`}>
      {severidad}
    </span>
  );
}

const fecha = (iso: string) => new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });

// Alertas que ms-edututor-audit detecta sobre el historial y publica en el
// segundo tópico (sessions.alerts); ms-edututor-report las guarda y aquí se
// listan.
export function AlertsPanel({ mockMode, localAudit }: { mockMode: boolean; localAudit: EventoAuditoria[] }) {
  const query = useGetAnalyticsAlerts({ limit: 20 }, { query: { enabled: !mockMode, queryKey: getGetAnalyticsAlertsQueryKey({ limit: 20 }), refetchInterval: REFRESCO_MS, retry: false } });
  const alertas = mockMode ? alertasDemo(localAudit) : Array.isArray(query.data) ? (query.data as AlertaAnalitica[]) : null;

  return (
    <section className="rounded-2xl border border-card-border bg-card p-5 md:p-6" data-testid="alerts-panel">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-primary">Kafka · sessions.alerts</p>
          <h2 className="mt-1 font-display text-lg font-bold tracking-tight">Alertas de la operación</h2>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">Patrones que Auditoría detecta en los eventos, por ejemplo un estudiante que cancela varias sesiones en pocos días. Viajan por su propio tópico y Reportes las guarda.</p>
        </div>
        {alertas && <p className="font-mono-ui text-[10px] uppercase tracking-[.13em] text-muted-foreground" data-testid="alerts-total">{alertas.length} recientes</p>}
      </div>

      {!alertas ? (
        <p className="mt-4 rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground" data-testid="alerts-estado">
          {query.isLoading ? 'Consultando alertas…' : 'No se pudieron consultar las alertas en este momento.'}
        </p>
      ) : alertas.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground" data-testid="alerts-vacio">Sin alertas: ningún estudiante ha superado el umbral de cancelaciones.</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-border/70">
          {alertas.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 px-4 py-3 text-xs first:border-t-0" data-testid={`alerta-${a.id}`}>
              <SeveridadPill severidad={a.severidad} />
              <span className="font-semibold">{REGLAS[a.regla] ?? a.regla}</span>
              <span className="font-mono-ui text-muted-foreground">{a.estudianteId}</span>
              <span className="min-w-0 flex-1 text-muted-foreground">{a.mensaje ?? `${a.valor} (umbral ${a.umbral})`}</span>
              <span className="font-mono-ui text-[10px] text-muted-foreground">{fecha(a.detectadaEn)}</span>
              {a.kafkaParticion != null && <span className="font-mono-ui text-[10px] text-muted-foreground">p{a.kafkaParticion} · o{a.kafkaOffset}</span>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
