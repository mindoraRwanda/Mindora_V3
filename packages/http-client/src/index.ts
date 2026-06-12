import CircuitBreaker from 'opossum'

// The shape of every response that comes back from an internal service call
export type ServiceResponse<T> = {
  data: T | null
  status: number
  ok: boolean
  error?: string
}

// Options you can pass when making a call
export type HttpClientOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  timeoutMs?: number
}

// Circuit breaker options — controls how Opossum behaves
const BREAKER_OPTIONS = {
  timeout: 5000,          // if a request takes longer than 5s, it fails
  errorThresholdPercentage: 50,  // open circuit if 50% of requests fail
  resetTimeout: 10000     // try again after 10 seconds
}

// Cache breakers per service base URL so each service has its own circuit
const breakers = new Map<string, CircuitBreaker>()

function getBreaker(baseUrl: string): CircuitBreaker {
  if (!breakers.has(baseUrl)) {
    const breaker = new CircuitBreaker(async (url: string, options: RequestInit) => {
      const response = await fetch(url, options)
      return response
    }, BREAKER_OPTIONS)

    breaker.on('open', () => {
      console.warn(`Circuit breaker OPEN for ${baseUrl} — requests are being blocked`)
    })

    breaker.on('halfOpen', () => {
      console.info(`Circuit breaker HALF-OPEN for ${baseUrl} — testing recovery`)
    })

    breaker.on('close', () => {
      console.info(`Circuit breaker CLOSED for ${baseUrl} — service recovered`)
    })

    breakers.set(baseUrl, breaker)
  }

  return breakers.get(baseUrl)!
}

// The main function every service will use
export async function callService<T>(
  baseUrl: string,
  path: string,
  options: HttpClientOptions = {}
): Promise<ServiceResponse<T>> {
  const {
    method = 'GET',
    body,
    headers = {},
    timeoutMs = 5000
  } = options

  const url = `${baseUrl}${path}`

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    signal: AbortSignal.timeout(timeoutMs)
  }

  if (body) {
    requestInit.body = JSON.stringify(body)
  }

  const breaker = getBreaker(baseUrl)

  try {
    const response = await breaker.fire(url, requestInit) as Response

    // Handle empty responses like 204 No Content
    const text = await response.text()
    const data = text ? JSON.parse(text) as T : null

    return {
      data,
      status: response.status,
      ok: response.ok,
      error: response.ok ? undefined : `Service returned ${response.status}`
    }
  } catch (error: unknown) {
    // Circuit is open or request failed
    if (error instanceof Error && error.message === 'Breaker is open') {
      console.error(`Circuit open — ${baseUrl} is unavailable`)
      return {
        data: null,
        status: 503,
        ok: false,
        error: 'Service temporarily unavailable'
      }
    }

    if (
      error instanceof Error &&
      (error.name === 'TimeoutError' || error.name === 'AbortError')
    ) {
      return {
        data: null,
        status: 408,
        ok: false,
        error: 'Request timed out'
      }
    }

    console.error(`HTTP client error calling ${url}:`, error)
    return {
      data: null,
      status: 500,
      ok: false,
      error: 'Unexpected error'
    }
  }
}

// Convenience wrappers so services don't have to pass method every time
export const httpClient = {
  get: <T>(baseUrl: string, path: string, options?: Omit<HttpClientOptions, 'method' | 'body'>) =>
    callService<T>(baseUrl, path, { ...options, method: 'GET' }),

  post: <T>(baseUrl: string, path: string, body: unknown, options?: Omit<HttpClientOptions, 'method' | 'body'>) =>
    callService<T>(baseUrl, path, { ...options, method: 'POST', body }),

  put: <T>(baseUrl: string, path: string, body: unknown, options?: Omit<HttpClientOptions, 'method' | 'body'>) =>
    callService<T>(baseUrl, path, { ...options, method: 'PUT', body }),

  delete: <T>(baseUrl: string, path: string, options?: Omit<HttpClientOptions, 'method' | 'body'>) =>
    callService<T>(baseUrl, path, { ...options, method: 'DELETE' })
}