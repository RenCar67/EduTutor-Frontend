import { Building2, Check, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth, type AppRole, type AuthMode } from '@/auth/auth-context';

const roles: Array<{ value: AppRole; label: string; detail: string }> = [
  { value: 'ESTUDIANTE', label: 'Estudiante', detail: 'Explorar tutorías y gestionar tus sesiones' },
  { value: 'COORDINADOR', label: 'Coordinador', detail: 'Ver agenda y coordinar sesiones' },
  { value: 'AUDITOR', label: 'Auditor', detail: 'Consultar eventos y métricas de auditoría' },
  { value: 'ADMIN', label: 'Administrador', detail: 'Acceso completo a operación y auditoría' },
];

function MicrosoftMark() {
  return (
    <span className="grid grid-cols-2 gap-[2px]" aria-hidden="true">
      <span className="h-3 w-3 bg-[#f25022]" />
      <span className="h-3 w-3 bg-[#7fba00]" />
      <span className="h-3 w-3 bg-[#00a4ef]" />
      <span className="h-3 w-3 bg-[#ffb900]" />
    </span>
  );
}

export function LoginPage() {
  const [, setLocation] = useLocation();
  const {
    mode,
    setMode,
    isAuthenticated,
    isLoading,
    error,
    loginWithAzure,
    loginMock,
    isAzureConfigured,
  } = useAuth();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) setLocation('/');
  }, [isAuthenticated, isLoading, setLocation]);

  const handleAzureLogin = async () => {
    setPending(true);
    await loginWithAzure();
    setPending(false);
  };

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPending(false);
  };

  return (
    <main className="grain grid min-h-[100dvh] bg-background text-foreground lg:grid-cols-[minmax(360px,.82fr)_1.18fr]">
      <section className="relative hidden overflow-hidden bg-sidebar px-10 py-10 text-sidebar-foreground lg:flex lg:flex-col">
        <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-sidebar-primary/15 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 size={19} />
          </span>
          <span>
            <span className="block font-display text-lg font-bold">EduTutor</span>
            <span className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/45">operations console</span>
          </span>
        </div>
        <div className="relative mt-auto max-w-sm pb-6">
          <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-sidebar-primary">Acceso institucional</p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.04] tracking-tight">
            Tu operación de aprendizaje, bajo control.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-sidebar-foreground/60">
            Una consola compartida para conectar estudiantes, tutores y decisiones que mejoran cada sesión.
          </p>
          <div className="mt-8 space-y-3 text-xs text-sidebar-foreground/65">
            {['Inicio de sesión seguro con Microsoft Entra ID', 'Roles institucionales sincronizados', 'Trazabilidad de cada cambio operativo'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-sidebar-primary/15 text-sidebar-primary">
                  <Check size={12} />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[470px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Building2 size={17} />
            </span>
            <span className="font-display text-lg font-bold">EduTutor</span>
          </div>
          <div className="mb-8">
            <p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-primary">Bienvenido de vuelta</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Entra a tu workspace.</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Usa tu cuenta institucional para acceder con el rol y permisos asignados por tu organización.
            </p>
          </div>

          <div className="rounded-2xl border border-card-border bg-card p-5 shadow-[0_12px_35px_hsl(var(--foreground)/.06)] sm:p-6">
            <div className="flex items-center gap-3 rounded-xl bg-muted/65 p-3.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-background">
                <LockKeyhole size={16} className="text-primary" />
              </span>
              <div>
                <p className="text-xs font-bold">Autenticación protegida</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">OAuth 2.0 • OpenID Connect • PKCE</p>
              </div>
              <ShieldCheck size={17} className="ml-auto text-primary" />
            </div>

            <button
              type="button"
              onClick={() => void handleAzureLogin()}
              disabled={pending || isLoading}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-[0_8px_18px_hsl(var(--primary)/.18)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="button-login-microsoft"
            >
              <MicrosoftMark />
              {pending ? 'Redirigiendo a Microsoft...' : 'Iniciar sesión con cuenta institucional Microsoft'}
            </button>

            {!isAzureConfigured && mode === 'azure' && (
              <p className="mt-3 rounded-lg bg-[hsl(var(--accent)/.18)] px-3 py-2 text-[11px] leading-relaxed text-[hsl(31_55%_30%)]">
                Configura las variables de Azure (VITE_AZURE_CLIENT_ID y VITE_AZURE_TENANT_ID) para habilitar el acceso institucional en este entorno.
              </p>
            )}
            {error && (
              <p className="mt-3 rounded-lg bg-[hsl(var(--destructive)/.1)] px-3 py-2 text-[11px] leading-relaxed text-destructive">
                {error}
              </p>
            )}

            <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[.14em] text-muted-foreground/60">
              <span className="h-px flex-1 bg-border" />
              <span>o prueba en modo evaluación</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="rounded-xl border border-border p-3.5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold">Modo de evaluación (Mock)</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Simula roles sin requerir credenciales de Microsoft.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleModeChange(mode === 'mock' ? 'azure' : 'mock')}
                  className="rounded-full border border-border bg-muted px-2.5 py-1 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                  data-testid="button-toggle-auth-mode"
                >
                  {mode === 'mock' ? 'Mock activo' : 'Azure AD'}
                </button>
              </div>
              {mode === 'mock' && (
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {roles.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => loginMock(role.value)}
                      className="rounded-lg border border-border bg-background px-2.5 py-2.5 text-left transition hover:border-primary/50 hover:bg-[hsl(var(--primary)/.05)]"
                      data-testid={`button-mock-${role.value.toLowerCase()}`}
                    >
                      <span className="block text-[11px] font-bold">{role.label}</span>
                      <span className="mt-1 block text-[10px] leading-snug text-muted-foreground">{role.detail}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="mt-5 text-center text-[10px] leading-relaxed text-muted-foreground">
            Al continuar aceptas las políticas de acceso institucional de EduTutor.
          </p>
        </div>
      </section>
    </main>
  );
}
