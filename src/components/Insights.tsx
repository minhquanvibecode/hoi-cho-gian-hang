import { useState } from 'react'
import type { FixedCost, Product, Scenario } from '../config/seed'
import { projectScenario, type Projection } from '../lib/calc/plan'
import { minVisitorsToBreakEven, suggestions } from '../lib/calc/suggest'
import { formatNumber, formatVnd } from '../lib/format'
import { How } from './ui'

const SERIES = [
  { key: 'revenue', label: 'Doanh thu', color: 'var(--s1)', get: (p: Projection) => p.revenueVnd },
  { key: 'cost', label: 'Tổng chi phí', color: 'var(--s2)', get: (p: Projection) => p.variableVnd + p.fixedVnd },
  { key: 'profit', label: 'Lợi nhuận', color: 'var(--s3)', get: (p: Projection) => p.profitVnd },
] as const

const short = (n: number) => `${formatNumber(n / 1_000_000, 2)}tr`

/** Biểu đồ cột nhóm: doanh thu, tổng chi phí, lợi nhuận của từng kịch bản. */
export function ScenarioChart({ products, costs, scenarios }: { products: Product[]; costs: FixedCost[]; scenarios: Scenario[] }) {
  const [hover, setHover] = useState<string | null>(null)
  const data = scenarios.map((s) => ({ s, p: projectScenario(s, products, costs) }))
  const values = data.flatMap((d) => SERIES.map((x) => x.get(d.p)))
  const maxV = Math.max(1, ...values)
  const minV = Math.min(0, ...values)
  const W = 300
  const H = 210
  const top = 24
  const bottom = 28
  const plotH = H - top - bottom
  const y = (v: number) => top + ((maxV - v) / (maxV - minV)) * plotH
  const groupW = W / data.length
  const barW = 30
  const gap = 2

  return (
    <section className="card chart">
      <h2>Biểu đồ: doanh thu – chi phí – lợi nhuận</h2>
      <ul className="legend">
        {SERIES.map((x) => (
          <li key={x.key}>
            <i style={{ background: x.color }} />
            {x.label}
          </li>
        ))}
      </ul>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="So sánh doanh thu, tổng chi phí, lợi nhuận giữa các kịch bản">
        {[maxV, (maxV + minV) / 2].map((v) => (
          <line key={v} x1={0} x2={W} y1={y(v)} y2={y(v)} stroke="var(--chart-grid)" strokeWidth={1} />
        ))}
        <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="var(--chart-text)" strokeWidth={1} />
        {data.map((d, gi) => {
          const cx = groupW * gi + groupW / 2
          const start = cx - (SERIES.length * barW + (SERIES.length - 1) * gap) / 2
          return (
            <g key={d.s.id}>
              {SERIES.map((x, si) => {
                const v = x.get(d.p)
                const bx = start + si * (barW + gap)
                const y0 = y(0)
                const yv = y(v)
                const h = Math.max(1, Math.abs(y0 - yv))
                const id = `${d.s.id}-${x.key}`
                const dim = hover !== null && hover !== id
                return (
                  <g key={x.key} onMouseEnter={() => setHover(id)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hover === id ? null : id)}>
                    <title>{`${d.s.name} · ${x.label}: ${formatVnd(v)}`}</title>
                    <rect x={bx - 2} y={top - 10} width={barW + 4} height={plotH + 20} fill="transparent" />
                    <rect x={bx} y={Math.min(y0, yv)} width={barW} height={h} rx={4} fill={x.color} opacity={dim ? 0.35 : 1} />
                    {x.key !== 'cost' && (
                      <text x={bx + barW / 2} y={v >= 0 ? yv - 5 : yv + 16} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--chart-text)">
                        {short(v)}
                      </text>
                    )}
                  </g>
                )
              })}
              <text x={cx} y={H - 8} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--text)">
                {d.s.name}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="note">Đơn vị: triệu đồng (tr). Chạm vào cột để xem số chính xác; bảng "So sánh kịch bản" phía trên có đủ số liệu.</p>
      {hover && (
        <p className="line">
          {(() => {
            const [sid, key] = [hover.slice(0, hover.lastIndexOf('-')), hover.slice(hover.lastIndexOf('-') + 1)]
            const d = data.find((x) => x.s.id === sid)
            const ser = SERIES.find((x) => x.key === key)
            return d && ser ? (
              <>
                {d.s.name} · {ser.label}: <b>{formatVnd(ser.get(d.p))}</b>
              </>
            ) : null
          })()}
        </p>
      )}
    </section>
  )
}

export function SuggestionsCard({ products, costs, scenarios }: { products: Product[]; costs: FixedCost[]; scenarios: Scenario[] }) {
  const ref = scenarios[0]
  if (!ref) return null
  const list = suggestions(products, costs, ref)
  return (
    <section className="card">
      <h2>Gợi ý cải thiện lợi nhuận</h2>
      <p className="muted">So trên kịch bản {ref.name} (xấu nhất). Mỗi gợi ý thay một giả định, giữ nguyên phần còn lại.</p>
      <div className="stack">
        {scenarios.map((s) => {
          const v = minVisitorsToBreakEven(products, costs, s.buyRatePct)
          return v === null ? null : (
            <p className="line" key={s.id}>
              Ở tỷ lệ mua {s.buyRatePct}% ({s.name}) cần tối thiểu <b>{formatNumber(v)} lượt khách</b> để hòa vốn
              {s.visitors >= v ? ` — đang dự kiến ${formatNumber(s.visitors)}, dư ${formatNumber(s.visitors - v)}.` : ` — đang thiếu ${formatNumber(v - s.visitors)} lượt.`}
            </p>
          )
        })}
        {list.map((x) => {
          const diff = x.profitAfterVnd - x.profitBeforeVnd
          return (
            <div className="suggest" key={x.id}>
              <h3>{x.title}</h3>
              <div className="delta">
                <span>
                  Lợi nhuận: {formatVnd(x.profitBeforeVnd)} → <b className={x.profitAfterVnd >= 0 ? 'positive' : 'negative'}>{formatVnd(x.profitAfterVnd)}</b>{' '}
                  ({diff >= 0 ? '+' : ''}
                  {formatVnd(diff)})
                </span>
                {x.breakEvenBefore !== null && x.breakEvenAfter !== null && (
                  <span>
                    Hòa vốn: {x.breakEvenBefore} → <b>{x.breakEvenAfter} phần</b>
                  </span>
                )}
              </div>
              <p className="note">{x.explanation}</p>
              <p className="note">⚠️ {x.caution}</p>
            </div>
          )
        })}
      </div>
      <How>
        <p>Mỗi gợi ý tính lại toàn bộ bằng cùng công thức (chia phần theo cơ cấu, phần dư lớn nhất; hòa vốn làm tròn lên).</p>
        <p>Lượt khách tối thiểu = số lượt nhỏ nhất sao cho lượt × tỷ lệ mua (làm tròn gần nhất) ≥ số phần hòa vốn.</p>
      </How>
    </section>
  )
}
