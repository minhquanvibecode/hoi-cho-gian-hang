import { useState } from 'react'
import type { Order, Product } from '../config/seed'
import { orderRevenueVnd, soldSummary } from '../lib/calc/plan'
import { csvFileName, downloadText, ordersToCsv } from '../lib/csv'
import { formatDateTime, formatNumber, formatVnd } from '../lib/format'
import { newId } from '../state'
import { How, Progress } from './ui'

type Props = {
  products: Product[]
  orders: Order[]
  breakEvenUnits: number | null
  onSave: (o: Order) => void
  onDelete: (id: string) => void
  onNotify: (msg: string) => void
}

const QUICK_QTY = [1, 2, 3, 5]
const MAX_QTY = 999

const qtyError = (s: string) =>
  s.trim() === ''
    ? 'Vui lòng nhập số lượng.'
    : !/^\d+$/.test(s.trim())
      ? 'Chỉ nhập số nguyên.'
      : Number(s) < 1
        ? 'Số lượng tối thiểu là 1.'
        : Number(s) > MAX_QTY
          ? `Tối đa ${MAX_QTY} phần mỗi đơn.`
          : undefined

export function OrdersTab({ products, orders, breakEvenUnits, onSave, onDelete, onNotify }: Props) {
  const [productId, setProductId] = useState('')
  const [qtyText, setQtyText] = useState('1')
  const [errors, setErrors] = useState<{ product?: string; qty?: string }>({})
  const [filter, setFilter] = useState('all')

  const product = products.find((p) => p.id === productId)
  const qty = /^\d+$/.test(qtyText.trim()) ? Number(qtyText) : NaN
  const qtyValid = Number.isInteger(qty) && qty >= 1 && qty <= MAX_QTY
  const sold = soldSummary(orders, products)

  const setQty = (n: number) => {
    setQtyText(String(n))
    setErrors((x) => ({ ...x, qty: undefined }))
  }

  const submit = () => {
    const e = { product: product ? undefined : 'Vui lòng chạm chọn một sản phẩm.', qty: qtyError(qtyText) }
    setErrors(e)
    if (e.product || e.qty || !product) return
    onSave({
      id: newId('don'),
      productId: product.id,
      productName: product.name,
      qty,
      priceVnd: product.priceVnd,
      createdAt: new Date().toISOString(),
    })
    setQtyText('1')
    setErrors({})
  }

  // Bộ lọc: sản phẩm hiện có + sản phẩm đã xoá nhưng còn đơn
  const filterOptions = [
    ...products.map((p) => ({ id: p.id, name: p.name })),
    ...[...new Map(orders.filter((o) => !products.some((p) => p.id === o.productId)).map((o) => [o.productId, `${o.productName} (đã xoá)`])).entries()].map(
      ([id, name]) => ({ id, name }),
    ),
  ]
  const activeFilter = filter === 'all' || filterOptions.some((f) => f.id === filter) ? filter : 'all'
  const shown = activeFilter === 'all' ? orders : orders.filter((o) => o.productId === activeFilter)
  const shownQty = shown.reduce((s, o) => s + o.qty, 0)
  const shownRevenue = shown.reduce((s, o) => s + orderRevenueVnd(o), 0)

  const exportCsv = () => {
    const name = csvFileName(new Date())
    downloadText(name, ordersToCsv(shown))
    onNotify(`Đã xuất ${shown.length} đơn ra file ${name} (mở bằng Excel).`)
  }

  return (
    <>
      <section className="card">
        <h2>Ghi đơn bán thử</h2>
        <form
          className="stack"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <div className={`field ${errors.product ? 'invalid' : ''}`}>
            <span className="field-label" id="order-product-label">
              Sản phẩm
            </span>
            <div className="tiles" role="radiogroup" aria-labelledby="order-product-label">
              {products.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  role="radio"
                  aria-checked={p.id === productId}
                  className={`tile ${p.id === productId ? 'selected' : ''}`}
                  onClick={() => {
                    setProductId(p.id)
                    setErrors((x) => ({ ...x, product: undefined }))
                  }}
                >
                  <span className="tile-name">{p.name}</span>
                  <span className="tile-price">{formatVnd(p.priceVnd)}</span>
                  <span className="tile-sold">Đã bán {formatNumber(sold.byProduct[p.id] ?? 0)}</span>
                </button>
              ))}
            </div>
            {errors.product && <span className="error">{errors.product}</span>}
          </div>

          <div className={`field ${errors.qty ? 'invalid' : ''}`}>
            <label htmlFor="order-qty">Số lượng</label>
            <div className="quick-qty" role="group" aria-label="Chọn nhanh số lượng">
              {QUICK_QTY.map((n) => (
                <button type="button" key={n} className={`btn ${qty === n ? 'btn-selected' : ''}`} aria-pressed={qty === n} onClick={() => setQty(n)}>
                  {n}
                </button>
              ))}
            </div>
            <div className="control">
              <button type="button" className="btn btn-icon" aria-label="Giảm 1" onClick={() => setQty(Math.max(1, (qtyValid ? qty : 1) - 1))}>
                −
              </button>
              <input
                id="order-qty"
                inputMode="numeric"
                value={qtyText}
                onChange={(e) => {
                  setQtyText(e.target.value)
                  setErrors((x) => ({ ...x, qty: qtyError(e.target.value) }))
                }}
              />
              <button type="button" className="btn btn-icon" aria-label="Tăng 1" onClick={() => setQty(Math.min(MAX_QTY, (qtyValid ? qty : 0) + 1))}>
                +
              </button>
              <span className="unit">phần</span>
            </div>
            {errors.qty && <span className="error">{errors.qty}</span>}
          </div>

          <div className="order-preview">
            <span>Doanh thu đơn</span>
            <b>{product && qtyValid ? formatVnd(orderRevenueVnd({ priceVnd: product.priceVnd, qty })) : '—'}</b>
          </div>
          {product && qtyValid && (
            <p className="note">
              {product.name}: {formatVnd(product.priceVnd)}/phần × {qty} phần = {formatVnd(product.priceVnd * qty)}
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-block">
            Lưu đơn
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Đã bán thử</h2>
        <div className="kpis">
          <div className="kpi">
            <div className="label">Tổng đã bán</div>
            <div className="value">{formatNumber(sold.totalQty)} phần</div>
          </div>
          <div className="kpi">
            <div className="label">Doanh thu đơn thử</div>
            <div className="value">{formatVnd(sold.revenueVnd)}</div>
          </div>
        </div>
        {breakEvenUnits !== null && (
          <div className="stack-sm top">
            <div className="row-between">
              <span>So với hòa vốn</span>
              <b>
                {formatNumber(sold.totalQty)}/{formatNumber(breakEvenUnits)} phần
              </b>
            </div>
            <Progress value={sold.totalQty} max={breakEvenUnits} label="Tiến độ tới hòa vốn" />
            <p className="note">
              {sold.totalQty >= breakEvenUnits
                ? 'Đã vượt điểm hòa vốn theo cơ cấu dự kiến.'
                : `Còn ${formatNumber(breakEvenUnits - sold.totalQty)} phần nữa để hòa vốn (theo cơ cấu dự kiến).`}
            </p>
          </div>
        )}
        <div className="table-wrap top">
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th className="num">Đã bán</th>
                <th className="num">Dự kiến</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td className="num">{formatNumber(sold.byProduct[p.id] ?? 0)}</td>
                  <td className="num">{formatNumber(p.plannedQty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <How>
          <p>Đã bán = tổng số lượng các đơn thử của sản phẩm (đơn vị: phần).</p>
          <p>Doanh thu đơn = giá bán lúc ghi đơn × số lượng (đồng). Đổi giá sau đó không làm đổi đơn đã ghi.</p>
        </How>
      </section>

      <section className="card wide">
        <h2>Danh sách đơn ({orders.length})</h2>
        {orders.length === 0 ? (
          <p className="muted">Chưa có đơn nào. Ghi đơn đầu tiên ở khung "Ghi đơn bán thử".</p>
        ) : (
          <>
            <div className="field">
              <label htmlFor="order-filter">Lọc theo sản phẩm</label>
              <select id="order-filter" value={activeFilter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">Tất cả sản phẩm</option>
                {filterOptions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="row-between top">
              <p className="line">
                {shown.length} đơn · {formatNumber(shownQty)} phần · <b>{formatVnd(shownRevenue)}</b>
              </p>
              <button className="btn" onClick={exportCsv} disabled={shown.length === 0}>
                ⬇ Xuất CSV
              </button>
            </div>
            <ul className="order-list">
              {shown.map((o) => (
                <li key={o.id}>
                  <div>
                    <b>
                      {o.productName} × {o.qty}
                    </b>
                    <div className="note">
                      {formatDateTime(o.createdAt)} · {formatVnd(o.priceVnd)}/phần
                    </div>
                  </div>
                  <div className="order-right">
                    <b>{formatVnd(orderRevenueVnd(o))}</b>
                    <button className="btn btn-icon btn-danger" aria-label={`Xoá đơn ${o.productName} × ${o.qty}`} onClick={() => onDelete(o.id)}>
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="note">File CSV gồm các đơn đang hiện theo bộ lọc, có dòng tổng; mở được bằng Excel/Google Sheets.</p>
          </>
        )}
      </section>
    </>
  )
}
