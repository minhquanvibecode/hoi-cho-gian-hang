import { SEED_FIXED_COSTS, SEED_PRODUCTS, SEED_SCENARIOS, type FixedCost, type Product, type Scenario } from './config/seed'

export type Assumptions = { products: Product[]; fixedCosts: FixedCost[]; scenarios: Scenario[] }

export const seedAssumptions = (): Assumptions => ({
  products: SEED_PRODUCTS.map((p) => ({ ...p })),
  fixedCosts: SEED_FIXED_COSTS.map((c) => ({ ...c })),
  scenarios: SEED_SCENARIOS.map((s) => ({ ...s })),
})

export const newId = (prefix: string) =>
  `${prefix}-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)}`

/** Đếm số thay đổi so với dữ liệu BTC: mỗi ô đã chỉnh, mỗi mục đội thêm, mỗi mục BTC đã xoá đều tính 1. */
export function countChanged(a: Assumptions): number {
  let n = 0
  for (const p of a.products) {
    const s = SEED_PRODUCTS.find((x) => x.id === p.id)
    if (!s) {
      n++
      continue
    }
    n += Number(p.name !== s.name) + Number(p.priceVnd !== s.priceVnd) + Number(p.unitCostVnd !== s.unitCostVnd) + Number(p.plannedQty !== s.plannedQty)
  }
  n += SEED_PRODUCTS.filter((s) => !a.products.some((p) => p.id === s.id)).length
  for (const c of a.fixedCosts) {
    const s = SEED_FIXED_COSTS.find((x) => x.id === c.id)
    if (!s) {
      n++
      continue
    }
    n += Number(c.name !== s.name) + Number(c.amountVnd !== s.amountVnd)
  }
  n += SEED_FIXED_COSTS.filter((s) => !a.fixedCosts.some((c) => c.id === s.id)).length
  for (const sc of a.scenarios) {
    const s = SEED_SCENARIOS.find((x) => x.id === sc.id)
    if (s) n += Number(sc.visitors !== s.visitors) + Number(sc.buyRatePct !== s.buyRatePct)
  }
  return n
}
