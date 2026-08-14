import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { Providers } from './providers';
import { ToastContainer } from '@/shared/components/ui/Toast';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCityStore } from '@/shared/store/cityStore';
import { configureApiInterceptors, api } from '@/shared/lib/api';
import { ChatbotWidget } from '@/features/chatbot/components/ChatbotWidget';
import type { City } from '@/shared/types';

function AppInit({ children }: { children: React.ReactNode }) {
  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    configureApiInterceptors({
      getToken: () => useAuthStore.getState().accessToken,
      onRefreshFail: () => {
        useAuthStore.getState().clearAuth();
        // Don't use window.location.href — causes an infinite reload loop.
        // ProtectedRoute handles the /login redirect via React Router.
      },
    });

    // Restore city from localStorage before anything renders
    useCityStore.getState().initFromStorage();

    // Auto-detect city if none persisted (best-effort; fails silently for localhost)
    if (!useCityStore.getState().selectedCity) {
      api.get<City>('/api/cities/detect')
        .then(({ data }) => {
          if (data && !useCityStore.getState().selectedCity) {
            useCityStore.getState().setCity(data);
          }
        })
        .catch(() => { /* user will choose via CityModal */ });
    }

    void initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="w-10 h-10 rounded-full border-2 border-accent-indigo/20 border-t-accent-indigo animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Providers>
      <AppInit>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-accent-crimson focus:text-white focus:px-4 focus:py-2 focus:rounded-lg font-sans text-sm font-semibold"
        >
          Skip to main content
        </a>
        <RouterProvider router={router} />
        <ToastContainer />
        <ChatbotWidget />
      </AppInit>
    </Providers>
  );
}
