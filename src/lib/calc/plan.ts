import type { FixedCost, Order, Product, Scenario } from '../../config/seed'
import { allocateLargestRemainder, roundHalfUp, roundUp } from '../format'

/** Lãi góp mỗi phần của một sản phẩm, đồng/phần */
export const unitMarginVnd = (p: Product) => p.priceVnd - p.unitCostVnd

/** Tổng chi phí cố định, đồng */
export const totalFixedVnd = (costs: FixedCost[]) => costs.reduce((s, c) => s + c.amountVnd, 0)

/** Tổng số phần dự kiến (mẫu số của cơ cấu) */
export const totalPlannedQty = (products: Product[]) => products.reduce((s, p) => s + p.plannedQty, 0)

/** Lãi góp bình quân mỗi phần theo cơ cấu số phần dự kiến, đồng/phần (không làm tròn) */
export function avgMarginVnd(products: Product[]): number {
  const qty = totalPlannedQty(products)
  if (qty <= 0) return 0
  return products.reduce((s, p) => s + unitMarginVnd(p) * p.plannedQty, 0) / qty
}

export type BreakEven = {
  fixedVnd: number
  avgMarginVnd: number
  /** Số lẻ trước khi làm tròn; null khi không thể hòa vốn */
  rawUnits: number | null
  /** Làm tròn lên; null khi lãi góp bình quân ≤ 0 */
  units: number | null
}

export function breakEven(products: Product[], costs: FixedCost[]): BreakEven {
  const fixedVnd = totalFixedVnd(costs)
  const avg = avgMarginVnd(products)
  if (avg <= 0) return { fixedVnd, avgMarginVnd: avg, rawUnits: null, units: null }
  const rawUnits = fixedVnd / avg
  return { fixedVnd, avgMarginVnd: avg, rawUnits, units: roundUp(rawUnits) }
}

export type ProductLine = {
  product: Product
  rawQty: number
  qty: number
  revenueVnd: number
  variableVnd: number
}

export type Projection = {
  /** Số khách mua trước làm tròn */
  rawBuyers: number
  /** Số khách mua = tổng số phần (mỗi khách 1 phần) */
  buyers: number
  lines: ProductLine[]
  totalQty: number
  revenueVnd: number
  variableVnd: number
  fixedVnd: number
  profitVnd: number
  breakEvenUnits: number | null
  /** Tổng số phần − số phần hòa vốn; null khi không thể hòa vốn */
  safetyUnits: number | null
}

function summarize(
  lines: ProductLine[],
  products: Product[],
  costs: FixedCost[],
  rawBuyers: number,
  buyers: number,
): Projection {
  const totalQty = lines.reduce((s, l) => s + l.qty, 0)
  const revenueVnd = lines.reduce((s, l) => s + l.revenueVnd, 0)
  const variableVnd = lines.reduce((s, l) => s + l.variableVnd, 0)
  const be = breakEven(products, costs)
  return {
    rawBuyers,
    buyers,
    lines,
    totalQty,
    revenueVnd,
    variableVnd,
    fixedVnd: be.fixedVnd,
    profitVnd: revenueVnd - variableVnd - be.fixedVnd,
    breakEvenUnits: be.units,
    safetyUnits: be.units === null ? null : totalQty - be.units,
  }
}

const line = (product: Product, rawQty: number, qty: number): ProductLine => ({
  product,
  rawQty,
  qty,
  revenueVnd: product.priceVnd * qty,
  variableVnd: product.unitCostVnd * qty,
})

/** Số khách mua = lượt khách × tỷ lệ mua (làm tròn gần nhất, 0,5 lên) */
export const rawBuyersOf = (s: Pick<Scenario, 'visitors' | 'buyRatePct'>) => (s.visitors * s.buyRatePct) / 100

/** Dự kiến theo kịch bản lượng khách: chia số phần theo cơ cấu, phần dư lớn nhất. */
export function projectScenario(
  scenario: Pick<Scenario, 'visitors' | 'buyRatePct'>,
  products: Product[],
  costs: FixedCost[],
): Projection {
  const rawBuyers = rawBuyersOf(scenario)
  const buyers = roundHalfUp(rawBuyers)
  const weights = products.map((p) => p.plannedQty)
  const sum = totalPlannedQty(products)
  const qtys = allocateLargestRemainder(buyers, weights)
  const lines = products.map((p, i) => line(p, sum > 0 ? (buyers * p.plannedQty) / sum : 0, qtys[i]))
  return summarize(lines, products, costs, rawBuyers, buyers)
}

/** Dự kiến theo đúng số phần dự kiến trong bảng sản phẩm. */
export function projectPlan(products: Product[], costs: FixedCost[]): Projection {
  const lines = products.map((p) => line(p, p.plannedQty, p.plannedQty))
  const total = totalPlannedQty(products)
  return summarize(lines, products, costs, total, total)
}

/** Doanh thu một đơn, đồng */
export const orderRevenueVnd = (o: Pick<Order, 'priceVnd' | 'qty'>) => o.priceVnd * o.qty

export type SoldSummary = {
  byProduct: Record<string, number>
  totalQty: number
  revenueVnd: number
  /** Lãi góp từ đơn thử theo chi phí biến đổi hiện tại */
  marginVnd: number
}

export function soldSummary(orders: Order[], products: Product[]): SoldSummary {
  const byProduct: Record<string, number> = {}
  let revenueVnd = 0
  let marginVnd = 0
  for (const o of orders) {
    byProduct[o.productId] = (byProduct[o.productId] ?? 0) + o.qty
    revenueVnd += orderRevenueVnd(o)
    const cost = products.find((p) => p.id === o.productId)?.unitCostVnd ?? 0
    marginVnd += (o.priceVnd - cost) * o.qty
  }
  const totalQty = Object.values(byProduct).reduce((a, b) => a + b, 0)
  return { byProduct, totalQty, revenueVnd, marginVnd }
}

/** Biên an toàn quy ra lượt khách có thể hụt mà vẫn không lỗ (làm tròn xuống); null khi không tính được */
export function visitorBuffer(safetyUnits: number | null, buyRatePct: number): number | null {
  if (safetyUnits === null || safetyUnits < 0 || buyRatePct <= 0) return null
  return Math.floor((safetyUnits * 100) / buyRatePct + 1e-9)
}
