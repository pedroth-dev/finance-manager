import { useCallback, useEffect, useState } from 'react'
import { getBudgets, getCategories, createBudget, updateBudget, deleteBudget } from '@/services/api'
import type { BudgetWithSpending, Category } from '@/types'
import CustomSelect from '@/components/CustomSelect'
import ConfirmDialog from '@/components/ConfirmDialog'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function BudgetsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BudgetWithSpending | null>(null)
  const [budgetToDelete, setBudgetToDelete] = useState<BudgetWithSpending | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('')
  const [formLimit, setFormLimit] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([getBudgets(month, year), getCategories()])
      .then(([b, c]) => {
        setBudgets(b)
        setCategories(c)
      })
      .finally(() => setLoading(false))
  }, [month, year])

  useEffect(() => { load() }, [load])

  const categoriesWithoutBudget = categories.filter(
    (c) => !budgets.some((b) => b.category_id === c.id)
  )

  function openCreate() {
    setEditing(null)
    setFormCategoryId(categoriesWithoutBudget[0]?.id ?? '')
    setFormLimit('')
    setModalOpen(true)
  }

  function openEdit(b: BudgetWithSpending) {
    setEditing(b)
    setFormCategoryId(b.category_id)
    setFormLimit(String(b.amount_limit))
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const limit = parseFloat(formLimit.replace(',', '.'))
    if (isNaN(limit) || limit < 0) return
    if (editing) {
      updateBudget(editing.id, { amount_limit: limit }).then(() => { closeModal(); load() })
    } else {
      if (formCategoryId === '') return
      createBudget({
        category_id: formCategoryId as number,
        month,
        year,
        amount_limit: limit,
      }).then(() => { closeModal(); load() })
    }
  }

  function openDeleteConfirm(b: BudgetWithSpending) {
    setBudgetToDelete(b)
  }

  function closeDeleteConfirm() {
    if (!deleteLoading) setBudgetToDelete(null)
  }

  function confirmDelete() {
    if (!budgetToDelete) return
    setDeleteLoading(true)
    deleteBudget(budgetToDelete.id)
      .then(() => {
        setBudgetToDelete(null)
        load()
      })
      .catch((err) => window.alert(err instanceof Error ? err.message : 'Erro ao excluir.'))
      .finally(() => setDeleteLoading(false))
  }

  const monthOptions = MESES.map((nome, i) => ({ value: String(i + 1), label: nome }))
  const years = Array.from({ length: 11 }, (_, i) => now.getFullYear() - 5 + i)
  const yearOptions = years.map((y) => ({ value: String(y), label: String(y) }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg font-semibold">Orçamentos</h1>
        <div className="flex flex-wrap items-center gap-3">
          <CustomSelect
            value={String(month)}
            onChange={(v) => setMonth(Number(v))}
            options={monthOptions}
            className="w-[100px]"
          />
          <CustomSelect
            value={String(year)}
            onChange={(v) => setYear(Number(v))}
            options={yearOptions}
            className="w-[90px]"
          />
          <button
            type="button"
            onClick={openCreate}
            disabled={categoriesWithoutBudget.length === 0}
            className="flex items-center gap-1.5 bg-[var(--green)] text-black border-none rounded-lg px-4 py-2 text-[13px] font-semibold cursor-pointer transition-[opacity,transform] duration-75 hover:opacity-90 disabled:opacity-50"
          >
            + Definir orçamento
          </button>
        </div>
      </div>

      <p className="text-[13px] text-[var(--text3)]">
        Defina um limite por categoria para o mês. Você será alertado ao se aproximar ou ultrapassar o valor.
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[var(--green)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-8 text-center">
          <p className="text-[var(--text3)] mb-2">Nenhum orçamento definido para {MESES[month - 1]}/{year}.</p>
          <p className="text-sm text-[var(--text3)]">Adicione um orçamento por categoria acima.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const spent = parseFloat(String(b.spent))
            const limit = parseFloat(String(b.amount_limit))
            const pct = limit > 0 ? (spent / limit) * 100 : 0
            const alertClass =
              b.alert === 'over'
                ? 'border-[var(--red)]/50 bg-[var(--red)]/5'
                : b.alert === 'warning'
                  ? 'border-[var(--gold)]/50 bg-[var(--gold)]/5'
                  : 'border-[var(--border)]'
            return (
              <div
                key={b.id}
                className={`rounded-[var(--radius)] border p-5 ${alertClass} transition-colors duration-75`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${b.category_color}20`, color: b.category_color }}
                  >
                    {b.category_name}
                  </span>
                  <div className="flex gap-1 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => openEdit(b)}
                      className="text-[11px] px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface3)] text-[var(--text2)] hover:text-foreground"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteConfirm(b)}
                      className="text-[11px] px-2 py-1 rounded border border-[var(--red)]/20 text-[var(--red)] hover:bg-[var(--red)]/10"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text3)]">Gasto</span>
                  <span className="font-mono font-medium">{formatMoney(spent)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[var(--text3)]">Limite</span>
                  <span className="font-mono">{formatMoney(limit)}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface3)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor:
                        b.alert === 'over' ? 'var(--red)' : b.alert === 'warning' ? 'var(--gold)' : 'var(--green)',
                    }}
                  />
                </div>
                {b.alert === 'over' && (
                  <p className="text-xs text-[var(--red)] mt-2">Limite ultrapassado</p>
                )}
                {b.alert === 'warning' && (
                  <p className="text-xs text-[var(--gold)] mt-2">Próximo do limite</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="bg-[var(--surface)] border border-[var(--border2)] rounded-[var(--radius)] p-6 w-[360px] max-w-full">
            <h2 className="text-base font-semibold mb-4">
              {editing ? 'Editar orçamento' : 'Definir orçamento'}
            </h2>
            <form onSubmit={handleSubmit}>
              {!editing && (
                <div className="mb-4">
                  <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)] mb-1.5">
                    Categoria
                  </label>
                  <CustomSelect
                    value={String(formCategoryId)}
                    onChange={(v) => setFormCategoryId(v ? Number(v) : '')}
                    options={categoriesWithoutBudget.map((c) => ({
                      value: String(c.id),
                      label: `${c.icon || ''} ${c.name}`.trim(),
                    }))}
                    placeholder="Selecione"
                  />
                </div>
              )}
              <div className="mb-5">
                <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)] mb-1.5">
                  Limite (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formLimit}
                  onChange={(e) => setFormLimit(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface3)] px-3 py-2.5 text-[13px] font-mono"
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface2)] text-[var(--text2)] text-[13px] font-medium hover:border-[var(--border2)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[var(--green)] text-black text-[13px] font-semibold"
                >
                  {editing ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={budgetToDelete !== null}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDelete}
        title="Remover orçamento"
        message={budgetToDelete ? `Tem certeza que deseja remover o orçamento de "${budgetToDelete.category_name}" para este mês?` : ''}
        confirmLabel="Remover"
        isLoading={deleteLoading}
      />
    </div>
  )
}
