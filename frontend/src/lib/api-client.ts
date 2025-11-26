import { buildApiUrl } from '../config/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

// Helper to get JWT token from localStorage
function getAuthToken(): string | null {
  try {
    const authState = localStorage.getItem('auth-storage');
    if (authState) {
      const parsed = JSON.parse(authState);
      const token = parsed.state?.token;
      const expiresAt = parsed.state?.tokenExpiresAt;

      // Check if token is expired
      if (token && expiresAt) {
        const expiryDate = new Date(expiresAt);
        if (expiryDate > new Date()) {
          return token;
        }
      }
    }
  } catch (error) {
    console.error('Failed to get auth token from storage:', error);
  }
  return null;
}

// Request timeout in milliseconds (30 seconds)
const REQUEST_TIMEOUT = 30000;

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);

  const isFormData = options.body instanceof FormData;
  const defaultHeaders: HeadersInit = isFormData
    ? {}
    : {
        'Content-Type': 'application/json',
      };

  // Add JWT token in Authorization header if available
  const token = getAuthToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    signal: controller.signal,
  };

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        // Clear auth storage and redirect to login
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        throw new ApiError(401, 'Unauthorized - Please login again', null);
      }

      const errorData = await response.json().catch(() => null);
      throw new ApiError(response.status, response.statusText, errorData);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    // Handle abort errors (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }

    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  patch: <T>(endpoint: string, data: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
