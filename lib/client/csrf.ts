/**
 * Client-side CSRF token utilities
 * This module provides functions for fetching and using CSRF tokens in client-side code
 */

/**
 * Fetch a CSRF token from the server
 * @returns CSRF token
 */
export async function fetchCsrfToken(): Promise<string> {
  try {
    const response = await fetch('/api/auth/csrf-token');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.csrfToken) {
      throw new Error('Invalid CSRF token response');
    }
    
    // Store the token in session storage
    sessionStorage.setItem('csrfToken', data.csrfToken);
    
    return data.csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
}

/**
 * Get the current CSRF token from session storage or fetch a new one
 * @returns CSRF token
 */
export async function getCsrfToken(): Promise<string> {
  // Try to get the token from session storage
  const token = sessionStorage.getItem('csrfToken');
  
  if (token) {
    return token;
  }
  
  // Fetch a new token if not found
  return fetchCsrfToken();
}

/**
 * Add a CSRF token to a fetch request
 * @param url - Request URL
 * @param options - Fetch options
 * @returns Fetch options with CSRF token
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Only add CSRF token for state-changing methods
  const method = options.method || 'GET';
  
  if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    return fetch(url, options);
  }
  
  // Get the CSRF token
  const csrfToken = await getCsrfToken();
  
  // Create headers with CSRF token
  const headers = new Headers(options.headers || {});
  headers.set('X-CSRF-Token', csrfToken);
  
  // Add the token to the request
  const newOptions = {
    ...options,
    headers,
  };
  
  return fetch(url, newOptions);
}

/**
 * Example usage:
 * 
 * // For GET requests (no CSRF token needed)
 * const data = await fetchWithCsrf('/api/data').then(res => res.json());
 * 
 * // For POST requests (CSRF token added automatically)
 * const response = await fetchWithCsrf('/api/data', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify({ name: 'Example' }),
 * });
 */