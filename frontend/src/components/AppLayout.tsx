import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export default function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b bg-white px-4 py-3 flex items-center justify-between">
        <nav className="flex items-center gap-4">
          <Link to="/dashboard" className="text-lg font-bold text-[#1A1A2E]">
            Finance Manager
          </Link>
          <Link to="/dashboard" className="text-sm text-[#6B7280] hover:text-[#0F3460]">
            Dashboard
          </Link>
          <Link to="/transactions" className="text-sm text-[#6B7280] hover:text-[#0F3460]">
            Transações
          </Link>
          <Link to="/categories" className="text-sm text-[#6B7280] hover:text-[#0F3460]">
            Categorias
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#6B7280]">{user?.name ?? user?.email}</span>
          <Button variant="outline" size="sm" onClick={() => logout()}>
            Sair
          </Button>
        </div>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  )
}
