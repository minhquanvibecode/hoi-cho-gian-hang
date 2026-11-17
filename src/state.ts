import { SEED_FIXED_COSTS, SEED_PRODUCTS, SEED_SCENARIOS, type FixedCost, type Product, type Scenario } from './config/seed'

export type Assumptions = { products: Product[]; fixedCosts: FixedCost[]; scenarios: Scenario[] }

export const seedAssumptions = (): Assumptions => ({
  products: SEED_PRODUCTS.map((p) => ({ ...p })),
  fixedCosts: SEED_FIXED_COSTS.map((c) => ({ ...c })),
  scenarios: SEED_SCENARIOS.map((s) => ({ ...s })),
})

/** Đếm số ô giả định khác dữ liệu BTC */
export function countChanged(a: Assumptions): number {
  let n = 0
  for (const p of a.products) {
    const s = SEED_PRODUCTS.find((x) => x.id === p.id)
    if (!s) continue
    n += Number(p.priceVnd !== s.priceVnd) + Number(p.unitCostVnd !== s.unitCostVnd) + Number(p.plannedQty !== s.plannedQty)
  }
  for (const c of a.fixedCosts) {
    const s = SEED_FIXED_COSTS.find((x) => x.id === c.id)
    if (s) n += Number(c.amountVnd !== s.amountVnd)
  }
  for (const sc of a.scenarios) {
    const s = SEED_SCENARIOS.find((x) => x.id === sc.id)
    if (s) n += Number(sc.visitors !== s.visitors) + Number(sc.buyRatePct !== s.buyRatePct)
  }
  return n
}
