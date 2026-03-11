import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

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
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-lg bg-[var(--green)] flex items-center justify-center text-base">
            💰
          </div>
          <span className="text-base font-semibold tracking-wide text-foreground">
            Finance<span className="text-[var(--green)]">Manager</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-8">
          <h1 className="text-lg font-semibold text-foreground text-center">
            Crie sua conta
          </h1>
          <p className="mt-1 text-center text-[13px] text-[var(--text3)]">Comece a organizar suas finanças</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="text-[13px] text-[var(--red)] bg-[var(--red)]/8 border border-[var(--red)]/20 rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="name" className="block text-[11.5px] font-medium uppercase tracking-[0.06em] text-[var(--text3)] mb-1.5">
                Nome
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-[13px] text-foreground placeholder:text-[var(--text3)] focus:border-[var(--green)] focus:outline-none transition-colors"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-[11.5px] font-medium uppercase tracking-[0.06em] text-[var(--text3)] mb-1.5">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-[13px] text-foreground placeholder:text-[var(--text3)] focus:border-[var(--green)] focus:outline-none transition-colors"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[11.5px] font-medium uppercase tracking-[0.06em] text-[var(--text3)] mb-1.5">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-[13px] text-foreground placeholder:text-[var(--text3)] focus:border-[var(--green)] focus:outline-none transition-colors"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-[var(--green)] text-black border-none rounded-lg px-4 py-2.5 text-[13px] font-semibold cursor-pointer transition-[opacity,transform] duration-75 hover:opacity-90 hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                'Cadastrar'
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-[13px] text-[var(--text3)]">
            Já tem conta?{' '}
            <Link to="/login" className="font-medium text-[var(--green)] hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
