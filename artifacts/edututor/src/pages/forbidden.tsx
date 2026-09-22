import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/auth/auth-context';

export function ForbiddenPage() {
  const { user, logout } = useAuth();
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-background px-6">
      <div className="max-w-md text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[hsl(var(--destructive)/.1)] text-destructive">
          <ShieldAlert size={26} />
        </span>
        <p className="mt-6 font-mono-ui text-[10px] uppercase tracking-[.18em] text-destructive">
          403 — Acceso denegado
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
          Rol insuficiente para este módulo.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {user?.name ?? 'Tu cuenta'} ({user?.role ?? 'Sin rol'}) no tiene permisos de administrador (ADMIN) para consultar analítica, reportes o auditoría.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground">
            <ArrowLeft size={14} /> Volver al resumen
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-xl border border-border bg-card px-4 py-3 text-xs font-bold text-foreground hover:border-primary/40"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </main>
  );
}
