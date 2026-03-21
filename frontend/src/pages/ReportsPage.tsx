import { useCallback, useEffect, useState } from 'react'
import { getReportMonthly, getReportComparative, exportTransactionsCsv } from '@/services/api'
import type { ReportMonthly, ReportComparative } from '@/types'
import CustomSelect from '@/components/CustomSelect'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function ReportsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [monthly, setMonthly] = useState<ReportMonthly | null>(null)
  const [comparative, setComparative] = useState<ReportComparative | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [tab, setTab] = useState<'monthly' | 'comparative'>('monthly')

  const loadMonthly = useCallback(() => {
    setLoading(true)
    getReportMonthly(month, year)
      .then(setMonthly)
      .finally(() => setLoading(false))
  }, [month, year])

  const loadComparative = useCallback(() => {
    setLoading(true)
    getReportComparative(6)
      .then(setComparative)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 'monthly') loadMonthly()
    else loadComparative()
  }, [tab, loadMonthly, loadComparative])

  function handleExportCsv() {
    setExporting(true)
    exportTransactionsCsv()
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'transacoes.csv'
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(() => {})
      .finally(() => setExporting(false))
  }

  const monthOptions = MESES.map((nome, i) => ({ value: String(i + 1), label: nome }))
  const years = Array.from({ length: 11 }, (_, i) => now.getFullYear() - 5 + i)
  const yearOptions = years.map((y) => ({ value: String(y), label: String(y) }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg font-semibold">Relatórios</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('monthly')}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
              tab === 'monthly'
                ? 'bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/30'
                : 'border border-[var(--border)] text-[var(--text3)] hover:text-foreground'
            }`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setTab('comparative')}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
              tab === 'comparative'
                ? 'bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/30'
                : 'border border-[var(--border)] text-[var(--text3)] hover:text-foreground'
            }`}
          >
            Comparativo
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            className="ml-2 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface2)] text-[13px] font-medium hover:border-[var(--border2)] disabled:opacity-50"
          >
            {exporting ? 'Exportando…' : 'Exportar CSV'}
          </button>
        </div>
      </div>

      {tab === 'monthly' && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] uppercase tracking-wider text-[var(--text3)]">Mês/Ano</span>
            <CustomSelect
              value={String(month)}
              onChange={(v) => setMonth(Number(v))}
              options={monthOptions}
              className="w-[120px]"
            />
            <CustomSelect
              value={String(year)}
              onChange={(v) => setYear(Number(v))}
              options={yearOptions}
              className="w-[90px]"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-[var(--green)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : monthly ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-4">
                  <p className="text-[11px] text-[var(--text3)] uppercase tracking-wider mb-1">Receitas</p>
                  <p className="font-mono text-lg font-medium text-[var(--green)]">{formatMoney(monthly.receitas)}</p>
                </div>
                <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-4">
                  <p className="text-[11px] text-[var(--text3)] uppercase tracking-wider mb-1">Despesas</p>
                  <p className="font-mono text-lg font-medium text-[var(--red)]">{formatMoney(monthly.despesas)}</p>
                </div>
                <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-4">
                  <p className="text-[11px] text-[var(--text3)] uppercase tracking-wider mb-1">Saldo</p>
                  <p className="font-mono text-lg font-medium text-[var(--blue)]">{formatMoney(monthly.saldo)}</p>
                </div>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
                <h2 className="text-sm font-semibold px-4 py-3 border-b border-[var(--border)]">
                  Despesas por categoria — {MESES[monthly.month - 1]} {monthly.year}
                </h2>
                {monthly.por_categoria.length === 0 ? (
                  <p className="text-sm text-[var(--text3)] p-4">Nenhuma despesa por categoria neste mês.</p>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left text-[11px] font-medium uppercase tracking-wider text-[var(--text3)] px-4 py-3">Categoria</th>
                        <th className="text-right text-[11px] font-medium uppercase tracking-wider text-[var(--text3)] px-4 py-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthly.por_categoria.map((c, i) => (
                        <tr key={i} className="border-b border-[var(--border)] last:border-b-0">
                          <td className="px-4 py-3">
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: `${c.color}20`, color: c.color }}
                            >
                              {c.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sm">{formatMoney(c.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}

      {tab === 'comparative' && (
        <>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-[var(--green)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comparative && comparative.months.length > 0 ? (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
              <h2 className="text-sm font-semibold px-4 py-3 border-b border-[var(--border)]">
                Últimos 6 meses — receitas, despesas e saldo
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[400px]">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left text-[11px] font-medium uppercase tracking-wider text-[var(--text3)] px-4 py-3">Mês/Ano</th>
                      <th className="text-right text-[11px] font-medium uppercase tracking-wider text-[var(--text3)] px-4 py-3">Receitas</th>
                      <th className="text-right text-[11px] font-medium uppercase tracking-wider text-[var(--text3)] px-4 py-3">Despesas</th>
                      <th className="text-right text-[11px] font-medium uppercase tracking-wider text-[var(--text3)] px-4 py-3">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparative.months.map((m, i) => (
                      <tr key={i} className="border-b border-[var(--border)] last:border-b-0">
                        <td className="px-4 py-3 text-sm">{MESES[m.month - 1]} {m.year}</td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-[var(--green)]">{formatMoney(m.receitas)}</td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-[var(--red)]">{formatMoney(m.despesas)}</td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-[var(--blue)]">{formatMoney(m.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--text3)]">Nenhum dado para exibir.</p>
          )}
        </>
      )}
    </div>
  )
}
