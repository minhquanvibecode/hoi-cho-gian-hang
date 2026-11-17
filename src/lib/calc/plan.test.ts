import { describe, expect, it } from 'vitest'
import { SEED_FIXED_COSTS, SEED_PRODUCTS, SEED_SCENARIOS } from '../../config/seed'
import { avgMarginVnd, breakEven, orderRevenueVnd, projectPlan, projectScenario, soldSummary } from './plan'

const P = SEED_PRODUCTS
const F = SEED_FIXED_COSTS

describe('Bảng số tính tay (docs/PHAN-TICH-DE.md mục 5)', () => {
  it('lãi góp bình quân và hòa vốn', () => {
    expect(avgMarginVnd(P)).toBeCloseTo(11333.333, 2)
    const be = breakEven(P, F)
    expect(be.fixedVnd).toBe(550000)
    expect(be.rawUnits).toBeCloseTo(48.529, 2)
    expect(be.units).toBe(49)
  })

  it('kịch bản Thận trọng', () => {
    const r = projectScenario(SEED_SCENARIOS[0], P, F)
    expect(r.buyers).toBe(55)
    expect(r.lines.map((l) => l.qty)).toEqual([23, 15, 17])
    expect(r.revenueVnd).toBe(1090000)
    expect(r.variableVnd).toBe(468000)
    expect(r.profitVnd).toBe(72000)
    expect(r.safetyUnits).toBe(6)
  })

  it('kịch bản Cơ sở (97,5 → 98 khách)', () => {
    const r = projectScenario(SEED_SCENARIOS[1], P, F)
    expect(r.rawBuyers).toBe(97.5)
    expect(r.buyers).toBe(98)
    expect(r.lines.map((l) => l.qty)).toEqual([40, 28, 30])
    expect(r.revenueVnd).toBe(1950000)
    expect(r.variableVnd).toBe(838000)
    expect(r.profitVnd).toBe(562000)
    expect(r.safetyUnits).toBe(49)
  })

  it('kế hoạch theo bảng sản phẩm', () => {
    const r = projectPlan(P, F)
    expect(r.totalQty).toBe(195)
    expect(r.revenueVnd).toBe(3875000)
    expect(r.variableVnd).toBe(1665000)
    expect(r.profitVnd).toBe(1660000)
  })

  it('kết quả đổi theo giả định', () => {
    const r = projectScenario({ visitors: 200, buyRatePct: 50 }, P, F)
    expect(r.buyers).toBe(100)
    expect(r.totalQty).toBe(100)
  })
})

describe('Biên', () => {
  it('lãi góp ≤ 0 → không thể hòa vốn', () => {
    const bad = P.map((p) => ({ ...p, priceVnd: p.unitCostVnd }))
    expect(breakEven(bad, F).units).toBeNull()
    expect(projectScenario(SEED_SCENARIOS[0], bad, F).safetyUnits).toBeNull()
  })
  it('tổng số phần dự kiến = 0 không chia cho 0', () => {
    const zero = P.map((p) => ({ ...p, plannedQty: 0 }))
    expect(avgMarginVnd(zero)).toBe(0)
    expect(projectScenario(SEED_SCENARIOS[0], zero, F).totalQty).toBe(0)
  })
})

describe('Đơn bán thử', () => {
  it('doanh thu đơn và cộng dồn đã bán', () => {
    expect(orderRevenueVnd({ priceVnd: 25000, qty: 3 })).toBe(75000)
    const orders = [
      { id: '1', productId: 'cacao-da', productName: 'Cacao đá', qty: 3, priceVnd: 25000, createdAt: '' },
      { id: '2', productId: 'cacao-da', productName: 'Cacao đá', qty: 2, priceVnd: 25000, createdAt: '' },
      { id: '3', productId: 'tra-chanh', productName: 'Trà chanh', qty: 1, priceVnd: 20000, createdAt: '' },
    ]
    const s = soldSummary(orders, P)
    expect(s.byProduct['cacao-da']).toBe(5)
    expect(s.totalQty).toBe(6)
    expect(s.revenueVnd).toBe(145000)
    expect(s.marginVnd).toBe(5 * 14000 + 12000)
  })
})

describe('Biên an toàn theo lượt khách', () => {
  it('Thận trọng: 6 phần ÷ 55% = 10,9 → 10 lượt; Cơ sở: 49 ÷ 65% = 75,4 → 75', async () => {
    const { visitorBuffer } = await import('./plan')
    expect(visitorBuffer(6, 55)).toBe(10)
    expect(visitorBuffer(49, 65)).toBe(75)
    expect(visitorBuffer(-1, 55)).toBeNull()
    expect(visitorBuffer(5, 0)).toBeNull()
  })
})
