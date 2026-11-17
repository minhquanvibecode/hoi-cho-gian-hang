import { useState } from 'react'
import { SEED_FIXED_COSTS, SEED_PRODUCTS, SEED_SCENARIOS } from '../config/seed'
import { rawBuyersOf, totalFixedVnd, unitMarginVnd } from '../lib/calc/plan'
import { formatNumber, formatVnd, roundHalfUp } from '../lib/format'
import { countChanged, newId, type Assumptions } from '../state'
import { Dialog, NumberField, TextField } from './ui'

type Props = {
  a: Assumptions
  setA: (fn: (a: Assumptions) => Assumptions) => void
  onLoadSeed: (clearOrders: boolean) => void
  onNotify: (msg: string) => void
  orderCount: number
}

type PendingDelete = { kind: 'products' | 'fixedCosts'; id: string; name: string }

export const MAX_PRODUCTS = 8
export const MAX_FIXED = 10

export function AssumptionsTab({ a, setA, onLoadSeed, onNotify, orderCount }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [clearOrders, setClearOrders] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const changed = countChanged(a)

  const patch = <K extends 'products' | 'fixedCosts' | 'scenarios'>(key: K, id: string, field: string, value: number | string) =>
    setA((prev) => ({
      ...prev,
      [key]: (prev[key] as { id: string }[]).map((x) => (x.id === id ? { ...x, [field]: value } : x)),
    }))

  const addProduct = () => {
    setA((prev) => ({
      ...prev,
      products: [...prev.products, { id: newId('sp'), name: `Sản phẩm mới ${prev.products.length + 1}`, priceVnd: 20000, unitCostVnd: 10000, plannedQty: 20 }],
    }))
    onNotify('Đã thêm sản phẩm mới ở cuối danh sách — hãy sửa tên, giá và số phần.')
  }
  const addFixed = () => {
    setA((prev) => ({
      ...prev,
      fixedCosts: [...prev.fixedCosts, { id: newId('cp'), name: `Khoản chi mới ${prev.fixedCosts.length + 1}`, amountVnd: 50000, note: 'Đội thêm' }],
    }))
    onNotify('Đã thêm khoản chi cố định mới.')
  }

  return (
    <>
      <section className="card wide">
        <h2>Dữ liệu mẫu BTC</h2>
        <p className="muted">
          {changed === 0 ? 'Đang dùng nguyên giả định BTC.' : `Đã thay đổi ${changed} mục so với BTC (ô tô vàng, mục "Đội thêm").`}
        </p>
        <button className="btn btn-primary btn-block" onClick={() => setConfirming(true)}>
          Nạp dữ liệu mẫu
        </button>
      </section>

      <section className="card">
        <h2>Sản phẩm ({a.products.length})</h2>
        <div className="stack">
          {a.products.map((p) => {
            const seed = SEED_PRODUCTS.find((s) => s.id === p.id)
            const margin = unitMarginVnd(p)
            return (
              <fieldset key={p.id} className="group">
                <legend>{p.name}</legend>
                <TextField label="Tên sản phẩm" value={p.name} seedValue={seed?.name} onChange={(s) => patch('products', p.id, 'name', s)} />
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
                <button
                  className="btn btn-danger"
                  disabled={a.products.length <= 1}
                  title={a.products.length <= 1 ? 'Cần giữ ít nhất 1 sản phẩm' : undefined}
                  onClick={() => setPendingDelete({ kind: 'products', id: p.id, name: p.name })}
                >
                  Xoá sản phẩm
                </button>
              </fieldset>
            )
          })}
          {a.products.length < MAX_PRODUCTS ? (
            <button className="btn btn-block" onClick={addProduct}>
              ＋ Thêm sản phẩm
            </button>
          ) : (
            <p className="note">Tối đa {MAX_PRODUCTS} sản phẩm.</p>
          )}
        </div>
      </section>

      <div className="col">
        <section className="card">
          <h2>Chi phí cố định ({a.fixedCosts.length})</h2>
          <div className="stack">
            {a.fixedCosts.map((c) => {
              const seed = SEED_FIXED_COSTS.find((s) => s.id === c.id)
              return (
                <fieldset key={c.id} className="group">
                  <legend>{c.name}</legend>
                  <TextField label="Tên khoản chi" value={c.name} seedValue={seed?.name} onChange={(s) => patch('fixedCosts', c.id, 'name', s)} />
                  <NumberField
                    label="Số tiền"
                    unit="đ"
                    max={1_000_000_000}
                    value={c.amountVnd}
                    seedValue={seed?.amountVnd}
                    onChange={(n) => patch('fixedCosts', c.id, 'amountVnd', n)}
                  />
                  <p className="note">{c.note}</p>
                  <button className="btn btn-danger" onClick={() => setPendingDelete({ kind: 'fixedCosts', id: c.id, name: c.name })}>
                    Xoá khoản chi
                  </button>
                </fieldset>
              )
            })}
            {a.fixedCosts.length < MAX_FIXED && (
              <button className="btn btn-block" onClick={addFixed}>
                ＋ Thêm khoản chi
              </button>
            )}
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
      </div>

      {pendingDelete && (
        <Dialog
          title={`Xoá "${pendingDelete.name}"?`}
          confirmLabel="Xoá"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            const { kind, id, name } = pendingDelete
            setA((prev) => ({ ...prev, [kind]: (prev[kind] as { id: string }[]).filter((x) => x.id !== id) }))
            setPendingDelete(null)
            onNotify(`Đã xoá "${name}". Bấm "Nạp dữ liệu mẫu" nếu muốn khôi phục mục của BTC.`)
          }}
        >
          <p>
            {pendingDelete.kind === 'products'
              ? 'Sản phẩm bị xoá khỏi kế hoạch, kịch bản và hòa vốn. Các đơn bán thử đã ghi vẫn được giữ.'
              : 'Khoản chi bị xoá khỏi tổng chi phí cố định.'}
          </p>
        </Dialog>
      )}

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
          <p>Sản phẩm, chi phí cố định và hai kịch bản sẽ trở về giá trị ban đầu do BTC cung cấp (mục đội thêm sẽ bị bỏ).</p>
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
