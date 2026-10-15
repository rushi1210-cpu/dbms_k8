const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Custom API client for handling HTTP requests with JWT authorization,
 * structured JSON responses, and standardized error handling.
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = localStorage.getItem('railway_token');
  if (token && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method: options.method || 'GET',
    headers,
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { raw: text } : {};
    }

    if (!response.ok) {
      // 401 Unauthorized handling
      if (response.status === 401 && !endpoint.includes('/login')) {
        // If an authenticated endpoint returns 401, clear stored credentials
        localStorage.removeItem('railway_token');
        localStorage.removeItem('railway_user');
      }

      const errorMessage =
        data?.message ||
        data?.error ||
        (Array.isArray(data?.errors) ? data.errors.join(', ') : null) ||
        `Request failed with status ${response.status}`;

      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    // Network or server unreachable error
    const netError = new Error('Unable to connect to the Railway Management server. Please ensure the backend is running.');
    netError.status = 0;
    throw netError;
  }
}
