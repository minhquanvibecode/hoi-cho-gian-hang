import { useState } from 'react'
import { SEED_FIXED_COSTS, SEED_PRODUCTS, SEED_SCENARIOS } from '../config/seed'
import { rawBuyersOf, totalFixedVnd, unitMarginVnd } from '../lib/calc/plan'
import { formatNumber, formatVnd, roundHalfUp } from '../lib/format'
import { countChanged, type Assumptions } from '../state'
import { Dialog, NumberField } from './ui'

type Props = {
  a: Assumptions
  setA: (fn: (a: Assumptions) => Assumptions) => void
  onLoadSeed: (clearOrders: boolean) => void
  orderCount: number
}

export function AssumptionsTab({ a, setA, onLoadSeed, orderCount }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [clearOrders, setClearOrders] = useState(false)
  const changed = countChanged(a)

  const patch = <K extends keyof Assumptions>(key: K, id: string, field: string, value: number) =>
    setA((prev) => ({
      ...prev,
      [key]: (prev[key] as { id: string }[]).map((x) => (x.id === id ? { ...x, [field]: value } : x)),
    }))

  return (
    <>
      <section className="card">
        <h2>Dữ liệu mẫu BTC</h2>
        <p className="muted">
          {changed === 0 ? 'Đang dùng nguyên giả định BTC.' : `Đã chỉnh ${changed} giả định so với BTC (ô tô vàng).`}
        </p>
        <button className="btn btn-primary btn-block" onClick={() => setConfirming(true)}>
          Nạp dữ liệu mẫu
        </button>
      </section>

      <section className="card">
        <h2>Sản phẩm</h2>
        <div className="stack">
          {a.products.map((p) => {
            const seed = SEED_PRODUCTS.find((s) => s.id === p.id)
            const margin = unitMarginVnd(p)
            return (
              <fieldset key={p.id} className="group">
                <legend>{p.name}</legend>
                <NumberField
                  label="Giá bán/phần"
                  unit="đ"
                  max={10_000_000}
                  value={p.priceVnd}
                  seedValue={seed?.priceVnd}
                  onChange={(n) => patch('products', p.id, 'priceVnd', n)}
                  warning={margin <= 0 ? 'Giá bán không cao hơn chi phí: bán càng nhiều càng lỗ.' : null}
                />
                <NumberField
                  label="Chi phí biến đổi/phần"
                  unit="đ"
                  max={10_000_000}
                  value={p.unitCostVnd}
                  seedValue={seed?.unitCostVnd}
                  onChange={(n) => patch('products', p.id, 'unitCostVnd', n)}
                />
                <NumberField
                  label="Số phần dự kiến"
                  unit="phần"
                  max={100_000}
                  value={p.plannedQty}
                  seedValue={seed?.plannedQty}
                  onChange={(n) => patch('products', p.id, 'plannedQty', n)}
                />
                <p className={`line ${margin > 0 ? 'positive' : 'negative'}`}>
                  Lãi góp: {formatVnd(p.priceVnd)} − {formatVnd(p.unitCostVnd)} = <b>{formatVnd(margin)}/phần</b>
                </p>
              </fieldset>
            )
          })}
        </div>
      </section>

      <section className="card">
        <h2>Chi phí cố định</h2>
        <div className="stack">
          {a.fixedCosts.map((c) => (
            <div key={c.id}>
              <NumberField
                label={c.name}
                unit="đ"
                max={1_000_000_000}
                value={c.amountVnd}
                seedValue={SEED_FIXED_COSTS.find((s) => s.id === c.id)?.amountVnd}
                onChange={(n) => patch('fixedCosts', c.id, 'amountVnd', n)}
              />
              <p className="note">{c.note}</p>
            </div>
          ))}
          <p className="line">
            Tổng chi phí cố định: <b>{formatVnd(totalFixedVnd(a.fixedCosts))}</b>
          </p>
        </div>
      </section>

      <section className="card">
        <h2>Kịch bản lượng khách</h2>
        <div className="stack">
          {a.scenarios.map((s) => {
            const seed = SEED_SCENARIOS.find((x) => x.id === s.id)
            const raw = rawBuyersOf(s)
            return (
              <fieldset key={s.id} className="group">
                <legend>
                  {s.name} <span className="note">· {s.note}</span>
                </legend>
                <NumberField
                  label="Lượt khách dự kiến"
                  unit="lượt"
                  max={100_000}
                  value={s.visitors}
                  seedValue={seed?.visitors}
                  onChange={(n) => patch('scenarios', s.id, 'visitors', n)}
                />
                <NumberField
                  label="Tỷ lệ mua dự kiến"
                  unit="%"
                  max={100}
                  value={s.buyRatePct}
                  seedValue={seed?.buyRatePct}
                  onChange={(n) => patch('scenarios', s.id, 'buyRatePct', n)}
                />
                <p className="line">
                  Khách mua: {formatNumber(s.visitors)} × {s.buyRatePct}% = {formatNumber(raw)}
                  {raw !== roundHalfUp(raw) && <> → {formatNumber(roundHalfUp(raw))}</>} khách = <b>{formatNumber(roundHalfUp(raw))} phần</b>
                </p>
              </fieldset>
            )
          })}
        </div>
      </section>

      {confirming && (
        <Dialog
          title="Nạp dữ liệu mẫu BTC?"
          confirmLabel="Nạp dữ liệu mẫu"
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            onLoadSeed(clearOrders)
            setConfirming(false)
            setClearOrders(false)
          }}
        >
          <p>Sản phẩm, chi phí cố định và hai kịch bản sẽ trở về giá trị ban đầu do BTC cung cấp.</p>
          {orderCount > 0 && (
            <label className="check">
              <input type="checkbox" checked={clearOrders} onChange={(e) => setClearOrders(e.target.checked)} />
              Xoá cả {orderCount} đơn bán thử
            </label>
          )}
        </Dialog>
      )}
    </>
  )
}
