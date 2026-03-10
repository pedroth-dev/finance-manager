import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(name, email, password)
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar. Tente outro e-mail.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-full max-w-sm rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[#1A1A2E] text-center">Finance Manager</h1>
        <p className="mt-1 text-center text-sm text-[#6B7280]">Crie sua conta</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#1A1A2E]">
              Nome
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#0F3460] focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#1A1A2E]">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#0F3460] focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#1A1A2E]">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#0F3460] focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-[#6B7280]">
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-[#0F3460] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
