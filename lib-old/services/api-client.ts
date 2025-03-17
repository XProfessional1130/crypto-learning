import { handleError } from '@/lib/utils/error-handler';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export class ApiClient {
  private static baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

  private static async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    try {
      const { params, ...init } = options;

      // Build URL with query parameters
      const url = new URL(endpoint, this.baseUrl);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      // Add default headers
      const headers = new Headers(init.headers);
      if (!headers.has('Content-Type') && init.method !== 'GET') {
        headers.set('Content-Type', 'application/json');
      }

      const response = await fetch(url.toString(), {
        ...init,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      // Handle no content responses
      if (response.status === 204) {
        return null as T;
      }

      return await response.json();
    } catch (error) {
      throw handleError(error);
    }
  }

  static async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  static async post<T>(endpoint: string, data?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async put<T>(endpoint: string, data?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async patch<T>(endpoint: string, data?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
} 