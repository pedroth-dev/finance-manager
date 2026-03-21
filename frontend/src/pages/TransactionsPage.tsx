import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
} from '@/services/api'
import type { Transaction, Category, TransactionSort } from '@/types'
import EmojiPicker from '@/components/EmojiPicker'
import CustomSelect from '@/components/CustomSelect'
import DatePicker from '@/components/DatePicker'
import ConfirmDialog from '@/components/ConfirmDialog'

const today = new Date().toISOString().slice(0, 10)
const PER_PAGE = 20

type FilterType = 'all' | 'receita' | 'despesa'
type PeriodPreset = 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'this_year'
type StatusFilter = 'all' | 'paid' | 'unpaid'

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function getPeriodDates(preset: PeriodPreset): { date_from?: string; date_to?: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  if (preset === 'all') return {}
  if (preset === 'this_month') {
    const first = new Date(y, m, 1)
    return { date_from: first.toISOString().slice(0, 10), date_to: today }
  }
  if (preset === 'last_month') {
    const first = new Date(y, m - 1, 1)
    const last = new Date(y, m, 0)
    return { date_from: first.toISOString().slice(0, 10), date_to: last.toISOString().slice(0, 10) }
  }
  if (preset === 'last_3_months') {
    const from = new Date(y, m - 2, 1)
    return { date_from: from.toISOString().slice(0, 10), date_to: today }
  }
  if (preset === 'this_year') {
    return { date_from: `${y}-01-01`, date_to: today }
  }
  return {}
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [catFilter, setCatFilter] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [searchApi, setSearchApi] = useState('')
  const [period, setPeriod] = useState<PeriodPreset>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<TransactionSort>('date_desc')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    type: 'despesa' as 'receita' | 'despesa',
    date: today,
    category_id: null as number | null,
    is_paid: true,
    icon: '🛒',
    is_recurring: false,
    recurrence_frequency: '' as '' | 'weekly' | 'monthly' | 'yearly',
    recurrence_end_date: '' as string,
  })

  const load = useCallback((pageNum: number, append: boolean) => {
    if (pageNum === 1) setLoading(true)
    else setLoadingMore(true)
    const periodDates = getPeriodDates(period)
    const params = {
      type: filter === 'all' ? undefined : filter,
      category_id: catFilter ?? undefined,
      date_from: periodDates.date_from,
      date_to: periodDates.date_to,
      is_paid: statusFilter === 'all' ? undefined : statusFilter === 'paid',
      search: searchApi || undefined,
      sort,
      page: pageNum,
      per_page: PER_PAGE,
    }
    getTransactions(params).then((res) => {
      if (append) {
        setTransactions((prev) => [...prev, ...res.items])
      } else {
        setTransactions(res.items)
      }
      setTotal(res.total)
      setPage(res.page)
    }).finally(() => {
      setLoading(false)
      setLoadingMore(false)
    })
  }, [filter, catFilter, period, statusFilter, searchApi, sort])

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setSearchApi(search)
      searchDebounceRef.current = null
    }, 400)
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [search])

  useEffect(() => {
    setPage(1)
    load(1, false)
  }, [load])

  function resetForm() {
    setEditing(null)
    setForm({
      description: '', amount: '', type: 'despesa', date: today, category_id: null, is_paid: true, icon: '🛒',
      is_recurring: false, recurrence_frequency: '', recurrence_end_date: '',
    })
  }

  function openCreate() {
    resetForm()
    setModalOpen(true)
  }

  function openEdit(t: Transaction) {
    const cat = t.category_id ? catMap.get(t.category_id) : null
    setEditing(t)
    setForm({
      description: t.description,
      amount: String(t.amount),
      type: t.type,
      date: t.date.slice(0, 10),
      category_id: t.category_id,
      is_paid: t.is_paid,
      icon: cat?.icon || (t.type === 'receita' ? '💵' : '🛒'),
      is_recurring: t.is_recurring ?? false,
      recurrence_frequency: (t.recurrence_frequency as '' | 'weekly' | 'monthly' | 'yearly') || '',
      recurrence_end_date: t.recurrence_end_date?.slice(0, 10) ?? '',
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    resetForm()
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
      is_recurring: form.is_recurring,
      recurrence_frequency: form.is_recurring && form.recurrence_frequency ? form.recurrence_frequency : null,
      recurrence_end_date: form.is_recurring && form.recurrence_end_date ? form.recurrence_end_date : null,
    }
    const promise = editing
      ? updateTransaction(editing.id, payload)
      : createTransaction(payload)

    promise.then(() => { closeModal(); load(1, false) })
  }

  function openDeleteConfirm(t: Transaction) {
    setTransactionToDelete(t)
  }

  function closeDeleteConfirm() {
    if (!deleteLoading) setTransactionToDelete(null)
  }

  function confirmDelete() {
    if (!transactionToDelete) return
    setDeleteLoading(true)
    deleteTransaction(transactionToDelete.id)
      .then(() => {
        setTransactionToDelete(null)
        load(1, false)
      })
      .catch((err) => {
        window.alert(err instanceof Error ? err.message : 'Erro ao excluir.')
      })
      .finally(() => setDeleteLoading(false))
  }

  function loadMore() {
    load(page + 1, true)
  }

  const catMap = new Map(categories.map((c) => [c.id, c]))

  const totalReceitas = transactions.filter((t) => t.type === 'receita').reduce((s, t) => s + Number(t.amount), 0)
  const totalDespesas = transactions.filter((t) => t.type === 'despesa').reduce((s, t) => s + Number(t.amount), 0)
  const saldo = totalReceitas - totalDespesas

  const typeFilters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'receita', label: 'Receitas' },
    { key: 'despesa', label: 'Despesas' },
  ]

  const periodOptions: { key: PeriodPreset; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'this_month', label: 'Este mês' },
    { key: 'last_month', label: 'Mês passado' },
    { key: 'last_3_months', label: 'Últimos 3 meses' },
    { key: 'this_year', label: 'Este ano' },
  ]

  const statusOptions: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'paid', label: 'Pagos' },
    { key: 'unpaid', label: 'Pendentes' },
  ]

  const sortOptions: { value: TransactionSort; label: string }[] = [
    { value: 'date_desc', label: 'Data (mais recente)' },
    { value: 'date_asc', label: 'Data (mais antiga)' },
    { value: 'amount_desc', label: 'Valor (maior)' },
    { value: 'amount_asc', label: 'Valor (menor)' },
    { value: 'category_asc', label: 'Categoria (A–Z)' },
    { value: 'category_desc', label: 'Categoria (Z–A)' },
  ]

  const hasMore = transactions.length < total

  return (
    <>
      <div className="space-y-6">
        {/* Summary bar — totais do resultado filtrado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-4 sm:p-[18px]">
            <p className="text-[11px] text-[var(--text3)] uppercase tracking-[0.06em] mb-1.5">Receitas</p>
            <p className="font-mono text-lg font-medium text-[var(--green)]">{formatMoney(totalReceitas)}</p>
          </div>
          <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-4 sm:p-[18px]">
            <p className="text-[11px] text-[var(--text3)] uppercase tracking-[0.06em] mb-1.5">Despesas</p>
            <p className="font-mono text-lg font-medium text-[var(--red)]">{formatMoney(totalDespesas)}</p>
          </div>
          <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-4 sm:p-[18px]">
            <p className="text-[11px] text-[var(--text3)] uppercase tracking-[0.06em] mb-1.5">Saldo líquido</p>
            <p className="font-mono text-lg font-medium text-[var(--blue)]">{formatMoney(saldo)}</p>
          </div>
        </div>

        {/* Table card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Transações</h2>
              <p className="text-xs text-[var(--text3)] mt-0.5">{total} transação(ões) encontrada(s)</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="flex items-center gap-2 bg-[var(--surface2)] border border-[var(--border)] rounded-lg px-3 py-2 flex-1 sm:max-w-[260px] focus-within:border-[var(--border2)] transition-colors">
                <span className="text-[var(--text3)] text-sm">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar por descrição..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-[13px] text-foreground placeholder:text-[var(--text3)] w-full font-sans"
                />
              </div>
              <button
                onClick={openCreate}
                className="shrink-0 flex items-center gap-1.5 bg-[var(--green)] text-black border-none rounded-lg px-4 py-2 text-[13px] font-semibold cursor-pointer transition-[opacity,transform] duration-75 hover:opacity-90 hover:-translate-y-px active:translate-y-0"
              >
                + Nova
              </button>
            </div>
          </div>

          {/* Filtros: tipo, período, status */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {typeFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors duration-75 font-sans ${
                  filter === f.key
                    ? 'bg-[var(--green)]/10 border-[var(--green)]/30 text-[var(--green)]'
                    : 'border-[var(--border)] bg-transparent text-[var(--text3)] hover:border-[var(--border2)] hover:text-[var(--text2)]'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="w-px h-4 bg-[var(--border)] mx-1 hidden sm:block" />
            {periodOptions.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors duration-75 font-sans ${
                  period === p.key
                    ? 'bg-[var(--green)]/10 border-[var(--green)]/30 text-[var(--green)]'
                    : 'border-[var(--border)] bg-transparent text-[var(--text3)] hover:border-[var(--border2)] hover:text-[var(--text2)]'
                }`}
              >
                {p.label}
              </button>
            ))}
            <span className="w-px h-4 bg-[var(--border)] mx-1 hidden sm:block" />
            {statusOptions.map((s) => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors duration-75 font-sans ${
                  statusFilter === s.key
                    ? 'bg-[var(--green)]/10 border-[var(--green)]/30 text-[var(--green)]'
                    : 'border-[var(--border)] bg-transparent text-[var(--text3)] hover:border-[var(--border2)] hover:text-[var(--text2)]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Categorias + Ordenação */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCatFilter(catFilter === c.id ? null : c.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors duration-75 font-sans ${
                    catFilter === c.id
                      ? 'bg-[var(--green)]/10 border-[var(--green)]/30 text-[var(--green)]'
                      : 'border-[var(--border)] bg-transparent text-[var(--text3)] hover:border-[var(--border2)] hover:text-[var(--text2)]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[11px] text-[var(--text3)] uppercase tracking-[0.06em]">Ordenar</span>
              <CustomSelect
                value={sort}
                onChange={(v) => setSort(v as TransactionSort)}
                options={sortOptions}
                className="w-[180px]"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[var(--green)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-[var(--text3)] py-12 text-center">Nenhuma transação encontrada.</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)]">Descrição</th>
                    <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)]">Data</th>
                    <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)]">Categoria</th>
                    <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)]">Tipo</th>
                    <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)]">Valor</th>
                    <th className="pb-3 w-[100px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => {
                    const cat = t.category_id ? catMap.get(t.category_id) : null
                    const icon = cat?.icon || (t.type === 'receita' ? '💵' : '🛒')
                    const iconBg = t.type === 'receita' ? 'bg-[var(--green)]/10' : 'bg-[var(--blue)]/10'
                    return (
                      <tr
                        key={t.id}
                        className="group border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface2)] transition-colors"
                      >
                        <td className="py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-base shrink-0 ${iconBg}`}>
                              {icon}
                            </div>
                            <div>
                              <p className="text-[13.5px] font-medium text-foreground">{t.description}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {cat && <span className="text-[11.5px] text-[var(--text3)]">{cat.name}</span>}
                                {t.is_recurring && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--purple)]/15 text-[var(--purple)]">
                                    Recorrente
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-[13px] text-[var(--text3)]">
                          {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3.5">
                          {cat ? (
                            <span
                              className="inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: `${cat.color}1a`, color: cat.color }}
                            >
                              {cat.name}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[var(--text3)]">—</span>
                          )}
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            t.type === 'receita' ? 'bg-[var(--green)]/10 text-[var(--green)]' : 'bg-[var(--red)]/10 text-[var(--red)]'
                          }`}>
                            {t.type === 'receita' ? 'Receita' : 'Despesa'}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <span className={`font-mono text-sm font-medium ${t.type === 'receita' ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                            {t.type === 'receita' ? '+' : '−'} {formatMoney(Number(t.amount))}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-75">
                            <button
                              onClick={() => openEdit(t)}
                              className="text-[11px] px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface3)] text-[var(--text2)] hover:text-foreground hover:border-[var(--border2)] transition-colors duration-75"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(t)}
                              className="text-[11px] px-2.5 py-1 rounded-md border border-[var(--red)]/20 text-[var(--red)] hover:bg-[var(--red)]/10 transition-colors duration-75"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && transactions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-[var(--text3)]">
                Mostrando {transactions.length} de {total} transação(ões)
              </p>
              {hasMore && (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="text-[13px] font-medium text-[var(--green)] hover:underline disabled:opacity-50 cursor-pointer"
                >
                  {loadingMore ? 'Carregando…' : 'Carregar mais'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="bg-[var(--surface)] border border-[var(--border2)] rounded-[var(--radius)] p-7 w-[480px] max-w-full animate-fade-up">
            <h2 className="text-base font-semibold text-foreground mb-1.5">
              {editing ? 'Editar transação' : 'Nova transação'}
            </h2>
            <p className="text-[13px] text-[var(--text3)] mb-6">
              {editing ? 'Altere os dados da transação' : 'Adicione uma receita ou despesa'}
            </p>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-3.5 mb-5">
                {/* Description + Emoji */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)] mb-1.5">Descrição</label>
                  <div className="flex gap-2">
                    <EmojiPicker value={form.icon} onChange={(emoji) => setForm((f) => ({ ...f, icon: emoji }))} />
                    <input
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface3)] px-3 py-2.5 text-[13px] text-foreground placeholder:text-[var(--text3)] focus:border-[var(--green)] focus:outline-none transition-colors"
                      placeholder="Ex: Supermercado"
                      required
                    />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)] mb-1.5">Valor (R$)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface3)] px-3 py-2.5 text-[13px] text-foreground font-mono placeholder:text-[var(--text3)] focus:border-[var(--green)] focus:outline-none transition-colors"
                    placeholder="0,00"
                    required
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)] mb-1.5">Tipo</label>
                  <CustomSelect
                    value={form.type}
                    onChange={(v) => setForm((f) => ({ ...f, type: v as 'receita' | 'despesa' }))}
                    options={[
                      { value: 'despesa', label: 'Despesa' },
                      { value: 'receita', label: 'Receita' },
                    ]}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)] mb-1.5">Categoria</label>
                  <CustomSelect
                    value={String(form.category_id ?? '')}
                    onChange={(v) => setForm((f) => ({ ...f, category_id: v ? Number(v) : null }))}
                    options={[
                      { value: '', label: 'Nenhuma' },
                      ...categories.map((c) => ({ value: String(c.id), label: `${c.icon || ''} ${c.name}`.trim() })),
                    ]}
                    placeholder="Selecionar categoria"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)] mb-1.5">Data</label>
                  <DatePicker
                    value={form.date}
                    onChange={(v) => setForm((f) => ({ ...f, date: v }))}
                  />
                </div>

                {/* Recorrência */}
                <div className="col-span-2 flex flex-col gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_recurring}
                      onChange={(e) => setForm((f) => ({ ...f, is_recurring: e.target.checked }))}
                      className="rounded border-[var(--border)]"
                    />
                    <span className="text-[13px] text-foreground">Lançamento recorrente</span>
                  </label>
                  {form.is_recurring && (
                    <div className="flex flex-wrap items-center gap-3 pl-6">
                      <div>
                        <span className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)] mb-1">Frequência</span>
                        <CustomSelect
                          value={form.recurrence_frequency || 'monthly'}
                          onChange={(v) => setForm((f) => ({ ...f, recurrence_frequency: (v || 'monthly') as 'weekly' | 'monthly' | 'yearly' }))}
                          options={[
                            { value: 'weekly', label: 'Semanal' },
                            { value: 'monthly', label: 'Mensal' },
                            { value: 'yearly', label: 'Anual' },
                          ]}
                          className="w-[130px]"
                        />
                      </div>
                      <div>
                        <span className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)] mb-1">Até (opcional)</span>
                        <DatePicker
                          value={form.recurrence_end_date}
                          onChange={(v) => setForm((f) => ({ ...f, recurrence_end_date: v }))}
                          className="w-[140px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex items-center gap-1.5 bg-[var(--surface2)] text-[var(--text2)] border border-[var(--border)] rounded-lg px-4 py-2 text-[13px] font-medium hover:border-[var(--border2)] hover:text-foreground transition-colors duration-75 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-[var(--green)] text-black border-none rounded-lg px-4 py-2 text-[13px] font-semibold cursor-pointer transition-[opacity,transform] duration-75 hover:opacity-90"
                >
                  {editing ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={transactionToDelete !== null}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDelete}
        title="Excluir transação"
        message={transactionToDelete ? `Tem certeza que deseja excluir "${transactionToDelete.description}"? Esta ação não pode ser desfeita.` : ''}
        confirmLabel="Excluir"
        isLoading={deleteLoading}
      />
    </>
  )
}
