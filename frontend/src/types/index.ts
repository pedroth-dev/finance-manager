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
  description: string
  amount: string
  type: 'receita' | 'despesa'
  date: string
  category_id: number | null
  is_paid: boolean
  is_recurring: boolean
  created_at?: string
}
