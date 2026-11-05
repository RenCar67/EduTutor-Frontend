import { getGetKafkaStreamQueryKey, useGetKafkaStream } from '@workspace/api-client-react';
import type { EventoAuditoria, KafkaStream } from '@workspace/api-client-react';

const GRUPOS: Record<string, string> = { 'audit-service-v1': 'Auditoría', 'report-service-v1': 'Reportes' };
const REFRESCO_MS = 10_000;

// En modo demostración no hay broker: se reparte cada evento local en una de
// 3 particiones por el id de la sesión (la misma idea que la key en Kafka) y
// ambos grupos van al día.
function streamDemo(audit: EventoAuditoria[]): KafkaStream {
  const conteo = [0, 0, 0];
  for (const evento of audit) {
    const id = Number(String(evento.payloadJson?.sessionId ?? '').replace(/\D/g, '')) || 0;
    conteo[id % 3] += 1;
  }
  const detalle = conteo.map((offsetFinal, particion) => ({ particion, offsetFinal }));
  const alDia = (grupo: string) => ({
    grupo,
    lagTotal: 0,
    particiones: detalle.map((d) => ({ particion: d.particion, offsetActual: d.offsetFinal, offsetFinal: d.offsetFinal, lag: 0 })),
  });
  return { topic: 'sessions.events', particiones: 3, totalEventos: audit.length, detalle, grupos: [alDia('audit-service-v1'), alDia('report-service-v1')] };
}

function LagPill({ lag }: { lag: number }) {
  return lag === 0
    ? <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono-ui text-[10px] font-semibold text-emerald-700">al día</span>
    : <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-mono-ui text-[10px] font-semibold text-amber-700">LAG {lag}</span>;
}

// Muestra el tópico de eventos tal como lo ve Kafka: cada partición es un log
// con su propio contador (offset), y cada grupo de consumo recuerda hasta
// dónde leyó. La diferencia es el LAG.
export function KafkaStreamPanel({ mockMode, localAudit }: { mockMode: boolean; localAudit: EventoAuditoria[] }) {
  const query = useGetKafkaStream({ query: { enabled: !mockMode, queryKey: getGetKafkaStreamQueryKey(), refetchInterval: REFRESCO_MS, retry: false } });
  const datos = query.data as KafkaStream | undefined;
  const stream = mockMode ? streamDemo(localAudit) : (datos && Array.isArray(datos.grupos) && Array.isArray(datos.detalle) ? datos : null);
  const plantilla = { gridTemplateColumns: `0.9fr 0.9fr repeat(${stream?.grupos.length ?? 0}, 1.2fr)` };

  return (
    <section className="rounded-2xl border border-card-border bg-card p-5" data-testid="kafka-stream-panel">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-primary">Kafka · {stream?.topic ?? 'sessions.events'}</p>
          <h2 className="mt-1 font-display text-lg font-bold tracking-tight">Estado del flujo de eventos</h2>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">Cada partición es un registro independiente y su offset cuenta los eventos que lleva. Cada grupo recuerda hasta dónde leyó: lo que falta es el LAG.</p>
        </div>
        {stream && <p className="font-mono-ui text-[10px] uppercase tracking-[.13em] text-muted-foreground" data-testid="kafka-stream-total">{stream.totalEventos} eventos · {stream.particiones} particiones</p>}
      </div>

      {!stream ? (
        <p className="mt-4 rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground" data-testid="kafka-stream-estado">
          {query.isLoading ? 'Consultando Kafka…' : 'No se pudo consultar Kafka en este momento. El historial de auditoría guardado sigue disponible y este panel se actualiza solo cuando el servicio responde.'}
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-border/70">
          <div className="grid gap-3 bg-muted/40 px-4 py-2.5 font-mono-ui text-[9px] uppercase tracking-[.13em] text-muted-foreground" style={plantilla}>
            <span>Partición</span>
            <span>Eventos</span>
            {stream.grupos.map((g) => <span key={g.grupo} title={g.grupo}>{GRUPOS[g.grupo] ?? g.grupo}</span>)}
          </div>
          {stream.detalle.map((d) => (
            <div key={d.particion} className="grid items-center gap-3 border-t border-border/60 px-4 py-2.5 text-xs" style={plantilla} data-testid={`kafka-particion-${d.particion}`}>
              <span className="font-mono-ui font-semibold">{d.particion}</span>
              <span className="font-mono-ui">{d.offsetFinal}</span>
              {stream.grupos.map((g) => {
                const fila = g.particiones.find((x) => x.particion === d.particion);
                return (
                  <span key={g.grupo} className="flex items-center gap-2">
                    <span className="font-mono-ui text-muted-foreground">leído {fila?.offsetActual ?? 0}</span>
                    <LagPill lag={fila?.lag ?? 0} />
                  </span>
                );
              })}
            </div>
          ))}
          <div className="grid items-center gap-3 border-t border-border bg-muted/30 px-4 py-2.5 text-xs font-semibold" style={plantilla}>
            <span>Total</span>
            <span className="font-mono-ui">{stream.totalEventos}</span>
            {stream.grupos.map((g) => <span key={g.grupo}><LagPill lag={g.lagTotal} /></span>)}
          </div>
        </div>
      )}
    </section>
  );
}
