/**
 * API client - base URL and fetch wrapper.
 * Will be extended with auth header in Etapa 2.
 */
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export { API_BASE }
