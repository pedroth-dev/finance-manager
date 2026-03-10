import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b bg-white px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1A1A2E]">Finance Manager</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#6B7280]">{user?.name ?? user?.email}</span>
          <Button variant="outline" size="sm" onClick={() => logout()}>
            Sair
          </Button>
        </div>
      </header>
      <main className="p-4">
        <h2 className="text-2xl font-bold text-[#1A1A2E]">Dashboard</h2>
        <p className="mt-2 text-[#6B7280]">Resumo financeiro (em breve)</p>
      </main>
    </div>
  )
}
