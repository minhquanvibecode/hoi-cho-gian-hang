import { useCallback, useEffect, useState } from 'react'
import type { Order } from './config/seed'
import { AssumptionsTab } from './components/AssumptionsTab'
import { OrdersTab } from './components/OrdersTab'
import { OverviewTab } from './components/OverviewTab'
import { Toast, type ToastState } from './components/ui'
import { breakEven } from './lib/calc/plan'
import { formatVnd } from './lib/format'
import { usePersistentState } from './lib/storage'
import { seedAssumptions, type Assumptions } from './state'

const TABS = [
  { id: 'tong-quan', label: 'Tổng quan', icon: '📊' },
  { id: 'gia-dinh', label: 'Giả định', icon: '⚙️' },
  { id: 'don-thu', label: 'Đơn thử', icon: '🧾' },
] as const

const readHash = () => {
  const h = window.location.hash.slice(1)
  return TABS.some((t) => t.id === h) ? h : 'tong-quan'
}

export default function App() {
  const [tab, setTab] = useState(readHash)
  const [a, setAState] = usePersistentState<Assumptions>('assumptions', seedAssumptions())
  const [orders, setOrders] = usePersistentState<Order[]>('orders', [])
  const [toast, setToast] = useState<ToastState>(null)
  const closeToast = useCallback(() => setToast(null), [])

  useEffect(() => {
    const onHash = () => setTab(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const goTo = (id: string) => {
    window.location.hash = id
    setTab(id)
    window.scrollTo({ top: 0 })
  }

  const setA = (fn: (x: Assumptions) => Assumptions) => setAState((prev) => fn(prev))
  const be = breakEven(a.products, a.fixedCosts)

  return (
    <>
      <header className="app-header">
        <h1>Gian hàng hội chợ cuối tuần</h1>
        <p className="note">Kế hoạch bán đồ uống & bánh · hòa vốn · kịch bản</p>
      </header>
      <main className="app-main">
        {tab === 'tong-quan' && <OverviewTab a={a} orders={orders} goTo={goTo} />}
        {tab === 'gia-dinh' && (
          <AssumptionsTab
            a={a}
            setA={setA}
            orderCount={orders.length}
            onLoadSeed={(clearOrders) => {
              setAState(seedAssumptions())
              if (clearOrders) setOrders([])
              setToast({ msg: clearOrders ? 'Đã nạp dữ liệu mẫu BTC và xoá đơn thử.' : 'Đã nạp dữ liệu mẫu BTC.' })
            }}
          />
        )}
        {tab === 'don-thu' && (
          <OrdersTab
            products={a.products}
            orders={orders}
            breakEvenUnits={be.units}
            onSave={(o) => {
              setOrders((prev) => [o, ...prev])
              setToast({ msg: `Đã lưu đơn: ${o.productName} × ${o.qty} = ${formatVnd(o.priceVnd * o.qty)}` })
            }}
            onDelete={(id) => {
              const removed = orders.find((o) => o.id === id)
              setOrders((prev) => prev.filter((o) => o.id !== id))
              if (removed)
                setToast({
                  msg: `Đã xoá đơn ${removed.productName} × ${removed.qty}.`,
                  actionLabel: 'Hoàn tác',
                  onAction: () => setOrders((prev) => [removed, ...prev].sort((x, y) => y.createdAt.localeCompare(x.createdAt))),
                })
            }}
          />
        )}
      </main>
      <nav className="tabbar" aria-label="Chuyển màn hình">
        {TABS.map((t) => (
          <button key={t.id} data-tab={t.id} aria-current={tab === t.id ? 'page' : undefined} onClick={() => goTo(t.id)}>
            <span aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
      <Toast toast={toast} onClose={closeToast} />
    </>
  )
}
