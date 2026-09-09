import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { getCurrentUser } from '../services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Validates persisted auth tokens on app startup by calling /auth/me.
 * If the stored token is invalid/expired, clears auth state silently.
 */
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { accessToken, setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    // Validate the persisted token
    getCurrentUser()
      .then((user) => {
        // Token is valid — refresh user data in store (token stays the same)
        const refreshToken = useAuthStore.getState().refreshToken;
        if (refreshToken) {
          setAuth(user, accessToken, refreshToken);
        }
      })
      .catch(() => {
        // Token invalid/expired — clear auth
        clearAuth();
      })
      .finally(() => {
        setLoading(false);
      });
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>{children}</AuthInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
