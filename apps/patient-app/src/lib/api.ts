const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// Token stored in memory — never in localStorage (XSS protection)
// Access token lives in React state via AuthContext
// Refresh token lives in HttpOnly cookie set by Auth Service
let inMemoryAccessToken: string | null = null

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token
}

export function getAccessToken() {
  return inMemoryAccessToken
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  }

  if (inMemoryAccessToken) {
    headers['Authorization'] = `Bearer ${inMemoryAccessToken}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // sends HttpOnly refresh token cookie automatically
  })

  // Silent token refresh on 401
  if (response.status === 401 && path !== '/api/v1/auth/refresh') {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      // Retry original request with new token
      headers['Authorization'] = `Bearer ${inMemoryAccessToken}`
      const retryResponse = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      })
      if (!retryResponse.ok) throw new Error(`API error: ${retryResponse.status}`)
      return retryResponse.json()
    }
    // Refresh failed — clear token, let AuthContext handle redirect
    setAccessToken(null)
    throw new Error('UNAUTHORIZED')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message ?? `API error: ${response.status}`)
  }

  // Handle 204 No Content
  if (response.status === 204) return null as T

  return response.json()
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    // HttpOnly cookie is sent automatically via credentials: 'include'
    const data = await apiFetch<{ accessToken: string }>('/api/v1/auth/refresh', {
      method: 'POST',
    })
    setAccessToken(data.accessToken)
    return true
  } catch {
    return false
  }
}
