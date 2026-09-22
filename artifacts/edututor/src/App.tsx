import { type ReactNode } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { AppShell, WorkspaceProvider } from '@/components/app-shell';
import { AnalyticsPage, AuditPage, CatalogPage, DashboardPage, SessionsPage } from '@/pages/console';
import { AuthProvider } from '@/auth/auth-context';
import { ProtectedRoute } from '@/auth/protected-route';
import { ForbiddenPage } from '@/pages/forbidden';
import { LoginPage } from '@/pages/login';
import { msalConfig } from '@/auth/authConfig';
import { setBaseUrl } from '@workspace/api-client-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

if (import.meta.env.VITE_API_BASE_URL) {
  setBaseUrl(import.meta.env.VITE_API_BASE_URL);
}

const queryClient = new QueryClient();
const msalInstance = new PublicClientApplication(msalConfig);

function AdminReportsRoute() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AnalyticsPage />
    </ProtectedRoute>
  );
}

function AdminAuditRoute() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AuditPage />
    </ProtectedRoute>
  );
}

function WorkspaceRoutes() {
  return (
    <RoutedErrorBoundary>
      <ProtectedRoute>
        <WorkspaceProvider>
          <AppShell>
            <Switch>
              <Route path="/" component={DashboardPage} />
              <Route path="/catalog" component={CatalogPage} />
              <Route path="/sessions" component={SessionsPage} />
              <Route path="/analytics" component={AdminReportsRoute} />
              <Route path="/reportes" component={AdminReportsRoute} />
              <Route path="/audit" component={AdminAuditRoute} />
              <Route path="/auditoria" component={AdminAuditRoute} />
              <Route path="/forbidden" component={ForbiddenPage} />
              <Route component={NotFound} />
            </Switch>
          </AppShell>
        </WorkspaceProvider>
      </ProtectedRoute>
    </RoutedErrorBoundary>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/forbidden" component={ForbiddenPage} />
      <Route component={WorkspaceRoutes} />
    </Switch>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </MsalProvider>
  );
}

export default App;
