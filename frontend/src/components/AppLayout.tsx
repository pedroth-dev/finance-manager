import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import ThemeToggle from '@/components/ThemeToggle'

const mainNav = [
  { to: '/dashboard', label: 'Dashboard', icon: '◈' },
  { to: '/transactions', label: 'Transações', icon: '↕' },
  { to: '/categories', label: 'Categorias', icon: '⊞' },
]

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transações',
  '/categories': 'Categorias',
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const pageTitle = pageTitles[location.pathname] ?? 'Finance Manager'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="h-screen flex bg-[var(--bg)] text-foreground overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-40 h-full w-[220px] shrink-0 flex flex-col
          border-r border-[var(--border)] bg-[var(--surface)]
          transition-transform duration-100 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-[var(--green)]/20 to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="px-6 pt-7 pb-5 border-b border-[var(--border)]">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 group"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--green)] flex items-center justify-center text-sm shrink-0">
              💰
            </div>
            <span className="text-sm font-semibold tracking-wide text-foreground">
              Finance<span className="text-[var(--green)]">Manager</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <div className="px-4 pt-5 pb-2">
          <p className="px-2 mb-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--text3)]">
            Principal
          </p>
          {mainNav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] mb-0.5 transition-colors duration-75 ${
                  isActive
                    ? 'bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] font-medium'
                    : 'text-[var(--text2)] hover:bg-[var(--surface2)] hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-[var(--green)] rounded-sm" />
                  )}
                  <span className="w-[18px] text-center text-[15px]">{icon}</span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* User chip */}
        <div className="mt-auto p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-[var(--surface2)] hover:bg-[var(--surface3)] transition-colors cursor-pointer">
            <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[var(--green)] to-[var(--blue)] flex items-center justify-center text-xs font-semibold text-black shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-foreground truncate">
                {user?.name ?? 'Usuário'}
              </p>
              <p className="text-[11px] text-[var(--text3)] truncate">
                Conta pessoal
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-9 py-4 lg:py-5 border-b border-[var(--border)] bg-[var(--bg)] sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text2)] hover:text-foreground transition-colors"
              aria-label="Abrir menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold tracking-tight">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <button
              onClick={() => logout()}
              className="text-[13px] px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text2)] hover:border-[var(--border2)] hover:text-foreground transition-colors duration-75"
            >
              Sair
            </button>
          </div>
        </header>

        {/* Content — fills all available width */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-4 sm:px-6 lg:px-9 py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
