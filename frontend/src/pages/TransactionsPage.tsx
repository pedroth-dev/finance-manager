import { useEffect, useState } from 'react'
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
} from '@/services/api'
import type { Transaction, Category } from '@/types'
import { Button } from '@/components/ui/button'

const today = new Date().toISOString().slice(0, 10)

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    type: 'despesa' as 'receita' | 'despesa',
    date: today,
    category_id: null as number | null,
    is_paid: true,
  })

  function load() {
    setLoading(true)
    Promise.all([getTransactions(), getCategories()])
      .then(([txs, cats]) => {
        setTransactions(txs)
        setCategories(cats)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm({
      description: '',
      amount: '',
      type: 'despesa',
      date: today,
      category_id: null,
      is_paid: true,
    })
  }

  function openEdit(t: Transaction) {
    setEditing(t)
    setForm({
      description: t.description,
      amount: String(t.amount),
      type: t.type,
      date: t.date.slice(0, 10),
      category_id: t.category_id,
      is_paid: t.is_paid,
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(form.amount.replace(',', '.'))
    if (!form.description.trim() || isNaN(amount) || amount < 0) return
    const payload = {
      description: form.description.trim(),
      amount,
      type: form.type,
      date: form.date,
      category_id: form.category_id || null,
      is_paid: form.is_paid,
    }
    if (editing) {
      updateTransaction(editing.id, payload).then(() => {
        setEditing(null)
        openCreate()
        load()
      })
    } else {
      createTransaction(payload).then(() => {
        openCreate()
        load()
      })
    }
  }

  function handleDelete(t: Transaction) {
    if (!window.confirm(`Excluir "${t.description}"?`)) return
    deleteTransaction(t.id).then(load)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Transações</h1>
      <p className="mt-1 text-muted-foreground">Receitas e despesas.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 p-4 bg-card rounded-lg border border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div>
          <label className="block text-sm font-medium text-foreground">Descrição</label>
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Ex: Supermercado"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Valor</label>
          <input
            type="text"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="0,00"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Tipo</label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'receita' | 'despesa' }))}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Data</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Categoria</label>
          <select
            value={form.category_id ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                category_id: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Nenhuma</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit">{editing ? 'Salvar' : 'Adicionar'}</Button>
          {editing && (
            <Button type="button" variant="outline" onClick={openCreate}>
              Cancelar
            </Button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="mt-4 text-muted-foreground">Carregando...</p>
      ) : transactions.length === 0 ? (
        <p className="mt-4 text-muted-foreground">Nenhuma transação. Adicione uma acima.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse bg-card rounded-lg border border-border">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="p-3 font-medium">Data</th>
                <th className="p-3 font-medium">Descrição</th>
                <th className="p-3 font-medium">Tipo</th>
                <th className="p-3 font-medium text-right">Valor</th>
                <th className="p-3 font-medium w-28">Ações</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-b-0">
                  <td className="p-3 text-foreground">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                  <td className="p-3 text-foreground">{t.description}</td>
                  <td className="p-3">
                    <span
                      className={
                        t.type === 'receita'
                          ? 'text-[var(--success)] font-medium'
                          : 'text-destructive font-medium'
                      }
                    >
                      {t.type === 'receita' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className="p-3 text-right font-medium">
                    <span className={t.type === 'receita' ? 'text-[var(--success)]' : 'text-destructive'}>
                      {t.type === 'receita' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(t)}>
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
