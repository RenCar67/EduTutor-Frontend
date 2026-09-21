import { Bell, BookOpen, ChevronDown, CircleHelp, Database, LayoutDashboard, LineChart, ListChecks, LogOut, Menu, Search, ShieldCheck, SlidersHorizontal, UsersRound, X } from 'lucide-react';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { InteractionRequiredAuthError, type AccountInfo } from '@azure/msal-browser';
import { demoAudit, demoDaily, demoHourly, demoServices, demoSessions, demoSummary, lifecycle } from '@/lib/demo-data';
import { setAuthTokenGetter, setRequestContext } from '@workspace/api-client-react';
import type { AnalyticsSummary, EventoAuditoria, MetricaHora, MetricaServicioDia, Servicio, Sesion, SesionInput } from '@workspace/api-client-react';
import { msalInstance } from '@/msal';
import { apiRequest, loginRequest } from '@/authConfig';

// Roles de demo (Mock Mode) — se mapean 1:1 a los App Roles reales de Azure.
type Role = 'Estudiante' | 'Coordinador' | 'Administrador' | 'Auditor';
type WorkspaceContextValue = {
  mockMode: boolean;
  setMockMode: (value: boolean) => void;
  role: Role;
  setRole: (value: Role) => void;
  apiRole: string;
  account: AccountInfo | null;
  logout: () => void;
  services: Servicio[];
  sessions: Sesion[];
  summary: AnalyticsSummary;
  hourly: MetricaHora[];
  daily: MetricaServicioDia[];
  audit: EventoAuditoria[];
  createLocalSession: (input: SesionInput) => void;
  transitionLocalSession: (id: string, status: Sesion['estado']) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const userByRole: Record<Role, { id: string; apiRole: string; token: string }> = {
  Estudiante: { id: 'student-001', apiRole: 'ESTUDIANTE', token: 'simulated-azure-ad-jwt-estudiante' },
  Coordinador: { id: 'coordinador-002', apiRole: 'COORDINADOR', token: 'simulated-azure-ad-jwt-coordinador' },
  Administrador: { id: 'admin-001', apiRole: 'ADMIN', token: 'simulated-azure-ad-jwt-admin' },
  Auditor: { id: 'auditor-004', apiRole: 'AUDITOR', token: 'simulated-azure-ad-jwt-auditor' },
};

function currentAccount(): AccountInfo | null {
  const accounts = msalInstance.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
}

function roleFromAccount(account: AccountInfo): string {
  const claims = (account.idTokenClaims ?? {}) as { roles?: string[] };
  const raw = Array.isArray(claims.roles) && claims.roles.length > 0 ? claims.roles[0] : null;
  return (raw ?? 'ESTUDIANTE').toUpperCase();
}

async function getRealAccessToken(account: AccountInfo): Promise<string | null> {
  try {
    const result = await msalInstance.acquireTokenSilent({ ...apiRequest, account });
    return result.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect(apiRequest);
      return null; // el navegador está redirigiendo, no hay token que devolver aún
    }
    throw error;
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [mockMode, setMockMode] = useState(true);
  const [role, setRole] = useState<Role>('Administrador');
  const [account, setAccount] = useState<AccountInfo | null>(() => currentAccount());
  const [services] = useState(demoServices);
  const [sessions, setSessions] = useState(demoSessions);
  const [audit] = useState(demoAudit);

  // MSAL emite eventos de login/logout de forma asíncrona (incluso tras el
  // redirect de vuelta); nos suscribimos para reflejar la sesión real.
  useEffect(() => {
    const callbackId = msalInstance.addEventCallback(() => {
      setAccount(currentAccount());
    });
    return () => {
      if (callbackId) msalInstance.removeEventCallback(callbackId);
    };
  }, []);

  useEffect(() => {
    if (mockMode) {
      setAuthTokenGetter(null);
      const currentUser = userByRole[role];
      setRequestContext({
        userId: currentUser.id,
        userRole: currentUser.apiRole,
        authToken: currentUser.token,
      });
      return;
    }
    if (!account) {
      setRequestContext(null);
      setAuthTokenGetter(null);
      return;
    }
    setRequestContext({
      userId: account.localAccountId,
      userRole: roleFromAccount(account),
      authToken: null,
    });
    setAuthTokenGetter(() => getRealAccessToken(account));
  }, [mockMode, role, account]);

  const createLocalSession = (input: SesionInput) => {
    const service = services.find((item) => item.id === input.servicioId) ?? services[0];
    setSessions((current) => [{
      id: `SES-${1050 + current.length}`,
      servicioId: service.id,
      estudianteId: input.estudianteId,
      tutorId: input.tutorId,
      tutorNombre: service.tutorNombre,
      servicioNombre: service.nombre,
      fechaHora: input.fechaHora,
      estado: 'AGENDADA',
      observaciones: input.observaciones ?? '',
    }, ...current]);
  };
  const transitionLocalSession = (id: string, status: Sesion['estado']) => {
    const targetSession = sessions.find((s) => s.id === id);
    if (!targetSession) {
      throw new Error(`No se encontró la sesión ${id}`);
    }
    // Regla de invariante Caso 5: No se puede transicionar a EN_CURSO sin tutor asignado previamente
    if (status === 'EN_CURSO' && (!targetSession.tutorId || targetSession.estado === 'AGENDADA')) {
      throw new Error(
        'IllegalStateTransitionException: No se puede iniciar una sesión (EN_CURSO) sin tutor previamente asignado y confirmado.'
      );
    }
    // Validar transiciones permitidas
    const allowed = lifecycle[targetSession.estado] ?? [];
    if (!allowed.includes(status)) {
      throw new Error(
        `IllegalStateTransitionException: Transición inválida de ${targetSession.estado} a ${status}.`
      );
    }
    setSessions((current) => current.map((session) => session.id === id ? { ...session, estado: status } : session));
  };
  const apiRole = mockMode ? userByRole[role].apiRole : account ? roleFromAccount(account) : 'ESTUDIANTE';
  const logout = () => {
    msalInstance.logoutRedirect();
  };
  const value = useMemo(() => ({
    mockMode, setMockMode, role, setRole, apiRole, account, logout, services, sessions, summary: demoSummary,
    hourly: demoHourly, daily: demoDaily, audit, createLocalSession, transitionLocalSession,
  }), [mockMode, role, apiRole, account, services, sessions, audit]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
}

const navItems = [
  { href: '/', label: 'Resumen', icon: LayoutDashboard },
  { href: '/catalog', label: 'Catálogo', icon: BookOpen },
  { href: '/sessions', label: 'Sesiones', icon: ListChecks },
  { href: '/analytics', label: 'Analítica', icon: LineChart },
  { href: '/audit', label: 'Auditoría', icon: ShieldCheck },
];

function LoginGate() {
  const entrar = () => {
    msalInstance.loginRedirect(loginRequest);
  };
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background px-5 text-foreground">
      <div className="w-full max-w-sm rounded-2xl border border-card-border bg-card p-8 text-center shadow-[0_8px_26px_hsl(var(--foreground)/.06)]">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><BookOpen size={22} strokeWidth={2.5} /></span>
        <h1 className="mt-4 font-display text-[20px] font-bold tracking-tight">EduTutor</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">Mock Mode está apagado — inicia sesión con tu cuenta de Microsoft para conectarte al BFF real.</p>
        <button
          className="mt-6 w-full rounded-xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90"
          onClick={entrar}
          data-testid="button-login"
        >
          Iniciar sesión con Microsoft
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { mockMode, setMockMode, role, setRole, apiRole, account, logout } = useWorkspace();
  const current = navItems.find((item) => item.href === location);

  if (!mockMode && !account) {
    return <LoginGate />;
  }

  const claims = (account?.idTokenClaims ?? {}) as { name?: string; preferred_username?: string; email?: string };
  const displayName = !mockMode ? (claims.name || claims.preferred_username || claims.email || 'Usuario') : 'Mariana García';
  const initials = displayName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="grain min-h-[100dvh] bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-3">
          <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_6px_18px_hsl(var(--sidebar-primary)/.2)]"><BookOpen size={18} strokeWidth={2.5} /></span>
            <span><span className="block font-display text-[17px] font-bold tracking-tight">EduTutor</span><span className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/50">operations console</span></span>
          </Link>
          <button className="rounded-lg p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent md:hidden" onClick={() => setMobileOpen(false)} data-testid="button-close-menu"><X size={18} /></button>
        </div>
        <div className="mt-10 px-3 font-mono-ui text-[10px] uppercase tracking-[.18em] text-sidebar-foreground/40">Workspace</div>
        <nav className="mt-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors ${location === href ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground'}`} data-testid={`link-nav-${label.toLowerCase()}`}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{location === href && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}</Link>)}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-3">
            <div className="flex items-center justify-between"><span className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-sidebar-foreground/50">Data source</span><Database size={13} className="text-sidebar-primary" /></div>
            <button className="mt-3 flex w-full items-center justify-between rounded-lg bg-sidebar/50 px-2.5 py-2 text-left text-[12px] font-semibold hover:bg-sidebar/80" onClick={() => setMockMode(!mockMode)} data-testid="button-toggle-mock"><span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${mockMode ? 'bg-sidebar-primary' : 'bg-sidebar-foreground/40'}`} />Mock Mode</span><span className={`font-mono-ui text-[10px] ${mockMode ? 'text-sidebar-primary' : 'text-sidebar-foreground/45'}`}>{mockMode ? 'ON' : 'OFF'}</span></button>
            <p className="mt-2 text-[10px] leading-relaxed text-sidebar-foreground/40">{mockMode ? 'Demo workspace · local data' : 'Live API · sesión Azure AD'}</p>
          </div>
          <div className="flex items-center gap-3 border-t border-sidebar-border px-2 pt-4">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent font-display text-sm font-bold text-accent-foreground">{initials || 'MG'}</span>
            <div className="min-w-0"><p className="truncate text-[12px] font-semibold">{displayName}</p><p className="truncate text-[10px] text-sidebar-foreground/45">{mockMode ? 'Operations lead' : apiRole}</p></div>
            {!mockMode ? (
              <button className="ml-auto rounded-lg p-1.5 text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground" onClick={logout} title="Cerrar sesión" data-testid="button-logout"><LogOut size={15} /></button>
            ) : (
              <CircleHelp size={15} className="ml-auto text-sidebar-foreground/35" />
            )}
          </div>
        </div>
      </aside>
      {mobileOpen && <button className="fixed inset-0 z-30 bg-[hsl(var(--foreground)/.28)] md:hidden" onClick={() => setMobileOpen(false)} aria-label="Cerrar navegación" data-testid="button-overlay" />}
      <div className="md:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md md:px-9">
          <div className="flex items-center gap-3"><button className="rounded-xl p-2 hover:bg-muted md:hidden" onClick={() => setMobileOpen(true)} data-testid="button-open-menu"><Menu size={20} /></button><div><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">Workspace / <span className="text-primary">{current?.label ?? 'Resumen'}</span></p><h1 className="mt-1 font-display text-[21px] font-bold tracking-tight">{current?.label ?? 'Resumen operativo'}</h1></div></div>
          <div className="flex items-center gap-2.5">
            <span className="hidden items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-2.5 py-1.5 font-mono-ui text-[10px] font-semibold text-primary lg:inline-flex" title="Cabecera X-User-Role propagada al BFF">
              <ShieldCheck size={13} />
              BFF: {apiRole}
            </span>
            <button className="hidden rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition hover:border-primary/40 hover:text-primary sm:block" data-testid="button-search"><Search size={17} /></button>
            <button className="relative rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition hover:border-primary/40 hover:text-primary" data-testid="button-notifications"><Bell size={17} /><span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" /></button>
            <div className="ml-1 hidden h-8 w-px bg-border sm:block" />
            {mockMode ? (
              <label className="relative">
                <span className="sr-only">Seleccionar rol</span>
                <select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className="appearance-none rounded-xl border border-border bg-card py-2 pl-3 pr-8 text-[11px] font-semibold text-foreground outline-none transition focus:border-primary" data-testid="select-role">{(['Estudiante', 'Coordinador', 'Administrador', 'Auditor'] as Role[]).map((item) => <option key={item}>{item}</option>)}</select>
                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-2.5 text-muted-foreground" />
              </label>
            ) : (
              <span className="rounded-xl border border-border bg-card px-3 py-2 text-[11px] font-semibold text-foreground" title="Rol asignado en Azure AD (App Role)">{apiRole}</span>
            )}
          </div>
        </header>
        <main className="page-enter mx-auto max-w-[1500px] px-5 py-7 md:px-9 md:py-9">{children}</main>
      </div>
    </div>
  );
}

export { lifecycle };
