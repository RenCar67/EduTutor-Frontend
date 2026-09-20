import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="flex min-h-[65vh] items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[hsl(var(--accent)/.22)] text-[hsl(31_55%_34%)]"><Compass size={25} /></div>
        <p className="mt-5 font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Ruta no encontrada · 404</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Este camino todavía no existe.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Regresa al resumen para seguir el pulso de tus operaciones.</p>
        <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground" data-testid="link-not-found-home"><ArrowLeft size={14} /> Volver al resumen</Link>
      </div>
    </div>
  );
}
