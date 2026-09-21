import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { AppShell, WorkspaceProvider } from '@/components/app-shell';
import { AnalyticsPage, AuditPage, CatalogPage, DashboardPage, SessionsPage } from '@/pages/console';
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

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <WorkspaceProvider>
        <AppShell>
          <Switch>
            <Route path="/" component={DashboardPage} />
            <Route path="/catalog" component={CatalogPage} />
            <Route path="/sessions" component={SessionsPage} />
            <Route path="/analytics" component={AnalyticsPage} />
            <Route path="/audit" component={AuditPage} />
            <Route component={NotFound} />
          </Switch>
        </AppShell>
      </WorkspaceProvider>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
