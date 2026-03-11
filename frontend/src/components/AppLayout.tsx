import { Outlet } from 'react-router-dom'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ThemeToggle'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transações' },
  { to: '/categories', label: 'Categorias' },
]

export default function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar fixa à esquerda */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-sidebar-border bg-[var(--sidebar)] text-[var(--sidebar-foreground)]">
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/dashboard" className="text-lg font-semibold tracking-tight text-[var(--sidebar-foreground)]">
            Finance Manager
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]'
                    : 'text-[var(--sidebar-foreground)]/80 hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <p className="truncate px-3 py-1 text-sm text-[var(--sidebar-foreground)]/80" title={user?.email}>
            {user?.name ?? user?.email}
          </p>
        </div>
      </aside>

      {/* Área principal: header + conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 flex items-center justify-between gap-4 px-4 border-b border-border bg-card">
          <div className="min-w-0" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground hidden sm:inline truncate max-w-[180px]">
              {user?.name ?? user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Sair
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
