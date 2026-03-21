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
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T
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
export interface GetTransactionsParams {
  type?: 'receita' | 'despesa'
  category_id?: number | null
  date_from?: string
  date_to?: string
  is_paid?: boolean
  search?: string
  sort?: import('@/types').TransactionSort
  page?: number
  per_page?: number
}

export async function getTransactions(params?: GetTransactionsParams) {
  const sp = new URLSearchParams()
  if (params?.type) sp.set('type', params.type)
  if (params?.category_id != null) sp.set('category_id', String(params.category_id))
  if (params?.date_from) sp.set('date_from', params.date_from)
  if (params?.date_to) sp.set('date_to', params.date_to)
  if (params?.is_paid !== undefined) sp.set('is_paid', String(params.is_paid))
  if (params?.search?.trim()) sp.set('search', params.search.trim())
  if (params?.sort) sp.set('sort', params.sort)
  if (params?.page != null) sp.set('page', String(params.page))
  if (params?.per_page != null) sp.set('per_page', String(params.per_page))
  const q = sp.toString()
  return apiRequest<import('@/types').TransactionListResponse>(`/transactions${q ? `?${q}` : ''}`)
}
export async function createTransaction(data: {
  description: string
  amount: number
  type: 'receita' | 'despesa'
  date: string
  category_id?: number | null
  is_paid?: boolean
  is_recurring?: boolean
  recurrence_frequency?: string | null
  recurrence_end_date?: string | null
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
    recurrence_frequency: string | null
    recurrence_end_date: string | null
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

// Dashboard
export async function getDashboardSummary(month?: number, year?: number) {
  const params = new URLSearchParams()
  if (month != null) params.set('month', String(month))
  if (year != null) params.set('year', String(year))
  const q = params.toString()
  return apiRequest<import('@/types').DashboardSummary>(`/dashboard/summary${q ? `?${q}` : ''}`)
}

// Budgets
export async function getBudgets(month: number, year: number) {
  return apiRequest<import('@/types').BudgetWithSpending[]>(`/budgets?month=${month}&year=${year}`)
}
export async function createBudget(data: { category_id: number; month: number; year: number; amount_limit: number }) {
  return apiRequest<import('@/types').Budget>('/budgets', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
export async function updateBudget(id: number, data: { amount_limit?: number }) {
  return apiRequest<import('@/types').Budget>(`/budgets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
export async function deleteBudget(id: number) {
  return apiRequest<void>(`/budgets/${id}`, { method: 'DELETE' })
}

// Reports
export async function getReportMonthly(month: number, year: number) {
  return apiRequest<import('@/types').ReportMonthly>(`/reports/monthly?month=${month}&year=${year}`)
}
export async function getReportComparative(months?: number, year?: number) {
  const sp = new URLSearchParams()
  if (months != null) sp.set('months', String(months))
  if (year != null) sp.set('year', String(year))
  const q = sp.toString()
  return apiRequest<import('@/types').ReportComparative>(`/reports/comparative${q ? `?${q}` : ''}`)
}

export async function exportTransactionsCsv(params?: GetTransactionsParams): Promise<Blob> {
  const sp = new URLSearchParams()
  if (params?.type) sp.set('type', params.type)
  if (params?.category_id != null) sp.set('category_id', String(params.category_id))
  if (params?.date_from) sp.set('date_from', params.date_from)
  if (params?.date_to) sp.set('date_to', params.date_to)
  if (params?.is_paid !== undefined) sp.set('is_paid', String(params.is_paid))
  if (params?.search?.trim()) sp.set('search', params.search.trim())
  if (params?.sort) sp.set('sort', params.sort)
  const url = `${API_BASE}/transactions/export/csv${sp.toString() ? `?${sp}` : ''}`
  const res = await fetch(url, { headers: getAuthHeaders() as HeadersInit })
  if (!res.ok) throw new Error('Falha ao exportar')
  return res.blob()
}
