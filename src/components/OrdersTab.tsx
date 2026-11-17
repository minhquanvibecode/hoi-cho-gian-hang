import { useState } from 'react'
import type { Order, Product } from '../config/seed'
import { orderRevenueVnd, soldSummary } from '../lib/calc/plan'
import { formatDateTime, formatNumber, formatVnd } from '../lib/format'
import { How, Progress } from './ui'

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)

type Props = {
  products: Product[]
  orders: Order[]
  breakEvenUnits: number | null
  onSave: (o: Order) => void
  onDelete: (id: string) => void
}

export function OrdersTab({ products, orders, breakEvenUnits, onSave, onDelete }: Props) {
  const [productId, setProductId] = useState('')
  const [qtyText, setQtyText] = useState('1')
  const [errors, setErrors] = useState<{ product?: string; qty?: string }>({})
  const [filter, setFilter] = useState('all')

  const product = products.find((p) => p.id === productId)
  const qty = /^\d+$/.test(qtyText.trim()) ? Number(qtyText) : NaN
  const qtyValid = Number.isInteger(qty) && qty >= 1 && qty <= 999
  const sold = soldSummary(orders, products)

  const qtyError = (s: string) =>
    s.trim() === '' ? 'Vui lòng nhập số lượng.' : !/^\d+$/.test(s.trim()) ? 'Chỉ nhập số nguyên.' : Number(s) < 1 ? 'Số lượng tối thiểu là 1.' : Number(s) > 999 ? 'Tối đa 999 phần mỗi đơn.' : undefined

  const submit = () => {
    const e = { product: product ? undefined : 'Vui lòng chọn sản phẩm.', qty: qtyError(qtyText) }
    setErrors(e)
    if (e.product || e.qty || !product) return
    onSave({
      id: newId(),
      productId: product.id,
      productName: product.name,
      qty,
      priceVnd: product.priceVnd,
      createdAt: new Date().toISOString(),
    })
    setQtyText('1')
    setErrors({})
  }

  const shown = filter === 'all' ? orders : orders.filter((o) => o.productId === filter)
  const shownQty = shown.reduce((s, o) => s + o.qty, 0)
  const shownRevenue = shown.reduce((s, o) => s + orderRevenueVnd(o), 0)

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
            <label htmlFor="order-product">Sản phẩm</label>
            <select
              id="order-product"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value)
                setErrors((x) => ({ ...x, product: undefined }))
              }}
            >
              <option value="">— Chọn sản phẩm —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {formatVnd(p.priceVnd)}
                </option>
              ))}
            </select>
            {errors.product && <span className="error">{errors.product}</span>}
          </div>
          <div className={`field ${errors.qty ? 'invalid' : ''}`}>
            <label htmlFor="order-qty">Số lượng</label>
            <div className="control">
              <button type="button" className="btn btn-icon" aria-label="Giảm 1" onClick={() => setQtyText(String(Math.max(1, (qtyValid ? qty : 1) - 1)))}>
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
              <button type="button" className="btn btn-icon" aria-label="Tăng 1" onClick={() => setQtyText(String(Math.min(999, (qtyValid ? qty : 0) + 1)))}>
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
              {formatVnd(product.priceVnd)}/phần × {qty} phần = {formatVnd(product.priceVnd * qty)}
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

      <section className="card">
        <h2>Danh sách đơn ({orders.length})</h2>
        {orders.length === 0 ? (
          <p className="muted">Chưa có đơn nào. Ghi đơn đầu tiên ở khung phía trên.</p>
        ) : (
          <>
            <div className="field">
              <label htmlFor="order-filter">Lọc theo sản phẩm</label>
              <select id="order-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">Tất cả sản phẩm</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="line">
              {shown.length} đơn · {formatNumber(shownQty)} phần · <b>{formatVnd(shownRevenue)}</b>
            </p>
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
          </>
        )}
      </section>
    </>
  )
}
