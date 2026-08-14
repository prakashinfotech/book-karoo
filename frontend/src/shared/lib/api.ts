import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/shared/types';

// Lazy import to avoid circular dependency (authStore → api → authStore)
let getToken: () => string | null = () => null;
let onRefreshFail: () => void = () => undefined;

export function configureApiInterceptors(opts: {
  getToken: () => string | null;
  onRefreshFail: () => void;
}) {
  getToken = opts.getToken;
  onRefreshFail = opts.onRefreshFail;
}

export const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL ?? 'https://bookkaroo-1.onrender.com',
  headers:         { 'Content-Type': 'application/json' },
  withCredentials: true, // required so the httpOnly bk_refresh cookie is sent on refresh calls
});

// ── Request: attach access token ───────────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: handle 401 → refresh ────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Never retry auth endpoints — login/signup 401s are credential errors, not token expiry.
    const url = originalRequest.url ?? '';
    const isAuthCall = url.includes('/api/auth/refresh')
                    || url.includes('/api/auth/login')
                    || url.includes('/api/auth/signup');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthCall) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post<{ accessToken: string }>('/api/auth/refresh');
        const { accessToken } = data;

        // Dynamically update the store after refresh
        const { useAuthStore } = await import('@/features/auth/store/authStore');
        useAuthStore.getState().setAuth(useAuthStore.getState().user!, accessToken);

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        onRefreshFail();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normalise error shape
    if (!error.response) {
      const apiError: ApiError = {
        message: 'No internet connection. Please check your network.',
        statusCode: 0,
      };
      return Promise.reject(apiError);
    }

    const { status, data } = error.response as { status: number; data: Record<string, unknown> };
    let message: string;

    if (status === 500) {
      message = 'Something went wrong on our end. Please try again.';
    } else if (status === 503) {
      message = 'Service temporarily unavailable. Please try again shortly.';
    } else if (status === 403) {
      message = "You don't have permission to do this.";
    } else if (status === 404) {
      message = 'The requested resource was not found.';
    } else {
      message =
        (data?.message as string | undefined) ??
        (data?.error as string | undefined) ??
        (data?.detail as string | undefined) ??   // ProblemDetails: human-readable detail
        (data?.title as string | undefined) ??    // fallback to status name e.g. "Conflict"
        error.message ??
        'An error occurred.';
    }

    const apiError: ApiError = {
      message,
      statusCode: status,
      errors: data?.errors as Record<string, string[]> | undefined,
    };

    return Promise.reject(apiError);
  }
);
