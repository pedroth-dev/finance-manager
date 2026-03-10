const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const TOKEN_KEY = 'fm_token'

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers as Record<string, string>),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(Array.isArray(err.detail) ? err.detail[0] : err.detail ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export { API_BASE }

// Categories
export async function getCategories() {
  return apiRequest<import('@/types').Category[]>('/categories')
}
export async function createCategory(data: { name: string; color?: string; icon?: string }) {
  return apiRequest<import('@/types').Category>('/categories', {
    method: 'POST',
    body: JSON.stringify({ ...data, color: data.color ?? '#6B7280', icon: data.icon ?? '' }),
  })
}
export async function updateCategory(id: number, data: Partial<{ name: string; color: string; icon: string }>) {
  return apiRequest<import('@/types').Category>(`/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
export async function deleteCategory(id: number) {
  return apiRequest<void>(`/categories/${id}`, { method: 'DELETE' })
}

// Transactions
export async function getTransactions() {
  return apiRequest<import('@/types').Transaction[]>('/transactions')
}
export async function createTransaction(data: {
  description: string
  amount: number
  type: 'receita' | 'despesa'
  date: string
  category_id?: number | null
  is_paid?: boolean
  is_recurring?: boolean
}) {
  return apiRequest<import('@/types').Transaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
export async function updateTransaction(
  id: number,
  data: Partial<{
    description: string
    amount: number
    type: 'receita' | 'despesa'
    date: string
    category_id: number | null
    is_paid: boolean
    is_recurring: boolean
  }>
) {
  return apiRequest<import('@/types').Transaction>(`/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
export async function deleteTransaction(id: number) {
  return apiRequest<void>(`/transactions/${id}`, { method: 'DELETE' })
}
