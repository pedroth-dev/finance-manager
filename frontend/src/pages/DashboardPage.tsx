import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import { getDashboardSummary } from '@/services/api'
import type { DashboardSummary } from '@/types'
import { formatDateOnlyPtBR } from '@/lib/dateLocal'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const DONUT_COLORS = ['#4d9fff', '#00e5a0', '#f5c842', '#ff5e6c', '#a78bfa', '#f97316']

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatMoneyShort(value: number) {
  if (Math.abs(value) >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`
  return `R$ ${value}`
}

function barTopLabelFormatter(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n <= 0) return ''
  return formatMoneyShort(n)
}

/** Mesmo critério do backend: tira meses sem receita nem despesa no começo da série. */
function trimLeadingMonthsWithoutMovement(
  rows: { month: number; year: number; receitas: number; despesas: number }[],
) {
  if (rows.length === 0) return []
  const firstWithData = rows.findIndex((r) => r.receitas > 0 || r.despesas > 0)
  if (firstWithData === -1) return [rows[rows.length - 1]]
  return rows.slice(firstWithData)
}

function evolucaoChartSubtitle(
  rows: { month: number; year: number }[],
  meses: string[],
): string {
  const n = rows.length
  if (n === 0) return ''
  if (n === 1) {
    const e = rows[0]
    return `${meses[e.month - 1]} ${e.year}`
  }
  if (n === 6) return 'Últimos 6 meses'
  const first = rows[0]
  const last = rows[n - 1]
  return `${meses[first.month - 1]} ${first.year} — ${meses[last.month - 1]} ${last.year}`
}

/* ── Donut Chart SVG ── */
function DonutChart({
  data,
  total,
}: {
  data: { name: string; color: string; total: number }[]
  total: number
}) {
  const r = 38
  const circ = 2 * Math.PI * r
  const dashes = data.map((item) => (total > 0 ? item.total / total : 0) * circ)
  const { offsets } = dashes.reduce<{ offsets: number[]; sum: number }>(
    (state, d) => ({
      offsets: [...state.offsets, state.sum],
      sum: state.sum + d,
    }),
    { offsets: [], sum: 0 }
  )

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[160px] h-[160px] mb-5">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface2)" strokeWidth="12" />
          {data.map((item, i) => {
            const dash = dashes[i]
            return (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={item.color || DONUT_COLORS[i % DONUT_COLORS.length]}
                strokeWidth="12"
                strokeDasharray={`${dash} ${circ}`}
                strokeDashoffset={-offsets[i]}
                strokeLinecap="round"
              />
            )
          })}
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="font-mono text-lg font-medium text-foreground leading-none">
            {formatMoney(total)}
          </p>
          <p className="text-[10px] text-[var(--text3)] mt-1">total</p>
        </div>
      </div>

      <div className="w-full flex flex-col gap-2">
        {data.map((item, i) => {
          const pct = total > 0 ? ((item.total / total) * 100).toFixed(0) : '0'
          return (
            <div key={i} className="flex items-center gap-2 text-[12.5px]">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color || DONUT_COLORS[i % DONUT_COLORS.length] }}
              />
              <span className="text-[var(--text2)] flex-1">{item.name}</span>
              <span className="font-mono text-xs text-[var(--text3)]">{pct}%</span>
              <span className="font-mono text-xs text-foreground text-right min-w-[70px]">
                {formatMoney(item.total)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── KPI Card ── */
function KpiCard({
  label,
  value,
  color,
  bgIcon,
  badge,
  delay = 0,
}: {
  label: string
  value: number
  color: 'green' | 'red' | 'blue'
  bgIcon: string
  badge?: string
  delay?: number
}) {
  const colorMap = {
    green: { text: 'text-[var(--green)]', border: 'from-transparent via-[var(--green)] to-transparent', badgeBg: 'bg-[var(--green)]/10', badgeText: 'text-[var(--green)]' },
    red: { text: 'text-[var(--red)]', border: 'from-transparent via-[var(--red)] to-transparent', badgeBg: 'bg-[var(--red)]/10', badgeText: 'text-[var(--red)]' },
    blue: { text: 'text-[var(--blue)]', border: 'from-transparent via-[var(--blue)] to-transparent', badgeBg: 'bg-[var(--blue)]/10', badgeText: 'text-[var(--blue)]' },
  }
  const c = colorMap[color]

  return (
    <div
      className="relative bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] px-4 sm:px-6 py-5 sm:py-[22px] overflow-hidden transition-[border-color,transform] duration-100 hover:border-[var(--border2)] hover:-translate-y-0.5 cursor-default animate-fade-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${c.border}`} />
      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[52px] opacity-[0.04] pointer-events-none">
        {bgIcon}
      </span>

      <p className="text-[11.5px] font-medium uppercase tracking-[0.06em] text-[var(--text3)] mb-2.5">
        {label}
      </p>
      <p className={`font-mono text-xl sm:text-[26px] font-medium tracking-tight leading-none mb-2.5 ${c.text}`}>
        {formatMoney(value)}
      </p>
      {badge && (
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${c.badgeBg} ${c.badgeText}`}>
          {badge}
        </span>
      )}
    </div>
  )
}

/* ── Custom Bar Chart Tooltip ── */
function BarTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--surface2)] border border-[var(--border2)] rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-[var(--text3)] mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono">
          {p.name}: {formatMoney(p.value)}
        </p>
      ))}
    </div>
  )
}

/* ── Main Page ── */
export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardSummary()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[var(--green)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--text3)]">Erro ao carregar resumo.</p>
      </div>
    )
  }

  const evolucaoMensal = trimLeadingMonthsWithoutMovement(data.evolucao_mensal)
  const evolucaoComLabel = evolucaoMensal.map((e) => ({
    ...e,
    mesAno: `${MESES[e.month - 1]}`,
  }))

  const totalDespesas = data.por_categoria.reduce((s, c) => s + c.total, 0)

  const categoriesWithColors = data.por_categoria.map((c, i) => ({
    ...c,
    color: c.color || DONUT_COLORS[i % DONUT_COLORS.length],
  }))

  const saldoPct = data.receitas_mes > 0
    ? Math.round((data.saldo_mes / data.receitas_mes) * 100)
    : 0
  const despesaPct = data.receitas_mes > 0
    ? Math.round((data.despesas_mes / data.receitas_mes) * 100)
    : 0

  return (
    <div className="space-y-7">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          label="Saldo do mês"
          value={data.saldo_mes}
          color="blue"
          bgIcon="◈"
          badge={data.receitas_mes > 0 ? `↑ ${saldoPct}% de aproveitamento` : undefined}
          delay={0.05}
        />
        <KpiCard
          label="Receitas"
          value={data.receitas_mes}
          color="green"
          bgIcon="↑"
          badge="↑ vs mês anterior"
          delay={0.1}
        />
        <KpiCard
          label="Despesas"
          value={data.despesas_mes}
          color="red"
          bgIcon="↓"
          badge={data.receitas_mes > 0 ? `${despesaPct}% da receita` : undefined}
          delay={0.15}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.6fr] gap-4 animate-fade-up">
        {/* Donut */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Despesas por categoria</h2>
              <p className="text-xs text-[var(--text3)] mt-0.5">
                {MESES[data.month - 1]} {data.year}
              </p>
            </div>
            <Link
              to="/categories"
              className="text-xs text-[var(--text3)] bg-[var(--surface2)] border border-[var(--border)] rounded-md px-2.5 py-1 hover:text-foreground transition-colors"
            >
              Ver tudo
            </Link>
          </div>
          {categoriesWithColors.length === 0 ? (
            <p className="text-sm text-[var(--text3)] py-12 text-center">
              Nenhuma despesa por categoria.
            </p>
          ) : (
            <DonutChart data={categoriesWithColors} total={totalDespesas} />
          )}
        </div>

        {/* Bar chart */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Evolução financeira</h2>
              <p className="text-xs text-[var(--text3)] mt-0.5">
                {evolucaoChartSubtitle(evolucaoMensal, MESES)}
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={evolucaoComLabel} margin={{ top: 26, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="mesAno"
                tick={{ fontSize: 11, fill: 'var(--text3)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text3)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatMoneyShort}
              />
              <Tooltip content={<BarTooltipContent />} cursor={{ fill: 'var(--surface2)' }} />
              <Bar dataKey="receitas" name="Receitas" fill="var(--green)" radius={[4, 4, 0, 0]}>
                <LabelList
                  dataKey="receitas"
                  position="top"
                  fill="var(--text2)"
                  fontSize={11}
                  formatter={barTopLabelFormatter}
                />
              </Bar>
              <Bar dataKey="despesas" name="Despesas" fill="var(--red)" opacity={0.7} radius={[4, 4, 0, 0]}>
                <LabelList
                  dataKey="despesas"
                  position="top"
                  fill="var(--text2)"
                  fontSize={11}
                  formatter={barTopLabelFormatter}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text2)]">
              <span className="w-2 h-2 rounded-sm bg-[var(--green)]" />
              Receitas
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text2)]">
              <span className="w-2 h-2 rounded-sm bg-[var(--red)]" />
              Despesas
            </div>
          </div>
        </div>
      </div>

      {/* Transactions table */}
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 sm:p-6 animate-fade-up"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Últimas transações</h2>
            <p className="text-xs text-[var(--text3)] mt-0.5">
              {data.ultimas_transacoes.length} transação(ões) recentes
            </p>
          </div>
          <Link
            to="/transactions"
            className="text-xs text-[var(--text3)] bg-[var(--surface2)] border border-[var(--border)] rounded-md px-2.5 py-1 hover:text-foreground transition-colors"
          >
            Ver todas
          </Link>
        </div>

        {data.ultimas_transacoes.length === 0 ? (
          <p className="text-sm text-[var(--text3)] py-8 text-center">Nenhuma transação ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[400px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)]">
                    Descrição
                  </th>
                  <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)] hidden sm:table-cell">
                    Data
                  </th>
                  <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)] hidden md:table-cell">
                    Tipo
                  </th>
                  <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)]">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.ultimas_transacoes.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface2)] transition-colors cursor-pointer"
                  >
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[15px] shrink-0 ${
                            t.type === 'receita' ? 'bg-[var(--green)]/10' : 'bg-[var(--red)]/10'
                          }`}
                        >
                          {t.type === 'receita' ? '💵' : '🛒'}
                        </div>
                        <div>
                          <p className="text-[13.5px] font-medium text-foreground">{t.description}</p>
                          <p className="text-[11px] text-[var(--text3)] sm:hidden mt-0.5">
                            {formatDateOnlyPtBR(t.date, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-[13px] text-[var(--text3)] hidden sm:table-cell">
                      {formatDateOnlyPtBR(t.date)}
                    </td>
                    <td className="py-3.5 hidden md:table-cell">
                      <span
                        className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          t.type === 'receita'
                            ? 'bg-[var(--green)]/10 text-[var(--green)]'
                            : 'bg-[var(--red)]/10 text-[var(--red)]'
                        }`}
                      >
                        {t.type === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <span
                        className={`font-mono text-sm font-medium ${
                          t.type === 'receita' ? 'text-[var(--green)]' : 'text-[var(--red)]'
                        }`}
                      >
                        {t.type === 'receita' ? '+' : '−'} {formatMoney(t.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
