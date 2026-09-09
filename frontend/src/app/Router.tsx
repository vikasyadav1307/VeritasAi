import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AuthLayout } from '../components/layout/AuthLayout';
import { useAuthStore } from '../store/auth.store';

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('../features/auth/pages/RegisterPage'));
const AnalyzePage = lazy(() => import('../features/analyze/pages/AnalyzePage'));
const HistoryPage = lazy(() => import('../features/history/pages/HistoryPage'));
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'));

function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'var(--text-secondary)',
      fontSize: 'var(--text-lg)',
    }}>
      Loading...
    </div>
  );
}

/**
 * Wrapper that protects routes requiring authentication.
 * Redirects unauthenticated users to /login and handles initial auth loading.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) {
    return <PageLoader />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/**
 * Wrapper that redirects authenticated users away from auth pages.
 * Guests can freely access login/register.
 */
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) {
    return <PageLoader />;
  }
  if (isAuthenticated) {
    return <Navigate to="/analyze" replace />;
  }
  return <>{children}</>;
}

export function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public auth routes — redirect authenticated users to /analyze */}
        <Route
          element={
            <GuestRoute>
              <AuthLayout />
            </GuestRoute>
          }
        >
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected app routes — accessible only to authenticated users */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/analyze" replace />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/analyze" replace />} />
      </Routes>
    </Suspense>
  );
}
