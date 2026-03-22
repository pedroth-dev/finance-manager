export interface User {
  id: number
  name: string
  email: string
  created_at: string
}

export interface Token {
  access_token: string
  token_type: string
}

export interface Category {
  id: number
  user_id: number
  name: string
  color: string
  icon: string
}

export interface Transaction {
  id: number
  user_id: number
  icon?: string
  description: string
  amount: string
  type: 'receita' | 'despesa'
  date: string
  category_id: number | null
  is_paid: boolean
  is_recurring: boolean
  recurrence_frequency?: string | null
  recurrence_end_date?: string | null
  created_at?: string
}

export interface TransactionListResponse {
  items: Transaction[]
  total: number
  page: number
  per_page: number
}

export type TransactionSort =
  | 'date_desc'
  | 'date_asc'
  | 'amount_desc'
  | 'amount_asc'
  | 'category_asc'
  | 'category_desc'

export interface Budget {
  id: number
  user_id: number
  category_id: number
  month: number
  year: number
  amount_limit: string
}

export interface BudgetWithSpending extends Budget {
  spent: string
  category_name: string
  category_color: string
  alert: 'ok' | 'warning' | 'over'
}

export interface ReportMonthly {
  month: number
  year: number
  receitas: number
  despesas: number
  saldo: number
  por_categoria: { name: string; color: string; total: number }[]
}

export interface ReportComparative {
  months: { month: number; year: number; receitas: number; despesas: number; saldo: number }[]
}

export interface DashboardSummary {
  receitas_mes: number
  despesas_mes: number
  saldo_mes: number
  por_categoria: { name: string; color: string; total: number }[]
  evolucao_mensal: { month: number; year: number; receitas: number; despesas: number; saldo: number }[]
  ultimas_transacoes: { id: number; description: string; amount: number; type: string; date: string }[]
  month: number
  year: number
}
